import { Vec2 } from "../world/geometry";
import { Ant } from "./ant";

export interface MovementPolicy {
  move(ant: Ant, to: Vec2): void;       // updates ant position over time or instantly
}
