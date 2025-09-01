// src/components/and_driver.ts
import type { Cell, Component } from "../world/board.js";
import { registerDriver, type ComponentDriver } from "./drivers.js";

export interface AndPorts extends Record<string, Cell> {
    inA: Cell;
    inB: Cell;
    pin: Cell;
}

type AndEval = { out: 0 | 1 };

export const GateANDDriver: ComponentDriver<AndPorts, AndEval> = {
    ports(comp: Component): AndPorts {
        const req = (role: string): Cell => {
            const c = comp.cells.find(c => c.tags[0] === role);
            if (!c) throw new Error(`GateAND missing role '${role}' in ${comp.id}`);
            return c; // return the original object (no clones!!)
        };
        // This object satisfies the index signature and named roles.
        return { inA: req("inA"), inB: req("inB"), pin: req("pin") };
    },

    evaluateFromPorts(ports: AndPorts): AndEval {
        const a: 0 | 1 = ports.inA.occupancy > 0 ? 1 : 0;
        const b: 0 | 1 = ports.inB.occupancy > 0 ? 1 : 0;
        return { out: (a & b) as 0 | 1 };
    },

    evaluate(comp: Component): AndEval {
        return this.evaluateFromPorts!(this.ports(comp));
    },
};

registerDriver<AndPorts, AndEval>("GateAND", GateANDDriver);
