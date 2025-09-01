import test from "node:test";
import assert from "node:assert/strict";

import { loadBoard } from "../config/loader.js";
import { demoOA21Board } from "../config/demo_oa21_board.js";
import { driverFor } from "./drivers.js";
import type { OA21Ports, OA21Eval } from "./oa21_driver.js";
import { GateOA21Driver } from "./oa21_driver.js";
import { registerDriver } from "./drivers.js";
import { buildIndex } from "../world/board_utils.js";

registerDriver<OA21Ports, OA21Eval>("GateOA21", GateOA21Driver);

function fail(msg: string): never { throw new Error(msg); }

test("OA21 gate: out = A | (B & C) evaluate & operate", () => {
  const board  = loadBoard(demoOA21Board);
  const sector = board.sectors[0] ?? fail("sector missing");
  const comp   = sector.components[0] ?? fail("component missing");

  const drv   = driverFor<OA21Ports, OA21Eval>(comp.kind);
  const ports = drv.ports(comp);

  // Truth table (A,(B&C)) → out
  // 0,(0&0)=0 → 0
  ports.inA.occupancy = 0; ports.inB.occupancy = 0; ports.inC.occupancy = 0;
  assert.deepEqual(drv.evaluateFromPorts!(ports), { out: 0 });

  // 0,(1&0)=0 → 0
  ports.inA.occupancy = 0; ports.inB.occupancy = 1; ports.inC.occupancy = 0;
  assert.deepEqual(drv.evaluateFromPorts!(ports), { out: 0 });

  // 0,(1&1)=1 → 1
  ports.inA.occupancy = 0; ports.inB.occupancy = 1; ports.inC.occupancy = 1;
  assert.deepEqual(drv.evaluateFromPorts!(ports), { out: 1 });

  // 1,(0&0)=0 → 1
  ports.inA.occupancy = 1; ports.inB.occupancy = 0; ports.inC.occupancy = 0;
  assert.deepEqual(drv.evaluateFromPorts!(ports), { out: 1 });

  // operate(): pushes physical output to match logic
  const idx = buildIndex(board);
  const ctx = {
    placeTo:  (cellId: string) => { idx.findCell(cellId).occupancy = 1; },
    evictFrom:(cellId: string) => { idx.findCell(cellId).occupancy = 0; },
  };

  // Set 1,(1&1)=1, expect out occupied
  ports.inA.occupancy = 1; ports.inB.occupancy = 1; ports.inC.occupancy = 1;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 1);

  // Set 0,(1&1)=1, expect out occupied
  ports.inA.occupancy = 0; ports.inB.occupancy = 1; ports.inC.occupancy = 1;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 1);

  // Set 0,(0&1)=0, expect out occupied
  ports.inA.occupancy = 0; ports.inB.occupancy = 0; ports.inC.occupancy = 1;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 0);

  // Set 0,(1&0)=0, expect out false
  ports.inA.occupancy = 0; ports.inB.occupancy = 1; ports.inC.occupancy = 0;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 0);

  // Set 0,(0&0)=0, expect out false
  ports.inA.occupancy = 0; ports.inB.occupancy = 0; ports.inC.occupancy = 0;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 0);

  // Set 1,(1&0)=1, expect out true
  ports.inA.occupancy = 1; ports.inB.occupancy = 1; ports.inC.occupancy = 0;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 1);

  // Set 1,(0&1)=1, expect out true
  ports.inA.occupancy = 1; ports.inB.occupancy = 0; ports.inC.occupancy = 1;
  drv.operate!(comp, ctx, {});
  assert.equal(ports.out.occupancy, 1);
});
