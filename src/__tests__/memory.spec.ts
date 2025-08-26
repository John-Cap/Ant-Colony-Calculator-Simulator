import { describe, it, expect } from "vitest";
import {
  MemoryTable, OutOfMemoryError, InvalidTransitionError,
  type MemKey, type Bit
} from "../resources/memory.js";

const k = (kind: "G"|"P"|"C"|"S", hi: number, lo: number = hi): MemKey => ({ kind, span: [hi, lo] as const });

describe("MemoryTable basics", () => {
  it("allocates rows until capacity, then throws OutOfMemoryError", () => {
    const mem = new MemoryTable(2);
    const id1 = mem.allocate(k("G", 2, 0));
    const id2 = mem.allocate(k("C", 4, 4));
    expect(mem.getRow(id1).state).toBe("Reserved");
    expect(mem.getRow(id2).state).toBe("Reserved");
    expect(() => mem.allocate(k("S", 3, 3))).toThrow(OutOfMemoryError);
  });

  it("ready → beginClear → decOccupancy frees only after last grain removed", () => {
    const mem = new MemoryTable(1);
    const id = mem.allocate(k("G", 1, 0));
    mem.setValue(id, 1 as Bit);
    mem.markReady(id);

    // ants place some grains while building the row
    mem.incOccupancy(id); // variable dot
    mem.incOccupancy(id); // index hi
    mem.incOccupancy(id); // index lo
    mem.incOccupancy(id); // value bin

    mem.beginClear(id);
    expect(mem.getRow(id).state).toBe("Clearing");

    // remove three grains -> still not free
    mem.decOccupancy(id);
    mem.decOccupancy(id);
    mem.decOccupancy(id);
    expect(mem.getRow(id).state).toBe("Clearing");

    // remove final grain -> row returns to Free
    mem.decOccupancy(id);
    expect(mem.getRow(id).state).toBe("Free");
    expect(mem.stats().Free).toBe(1);
  });

  it("guards invalid transitions", () => {
    const mem = new MemoryTable(1);
    const id = mem.allocate(k("P", 0, 0));

    expect(() => mem.markReady(id)).toThrow(InvalidTransitionError); // value not set
    mem.setValue(id, 0 as Bit);
    mem.markReady(id);

    // Cannot free directly; must clear
    expect(() => mem.freeIfEmpty(id)).toThrow(InvalidTransitionError);
    mem.beginClear(id);
    // Occupancy already 0 → we can freeIfEmpty
    mem.freeIfEmpty(id);
    expect(mem.getRow(id).state).toBe("Free");
  });
});
