import { describe, it, expect } from "vitest";
import { XOR, AND, OR, combine, type GP } from "../core/bit.js";

describe("gates", () => {
  it("XOR/AND/OR basics", () => {
    expect(XOR(1, 0)).toBe(1);
    expect(AND(1, 1)).toBe(1);
    expect(OR(0, 0)).toBe(0);
    expect(OR(0, 1)).toBe(1);
  });
  it("combine rule", () => {
    const g0: GP = { G: 0, P: 1 };
    const g1: GP = { G: 0, P: 1 };
    expect(combine(g1, g0)).toEqual({ G: 0, P: 1 });
  });
});
