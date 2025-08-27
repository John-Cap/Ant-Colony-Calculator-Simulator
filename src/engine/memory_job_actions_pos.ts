import type { ExecContext } from "./actions.js";
import { StringCell, PairCell } from "./cells.js";
import type { Bit } from "../core/bit.js";
import type { MemKey } from "../resources/memory.js";
import { requiredSitesForKey } from "../resources/memory_board.js";
import type { JobQueuePos } from "../domain/jobs_positional_queue.js";

function requiredGrains(span: readonly [number, number]): number {
  const [hi, lo] = span;
  return 2 + (hi === lo ? 1 : 2); // Var + Value + indices
}

/** Enqueue positional jobs to fill a row using the PairCell's bit (G/P). */
export class EnqueueFillRowFromPairPos {
  constructor(
    public id: string,
    private key: MemKey,
    private rowIdCell: string,
    private pairCellId: string,
    private which: "G" | "P" = "G",
  ) {}
  execute(ctx: ExecContext) {
    const { memory, board, jobsPos } = ctx;
    if (!memory) throw new Error("EnqueueFillRowFromPairPos: memory required");
    if (!board) throw new Error("EnqueueFillRowFromPairPos: board required");
    if (!jobsPos) throw new Error("EnqueueFillRowFromPairPos: jobsPos required");

    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;

    // Set the bit value first
    const pair = ctx.grid.get<PairCell>(this.pairCellId).value;
    const v: Bit = (this.which === "G" ? pair.G : pair.P);
    memory.setValue(rowId, v);

    // Required sites and coordinates
    const sites = requiredSitesForKey(this.key);
    const cells = board.get(rowId);

    for (const s of sites) {
      const dest = s === "Var" ? cells.var
                 : s === "Value" ? cells.value
                 : s === "IdxLo" ? (cells.idxLo as {x:number;y:number})
                 : (cells.idxHi as {x:number;y:number});

      // Simple sequence: fetch near → carry → place
      jobsPos.push({ kind: "FetchFromRepo", near: dest });
      jobsPos.push({ kind: "CarryTo", dest });
      jobsPos.push({ kind: "PlaceInRow", rowId, site: s });
    }
  }
}

/** Drain realtime workers until the row is Ready (value set + all dots placed). */
export class AwaitRowReadyRealtime {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const { memTickMs = 16 } = ctx;
    const { workerRT, memory } = ctx;
    if (!workerRT) throw new Error("AwaitRowReadyRealtime: workerRT required");
    if (!memory) throw new Error("AwaitRowReadyRealtime: memory required");

    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;

    // Busy-wait the realtime pool in this debug/offline mode.
    // In UI we would schedule ticks on a timer.
    for (let guard = 0; guard < 100000; guard++) {
      const row = memory.getRow(rowId);
      if (row.state === "Ready") return;
      workerRT.tick(memTickMs);
    }
    throw new Error(`AwaitRowReadyRealtime: guard exhausted for row ${rowId}`);
  }
}

/** Enqueue eviction (positional) for all grains currently on the row. */
export class EnqueueClearRowPos {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const { memory, rt, jobsPos, repoPos } = ctx;
    if (!memory) throw new Error("EnqueueClearRowPos: memory required");
    if (!rt) throw new Error("EnqueueClearRowPos: runtime required");
    if (!jobsPos) throw new Error("EnqueueClearRowPos: jobsPos required");

    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    memory.beginClear(rowId);

    const grains = rt.listGrains(rowId);
    for (const gid of grains) {
      jobsPos.push({ kind: "EvictFromRow", rowId, grainId: gid });
      jobsPos.push({ kind: "CarryTo", dest: repoPos ?? { x: 0, y: 0 } });
      jobsPos.push({ kind: "ReturnToRepo", grainId: gid });
    }
  }
}

/** Drain realtime workers until the row becomes Free (after clearing completes). */
export class AwaitRowFreedRealtime {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    const { memTickMs = 16 } = ctx;
    const { workerRT, memory } = ctx;
    if (!workerRT) throw new Error("AwaitRowFreedRealtime: workerRT required");
    if (!memory) throw new Error("AwaitRowFreedRealtime: memory required");

    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;

    for (let guard = 0; guard < 100000; guard++) {
      const row = memory.getRow(rowId);
      if (row.state === "Free") return;
      workerRT.tick(memTickMs);
    }
    throw new Error(`AwaitRowFreedRealtime: guard exhausted for row ${rowId}`);
  }
}
