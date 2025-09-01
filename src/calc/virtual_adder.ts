// Virtual, deterministic computation of a 4-bit Brent–Kung addition.
// Strict-mode safe (noUncheckedIndexedAccess, exactOptionalPropertyTypes).

export type Bit = 0 | 1;
export type SpanKey = `${number}:${number}`;
export type GP = { G: Bit; P: Bit };

export interface VirtualSnapshot {
    n: number;
    A: Bit[];                  // [A0..A3]
    B: Bit[];                  // [B0..B3]
    P: Bit[];                  // [P0..P3]
    G: Bit[];                  // [G0..G3]
    prefixP: Record<SpanKey, Bit>;
    prefixG: Record<SpanKey, Bit>;
    C: Bit[];                  // [C0..C4]
    S: Bit[];                  // [S0..S3]
    steps: Array<{ name: string; detail?: unknown }>;
}

//Check strict!
function at<T>(arr: ReadonlyArray<T>, i: number, msg?: string): T {
    const v = arr[i];
    if (v === undefined) throw new Error(msg ?? `Index ${i} out of range`);
    return v;
}
function getRec<R extends Record<string, unknown>, K extends keyof R>(
    rec: R,
    k: K,
    msg?: string,
): R[K] {
    const v = rec[k];
    if (v === undefined) throw new Error(msg ?? `Missing key ${String(k)}`);
    return v as R[K];
}

const b = (v: number): Bit => ((v & 1) as Bit);
const XOR = (x: Bit, y: Bit): Bit => b(x ^ y);
const AND = (x: Bit, y: Bit): Bit => b(x & y);
const OR  = (x: Bit, y: Bit): Bit => b(x | y);

function combine(right: GP, left: GP): GP {
    return {
        G: OR(right.G, AND(right.P, left.G)),
        P: AND(right.P, left.P),
    };
}

function getBit(num: number, i: number): Bit {
    return b((num >> i) & 1);   
}
const span = (hi: number, lo: number): SpanKey => `${hi}:${lo}`;

export interface ComputeOptions { c0?: Bit; }

export function computeVirtual4(a: number, bIn: number, opts: ComputeOptions = {}): VirtualSnapshot {
    const steps: VirtualSnapshot["steps"] = [];
    const n = 4;
    const c0: Bit = opts.c0 ?? 0;

    // Normalize inputs to 4 bits
    const a4 = a & 0b1111;
    const b4 = bIn & 0b1111;

    // Bits (LSB first)
    const A: Bit[] = Array.from({ length: n }, (_, i) => getBit(a4, i));
    const B: Bit[] = Array.from({ length: n }, (_, i) => getBit(b4, i));
    steps.push({ name: "inputs", detail: { A, B, C0: c0 } });

    // Bitwise P, G
    const P: Bit[] = Array.from({ length: n }, (_, i) => XOR(at(A, i), at(B, i)));
    const G: Bit[] = Array.from({ length: n }, (_, i) => AND(at(A, i), at(B, i)));
    steps.push({ name: "bitwise.P", detail: { P } });
    steps.push({ name: "bitwise.G", detail: { G } });

    // Single-bit pairs
    const GPi: GP[] = Array.from({ length: n }, (_, i) => ({ G: at(G, i), P: at(P, i) }));

    // Level 1: [1:0], [3:2]
    const gp10 = combine(at(GPi, 1), at(GPi, 0));
    const gp32 = combine(at(GPi, 3), at(GPi, 2));

    const prefixP: Record<SpanKey, Bit> = {
        [span(1,0)]: gp10.P,
        [span(3,2)]: gp32.P,
    };
    const prefixG: Record<SpanKey, Bit> = {
        [span(1,0)]: gp10.G,
        [span(3,2)]: gp32.G,
    };
    steps.push({ name: "prefix.level1", detail: {
        P: { [span(1,0)]: gp10.P, [span(3,2)]: gp32.P },
        G: { [span(1,0)]: gp10.G, [span(3,2)]: gp32.G },
    }});

    // Level 2 root: [3:0] = (3:2) ∘ (1:0)
    const gp30 = combine(gp32, gp10);
    prefixP[span(3,0)] = gp30.P;
    prefixG[span(3,0)] = gp30.G;
    steps.push({ name: "prefix.level2.root", detail: {
        P: { [span(3,0)]: gp30.P }, G: { [span(3,0)]: gp30.G }
    }});

  // Small combine: [2:0] = (2:2) ∘ (1:0)
    const gp20 = combine(at(GPi, 2), gp10);
    prefixP[span(2,0)] = gp20.P;
    prefixG[span(2,0)] = gp20.G;
    steps.push({ name: "prefix.small.20", detail: {
        P: { [span(2,0)]: gp20.P }, G: { [span(2,0)]: gp20.G }
    }});

  // Carries (prefix form)
    const C: Bit[] = [c0, 0, 0, 0, 0] as Bit[];

    C[1] = OR(at(GPi, 0).G, AND(at(GPi, 0).P, at(C, 0)));
    C[2] = OR(getRec(prefixG, span(1,0)), AND(getRec(prefixP, span(1,0)), at(C, 0)));
    C[3] = OR(getRec(prefixG, span(2,0)), AND(getRec(prefixP, span(2,0)), at(C, 0)));
    C[4] = OR(getRec(prefixG, span(3,0)), AND(getRec(prefixP, span(3,0)), at(C, 0)));

    const S: Bit[] = Array.from({ length: n }, (_, i) => XOR(at(P, i), at(C, i)));

    steps.push({ name: "sums", detail: { S } });

    return { n, A, B, P, G, prefixP, prefixG, C, S, steps };
}
