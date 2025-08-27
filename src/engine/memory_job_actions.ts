import type { ExecContext } from "./actions.js";
import { StringCell, PairCell } from "./cells.js";
import type { Bit } from "../core/bit.js";
import type { JobQueue } from "../domain/jobs.js";
import type { MemoryTable } from "../resources/memory.js";

/** Compute how many grains are needed to encode the key (var + value + index sites). */
function requiredGrains(span: readonly [number, number]): number {
  const [hi, lo] = span;
  return 2 + (hi === lo ? 1 : 2); // var + value + (one or two) index dots
}

/** Enqueue placement for a row, deriving the bit from a PairCell (G or P). */
export class EnqueueFillRowFromPair {
  constructor(
    public id: string,
    private rowIdCell: string,
    private pairCellId: string,
    private which: "G" | "P" = "G",
    private span: readonly [number, number],   // pass the same span used at allocation
  ) {}
  execute(ctx: ExecContext) {
    const mem = mustMem(ctx);
    const jobs = mustJobs(ctx);
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    // Set the bit value first
    const pair = ctx.grid.get<PairCell>(this.pairCellId).value;
    const v: Bit = (this.which === "G" ? pair.G : pair.P);
    mem.setValue(rowId, v);
    // In Reserved → place N grains → worker will mark Ready.
    const count = requiredGrains(this.span);
    jobs.push({ kind: "PlaceOnRow", rowId, count });
  }
}

/** Drain the queue (virtual mode) to ensure the row is Ready. */
export class AwaitRowReady {
  constructor(public id: string) {}
  execute(ctx: ExecContext) {
    const worker = mustWorker(ctx);
    worker.drain();
  }
}

/** Set row to Clearing and enqueue eviction. */
export class EnqueueClearRow {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const mem = mustMem(ctx);
    const jobs = mustJobs(ctx);
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    mem.beginClear(rowId);
    jobs.push({ kind: "ClearRow", rowId });
  }
}

/** Drain eviction and free rows that are empty. */
export class AwaitRowFreed {
  constructor(public id: string) {}
  execute(ctx: ExecContext) {
    const worker = mustWorker(ctx);
    worker.drain();
  }
}

// — helpers —
function mustMem(ctx: ExecContext): MemoryTable {
  if (!ctx.memory) throw new Error("memory required");
  return ctx.memory;
}
function mustJobs(ctx: ExecContext): JobQueue {
  if (!ctx.jobs) throw new Error("jobs queue required");
  return ctx.jobs;
}
function mustWorker(ctx: ExecContext) {
  if (!ctx.worker) throw new Error("virtual worker required");
  return ctx.worker;
}
