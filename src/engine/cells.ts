import type { Bit, GP } from '../core/bit.js';

export enum CellState { EMPTY = 'EMPTY', READY = 'READY' }

export abstract class Cell<T> {
  private _state: CellState = CellState.EMPTY;
  protected _value?: T;
  constructor(public readonly id: string) {}
  get state(): CellState { return this._state; }
  get value(): T {
    if (this._state !== CellState.READY) throw new Error(`Cell ${this.id} not ready`);
    return this._value as T;
  }
  protected ready(v: T) { this._value = v; this._state = CellState.READY; }
}

export class BitCell extends Cell<Bit> { write(v: Bit) { this.ready(v); } }
export class PairCell extends Cell<GP> { write(v: GP) { this.ready(v); } }

export interface Grid {
  get<T extends Cell<unknown>>(id: string): T;
  put(cell: Cell<unknown>): void;
  has(id: string): boolean;
}

export class InMemoryGrid implements Grid {
  private map = new Map<string, Cell<unknown>>();
  get<T extends Cell<unknown>>(id: string): T {
    const c = this.map.get(id);
    if (!c) throw new Error(`Missing cell ${id}`);
    return c as T;
  }
  put(cell: Cell<unknown>): void { this.map.set(cell.id, cell); }
  has(id: string): boolean { return this.map.has(id); }
}
