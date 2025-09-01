import type { BoardSpec } from "./schema.js";

export const demoOA21Board: BoardSpec = {
  sectors: [
    {
      id: "sec:oa21",
      x: 0, y: 0, w: 200, h: 140,
      components: [
        {
          id: "gate:oa21:0",
          type: "GateOA21",
          x: 20, y: 20, w: 140, h: 100,
          cells: [
            { id: "gate:oa21:0/inA", role: "inA", x: 25,  y: 30, w: 10, h: 10 },
            { id: "gate:oa21:0/inB", role: "inB", x: 25,  y: 55, w: 10, h: 10 },
            { id: "gate:oa21:0/inC", role: "inC", x: 25,  y: 80, w: 10, h: 10 },
            { id: "gate:oa21:0/pin", role: "pin", x: 75,  y: 55, w:  8, h:  8, tags: ["Actuator"] },
            { id: "gate:oa21:0/out", role: "out", x: 120, y: 55, w: 10, h: 10 },
          ]
        }
      ]
    }
  ]
};
