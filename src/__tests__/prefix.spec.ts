import { describe, it, expect } from 'vitest';
import { toNibble, fromNibble, type Bit, type GP } from '../core/bit.js';
import {
  gpCombine,
  gpRangeFromLeaves,
  gpPrefixes,
  carryFromPrefix,
  carriesFromPrefixes,
  sumsFromPAndCarries,
  pgLeavesFromAB,
  addWithPrefix,
} from '../core/prefix.js';

describe('combine law', () => {
  it('matches (G,P) = (G_R ∨ (P_R·G_L), P_R·P_L)', () => {
    const R: GP = { G: 1, P: 0 };
    const L: GP = { G: 0, P: 1 };
    expect(gpCombine(R, L)).toEqual<GP>({ G: 1, P: 0 });
  });
});

describe('range folding', () => {
  it('[2:0] = (2:2) ∘ (1:0)', () => {
    const leaves: GP[] = [
      { G: 0, P: 1 }, // bit 0
      { G: 0, P: 1 }, // bit 1
      { G: 0, P: 1 }, // bit 2
    ];
    const r = gpRangeFromLeaves(leaves, 2, 0);
    expect(r).toEqual<GP>({ G: 0, P: 1 });
  });
});

describe('prefix carries and sums (example 13 + 10)', () => {
  it('matches 23 with expected carries', () => {
    const A = toNibble(13); // [1,0,1,1] LSB-first
    const B = toNibble(10); // [0,1,0,1]
    const { P, G, leaves } = pgLeavesFromAB(A, B);
    const prefixes = gpPrefixes(leaves);
    const C = carriesFromPrefixes(prefixes, 0);
    const S = sumsFromPAndCarries(P, C);

    // Carries: C0..C4 = 0,0,0,0,1
    expect(C).toEqual<Bit[]>([0,0,0,0,1]);
    // S = 0b0111 (LSB-first -> [1,1,1,0])
    expect(S).toEqual<Bit[]>([1,1,1,0]);

    // Numeric check
    const value = (C[4]! * 16) + fromNibble([S[0]!, S[1]!, S[2]!, S[3]!] as any);
    expect(value).toBe(23);
  });
});

describe('exhaustive 4-bit addition matches arithmetic (C0=0)', () => {
  it('all A,B in 0..15', () => {
    for (let a = 0; a <= 15; a++) {
      for (let b = 0; b <= 15; b++) {
        const A = toNibble(a);
        const B = toNibble(b);
        const { C, S } = addWithPrefix(A, B, 0);
        const sum = (C[4]! * 16) + ((S[3]! << 3) | (S[2]! << 2) | (S[1]! << 1) | (S[0]! << 0));
        expect(sum).toBe(a + b);
      }
    }
  });
});

describe('S_i = P_i XOR C_i invariant', () => {
  it('holds for random pairs', () => {
    const rnd = () => Math.floor(Math.random()*16);
    for (let t = 0; t < 20; t++) {
      const A = toNibble(rnd());
      const B = toNibble(rnd());
      const { P, C, S } = addWithPrefix(A, B, 0);
      for (let i = 0; i < 4; i++) {
        expect(S[i]).toBe(((P[i]! ^ C[i]!) as Bit));
      }
    }
  });
});
