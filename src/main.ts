import { XOR, AND, OR, combine, type Bit, type GP } from "./core/bit.js";

// tiny smoke test
const P0: Bit = 1,
  G0: Bit = 0;
const P1: Bit = 1,
  G1: Bit = 0;
const g0: GP = { G: G0, P: P0 };
const g1: GP = { G: G1, P: P1 };

// (1:0) = (g1) ∘ (g0) = (0 ∨ (1·0), 1·1) = (0,1)
console.log("combine(1:0)=", combine(g1, g0)); // expect { G:0, P:1 }
console.log(
  "XOR(1,0)=",
  XOR(1, 0),
  "AND(1,1)=",
  AND(1, 1),
  "OR(0,1)=",
  OR(0, 1),
);
