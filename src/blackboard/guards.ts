import { Blackboard } from './blackboard.js';
import { RowKey, Span, VarKind } from './types.js';

export type Guard = (bb: Blackboard) => boolean;

export const known = (v: VarKind, i: number, val?: 0|1): Guard =>
    (bb) => bb.isKnownVar(v, i, val);

export const knownPrefix = (v: 'G'|'P', s: Span, val?: 0|1): Guard =>
    (bb) => bb.isKnownPrefix(v, s, val);

export const rowReady = (key: RowKey): Guard =>
    (bb) => bb.rowReadyByKey(key);

export const all = (...gs: Guard[]): Guard =>
    (bb) => gs.every(g => g(bb));

export const any = (...gs: Guard[]): Guard =>
    (bb) => gs.some(g => g(bb));