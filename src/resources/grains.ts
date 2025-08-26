/**
 * GrainPool — authoritative backend for grains.
 * States: Repo (in repository), Loose (on the map), InSlot (occupying a slot).
 * No teleports: higher layers will ensure only Ant workers call these methods.
 */

export type GrainId = string;
export type SlotId = string;

export type GrainState = "Repo" | "Loose" | "InSlot";

export interface WorldPos { x: number; y: number; }

export interface Grain {
  id: GrainId;
  state: GrainState;
  pos: WorldPos | undefined;   // defined when Loose
  slotId: SlotId | undefined;  // defined when InSlot
}

export class OutOfGrainsError extends Error {
  constructor(msg = "GrainPool: repository empty") { super(msg); }
}
export class GrainNotFoundError extends Error {
  constructor(id: GrainId) { super(`Grain '${id}' not found`); }
}
export class InvalidGrainStateError extends Error {
  constructor(msg: string) { super(msg); }
}

function check(cond: boolean, err: Error): void { if (!cond) throw err; }

export class GrainPool {
  private repoCount: number;
  private grains = new Map<GrainId, Grain>();
  private nextId = 0;

  constructor(initialRepoCount: number) {
    check(Number.isInteger(initialRepoCount) && initialRepoCount >= 0, new OutOfGrainsError("initialRepoCount < 0"));
    this.repoCount = initialRepoCount;
  }

  /** Create a fresh grain from repo into Loose at the given position. */
  borrowToLoose(pos: WorldPos): Grain {
    if (this.repoCount <= 0) throw new OutOfGrainsError();
    this.repoCount -= 1;
    const id = `g-${this.nextId++}`;
    const g: Grain = { id, state: "Loose", pos, slotId: undefined };
    this.grains.set(id, g);
    return g;
  }

  /** Mark an existing loose grain as placed into a slot. */
  placeIntoSlot(grainId: GrainId, slotId: SlotId): void {
    const g = this.must(grainId);
    check(g.state === "Loose", new InvalidGrainStateError(`placeIntoSlot requires Loose; grain ${grainId} is ${g.state}`));
    g.state = "InSlot";
    g.slotId = slotId;
    g.pos = undefined;
  }

  /** Remove a grain from a slot back to Loose at a position (e.g., into a nearby cell). */
  removeFromSlotToLoose(grainId: GrainId, pos: WorldPos): void {
    const g = this.must(grainId);
    check(g.state === "InSlot", new InvalidGrainStateError(`removeFromSlotToLoose requires InSlot; grain ${grainId} is ${g.state}`));
    g.state = "Loose";
    g.slotId = undefined;
    g.pos = pos;
  }

  /** Return a loose grain to the repository (despawns from world). */
  returnLooseToRepo(grainId: GrainId): void {
    const g = this.must(grainId);
    check(g.state === "Loose", new InvalidGrainStateError(`returnLooseToRepo requires Loose; grain ${grainId} is ${g.state}`));
    this.grains.delete(grainId);
    this.repoCount += 1;
  }

  /** Find the id of a loose grain within radius r of pos, if any (linear scan; OK for small worlds). */
  findLooseNear(pos: WorldPos, r: number): Grain | undefined {
    let best: Grain | undefined;
    const r2 = r * r;
    for (const g of this.grains.values()) {
      if (g.state !== "Loose" || g.pos === undefined) continue;
      const dx = g.pos.x - pos.x, dy = g.pos.y - pos.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2 && (best === undefined || d2 < this.dist2(best.pos!, pos))) best = g;
    }
    return best;
  }

  /** Read-only snapshot for debugging/inspection. */
  snapshot(): ReadonlyArray<Grain> {
    return Array.from(this.grains.values());
  }

  stats() {
    let loose = 0, inSlot = 0;
    for (const g of this.grains.values()) {
      if (g.state === "Loose") loose++;
      else if (g.state === "InSlot") inSlot++;
    }
    return { repo: this.repoCount, loose, inSlot, total: this.repoCount + loose + inSlot };
  }

  // — internal —
  private must(id: GrainId): Grain {
    const g = this.grains.get(id);
    if (!g) throw new GrainNotFoundError(id);
    return g;
  }
  private dist2(a: WorldPos, b: WorldPos): number {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
  }
}
