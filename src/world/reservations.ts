import { Id } from "./geometry.js";
import { Board } from "./board.js";
import { buildIndex } from "./board_utils.js";

export class ReservationService {
  private readonly cellToJob = new Map<Id, Id>();

  constructor(private board: Board) {}

  isReserved(cellId: Id): boolean {
    return this.cellToJob.has(cellId);
  }

  tryReserve(cellId: Id, jobId: Id): boolean {
    if (this.cellToJob.has(cellId)) return false;
    const idx = buildIndex(this.board);
    const cell = idx.findCell(cellId);
    cell.reservedBy = jobId;
    this.cellToJob.set(cellId, jobId);
    return true;
  }

  release(cellId: Id): void {
    const idx = buildIndex(this.board);
    const cell = idx.findCell(cellId);
    cell.reservedBy = undefined; // exactOptionalPropertyTypes-friendly
    this.cellToJob.delete(cellId);
  }
}
