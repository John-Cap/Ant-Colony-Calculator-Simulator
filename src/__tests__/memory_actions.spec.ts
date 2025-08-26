import { describe, it, expect } from "vitest";
import { InMemoryGrid, StringCell } from "../engine/cells.js";
import { Plan, PlanNode, VirtualExecutor } from "../engine/plan.js";
import { MemoryTable, type Bit } from "../resources/memory.js";
import { AllocScratch, SetScratchValue, IncScratchOccupancy, MarkScratchReady, BeginScratchClear, DecScratchOccupancy } from "../engine/memory_actions.js";

function mkCtx() {
  const grid = new InMemoryGrid();
  grid.put(new StringCell("ROW")); // will hold the row id
  return { grid, c0: 0 as Bit, memory: new MemoryTable(1) };
}

describe("scratch memory actions", () => {
  it("allocate → set value → ready → clear only after last dec", async () => {
    const ctx = mkCtx();

    const nodes = [
      new PlanNode("alloc", [], [
        new AllocScratch("allocA", { kind: "G", span: [2,0] }, "ROW"),
      ]),
      new PlanNode("build", ["alloc"], [
        new SetScratchValue("setV", "ROW", 1),
        new IncScratchOccupancy("incVar","ROW"), // var dot
        new IncScratchOccupancy("incHi","ROW"),  // index hi
        new IncScratchOccupancy("incLo","ROW"),  // index lo
        new IncScratchOccupancy("incVal","ROW"), // value bin
        new MarkScratchReady("ready","ROW"),
      ]),
      new PlanNode("beginClear", ["build"], [
        new BeginScratchClear("clr","ROW"),
      ]),
      new PlanNode("partialEvict", ["beginClear"], [
        new DecScratchOccupancy("dec1","ROW"),
        new DecScratchOccupancy("dec2","ROW"),
        new DecScratchOccupancy("dec3","ROW"),
      ]),
      new PlanNode("finalEvict", ["partialEvict"], [
        new DecScratchOccupancy("dec4","ROW"),
      ]),
    ];

    const plan = new Plan(nodes);
    await new VirtualExecutor().run(plan, ctx);

    const snap = ctx.memory!.snapshot()[0]!;
    expect(snap.state).toBe("Free");     // only after the fourth dec
    expect(ctx.memory!.stats().Free).toBe(1);
  });
});
