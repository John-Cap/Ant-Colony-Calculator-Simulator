export type WorldPos = { x: number; y: number };

export abstract class Entity {
  protected _pos: WorldPos;
  constructor(public readonly id: string, pos: WorldPos) { this._pos = pos; }
  get pos(): WorldPos { return this._pos; }
  protected setPos(p: WorldPos) { this._pos = p; }
}
