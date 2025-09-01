export type Bit = 0 | 1;
export type VarKind = 'P' | 'G' | 'C' | 'S';
export type Span = [hi: number, lo: number];  // e.g. [2,0] for G[2:0]
export type SymbolKey = string;               // canonical string form

export function keyOf(kind: VarKind, idx: number | Span): SymbolKey {
    return Array.isArray(idx) ? `${kind}[${idx[0]}:${idx[1]}]` : `${kind}${idx}`;
}

export function parseKey(k: SymbolKey): { kind: VarKind; idx?: number; span?: Span } {
    const mSpan = /^([PGCS])\[(\d+):(\d+)\]$/.exec(k);
    if (mSpan) return { kind: mSpan[1] as VarKind, span: [Number(mSpan[2]), Number(mSpan[3])] };
    const mIdx = /^([PGCS])(\d+)$/.exec(k);
    if (mIdx) return { kind: mIdx[1] as VarKind, idx: Number(mIdx[2]) };
    throw new Error(`Invalid symbol key: ${k}`);
}
