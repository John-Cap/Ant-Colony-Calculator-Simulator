/**
 * Core bit/boolean primitives for the ant-CLA simulator.
 *
 * Conventions
 * ───────────
 * • Storage is LSB-first! For a 4-bit nibble we use [b0, b1, b2, b3],
 *   where b0 is the least significant bit (index 0).
 * • Display helpers (e.g., formatBits) default to MSB-left strings.
 */

export type Bit = 0 | 1;

export type Nibble = readonly [Bit, Bit, Bit, Bit];

export interface GP {
  /** Generate: AND*/
  G: Bit;
  /** Propagate: XOR*/
  P: Bit;
}

/** Type guard for Bit. */
export function isBit(x: unknown): x is Bit {
  return x === 0 || x === 1;
}

/** Assert test? */
export function assertBit(x: unknown): asserts x is Bit {
  if (!isBit(x)) {
    throw new TypeError(`Expected Bit (0|1), got: ${String(x)}`);
  }
}

export function xor(a: Bit, b: Bit): Bit {
  return ((a ^ b) as Bit);
}

export function and(a: Bit, b: Bit): Bit {
  return ((a & b) as Bit);
}

export function or(a: Bit, b: Bit): Bit {
  return ((a | b) as Bit);
}

/** P = A ⊕ B*/
export function computeP(a: Bit, b: Bit): Bit {
  return xor(a, b);
}

/** G = A · B */
export function computeG(a: Bit, b: Bit): Bit {
  return and(a, b);
}

/**
 * Convert an integer in [0,15] to a 4-bit nibble (LSB-first).
 * Throws if n is not an integer in range.
 */
export function toNibble(n: number): Nibble {
  if (!Number.isInteger(n) || n < 0 || n > 15) {
    throw new RangeError(`toNibble: int ${n} not element of [0,15]`);
  }
  const b0: Bit = ((n >> 0) & 1) as Bit;
  const b1: Bit = ((n >> 1) & 1) as Bit;
  const b2: Bit = ((n >> 2) & 1) as Bit;
  const b3: Bit = ((n >> 3) & 1) as Bit;
  return [b0, b1, b2, b3];
}

/**
 * Convert a 4-bit nibble (LSB-first) back to an integer in [0,15].
 * TODO - Validate tuple length and bit values at runtime?
 */
export function fromNibble(nb: Nibble): number {
  const [b0, b1, b2, b3] = nb;
  // Runtime validation (defensive), even though the type already constrains.
  [b0, b1, b2, b3].forEach(assertBit);
  return (b0 << 0) | (b1 << 1) | (b2 << 2) | (b3 << 3);
}

/**
 * Format a sequence of bits as a binary string.
 * By default prints MSB-left (i.e., visually conventional).
 *
 * @param bits  Sequence of bits, typically LSB-first.
 * @param opts  msbLeft=true prints reversed; false prints as-is (LSB-left).
 */
export function formatBits(
  bits: readonly Bit[],
  opts: { msbLeft?: boolean } = { msbLeft: true }
): string {
  const { msbLeft = true } = opts;
  const src = msbLeft ? [...bits].reverse() : bits;
  return src.map((b) => (b === 1 ? "1" : "0")).join("");
}
