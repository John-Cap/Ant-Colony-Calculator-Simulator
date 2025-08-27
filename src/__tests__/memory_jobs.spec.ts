import { describe, it, expect } from "vitest";
import { InMemoryGrid, StringCell, PairCell } from "../engine/cells.js";
import { MemoryTable } from "../resources/memory.js";
import { GrainPool } from "../resources/grains.js";
import { InMemoryJobQueue } from "../domain/jobs.js";
import { MemoryRuntime } from "../sim/memory_runtime.js";
import { VirtualAntWorker } from "../sim/virtual_worker.js";
import {
  EnqueueFillRowFromPair, AwaitRowReady, EnqueueClearRow, AwaitRowFreed
} from "../engine/memory_job_actions.js";

describe("Job-driven scratch (virtual)", () => {
  it("fills a row from pair, then clears it via jobs", () => {
    const grid = new InMemoryGrid();
    grid.put(new StringCell("ROW"));
    grid.put(new PairCell("PAIR"));
    grid.get<PairCell>("PAIR").write({ G: 1, P: 0 });

    const memory = new MemoryTable(1);
    const grains = new GrainPool(10);
    const jobs = new InMemoryJobQueue();
    const rt = new MemoryRuntime(memory, grains);
    const worker = new VirtualAntWorker(jobs, rt, memory);

    // Allocate the row out-of-band (what AllocScratch does)
    const rowId = memory.allocate({ kind: "G", span: [2,0] });
    grid.get<StringCell>("ROW").write(rowId);

    // Enqueue fill → drain → row becomes Ready, occupancy > 0
    new EnqueueFillRowFromPair("fill", "ROW", "PAIR", "G", [2,0]).execute({ grid, c0: 0, memory, grains, jobs, worker });
    new AwaitRowReady("awaitFill").execute({ grid, c0: 0, memory, grains, jobs, worker });
    const r1 = memory.getRow(rowId);
    expect(r1.state).toBe("Ready");
    expect(r1.occupancy).toBeGreaterThan(0);

    // Enqueue clear → drain → row returns to Free
    new EnqueueClearRow("clear", "ROW").execute({ grid, c0: 0, memory, grains, jobs, worker });
    new AwaitRowFreed("awaitClear").execute({ grid, c0: 0, memory, grains, jobs, worker });
    const r2 = memory.getRow(rowId);
    expect(r2.state).toBe("Free");
    expect(memory.stats().Free).toBe(1);
  });
});
