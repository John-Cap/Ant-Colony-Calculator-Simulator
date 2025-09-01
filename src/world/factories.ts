import { Board, Sector, Component, Cell } from "./board.js";
import { Id, Rect, Vec2, centerOf } from "./geometry.js";

export function makeCell(id: Id, bounds: Rect, tags: string[], capacity = 1, dock?: Vec2): Cell {
    return {
        id, bounds,
        dock: dock ?? centerOf(bounds),
        capacity,
        occupancy: 0,
        tags,
    };
}

export function makeComponent(id: Id, kind: string, bounds: Rect, cells: Cell[] = [], children: Component[] = [], solid = false): Component {
    return { id, kind, bounds, cells, children, solid };
}

export function makeSector(id: Id, bounds: Rect, components: Component[] = []): Sector {
    return { id, bounds, components };
}

export function makeBoard(sectors: Sector[] = []): Board {
    return { sectors }; 
}
