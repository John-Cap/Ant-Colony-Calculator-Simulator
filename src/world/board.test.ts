import test from "node:test";
import assert from "node:assert/strict";
import { makeBoard, makeSector, makeComponent, makeCell } from "./factories.js";
import { buildIndex } from "./board_utils.js";
import { centerOf } from "./geometry.js";
import { ReservationService } from "./reservations.js";

test("world: create board, index, nearest cell", () => {
    const cellA = makeCell("cell:var", { x: 10, y: 10, w: 10, h: 10 }, ["Var"]);
    const cellB = makeCell("cell:val", { x: 40, y: 10, w: 10, h: 10 }, ["Value"]);
    const row = makeComponent("row:0", "MemoryRow", { x: 5, y: 5, w: 50, h: 20 }, [cellA, cellB]);
    const sector = makeSector("sector:mem", { x: 0, y: 0, w: 200, h: 100 }, [row]);
    const board = makeBoard([sector]);

    const idx = buildIndex(board);
    assert.equal(idx.findCell("cell:var").id, "cell:var");
    assert.equal(idx.findComponent("row:0").kind, "MemoryRow");

    const p = centerOf({ x: 0, y: 0, w: 1, h: 1 });
    const nearestVar = idx.nearestCellWithTag("Var", p);
    assert.equal(nearestVar?.id, "cell:var");
});

test("world: reservation service", () => {
    const c = makeCell("c", { x: 0, y: 0, w: 10, h: 10 }, ["Value"]);
    const row = makeComponent("r", "MemoryRow", { x: 0, y: 0, w: 10, h: 10 }, [c]);
    const sec = makeSector("s", { x: 0, y: 0, w: 10, h: 10 }, [row]);
    const board = makeBoard([sec]);

    const rs = new ReservationService(board);
    assert.equal(rs.isReserved("c"), false);

    const ok = rs.tryReserve("c", "job:1");
    assert.equal(ok, true);
    assert.equal(rs.isReserved("c"), true);

    rs.release("c");
    assert.equal(rs.isReserved("c"), false);
});
