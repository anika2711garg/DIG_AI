/** Confirm the OpenRouter key + configured models work. */
import { openRouterGenerate } from "@libs/integrations/llm-client";

async function main() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  const gen = openRouterGenerate(key);

  for (const model of [process.env.LLM_MODEL_CHEAP!, process.env.LLM_MODEL_STRONG!]) {
    try {
      const res = await gen({
        model,
        system: 'Reply ONLY with compact JSON: {"ok": true}.',
        prompt: "ping",
      });
      console.log(`✓ ${model}: ${res.text.slice(0, 60).replace(/\n/g, " ")}  (in=${res.usage.tokensIn} out=${res.usage.tokensOut})`);
    } catch (err) {
      console.log(`✗ ${model}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
