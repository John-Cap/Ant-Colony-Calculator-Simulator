import type { ExecContext } from "./actions.js";
import { StringCell } from "./cells.js";
import type { MemKey } from "../resources/memory.js";

export class RealizeBoardRowFromKey {
  constructor(public id: string, private key: MemKey, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    if (!ctx.board) throw new Error("RealizeBoardRowFromKey: board required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    ctx.board.realize(this.key, rowId);
  }
}

export class RemoveBoardRow {
  constructor(public id: string, private rowIdCell: string) {}
  execute(ctx: ExecContext) {
    if (!ctx.board) throw new Error("RemoveBoardRow: board required");
    const rowId = ctx.grid.get<StringCell>(this.rowIdCell).value;
    if (ctx.board.has(rowId)) ctx.board.remove(rowId);
  }
}
