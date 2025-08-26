export type Bit = 0 | 1;
export type GP = { G: Bit; P: Bit };

export const XOR = (a: Bit, b: Bit): Bit => (a ^ b) as Bit;
export const AND = (a: Bit, b: Bit): Bit => (a & b) as Bit;
export const OR = (a: Bit, b: Bit): Bit => (a | b) as Bit;

// Right ∘ Left (higher indices on the right)
export function combine(right: GP, left: GP): GP {
  return { G: OR(right.G, AND(right.P, left.G)), P: AND(right.P, left.P) };
}
