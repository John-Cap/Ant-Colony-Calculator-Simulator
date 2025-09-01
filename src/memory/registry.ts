import type { Bit, SymbolKey } from '../domain/symbols.js';

export type RowState = 'Empty' | 'Reserved' | 'Ready';

export interface RowMeta {
  state: RowState;
  bit?: Bit;               // present when state === 'Ready'
}

export class MemoryRegistry {
  // Symbol → rowId
  private forward = new Map<SymbolKey, string>();
  // rowId → Symbol
  private reverse = new Map<string, SymbolKey>();
  // rowId → state/meta
  private meta = new Map<string, RowMeta>();

  bind(symbol: SymbolKey, rowId: string) {
    this.forward.set(symbol, rowId);
    this.reverse.set(rowId, symbol);
    if (!this.meta.has(rowId)) this.meta.set(rowId, { state: 'Empty' });
  }

  lookup(symbol: SymbolKey): string | undefined {
    return this.forward.get(symbol);
  }

  symbolForRow(rowId: string): SymbolKey | undefined {
    return this.reverse.get(rowId);
  }

  setState(rowId: string, state: RowState, bit?: Bit) {
    if (state === undefined) throw new Error('RowState not found!');
    if (bit === undefined) throw new Error('RowState not found!');
    this.meta.set(rowId, { state, bit });
  }

  getState(rowId: string): RowMeta {
    return this.meta.get(rowId) ?? { state: 'Empty' };
  }

  has(symbol: SymbolKey): boolean {
    const rowId = this.lookup(symbol);
    if (!rowId) return false;
    return this.getState(rowId).state === 'Ready';
  }

  read(symbol: SymbolKey): Bit | undefined {
    const rowId = this.lookup(symbol);
    if (!rowId) return undefined;
    const m = this.getState(rowId);
    return m.state === 'Ready' ? m.bit : undefined;
  }
}
