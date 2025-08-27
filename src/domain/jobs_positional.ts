import type { GrainId } from "../resources/grains.js";
import type { Site } from "../resources/memory_board.js";

export type JobPos =
  | { kind: "FetchFromRepo"; near: { x: number; y: number } }          // create a loose grain near a point
  | { kind: "PickLoose"; grainId: GrainId }                             // pick a specific loose grain
  | { kind: "CarryTo"; dest: { x: number; y: number } }                 // move (handled by realtime worker)
  | { kind: "PlaceInRow"; rowId: string; site: Site }                   // carried grain -> InSlot
  | { kind: "EvictFromRow"; rowId: string; grainId: GrainId }           // slot -> Loose
  | { kind: "ReturnToRepo"; grainId: GrainId };                         // Loose -> Repo
