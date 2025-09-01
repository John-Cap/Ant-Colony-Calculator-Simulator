import { Id, Rect, Vec2 } from "./geometry.js";

export interface Cell {
  id: Id;
  bounds: Rect;                  // world-space rectangle
  dock: Vec2;                    // target point for ants
  capacity: number;              // default 1
  occupancy: number;             // grains inside now
  reservedBy?: Id | undefined;               // JobChain id if reserved
  tags: string[];                // e.g. ["Var"], ["IdxLo"], ["Value"]
}

export interface Component {
  id: Id;
  kind: string;                  // "MemoryRow", "GateXor", "Repo", …
  bounds: Rect;                  // world rect of the component
  solid?: boolean;               // obstacle for navigation
  cells: Cell[];
  children: Component[];
}

export interface Sector {
  id: Id;
  bounds: Rect;                  // world rect of the sector
  components: Component[];
}

export interface Board {
  sectors: Sector[];
}
