import { describe, it, expect } from 'vitest';
import {
  Bit,
  Nibble,
  GP,
  xor,
  and,
  or,
  computeP,
  computeG,
  isBit,
  assertBit,
  toNibble,
  fromNibble,
  formatBits,
} from '../core/bit.js';

describe('Bit guards', () => {
  it('isBit/assertBit', () => {
    expect(isBit(0)).toBe(true);
    expect(isBit(1)).toBe(true);
    expect(isBit(2)).toBe(false);
    expect(() => assertBit(2)).toThrow();
    expect(() => assertBit('x')).toThrow();
    expect(() => assertBit(1)).not.toThrow();
  });
});

describe('Boolean gates', () => {
  const pairs: [Bit, Bit, { xor: Bit; and: Bit; or: Bit }][] = [
    [0, 0, { xor: 0, and: 0, or: 0 }],
    [0, 1, { xor: 1, and: 0, or: 1 }],
    [1, 0, { xor: 1, and: 0, or: 1 }],
    [1, 1, { xor: 0, and: 1, or: 1 }],
  ];

  it('truth tables match classical logic', () => {
    for (const [a, b, exp] of pairs) {
      expect(xor(a, b)).toBe(exp.xor);
      expect(and(a, b)).toBe(exp.and);
      expect(or(a, b)).toBe(exp.or);
    }
  });

  it('computeP === xor; computeG === and; and P/G never both 1', () => {
    for (const [a, b] of pairs.map(([a, b]) => [a, b] as [Bit, Bit])) {
      const P = computeP(a, b);
      const G = computeG(a, b);
      expect(P).toBe(xor(a, b));
      expect(G).toBe(and(a, b));
      expect(!(P === 1 && G === 1)).toBe(true);
    }
  });
});

describe('Nibble conversions', () => {
  it('round-trip 0..15', () => {
    for (let n = 0; n <= 15; n++) {
      const nb = toNibble(n);
      const m = fromNibble(nb);
      expect(m).toBe(n);
    }
  });

  it('toNibble rejects out-of-range', () => {
    expect(() => toNibble(-1)).toThrow();
    expect(() => toNibble(16)).toThrow();
    expect(() => toNibble(3.14)).toThrow();
  });

  it('formatBits prints MSB-left by default', () => {
    const nb = toNibble(13); // 1101b → LSB-first [1,0,1,1]
    expect(nb).toEqual<[Bit, Bit, Bit, Bit]>([1, 0, 1, 1]);
    expect(formatBits(nb)).toBe('1101');          // MSB-left
    expect(formatBits(nb, { msbLeft: false })).toBe('1011'); // LSB-left
  });
});
