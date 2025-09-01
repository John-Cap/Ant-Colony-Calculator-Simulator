
// src/components/and_driver.ts
import type { ComponentDriver } from "./drivers.js";
import type { Cell, Component } from "../world/board.js";
import { buildIndex } from "../world/board_utils.js";

function fail(msg: string): never { throw new Error(msg); }

export const GateANDDriver: ComponentDriver = {
    ports(comp: Component) {
        const idx = buildIndex({ sectors: [{ id:"_", bounds: comp.bounds, components:[comp] }] }); // lightweight index for comp
        const req = (role: string) => {
            for (const cell of comp.cells) if (cell.tags[0] === role) return cell;
            throw new Error(`GateAND missing role '${role}' in ${comp.id}`);
        };
        return {
            inA: req("inA"),
            inB: req("inB"),
            pin: req("pin"),
        };
    },

    evaluate(comp: Component) {
        const cells = this.ports(comp) as Record<string, Cell | undefined>;
        const inA = cells.inA ?? fail(`Missing 'inA' for ${comp.id}`);
        const inB = cells.inB ?? fail(`Missing 'inB' for ${comp.id}`);
        const a: 0|1 = inA.occupancy > 0 ? 1 : 0;
        const b: 0|1 = inB.occupancy > 0 ? 1 : 0;
        return { out: (a & b) as 0|1 };
    },

  // 'bind.out' is the target memory-cell id to receive the result grain.
  operate(comp: Component, ctx, bind) {
    const bindOut = bind.out ?? fail('bind.out not defined!')
    const cells = this.ports(comp);
    const { out } = this.evaluate!(comp);
    if (out === 1) {
      ctx.placeTo(bindOut);       // enqueue or directly place a grain to 'out' cell
    } else {
      // ensure 'out' is empty if policy requires (optional cleanup)
      ctx.evictFrom(bindOut);
    }
    // optional: clear inputs after operation
    // ctx.evictFrom(cells.inA.id);
    // ctx.evictFrom(cells.inB.id);
  }
};
