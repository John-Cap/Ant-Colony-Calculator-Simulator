import { describe, it, expect } from "vitest";
import { GrainPool, OutOfGrainsError, InvalidGrainStateError } from "../resources/grains.js";

describe("GrainPool basics", () => {
  it("borrows from repo to loose and returns back", () => {
    const gp = new GrainPool(2);
    const g = gp.borrowToLoose({ x: 1, y: 1 });
    expect(gp.stats()).toEqual({ repo: 1, loose: 1, inSlot: 0, total: 2 });

    gp.placeIntoSlot(g.id, "slot-A");
    expect(gp.stats()).toEqual({ repo: 1, loose: 0, inSlot: 1, total: 2 });

    gp.removeFromSlotToLoose(g.id, { x: 2, y: 2 });
    expect(gp.stats()).toEqual({ repo: 1, loose: 1, inSlot: 0, total: 2 });

    gp.returnLooseToRepo(g.id);
    expect(gp.stats()).toEqual({ repo: 2, loose: 0, inSlot: 0, total: 2 });
  });

  it("errors on empty repo and invalid transitions", () => {
    const gp = new GrainPool(0);
    expect(() => gp.borrowToLoose({ x: 0, y: 0 })).toThrow(OutOfGrainsError);

    const gp2 = new GrainPool(1);
    const g = gp2.borrowToLoose({ x: 0, y: 0 });
    expect(() => gp2.returnLooseToRepo("nope")).toThrow();
    gp2.placeIntoSlot(g.id, "S1");
    expect(() => gp2.returnLooseToRepo(g.id)).toThrow(InvalidGrainStateError);
  });

  it("finds nearby loose grains", () => {
    const gp = new GrainPool(3);
    const g1 = gp.borrowToLoose({ x: 0, y: 0 });
    const g2 = gp.borrowToLoose({ x: 5, y: 0 });
    gp.placeIntoSlot(g2.id, "S"); // not loose anymore
    const near = gp.findLooseNear({ x: 1, y: 0 }, 2);
    expect(near?.id).toBe(g1.id);
  });
});
