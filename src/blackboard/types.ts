// Primitive shared types
export type Id = string;
export type Bit = 0 | 1;

export type VarKind = 'A' | 'B' | 'P' | 'G' | 'C' | 'S';

// G/P prefixes use spans hi:lo (e.g. 3:0, 1:0)
export interface Span { hi: number; lo: number; }
export const spanKey = (s: Span) => `${s.hi}:${s.lo}` as const;

// Key for a memory row (what the row conceptually stores)
export type RowKey =
    | { kind: 'G'; span: Span }
    | { kind: 'P'; span: Span }
    | { kind: 'C'; index: number }
    | { kind: 'S'; index: number };

// Row lifecycle
export type RowState = 'Reserved' | 'Filling' | 'Ready' | 'Clearing' | 'Free';

// ------------------------------------------------------------------
// Fact model (everything we can assert on the blackboard)
// ------------------------------------------------------------------

// Known single-bit variables (Ai, Bi, Pi, Gi, Ci, Si)
export interface KnownVarFact {
    fact: 'KnownVar';
    v: VarKind;          // e.g., 'P'
    index: number;       // e.g., 2
    value: Bit;
}

// Known prefix values for G or P over a span (we keep them separate—no tuples)
export interface KnownPrefixFact {
    fact: 'KnownPrefix';
    v: 'G' | 'P';
    span: Span;          // e.g., {hi:3, lo:0}
    value: Bit;
}

// Row mapping (conceptual key -> physical row id)
export interface RowAllocatedFact {
    fact: 'RowAllocated';
    key: RowKey;
    rowId: Id;
}

export interface RowStateFact {
    fact: 'RowState';
    rowId: Id;
    state: RowState;
}

// Cell occupancy on the world board
export interface CellOccFact {
    fact: 'CellOcc';
    compId: Id;
    role: string;       // e.g., 'inA', 'reserved', 'value'
    occupancy: number;  // grains currently inside
}

// Ant state (minimal for scheduling)
export interface AntFact {
    fact: 'Ant';
    id: Id;
    status: 'Idle' | 'Busy';
    x: number; y: number;
    carrying?: Id | null;  // grain id, if any
    jobId?: Id | null;
}

// Union
export type Fact =
    | KnownVarFact
    | KnownPrefixFact
    | RowAllocatedFact
    | RowStateFact
    | CellOccFact
    | AntFact;

// Event payloads
export type FactEvent =
    | { type: 'added' | 'updated' | 'removed'; fact: Fact };