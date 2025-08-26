import { describe, it, expect } from 'vitest';
import { InMemoryGrid, BitCell, PairCell } from '../engine/cells.js';
import {
  ComputeP, ComputeG, MaterializeGP, CombineGP,
  CarryFromPrefix, SumFromPC, type ExecContext
} from '../engine/actions.js';
import type { Bit } from '../core/bit.js';

function mkCtx(): ExecContext {
  return { grid: new InMemoryGrid(), c0: 0 as Bit };
}

describe('Actions basics', () => {
  it('ComputeP / ComputeG / MaterializeGP', () => {
    const ctx = mkCtx();
    // cells
    ctx.grid.put(new BitCell('A0')); ctx.grid.put(new BitCell('B0'));
    ctx.grid.put(new BitCell('P0')); ctx.grid.put(new BitCell('G0'));
    ctx.grid.put(new PairCell('GP0'));

    // inputs: A0=1, B0=0 → P0=1, G0=0
    ctx.grid.get<BitCell>('A0').write(1);
    ctx.grid.get<BitCell>('B0').write(0);

    new ComputeP('p', 'A0', 'B0', 'P0').execute(ctx);
    new ComputeG('g', 'A0', 'B0', 'G0').execute(ctx);
    expect(ctx.grid.get<BitCell>('P0').value).toBe(1);
    expect(ctx.grid.get<BitCell>('G0').value).toBe(0);

    new MaterializeGP('m', 'G0', 'P0', 'GP0').execute(ctx);
    expect(ctx.grid.get<PairCell>('GP0').value).toEqual({ G: 0, P: 1 });
  });

  it('CombineGP follows (G,P) = (G_R ∨ (P_R·G_L), P_R·P_L)', () => {
    const ctx = mkCtx();
    ctx.grid.put(new PairCell('R')); ctx.grid.put(new PairCell('L')); ctx.grid.put(new PairCell('OUT'));
    ctx.grid.get<PairCell>('R').write({ G: 1, P: 0 });
    ctx.grid.get<PairCell>('L').write({ G: 0, P: 1 });

    new CombineGP('c', 'R', 'L', 'OUT').execute(ctx);
    expect(ctx.grid.get<PairCell>('OUT').value).toEqual({ G: 1, P: 0 });
  });

  it('CarryFromPrefix and SumFromPC', () => {
    const ctx: ExecContext = { grid: new InMemoryGrid(), c0: 1 as Bit }; // C0=1
    ctx.grid.put(new PairCell('PFX')); ctx.grid.put(new BitCell('C1'));
    // prefix with P=1,G=0 → carry propagates C0
    ctx.grid.get<PairCell>('PFX').write({ G: 0, P: 1 });
    new CarryFromPrefix('cfp', 'PFX', 'C1').execute(ctx);
    expect(ctx.grid.get<BitCell>('C1').value).toBe(1);

    ctx.grid.put(new BitCell('Pbit')); ctx.grid.put(new BitCell('Sbit'));
    ctx.grid.get<BitCell>('Pbit').write(0);
    new SumFromPC('sum', 'Pbit', 'C1', 'Sbit').execute(ctx);
    expect(ctx.grid.get<BitCell>('Sbit').value).toBe(1); // 0 XOR 1 = 1
  });
});
