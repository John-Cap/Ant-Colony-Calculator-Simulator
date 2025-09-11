import { Cell, Component } from "../world/board.js";
import { ComponentDriver, PortsBase } from "./drivers.js";

/** Ports for G = inA ∨ (inB ∧ inC). */
export interface OrAndPorts extends PortsBase {
    inA: Cell;   // GR
    inB: Cell;   // PR
    inC: Cell;   // GL
    pin: Cell;   // actuator pin (kept for symmetry with other gates)
}

export interface OrAndEval { out: 0 | 1; }

// Tiny helper for hard failures
const fail = (msg: string): never => { throw new Error(msg); };

/**
 * Combo OR/AND gate used by CLA: out = inA OR (inB AND inC).
 * Bits are represented by cell.occupancy > 0.
 */
export const GateORANDDriver: ComponentDriver<OrAndPorts, OrAndEval> = {

    ports(comp: Component): OrAndPorts {
        const get = (role: string): Cell =>
        comp.cells.find(c => c.tags[0] === role) ?? fail(`GateORAND missing '${role}' in ${comp.id}`);

        return {
            inA: get("inA"),
            inB: get("inB"),
            inC: get("inC"),
            pin: get("pin"),
            // index signature inherited from PortsBase
        };
    },

    evaluateFromPorts(p: OrAndPorts): OrAndEval {
        const a: 0|1 = p.inA.occupancy > 0 ? 1 : 0;
        const b: 0|1 = p.inB.occupancy > 0 ? 1 : 0;
        const c: 0|1 = p.inC.occupancy > 0 ? 1 : 0;
        const out: 0|1 = (a | (b & c)) as 0|1;
        return { out };
    },

    evaluate(comp: Component): OrAndEval {
        return this.evaluateFromPorts!(this.ports(comp));
    },

  // operate(comp, ctx, bind) { /* live-sim wil be implimented as such */ }
};
