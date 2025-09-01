import { Board, Sector, Component, Cell } from "./board.js";
import { Id, Vec2, dist2 } from "./geometry.js";

export interface BoardIndex {
    sectors: Map<Id, Sector>;
    components: Map<Id, Component>;
    cells: Map<Id, Cell>;
    findCell(id: Id): Cell;
    findComponent(id: Id): Component;
    nearestCellWithTag(tag: string, from: Vec2): Cell | undefined;
}

export function buildIndex(board: Board): BoardIndex {
    const sectors = new Map<Id, Sector>();
    const components = new Map<Id, Component>();
    const cells = new Map<Id, Cell>();
    for (const s of board.sectors) {
        sectors.set(s.id, s);
            for (const c of s.components) {
                components.set(c.id, c);
                for (const cell of c.cells) cells.set(cell.id, cell);
                for (const child of c.children) {
                    components.set(child.id, child);
                    for (const cell of child.cells) cells.set(cell.id, cell);
                }
            }
    }
    return {
        sectors, components, cells,
        findCell(id: Id) {
            const v = cells.get(id);
            if (!v) throw new Error(`Unknown cell: ${id}`);
            return v
        },
        findComponent(id: Id) {
            const v = components.get(id);
            if (!v) throw new Error(`Unknown component: ${id}`);
            return v
        },
        nearestCellWithTag(tag: string, from: Vec2) {
            let best: Cell | undefined;
            let bestD = Number.POSITIVE_INFINITY;
            for (const cell of cells.values()) {
            if (!cell.tags.includes(tag)) continue;
            const d = dist2(cell.dock, from);
            if (d < bestD) { bestD = d; best = cell; }
            }
            return best
        }
    };
}
