// src/__tests__/plan_cla4.spec.ts
import { describe, it, expect } from "vitest";

import { InMemoryGrid, BitCell, PairCell, StringCell } from "../engine/cells.js";
import { VirtualExecutor } from "../engine/plan.js";
import { Plan, PlanNode } from "../engine/plan.js";
import { buildPlanCLA4 } from "../strategies/cla4.js";

import { MemoryTable } from "../resources/memory.js";
import { GrainPool } from "../resources/grains.js";

import { InMemoryJobQueue } from "../domain/jobs.js";
import { MemoryRuntime } from "../sim/memory_runtime.js";
import { VirtualAntWorker } from "../sim/virtual_worker.js";

import type { Bit } from "../core/bit.js";
import { installDefault4BitTemplates, MemoryBoard } from "../resources/memory_board.js";

/* ---------- helpers ---------- */

function prepGrid(): InMemoryGrid {
  const g = new InMemoryGrid();

  for (let i = 0; i < 4; i++) {
    g.put(new BitCell(`A${i}`));
    g.put(new BitCell(`B${i}`));
    g.put(new BitCell(`P${i}`));
    g.put(new BitCell(`G${i}`));
    g.put(new PairCell(`GP${i}`));
    g.put(new BitCell(`C${i}`));
    g.put(new BitCell(`S${i}`));
  }
  g.put(new BitCell("C4"));
  g.put(new BitCell("C0"));

  // Prefix pairs produced by the plan
  ["PFX[1:0]", "PFX[3:2]", "PFX[2:0]", "PFX[3:0]"].forEach((id) =>
    g.put(new PairCell(id)),
  );

  // Row id carriers required by the strategy
  ["ROW10", "ROW32", "ROW20", "ROW30"].forEach((id) =>
    g.put(new StringCell(id)),
  );

  return g;
}

function writeNibble(g: InMemoryGrid, prefix: "A" | "B", n: number) {
  for (let i = 0; i < 4; i++) {
    const bit: Bit = ((n >> i) & 1) as Bit;
    g.get<BitCell>(`${prefix}${i}`).write(bit);
  }
}

async function runOnce(a: number, b: number, c0: Bit = 0 as Bit) {
  const grid = prepGrid();
  grid.get<BitCell>("C0").write(c0);

  writeNibble(grid, "A", a);
  writeNibble(grid, "B", b);

  // Resources + worker (virtual)
  const memory = new MemoryTable(4);
  const grains = new GrainPool(64);
  const jobs = new InMemoryJobQueue();
  const runtime = new MemoryRuntime(memory, grains);
  const worker = new VirtualAntWorker(jobs, runtime, memory);

  // NEW: board with default coordinate templates
  const board = new MemoryBoard();
  installDefault4BitTemplates(board);

  const plan = buildPlanCLA4();
  await new VirtualExecutor().run(plan, { grid, c0, memory, grains, jobs, worker, board });

  const s0 = grid.get<BitCell>("S0").value;
  const s1 = grid.get<BitCell>("S1").value;
  const s2 = grid.get<BitCell>("S2").value;
  const s3 = grid.get<BitCell>("S3").value;
  const c4 = grid.get<BitCell>("C4").value;

  const sum = (Number(c4) << 4) | (Number(s3) << 3) | (Number(s2) << 2) | (Number(s1) << 1) | Number(s0);
  return { sum, grid, memory, grains };
}

/* ---------- tests ---------- */

describe("Brent–Kung 4-bit plan end-to-end", () => {
  it("computes 13 + 10 = 23", async () => {
    const { sum } = await runOnce(13, 10, 0 as Bit);
    expect(sum).toBe(23);
  });

  it("exhaustive correctness for all pairs (C0=0)", async () => {
    for (let a = 0; a < 16; a++) {
      for (let b = 0; b < 16; b++) {
        const { sum } = await runOnce(a, b, 0 as Bit);
        expect(sum).toBe(a + b);
      }
    }
  });

  it("detects cycles (negative test)", async () => {
    // A minimal cyclic plan: A -> B -> A
    const nodes = [
      new PlanNode("A", ["B"], []),
      new PlanNode("B", ["A"], []),
    ];
    const cyclic = new Plan(nodes);

    const grid = prepGrid();
    grid.get<BitCell>("C0").write(0 as Bit);

    const memory = new MemoryTable(4);
    const grains = new GrainPool(0);
    const jobs = new InMemoryJobQueue();
    const runtime = new MemoryRuntime(memory, grains);
    const worker = new VirtualAntWorker(jobs, runtime, memory);

    await expect(
      new VirtualExecutor().run(cyclic, { grid, c0: 0 as Bit, memory, grains, jobs, worker }),
    ).rejects.toThrow();
  });
});
