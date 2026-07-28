import { assertBudget, type BudgetState } from "@libs/core";
import type { Db } from "@libs/db";
import { runs, traces } from "@libs/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

/**
 * The traced model gateway. Every call: budget check → generate → parse +
 * validate against a Zod schema → write a `traces` row (input, output, tokens,
 * latency, cost) → add cost to `runs.spent_usd`. No exceptions — traces are the
 * debugger and the CI replay dataset.
 *
 * The provider is injected (`LlmGenerate`), so this is fully testable with a
 * canned responder — no API key, no network.
 */
export type LLMRole = "cheap" | "strong";

/** Stage → model tier. One place to change; later an ablation axis. */
export const STAGE_ROUTING: Readonly<Record<string, LLMRole>> = {
  ingesting: "cheap",
  localizing: "cheap",
  summarize: "cheap",
  triage: "cheap",
  reproducing: "strong",
  patching: "strong",
};

export interface LLMUsage {
  tokensIn: number;
  tokensOut: number;
}

/** Low-level generation: provider wrapper in prod, canned responder in tests. */
export type LlmGenerate = (args: {
  model: string;
  system: string;
  prompt: string;
}) => Promise<{ text: string; usage: LLMUsage }>;

/** Price per 1M tokens (USD), by tier. Approximate + configurable. */
export interface Pricing {
  cheap: { inPerMTok: number; outPerMTok: number };
  strong: { inPerMTok: number; outPerMTok: number };
}

export const DEFAULT_PRICING: Pricing = {
  cheap: { inPerMTok: 0.8, outPerMTok: 4.0 },
  strong: { inPerMTok: 5.0, outPerMTok: 25.0 },
};

export function roleForStage(stage: string, override?: LLMRole): LLMRole {
  return override ?? STAGE_ROUTING[stage] ?? "cheap";
}

export function computeCost(role: LLMRole, usage: LLMUsage, pricing: Pricing = DEFAULT_PRICING): number {
  const p = pricing[role];
  return (usage.tokensIn / 1e6) * p.inPerMTok + (usage.tokensOut / 1e6) * p.outPerMTok;
}

export class LLMStructuredOutputError extends Error {
  constructor(
    message: string,
    readonly rawOutput: string,
  ) {
    super(message);
    this.name = "LLMStructuredOutputError";
  }
}

export interface LlmCallParams<T> {
  runId: number;
  stage: string;
  role?: LLMRole; // override routing
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  budget: BudgetState;
  /** Rough cost of THIS call, checked against the budget before spending. */
  estimatedCostUsd?: number;
}

export interface LlmCallResult<T> {
  data: T;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
}

export interface LlmClientOptions {
  db: Db;
  models: Record<LLMRole, string>;
  generate: LlmGenerate;
  pricing?: Pricing;
}

export class LlmClient {
  constructor(private readonly opts: LlmClientOptions) {}

  async call<T>(params: LlmCallParams<T>): Promise<LlmCallResult<T>> {
    const role = roleForStage(params.stage, params.role);
    const model = this.opts.models[role];

    // Hard budget ceiling BEFORE spending anything.
    assertBudget(params.budget, params.estimatedCostUsd ?? 0);

    const start = Date.now();
    let text: string;
    let usage: LLMUsage;
    try {
      const res = await this.opts.generate({ model, system: params.system, prompt: params.prompt });
      text = res.text;
      usage = res.usage;
    } catch (err) {
      const latencyMs = Date.now() - start;
      const name = err instanceof Error ? err.name : "unknown";
      const message = err instanceof Error ? err.message : String(err);
      await this.trace(params, model, { tokensIn: 0, tokensOut: 0 }, 0, latencyMs, null, name, message);
      throw err;
    }

    const latencyMs = Date.now() - start;
    const costUsd = computeCost(role, usage, this.opts.pricing);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // We paid for the tokens — trace + charge even on a bad response.
      await this.trace(params, model, usage, costUsd, latencyMs, { rawText: text }, "invalid_json", "not valid JSON");
      throw new LLMStructuredOutputError("Response was not valid JSON", text);
    }

    const validated = params.schema.safeParse(parsed);
    await this.trace(
      params,
      model,
      usage,
      costUsd,
      latencyMs,
      { output: parsed },
      validated.success ? null : "schema_mismatch",
      validated.success ? null : validated.error.message,
    );

    if (!validated.success) {
      throw new LLMStructuredOutputError(
        `Response failed schema validation: ${validated.error.message}`,
        text,
      );
    }

    return { data: validated.data, model, tokensIn: usage.tokensIn, tokensOut: usage.tokensOut, costUsd, latencyMs };
  }

  /** Insert the trace row and add its cost to the run — one transaction. */
  private async trace<T>(
    params: LlmCallParams<T>,
    model: string,
    usage: LLMUsage,
    costUsd: number,
    latencyMs: number,
    outputJson: Record<string, unknown> | null,
    errorType: string | null,
    errorMessage: string | null,
  ): Promise<void> {
    const cost = costUsd.toFixed(6);
    await this.opts.db.transaction(async (tx) => {
      await tx.insert(traces).values({
        runId: params.runId,
        kind: "model",
        name: `${params.stage}:${model}`,
        inputJson: { system: params.system, prompt: params.prompt },
        outputJson: outputJson ?? undefined,
        success: errorType ? "false" : "true",
        ...(errorType ? { errorType } : {}),
        ...(errorMessage ? { errorMessage } : {}),
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        latencyMs,
        costUsd: cost,
      });
      if (costUsd > 0) {
        await tx
          .update(runs)
          .set({ spentUsd: sql`${runs.spentUsd} + ${cost}::numeric`, updatedAt: new Date() })
          .where(eq(runs.id, params.runId));
      }
    });
  }
}

/** OpenRouter provider — the production {@link LlmGenerate}. Never called in tests. */
export function openRouterGenerate(apiKey: string): LlmGenerate {
  return async ({ model, system, prompt }) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: json.choices?.[0]?.message?.content ?? "",
      usage: {
        tokensIn: json.usage?.prompt_tokens ?? 0,
        tokensOut: json.usage?.completion_tokens ?? 0,
      },
    };
  };
}
