import type { Cell, Component } from "../world/board.js";
import { registerDriver, type ComponentDriver, type GateContext } from "./drivers.js";

/** Three inputs (inA,inB,inC), one output, plus pin actuator. */
export interface OA21Ports extends Record<string, Cell> {
  inA: Cell;    // maps to “A” in A | (B & C)  e.g., G_i
  inB: Cell;    // maps to “B”                 e.g., P_i
  inC: Cell;    // maps to “C”                 e.g., C_i
  pin: Cell;    // actuator (ant pushes)
  out: Cell;    // physical output cell
}

export type OA21Eval = { out: 0 | 1 };

/** OR-AND gate: out = A | (B & C). */
export const GateOA21Driver: ComponentDriver<OA21Ports, OA21Eval> = {
  ports(comp: Component): OA21Ports {
    const req = (role: string): Cell => {
      const c = comp.cells.find(c => c.tags[0] === role);
      if (!c) throw new Error(`GateOA21 missing role '${role}' in ${comp.id}`);
      return c;
    };
    return {
      inA: req("inA"),
      inB: req("inB"),
      inC: req("inC"),
      pin: req("pin"),
      out: req("out"),
    };
  },

  evaluateFromPorts(ports: OA21Ports): OA21Eval {
    const a: 0 | 1 = ports.inA.occupancy > 0 ? 1 : 0;
    const b: 0 | 1 = ports.inB.occupancy > 0 ? 1 : 0;
    const c: 0 | 1 = ports.inC.occupancy > 0 ? 1 : 0;
    return { out: ((a | (b & c)) as 0 | 1) };
  },

  evaluate(comp: Component): OA21Eval {
    return this.evaluateFromPorts!(this.ports(comp));
  },

  /** Side-effect: drive the physical output to match the logic result.
   *  Optional bind.out can redirect to a different memory cell id.
   */
  operate(comp: Component, ctx: GateContext, bind: Record<string, string>) {
    const ports = this.ports(comp);
    const { out } = this.evaluateFromPorts!(ports);
    const outId = bind.out ?? ports.out.id;
    if (out === 1) ctx.placeTo(outId); else ctx.evictFrom(outId);
  },
};

// register on import
registerDriver<OA21Ports, OA21Eval>("GateOA21", GateOA21Driver);
