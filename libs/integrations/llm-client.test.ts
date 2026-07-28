import { describe, expect, it } from "vitest";

import { computeCost, roleForStage } from "./llm-client";

describe("roleForStage", () => {
  it("routes cheap stages to the cheap model", () => {
    expect(roleForStage("localizing")).toBe("cheap");
    expect(roleForStage("ingesting")).toBe("cheap");
    expect(roleForStage("summarize")).toBe("cheap");
  });

  it("routes reproduce/patch to the strong model", () => {
    expect(roleForStage("reproducing")).toBe("strong");
    expect(roleForStage("patching")).toBe("strong");
  });

  it("defaults an unknown stage to cheap", () => {
    expect(roleForStage("mystery")).toBe("cheap");
  });

  it("honors an explicit override", () => {
    expect(roleForStage("localizing", "strong")).toBe("strong");
  });
});

describe("computeCost", () => {
  it("prices per million tokens, split by in/out rate and tier", () => {
    // strong = 5 in / 25 out per Mtok → 1M in + 0.5M out = 5 + 12.5
    expect(computeCost("strong", { tokensIn: 1_000_000, tokensOut: 500_000 })).toBeCloseTo(17.5);
    // cheap = 0.8 in / 4 out → 1000 in + 500 out = 0.0008 + 0.002
    expect(computeCost("cheap", { tokensIn: 1000, tokensOut: 500 })).toBeCloseTo(0.0028);
  });

  it("is zero for zero usage", () => {
    expect(computeCost("strong", { tokensIn: 0, tokensOut: 0 })).toBe(0);
  });

  it("respects a custom pricing table", () => {
    const pricing = { cheap: { inPerMTok: 1, outPerMTok: 1 }, strong: { inPerMTok: 1, outPerMTok: 1 } };
    expect(computeCost("cheap", { tokensIn: 1_000_000, tokensOut: 1_000_000 }, pricing)).toBeCloseTo(2);
  });
});
