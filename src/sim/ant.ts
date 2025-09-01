import { Id, Vec2 } from "../world/geometry";

export interface Ant {
  id: Id;
  pos: Vec2;
  speed: number;
  carrying?: Id;                 // Grain id if you want unique grains; otherwise omit
  state: 'idle'|'moving'|'working';
}