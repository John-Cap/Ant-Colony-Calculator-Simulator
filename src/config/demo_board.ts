import type { BoardSpec } from "./schema.js";

export const demoBoard: BoardSpec = {
    sectors:    [
        {
            id: "sec:gates",
            x: 0, y: 0, w: 300, h: 200,
            components: [
                {
                    id: "gate:and:0",
                    type: "GateAND",
                    x: 20, y: 20, w: 80, h: 50,
                    cells: [
                        { id: "gate:and:0/inA", role: "inA", x: 22, y: 25, w: 10, h: 10, },
                        { id: "gate:and:0/inB", role: "inB", x: 22, y: 45, w: 10, h: 10, },
                        { id: "gate:and:0/pin", role: "pin", x: 80, y: 35, w: 8,  h: 8,  tags: ["Actuator"] }
                    ]
                }
            ]
        },
        {
            id: "sec:repo",
            x: 0, y: 220, w: 300, h: 80,
            components: [
                {
                    id: "repo:main",
                    type: "Repo",
                    x: 20, y: 230, w: 60, h: 60,
                    cells: [{ id: "repo:main/bin", role: "bin", x: 25, y: 235, w: 50, h: 50, capacity: 999 }]
                }
            ]
        }
    ]
};
