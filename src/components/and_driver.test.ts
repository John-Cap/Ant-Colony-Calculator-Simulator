// src/components/and_driver.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { loadBoard } from "../config/loader.js";
import { demoBoard } from "../config/demo_board.js";
import { registerDriver, driverFor } from "./drivers.js";
import { GateANDDriver } from "./and_driver.js";
import { Cell } from "../world/board.js";

registerDriver("GateAND", GateANDDriver);
function fail(msg: string): never { throw new Error(msg); }

test("AND gate: roles and evaluate", () => {
    const board = loadBoard(demoBoard);
    const boardSector = board.sectors[0] ?? fail('Board sector undefined!')
    const comp = boardSector.components[0] ?? fail('component undefined!');
    const drv = driverFor(comp.kind);

    const ports = drv.ports(comp) as { inA?: Cell; inB?: Cell };
    const inA = ports.inA ?? fail("inA undefined!");
    const inB = ports.inB ?? fail("inA undefined!");
    // a=1, b=0
    inA.occupancy = 1; inB.occupancy = 0;
    console.log([inA.occupancy,inB.occupancy])
    assert.equal(drv.evaluate!(comp).out, 0);
    // a=0, b=1
    inA.occupancy = 0; inB.occupancy = 1;
    console.log([inA.occupancy,inB.occupancy])
    assert.equal(drv.evaluate!(comp).out, 0);
    // a=0, b=0
    inA.occupancy = 0; inB.occupancy = 0;
    console.log([inA.occupancy,inB.occupancy])
    assert.equal(drv.evaluate!(comp).out, 0);
    // a=1, b=1
    inB.occupancy = 1; inA.occupancy = 1;
    console.log([inA.occupancy,inB.occupancy])
    assert.equal(drv.evaluate!(comp).out, 1);
});
