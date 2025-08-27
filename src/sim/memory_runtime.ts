import type { MemoryTable } from "../resources/memory.js";
import type { GrainPool, GrainId } from "../resources/grains.js";

/** Tracks which concrete grains currently belong to each memory row. */
export class MemoryRuntime {
    private rowGrains = new Map<string, Set<GrainId>>();

    constructor(private mem: MemoryTable, private grains: GrainPool) {}

    private takeAny(set: Set<GrainId>): GrainId | undefined {
        for (const id of set) { set.delete(id); return id; }
        return undefined;
    }

    /** Borrow one grain and place it into the given row (no geometry in virtual mode). */
    placeOne(rowId: string) {
        const g = this.grains.borrowToLoose({ x: 0, y: 0 });       // spawn near “site”
        this.grains.placeIntoSlot(g.id, rowId);                    // use rowId as slotId
        this.mem.incOccupancy(rowId);
        let set = this.rowGrains.get(rowId);
        if (!set) { set = new Set<GrainId>(); this.rowGrains.set(rowId, set); }
        set.add(g.id);
    }

    /** Evict one grain from row and return it to repo. */
    evictOne(rowId: string) {
        const set = this.rowGrains.get(rowId);
        if (!set || set.size === 0) return;

        const it = set.values().next();
        if (it.done) return;                   // satisfies the type checker
        const gid = this.takeAny(set);       // GrainId = string
        if (!gid) return;

        set.delete(gid);
        this.grains.removeFromSlotToLoose(gid, { x: 0, y: 0 });
        this.grains.returnLooseToRepo(gid);
        this.mem.decOccupancy(rowId);
    }


    /** Number of grains currently on the row. */
    count(rowId: string): number { return this.rowGrains.get(rowId)?.size ?? 0; }
}
