import { Entity, type WorldPos } from "./entity.js";
import type { GrainId } from "../resources/grains.js";

export type AntState = "Idle" | "Working";

export class Ant extends Entity {
  private _carrying: GrainId | undefined;
  state: AntState = "Idle";

  constructor(id: string, pos: WorldPos = { x: 0, y: 0 }) { super(id, pos); }

  get carrying(): GrainId | undefined { return this._carrying; }
  pick(grainId: GrainId) {
    if (this._carrying) throw new Error(`Ant ${this.id} already carrying ${this._carrying}`);
    this._carrying = grainId;
  }
  drop(): GrainId {
    if (!this._carrying) throw new Error(`Ant ${this.id} not carrying`);
    const g = this._carrying; this._carrying = undefined; return g;
  }
}
