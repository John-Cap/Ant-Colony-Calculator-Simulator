// src/config/memory_table.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { demoMemoryTableBoard, MEM_ROW_ROLES } from "./memory_table.js";
import { loadBoard } from "../config/loader.js";

test("memory table housing + rows shape", () => {
  const spec = demoMemoryTableBoard(20);
  const board = loadBoard(spec);

  const sec = board.sectors[0];
  assert.ok(sec, "sector missing");

  const housing = sec.components.find(c => c.kind === "MemoryHousing");
  assert.ok(housing, "housing missing");

  assert.equal(housing!.children.length, 20, "row count mismatch");

  const row0 = housing!.children[0];
  if (row0===undefined) throw new Error(`row0 is undefined!`);
  assert.equal(row0.kind, "MemoryRow");
  assert.equal(row0.cells.length, MEM_ROW_ROLES.length);
  for (const role of MEM_ROW_ROLES) {
    const c = row0.cells.find(x => x.tags?.[0] === role || (x as any).role === role);
    assert.ok(c, `row0 missing cell role '${role}'`);
  }
});
