import { describe, it, expect } from 'vitest';
import { InMemoryGrid, BitCell, PairCell } from '../engine/cells.js';
import { VirtualExecutor, Plan } from '../engine/plan.js';
import { buildPlanCLA4 } from '../strategies/cla4.js';
import { toNibble, fromNibble, type Bit } from '../core/bit.js';

function prepGrid(): InMemoryGrid {
  const g = new InMemoryGrid();
  for (let i = 0; i < 4; i++) {
    g.put(new BitCell(`A${i}`)); g.put(new BitCell(`B${i}`));
    g.put(new BitCell(`P${i}`)); g.put(new BitCell(`G${i}`));
    g.put(new PairCell(`GP${i}`));
    g.put(new BitCell(`C${i}`)); g.put(new BitCell(`S${i}`));
  }
  g.put(new BitCell('C4')); g.put(new BitCell('C0')); g.get<BitCell>('C0').write(0);
  ['PFX[1:0]','PFX[3:2]','PFX[2:0]','PFX[3:0]'].forEach(id => g.put(new PairCell(id)));
  return g;
}

function loadInputs(grid: InMemoryGrid, a: number, b: number) {
  const A = toNibble(a); const B = toNibble(b);
  (A as [Bit,Bit,Bit,Bit]).forEach((v,i)=>grid.get<BitCell>(`A${i}`).write(v));
  (B as [Bit,Bit,Bit,Bit]).forEach((v,i)=>grid.get<BitCell>(`B${i}`).write(v));
}

function readSum(grid: InMemoryGrid): number {
  const bits = [0,1,2,3].map(i => grid.get<BitCell>(`S${i}`).value) as [Bit,Bit,Bit,Bit];
  const C4 = grid.get<BitCell>('C4').value;
  return (C4 << 4) | fromNibble(bits);
}

describe('Brent–Kung 4-bit plan end-to-end', () => {
  it('computes 13 + 10 = 23', async () => {
    const grid = prepGrid();
    loadInputs(grid, 13, 10);
    const plan: Plan = buildPlanCLA4();
    await new VirtualExecutor().run(plan, { grid, c0: 0 });
    expect(readSum(grid)).toBe(23);
  });

  it('exhaustive correctness for all pairs (C0=0)', async () => {
    const plan: Plan = buildPlanCLA4();
    for (let a = 0; a <= 15; a++) {
      for (let b = 0; b <= 15; b++) {
        const grid = prepGrid();
        loadInputs(grid, a, b);
        await new VirtualExecutor().run(plan, { grid, c0: 0 });
        expect(readSum(grid)).toBe(a + b);
      }
    }
  });

  it('detects cycles (negative test)', async () => {
    // small 2-node cycle
    const { PlanNode } = await import('../engine/plan.js');
    const n1 = new PlanNode('A', ['B'], []);
    const n2 = new PlanNode('B', ['A'], []);
    const bad = new Plan([n1, n2]);
    await expect(new VirtualExecutor().run(bad, { grid: prepGrid(), c0: 0 })).rejects.toThrow();
  });
});
