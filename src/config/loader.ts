// src/config/loader.ts
import type { BoardSpec, ComponentSpec, CellSpec } from "./schema.js";
import { makeBoard, makeSector, makeComponent, makeCell } from "../world/factories.js";

export function loadBoard(spec: BoardSpec) {
    const sectors = spec.sectors.map(s => {
        const comps = s.components.map(loadComponent);
        return makeSector(s.id, { x: s.x, y: s.y, w: s.w, h: s.h }, comps);
    });
    return makeBoard(sectors);
}

function loadComponent(c: ComponentSpec) {
    const cells = c.cells.map(loadCell);
    const children = (c.children ?? []).map(loadComponent);
    const comp = makeComponent(c.id, c.type, { x: c.x, y: c.y, w: c.w, h: c.h }, cells, children, !!c.solid);
    // attach props (if any) on the component instance for drivers to see (optional)
    (comp as any).props = c.props ?? {};
    return comp;
}

function loadCell(c: CellSpec) {
    return makeCell(
        c.id,
        { x: c.x, y: c.y, w: c.w, h: c.h },
        [c.role, ...(c.tags ?? [])], // keep role as first tag for quick filtering!
        c.capacity ?? 1
    );
}
