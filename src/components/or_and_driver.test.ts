import test from "node:test";
import assert from "node:assert/strict";
import { GateORANDDriver } from "./or_and_driver.js";
import { Component, Cell } from "../world/board.js";

const cell = (id: string, role: string): Cell => ({
  id,
  bounds: { x: 0, y: 0, w: 1, h: 1 },
  dock:   { x: 0, y: 0 },
  capacity: 1,
  occupancy: 0,
  tags: [role],
});

const makeComp = (): Component => ({
  id: "combo-1",
  kind: "GateORAND",
  bounds: { x: 0, y: 0, w: 5, h: 3 },
  solid: false,
  children: [],
  cells: [
    cell("inA", "inA"),
    cell("inB", "inB"),
    cell("inC", "inC"),
    cell("pin", "pin"),
  ],
});

test("GateORAND: out = inA OR (inB AND inC)", () => {
  const comp = makeComp();
  const ports = GateORANDDriver.ports(comp);

  // (a,b,c) -> expected
  const cases: Array<[[0|1,0|1,0|1], 0|1]> = [
    [[0,0,0], 0],
    [[1,0,0], 1],
    [[0,1,0], 0],
    [[0,0,1], 0],
    [[0,1,1], 1],
    [[1,1,0], 1],
    [[1,0,1], 1],
    [[1,1,1], 1],
  ];

  for (const [[a,b,c], expected] of cases) {
    ports.inA.occupancy = a;
    ports.inB.occupancy = b;
    ports.inC.occupancy = c;
    const { out } = GateORANDDriver.evaluateFromPorts(ports);
    assert.equal(out, expected, `a=${a} b=${b} c=${c}`);
  }
});
