import { EventEmitter } from 'node:events';
import {
    AntFact, Bit, CellOccFact, Fact, FactEvent, Id, KnownPrefixFact,
    KnownVarFact, RowAllocatedFact, RowKey, RowState, RowStateFact, Span,
    spanKey, VarKind
} from './types.js';

type Key = string;
const keyVar = (v: VarKind, i: number) => `${v}:${i}`;
const keyPrefix = (v: 'G'|'P', s: Span) => `${v}:${spanKey(s)}`;
const keyCell = (compId: Id, role: string) => `${compId}#${role}`;
const keyRowKey = (rk: RowKey) =>
    rk.kind === 'G' || rk.kind === 'P'
    ? `${rk.kind}[${spanKey(rk.span)}]`
    : `${rk.kind}[${rk.index}]`;

// The store keeps fast maps for common lookups
export class Blackboard {
    private ee = new EventEmitter();

    // Value knowledge
    private knownVar = new Map<Key, Bit>();                 // P:2 -> 1
    private knownPrefix = new Map<Key, Bit>();              // G:3:0 -> 1

    // Rows
    private rowByKey = new Map<Key, Id>();                  // G[1:0] -> row-12
    private rowState = new Map<Id, RowState>();             // row-12 -> Ready

    // Cells
    private cellOcc = new Map<Key, number>();               // comp#role -> n

    // Ants
    private ants = new Map<Id, AntFact>();

    // --------------------- Events ---------------------
    on(listener: (ev: FactEvent) => void) { this.ee.on('ev', listener); }
    off(listener: (ev: FactEvent) => void) { this.ee.off('ev', listener); }
    private emit(ev: FactEvent) { this.ee.emit('ev', ev); }

    // --------------------- Writes ---------------------
    setKnownVar(v: VarKind, index: number, value: Bit) {
        const k = keyVar(v, index);
        const existed = this.knownVar.has(k);
        this.knownVar.set(k, value);
        const fact: KnownVarFact = { fact: 'KnownVar', v, index, value };
        this.emit({ type: existed ? 'updated' : 'added', fact });
    }

    setKnownPrefix(v: 'G'|'P', span: Span, value: Bit) {
        const k = keyPrefix(v, span);
        const existed = this.knownPrefix.has(k);
        this.knownPrefix.set(k, value);
        const fact: KnownPrefixFact = { fact: 'KnownPrefix', v, span, value };
        this.emit({ type: existed ? 'updated' : 'added', fact });
    }

    setRowAllocated(key: RowKey, rowId: Id) {
        const kk = keyRowKey(key);
        const existed = this.rowByKey.has(kk);
        this.rowByKey.set(kk, rowId);
        const fact: RowAllocatedFact = { fact: 'RowAllocated', key, rowId };
        this.emit({ type: existed ? 'updated' : 'added', fact });
    }

    setRowState(rowId: Id, state: RowState) {
        const existed = this.rowState.has(rowId);
        this.rowState.set(rowId, state);
        const fact: RowStateFact = { fact: 'RowState', rowId, state };
        this.emit({ type: existed ? 'updated' : 'added', fact });
    }

    setCellOcc(compId: Id, role: string, occupancy: number) {
        const k = keyCell(compId, role);
        const existed = this.cellOcc.has(k);
        this.cellOcc.set(k, occupancy);
        const fact: CellOccFact = { fact: 'CellOcc', compId, role, occupancy };
        this.emit({ type: existed ? 'updated' : 'added', fact });
    }

    setAnt(f: AntFact) {
        const existed = this.ants.has(f.id);
        this.ants.set(f.id, f);
        this.emit({ type: existed ? 'updated' : 'added', fact: f });
    }

    // --------------------- Queries ---------------------
    isKnownVar(v: VarKind, index: number, eq?: Bit): boolean {
        const val = this.knownVar.get(keyVar(v, index));
        return eq === undefined ? val !== undefined : val === eq;
    }

    getVar(v: VarKind, index: number): Bit | undefined {
        return this.knownVar.get(keyVar(v, index));
    }

    isKnownPrefix(v: 'G'|'P', span: Span, eq?: Bit): boolean {
        const val = this.knownPrefix.get(keyPrefix(v, span));
        return eq === undefined ? val !== undefined : val === eq;
    }

    rowIdFor(key: RowKey): Id | undefined {
        return this.rowByKey.get(keyRowKey(key));
    }

    rowReadyByKey(key: RowKey): boolean {
        const id = this.rowIdFor(key);
        return !!id && this.rowState.get(id) === 'Ready';
    }

    rowStateOf(rowId: Id): RowState | undefined {
        return this.rowState.get(rowId);
    }

    cellOccOf(compId: Id, role: string): number {
        return this.cellOcc.get(keyCell(compId, role)) ?? 0;
    }

    ant(id: Id): AntFact | undefined { return this.ants.get(id); }

    // --------------------- Debug ---------------------
    dump(): void {
        const kv = [...this.knownVar.entries()].sort();
        const kp = [...this.knownPrefix.entries()].sort();
        const rows = [...this.rowByKey.entries()].map(([k, id]) => ({
            k, id, state: this.rowState.get(id)
        }));
        console.log('== Blackboard ==');
        console.table(kv.map(([k,v]) => ({ key:k, val:v })));
        console.table(kp.map(([k,v]) => ({ key:k, val:v })));
        console.table(rows);
    }
}