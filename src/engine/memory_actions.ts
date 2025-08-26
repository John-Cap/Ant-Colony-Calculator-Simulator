import type { Bit } from "../core/bit.js";        // use core Bit (0|1)
import type { MemKey } from "../resources/memory.js";
import type { ExecContext } from "./actions.js";
import { StringCell, BitCell, PairCell } from "./cells.js";

export interface Action { id: string; execute(ctx: ExecContext): void; }

/** Allocate a row for a given key; write the row-id into a StringCell. */
export class AllocScratch implements Action {
  constructor(
    public id: string,
    private key: MemKey,
    private outRowIdCell: string,
  ) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("AllocScratch: ExecContext.memory is required");
    const rowId = mem.allocate(this.key);
    ctx.grid.get<StringCell>(this.outRowIdCell).write(rowId);
  }
}

/** Optional convenience: set the bit value while building the row. */
export class SetScratchValue implements Action {
  constructor(public id: string, private rowIdCell: string, private value: Bit) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("SetScratchValue: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    mem.setValue(rowId, this.value);
  }
}

/** Mark row Busy (between Reserved and Ready). */
export class MarkScratchBusy implements Action {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("MarkScratchBusy: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    mem.markBusy(rowId);
  }
}

/** Mark row Ready (ants are assumed to have placed the final grains). */
export class MarkScratchReady implements Action {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("MarkScratchReady: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    mem.markReady(rowId);
  }
}

/** Begin clearing: emits no jobs yet; we will add jobs in the next step. */
export class BeginScratchClear implements Action {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("BeginScratchClear: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    mem.beginClear(rowId);
  }
}

/** Hooks for the “grain layer” (virtual step for now). */
export class IncScratchOccupancy implements Action {
  constructor(public id: string, private rowIdCell: string, private by: number = 1) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("IncScratchOccupancy: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    for (let i = 0; i < this.by; i++) mem.incOccupancy(rowId);
  }
}
export class DecScratchOccupancy implements Action {
  constructor(public id: string, private rowIdCell: string, private by: number = 1) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory;
    if (!mem) throw new Error("DecScratchOccupancy: ExecContext.memory is required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    for (let i = 0; i < this.by; i++) mem.decOccupancy(rowId);
  }
}

/** Set row value from a PairCell's field ('G' or 'P'). Defaults to 'G'. */
export class SetScratchValueFromPair implements Action {
  constructor(
    public id: string,
    private rowIdCell: string,
    private pairCellId: string,
    private which: "G" | "P" = "G",
  ) {}
  execute(ctx: ExecContext) {
    const mem = ctx.memory; if (!mem) throw new Error("SetScratchValueFromPair: memory required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    const pair = ctx.grid.get<PairCell>(this.pairCellId).value;
    const v: Bit = (this.which === "G" ? pair.G : pair.P);
    mem.setValue(rowId, v);
  }
}