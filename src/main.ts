// src/main.ts

import { InMemoryGrid, BitCell, PairCell, StringCell } from "./engine/cells.js";
import { VirtualExecutor } from "./engine/plan.js";
import { buildPlanCLA4 } from "./strategies/cla4.js";
import { toNibble, type Bit } from "./core/bit.js";

import { MemoryTable } from "./resources/memory.js";
import { GrainPool } from "./resources/grains.js";

import { InMemoryJobQueue } from "./domain/jobs.js";
import { MemoryRuntime } from "./sim/memory_runtime.js";
import { VirtualAntWorker } from "./sim/virtual_worker.js";

function bits4(n: number): [Bit, Bit, Bit, Bit] {
  return toNibble(n) as [Bit, Bit, Bit, Bit];
}

async function runDemo(aDec: number, bDec: number, c0: Bit = 0) {
  const grid = new InMemoryGrid();

  // Core cells
  for (let i = 0; i < 4; i++) {
    grid.put(new BitCell(`A${i}`));
    grid.put(new BitCell(`B${i}`));
    grid.put(new BitCell(`P${i}`));
    grid.put(new BitCell(`G${i}`));
    grid.put(new PairCell(`GP${i}`));
    grid.put(new BitCell(`C${i}`));
    grid.put(new BitCell(`S${i}`));
  }

  grid.put(new BitCell("C4"));
  grid.put(new BitCell("C0"));
  grid.get<BitCell>("C0").write(c0);   // <-- don't chain .write() to put()

  // Prefix outputs materialized by the plan
  ["PFX[1:0]", "PFX[3:2]", "PFX[2:0]", "PFX[3:0]"].forEach((id) =>
    grid.put(new PairCell(id))
  );

  // Row-id carriers for scratch rows (required by the strategy)
  ["ROW10", "ROW32", "ROW20", "ROW30"].forEach((id) =>
    grid.put(new StringCell(id))       // <-- note capital S
  );

  // Load inputs
  const A = bits4(aDec);
  const B = bits4(bDec);
  A.forEach((v, i) => grid.get<BitCell>(`A${i}`).write(v));
  B.forEach((v, i) => grid.get<BitCell>(`B${i}`).write(v));

  // Plan
  const plan = buildPlanCLA4();

  // Resources + virtual ant worker (job-driven fill/clear)
  const memory = new MemoryTable(4); // one row per prefix
  const grains = new GrainPool(64);
  const jobs = new InMemoryJobQueue();
  const runtime = new MemoryRuntime(memory, grains);
  const worker = new VirtualAntWorker(jobs, runtime, memory);

  // Execute
  await new VirtualExecutor().run(plan, { grid, c0, memory, grains, jobs, worker });

  // Read result
  const s0 = grid.get<BitCell>("S0").value;
  const s1 = grid.get<BitCell>("S1").value;
  const s2 = grid.get<BitCell>("S2").value;
  const s3 = grid.get<BitCell>("S3").value;
  const c4 = grid.get<BitCell>("C4").value;

  const sum = (Number(c4) << 4) | (Number(s3) << 3) | (Number(s2) << 2) | (Number(s1) << 1) | Number(s0);

  console.log(`${aDec} + ${bDec} = ${sum}  (C4 S3 S2 S1 S0 = ${c4} ${s3}${s2}${s1}${s0})`);
  console.log("Memory stats:", memory.stats());
  console.log("Grain stats:", grains.stats());
}

runDemo(13, 10).catch((err) => {
  console.error(err);
  process.exit(1);
});
