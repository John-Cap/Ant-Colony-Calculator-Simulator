import type { MemoryTable } from "../resources/memory.js";
import type { GrainPool, GrainId, WorldPos } from "../resources/grains.js";

/** Tracks which concrete grains currently belong to each memory row. */
export class MemoryRuntime {
  private rowGrains = new Map<string, Set<GrainId>>();

  constructor(private mem: MemoryTable, private grains: GrainPool) {}

  // ---------- Bulk helpers (used by virtual worker) ----------

  placeOne(rowId: string) {
    const g = this.grains.borrowToLoose({ x: 0, y: 0 });
    this.grains.placeIntoSlot(g.id, rowId);
    this.mem.incOccupancy(rowId);
    let set = this.rowGrains.get(rowId);
    if (!set) { set = new Set<GrainId>(); this.rowGrains.set(rowId, set); }
    set.add(g.id);
  }

  evictOne(rowId: string) {
    const set = this.rowGrains.get(rowId);
    if (!set || set.size === 0) return;
    const it = set.values().next();
    if (it.done) return;
    const gid = it.value as GrainId;
    set.delete(gid);
    this.grains.removeFromSlotToLoose(gid, { x: 0, y: 0 });
    this.grains.returnLooseToRepo(gid);
    this.mem.decOccupancy(rowId);
  }

  // ---------- Positional helpers (used by realtime worker) ----------

  /** Record that a specific grain is now in the row (after PlaceInRow). */
  recordPlace(rowId: string, grainId: GrainId) {
    let set = this.rowGrains.get(rowId);
    if (!set) { set = new Set<GrainId>(); this.rowGrains.set(rowId, set); }
    if (!set.has(grainId)) {
      set.add(grainId);
      this.mem.incOccupancy(rowId);
    }
  }

  /** Record that a specific grain left the row (after EvictFromRow). */
  recordEvict(rowId: string, grainId: GrainId, toPos: WorldPos) {
    const set = this.rowGrains.get(rowId);
    if (set && set.delete(grainId)) {
      this.mem.decOccupancy(rowId);
    }
    // The GrainPool state transitions are handled by the worker (removeFromSlotToLoose etc.)
  }

  listGrains(rowId: string): GrainId[] {
    const s = this.rowGrains.get(rowId);
    return s ? Array.from(s) : [];
  }

  count(rowId: string): number {
    return this.rowGrains.get(rowId)?.size ?? 0;
  }
}
