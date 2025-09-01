import test from "node:test";
import assert from "node:assert/strict";
import { loadBoard } from "../config/loader.js";
import { demoBoard } from "../config/demo_board.js";
import { driverFor } from "./drivers.js";
import type { AndPorts } from "./and_driver.js";

// Ensure AND driver has been registered
import "./and_driver.js";

function fail(msg: string): never { throw new Error(msg); }

test("AND gate: roles and evaluate", () => {
    const board = loadBoard(demoBoard);
    const sector = board.sectors[0] ?? fail("Sector missing");
    const comp   = sector.components[0] ?? fail("Component missing");

    const drv = driverFor<AndPorts, { out: 0 | 1 }>(comp.kind);
    const ports = drv.ports(comp);

    // a=1, b=0 -> 0
    ports.inA.occupancy = 1; ports.inB.occupancy = 0;
    assert.equal(drv.evaluateFromPorts!(ports).out, 0);

    // a=0, b=1 -> 0
    ports.inA.occupancy = 0; ports.inB.occupancy = 1;
    assert.equal(drv.evaluateFromPorts!(ports).out, 0);

    // a=0, b=0 -> 0
    ports.inA.occupancy = 0; ports.inB.occupancy = 0;
    assert.equal(drv.evaluateFromPorts!(ports).out, 0);

    // a=1, b=1 -> 1
    ports.inA.occupancy = 1; ports.inB.occupancy = 1;
    assert.equal(drv.evaluateFromPorts!(ports).out, 1);
});
