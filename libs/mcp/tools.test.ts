import type { Db } from "@libs/db";
import { KillSwitchError, NotApprovedError } from "@libs/services/pr";
import { describe, expect, it } from "vitest";

import { buildTools, type McpDeps } from "./tools";

// A fake DB whose `select().from().where()` resolves to the given approval rows.
const fakeDb = (approvalRows: unknown[]): Db =>
  ({ select: () => ({ from: () => ({ where: async () => approvalRows }) }) }) as unknown as Db;

const baseDeps = (over: Partial<McpDeps>): McpDeps => ({
  db: fakeDb([]),
  sandbox: {} as unknown as McpDeps["sandbox"],
  llm: {} as unknown as McpDeps["llm"],
  createPr: async () => ({ number: 1, url: "" }),
  fetchIssue: async () => ({ repo: "r", number: 1, title: "t", body: "b", labels: [], comments: [] }),
  template: "tpl",
  githubWritesEnabled: true,
  budgetUsd: 2,
  ...over,
});

describe("MCP tools", () => {
  it("exposes the expected tools", () => {
    expect(Object.keys(buildTools(baseDeps({}))).sort()).toEqual([
      "get_issue",
      "open_pull_request",
      "resolve_issue",
      "run_tests",
    ]);
  });

  it("get_issue structures a fetched issue", async () => {
    const tools = buildTools(
      baseDeps({
        fetchIssue: async () => ({ repo: "acme/x", number: 7, title: "bug", body: "boom", labels: [], comments: [] }),
      }),
    );
    const d = (await tools.get_issue!.handler({ repo: "acme/x", issueNumber: 7 })) as {
      issueNumber: number;
    };
    expect(d.issueNumber).toBe(7);
  });

  describe("open_pull_request is code-gated — arguments cannot bypass it", () => {
    it("throws NotApprovedError with no approval, even if args claim approval", async () => {
      let createCalls = 0;
      const tools = buildTools(
        baseDeps({ db: fakeDb([]), createPr: async () => ((createCalls += 1), { number: 9, url: "" }) }),
      );
      await expect(
        tools.open_pull_request!.handler({
          runId: 1,
          owner: "o",
          repo: "r",
          title: "t",
          body: "b",
          head: "h",
          base: "main",
          approved: true, // ignored — the gate reads the DB, not the args
        }),
      ).rejects.toBeInstanceOf(NotApprovedError);
      expect(createCalls).toBe(0);
    });

    it("throws KillSwitchError when writes are disabled, even with a real approval", async () => {
      let createCalls = 0;
      const tools = buildTools(
        baseDeps({
          db: fakeDb([{ responseJson: { approved: true } }]),
          githubWritesEnabled: false,
          createPr: async () => ((createCalls += 1), { number: 9, url: "" }),
        }),
      );
      await expect(
        tools.open_pull_request!.handler({
          runId: 1,
          owner: "o",
          repo: "r",
          title: "t",
          body: "b",
          head: "h",
          base: "main",
        }),
      ).rejects.toBeInstanceOf(KillSwitchError);
      expect(createCalls).toBe(0);
    });
  });
});
