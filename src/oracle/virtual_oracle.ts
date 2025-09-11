
import { Blackboard } from '../blackboard/blackboard.js';
import { Bit, Span, VarKind } from '../blackboard/types.js';

const bit = (n: number): Bit => (n ? 1 : 0);

// Helpers
function bitsOf(n: number, width: number): Bit[] {
    const out: Bit[] = Array.from({ length: width }, (_, i) => bit((n >> i) & 1));
    return out
}
const XOR = (a: Bit, b: Bit): Bit => (a ^ b) as Bit;
const AND = (a: Bit, b: Bit): Bit => (a & b) as Bit;
const OR  = (a: Bit, b: Bit): Bit => (a | b) as Bit;

// Prefix combine (right ◦ left)
function combine(GR: Bit, PR: Bit, GL: Bit, PL: Bit): { G: Bit; P: Bit } {
    return { G: OR(GR, AND(PR, GL)), P: AND(PR, PL) }
}

function setVec(bb: Blackboard, vk: VarKind, xs: Bit[]) {
    xs.forEach((b, i) => bb.setKnownVar(vk, i, b))
}

function span(hi: number, lo: number): Span { return { hi, lo }; }

/*
 i) Seeds: A,B,P,G, all needed prefixes (1:0),(3:2),(3:0),(2:0) for 4-bit,
 ii) Carries C1..C4, and sums S0..S3. C0 is the provided initial carry.
 iii) Sum debug
*/
export function seedOracle(bb: Blackboard, a: number, b: number, c0: Bit, width = 4) {
    // A/B
    const A = bitsOf(a, width); // LSB..MSB
    const B = bitsOf(b, width);
    setVec(bb, 'A', A);
    setVec(bb, 'B', B);

    // P/G bits
    const P = A.map((ai, i) => {
        const b=B[i];
        if (b===undefined) throw new Error('B[i] undefined');
        return XOR(ai, b)
    });
    const G = A.map((ai, i) => {
        const b=B[i];
        if (b===undefined) throw new Error('B[i] undefined');
        return AND(ai, b)
    });
    setVec(bb, 'P', P);
    setVec(bb, 'G', G);

    // Prefixes for CLA-4: (1:0) and (3:2), then (3:0) and (2:0)
    const g_0=G[0];
    const g_1=G[1];
    const g_2=G[2];
    const g_3=G[3];
    if (g_1==undefined || g_2==undefined || g_3==undefined || g_0==undefined) throw new Error('G value undefined');
    const p_0=P[0];
    const p_1=P[1];
    const p_2=P[2];
    const p_3=P[3];
    if (p_1==undefined || p_2==undefined || p_3==undefined || p_0==undefined) throw new Error('G value undefined');

    const gp10 = combine(g_1, p_1, g_0, p_0);     // [1:0]
    const gp32 = combine(g_3, p_3, g_2, p_2);     // [3:2]
    const gp30 = combine(gp32.G, gp32.P, gp10.G, gp10.P); // [3:0]
    const gp20 = combine(g_2, p_2, gp10.G, gp10.P);     // [2:0]

    bb.setKnownPrefix('G', span(1, 0), gp10.G);
    bb.setKnownPrefix('P', span(1, 0), gp10.P);
    bb.setKnownPrefix('G', span(3, 2), gp32.G);
    bb.setKnownPrefix('P', span(3, 2), gp32.P);
    bb.setKnownPrefix('G', span(3, 0), gp30.G);
    bb.setKnownPrefix('P', span(3, 0), gp30.P);
    bb.setKnownPrefix('G', span(2, 0), gp20.G);
    bb.setKnownPrefix('P', span(2, 0), gp20.P);

    // Carries (C0 provided)
    const C: Bit[] = Array(width + 1).fill(0) as Bit[];
    C[0] = c0;
    const G_0=G[0];
    const P_0=P[0];
    if (G_0===undefined || P_0===undefined) throw new Error('G_0 or P_0 undefined');
    C[1] = OR(G_0, AND(P_0, C[0]));
    C[2] = OR(gp10.G, AND(gp10.P, C[0]));
    C[3] = OR(gp20.G, AND(gp20.P, C[0]));
    C[4] = OR(gp30.G, AND(gp30.P, C[0]));

    for (let i = 1; i <= width; i++) {
        const c=C[i];
        if (c==undefined) throw new Error('C_i undefined');
        bb.setKnownVar('C', i, c)
    };

    // S = P ⊕ C
    const S = P.map((pi, i) => {
        if (C[i]===undefined) throw new Error('G_0 or P_0 undefined');
        return XOR(pi, C[i]);
    });

    if (
        S[0]===undefined ||
        S[1]===undefined ||
        S[2]===undefined ||
        S[3]===undefined
    ) throw new Error('G_0 or P_0 undefined');

    console.log("Calculated sum: ",(S[0] + 2*S[1] + 4*S[2] + 8*S[3] + 16*C[4]));

    setVec(bb, 'S', S);
}