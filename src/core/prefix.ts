/**
 * Adder theory primitives: prefix (G,P) combine, ranges, carries, and sums.
 *
 * Indexing & conventions
 * ──────────────────────
 * • Bits are LSB-first: index 0 is the least significant bit.
 * • For ranges [hi:lo], "right" = higher index (hi), "left" = lower index (lo).
 * • Combine rule (right ∘ left):
 *      (G,P) = (G_R ∨ (P_R · G_L),  P_R · P_L)
 */

import type { Bit, GP } from './bit.js';
import { and, or, xor, computeP as Pbit, computeG as Gbit } from './bit.js';

/** Assert a possibly-undefined value is present (helps with noUncheckedIndexedAccess). */
function must<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

/** Combine two (G,P) groups: right = higher indices, left = lower indices. */
export function gpCombine(right: GP, left: GP): GP {
  return {
    G: or(right.G, and(right.P, left.G)),
    P: and(right.P, left.P),
  };
}

/**
 * Fold a contiguous range [hi:lo] from per-bit leaves into a single (G,P).
 * Expects `leaves[i]` to be the (G_i,P_i) for bit i.
 */
export function gpRangeFromLeaves(leaves: readonly GP[], hi: number, lo: number): GP {
  if (hi < lo) throw new RangeError(`gpRangeFromLeaves: hi < lo (${hi} < ${lo})`);
  if (lo < 0 || hi >= leaves.length)
    throw new RangeError(`gpRangeFromLeaves: range [${hi}:${lo}] out of bounds`);
  let acc: GP = must(leaves[hi], `gpRangeFromLeaves: missing leaf ${hi}`);
  for (let i = hi - 1; i >= lo; i--) {
    const leaf = must(leaves[i], `gpRangeFromLeaves: missing leaf ${i}`);
    acc = gpCombine(acc, leaf); // right = acc (higher indices so far), left = current leaf i
  }
  return acc;
}

/**
 * Compute prefix array where `prefix[i]` is (G_{i:0}, P_{i:0}) — i.e., range [i:0].
 * Length = N (same as leaves).
 */
export function gpPrefixes(leaves: readonly GP[]): GP[] {
  const out: GP[] = [];
  for (let i = 0; i < leaves.length; i++) {
    const leaf = must(leaves[i], `gpPrefixes: missing leaf ${i}`);
    if (i === 0) out.push(leaf);
    else out.push(gpCombine(leaf, must(out[i - 1], `gpPrefixes: missing prefix ${i - 1}`)));
    // Note: combine(right=leaf i, left=prefix[i-1]) because "right" is higher index.
  }
  return out;
}

/** Carry from a prefix pair and input carry C0: Ci = G ∨ (P · C0). */
export function carryFromPrefix(prefix: GP, c0: Bit): Bit {
  return prefix.G === 1 || (prefix.P === 1 && c0 === 1) ? 1 : 0;
}

/**
 * Compute all carries C0..Cn given prefixes [i:0].
 * prefixes[i] must equal (G_{i:0}, P_{i:0}). Returns length N+1.
 */
export function carriesFromPrefixes(prefixes: readonly GP[], c0: Bit): Bit[] {
  const n = prefixes.length;
  const C: Bit[] = new Array(n + 1);
  C[0] = c0;
  for (let i = 1; i <= n; i++) {
    const pref = must(prefixes[i - 1], `carriesFromPrefixes: missing prefix ${i - 1}`);
    C[i] = carryFromPrefix(pref, c0);
  }
  return C;
}

/** Sum bits S_i = P_i ⊕ C_i (length N). */
export function sumsFromPAndCarries(P: readonly Bit[], C: readonly Bit[]): Bit[] {
  if (C.length !== P.length + 1) throw new Error(`sumsFromPAndCarries: C must be length P+1`);
  return P.map((p, i) => xor(p, must(C[i], `sumsFromPAndCarries: missing carry ${i}`)));
}

/** Build per-bit P_i, G_i, and GP leaves from A_i and B_i (all LSB-first). */
export function pgLeavesFromAB(A: readonly Bit[], B: readonly Bit[]): {
  P: Bit[]; G: Bit[]; leaves: GP[];
} {
  if (A.length !== B.length) throw new Error(`pgLeavesFromAB: A and B length mismatch`);
  const n = A.length;
  const P: Bit[] = new Array(n);
  const G: Bit[] = new Array(n);
  const leaves: GP[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = must(A[i], `pgLeavesFromAB: missing A[${i}]`);
    const b = must(B[i], `pgLeavesFromAB: missing B[${i}]`);
    const p = Pbit(a, b);
    const g = Gbit(a, b);
    P[i] = p; G[i] = g;
    leaves[i] = { G: g, P: p };
  }
  return { P, G, leaves };
}

/** Convenience: compute {S,C} from A,B (LSB-first) and C0 using full-prefix lookahead. */
export function addWithPrefix(A: readonly Bit[], B: readonly Bit[], c0: Bit = 0): {
  P: Bit[]; G: Bit[]; prefixes: GP[]; C: Bit[]; S: Bit[];
} {
  const { P, G, leaves } = pgLeavesFromAB(A, B);
  const prefixes = gpPrefixes(leaves);               // [i:0] for each i
  const C = carriesFromPrefixes(prefixes, c0);       // C0..Cn
  const S = sumsFromPAndCarries(P, C);               // S0..S_{n-1}
  return { P, G, prefixes, C, S };
}
