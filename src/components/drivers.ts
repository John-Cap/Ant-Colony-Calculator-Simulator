

// src/components/drivers.ts
import type { Component, Cell } from "../world/board.js";
import { buildIndex } from "../world/board_utils.js"; //?

export interface GateContext {
    // context you may need (board access, job scheduler hooks, memory row binding, etc.)
    getCell(id: string): Cell;
    // optional: enqueue jobs to set outputs, clear inputs, etc.
    placeTo(cellId: string): void;
    evictFrom(cellId: string): void;
}

export interface ComponentDriver {
    // discover the cells by role name; throws if missing
    ports(comp: Component): Record<string, Cell>;
    // evaluate logical output(s) from current input occupancy
    evaluate?(comp: Component): Record<string, 0|1>;
    // enact gate 'operate' when pin is pressed (usually spawn jobs)
    operate?(comp: Component, ctx: GateContext, bind: Record<string, string>): void;
}

// Registry
const drivers = new Map<string, ComponentDriver>();
export function registerDriver(type: string, d: ComponentDriver) { drivers.set(type, d); }
export function driverFor(type: string): ComponentDriver {
    const d = drivers.get(type); if (!d) throw new Error(`No driver for type ${type}`);
    return d;
}
