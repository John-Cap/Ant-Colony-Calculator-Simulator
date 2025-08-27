import { Plan, PlanNode } from '../engine/plan.js';
import {
  ComputeP,
  ComputeG,
  MaterializeGP,
  CombineGP,
  CarryFromPrefix,
  SumFromPC,
} from '../engine/actions.js';

// Allocate rows (still from the non-job memory actions)
import { AllocScratch } from '../engine/memory_actions.js';

// Job-driven fill/clear for rows
import {
  EnqueueFillRowFromPair,
  AwaitRowReady,
  EnqueueClearRow,
  AwaitRowFreed,
} from '../engine/memory_job_actions.js';

// —— helpers ——
const id = (role: string, i: number) => `${role}${i}`;
const pref = (hi: number, lo: number) => `PFX[${hi}:${lo}]`;

export function buildPlanCLA4(): Plan {
  const N = (nid: string, deps: string[], actions: any[]) =>
    new PlanNode(nid, deps, actions);

  const nodes: PlanNode[] = [];

  // ---------- Per-bit P/G and GP leaves ----------
  for (let i = 0; i < 4; i++) {
    nodes.push(
      N(`PG${i}`, [], [
        new ComputeP(`P${i}`, id('A', i), id('B', i), id('P', i)),
        new ComputeG(`G${i}`, id('A', i), id('B', i), id('G', i)),
      ]),
    );
    nodes.push(
      N(`GP${i}`, [`PG${i}`], [
        new MaterializeGP(`M${i}`, id('G', i), id('P', i), `GP${i}`),
      ]),
    );
  }

  // ---------- Allocate scratch rows for each prefix (we store G_{span}) ----------
  nodes.push(
    N('ALLOC_10', [], [
      new AllocScratch('alloc10', { kind: 'G', span: [1, 0] }, 'ROW10'),
    ]),
  );
  nodes.push(
    N('ALLOC_32', [], [
      new AllocScratch('alloc32', { kind: 'G', span: [3, 2] }, 'ROW32'),
    ]),
  );
  nodes.push(
    N('ALLOC_20', [], [
      new AllocScratch('alloc20', { kind: 'G', span: [2, 0] }, 'ROW20'),
    ]),
  );
  nodes.push(
    N('ALLOC_30', [], [
      new AllocScratch('alloc30', { kind: 'G', span: [3, 0] }, 'ROW30'),
    ]),
  );

  // ---------- Level-1 prefixes ----------
  nodes.push(
    N('L1_10', ['GP0', 'GP1', 'ALLOC_10'], [
      new CombineGP('C_10', 'GP1', 'GP0', pref(1, 0)),
      new EnqueueFillRowFromPair('fill10', 'ROW10', pref(1, 0), 'G', [1, 0]),
      new AwaitRowReady('await10'),
    ]),
  );

  nodes.push(
    N('L1_32', ['GP2', 'GP3', 'ALLOC_32'], [
      new CombineGP('C_32', 'GP3', 'GP2', pref(3, 2)),
      new EnqueueFillRowFromPair('fill32', 'ROW32', pref(3, 2), 'G', [3, 2]),
      new AwaitRowReady('await32'),
    ]),
  );

  // ---------- Level-2 root ----------
  nodes.push(
    N('L2_30', ['L1_10', 'L1_32', 'ALLOC_30'], [
      new CombineGP('C_30', pref(3, 2), pref(1, 0), pref(3, 0)),
      new EnqueueFillRowFromPair('fill30', 'ROW30', pref(3, 0), 'G', [3, 0]),
      new AwaitRowReady('await30'),
    ]),
  );

  // ---------- Small combine [2:0] ----------
  nodes.push(
    N('SC_20', ['GP2', 'L1_10', 'ALLOC_20'], [
      new CombineGP('C_20', 'GP2', pref(1, 0), pref(2, 0)),
      new EnqueueFillRowFromPair('fill20', 'ROW20', pref(2, 0), 'G', [2, 0]),
      new AwaitRowReady('await20'),
    ]),
  );

  // ---------- Carries ----------
  nodes.push(N('C1', ['GP0'], [new CarryFromPrefix('CFP1', 'GP0', 'C1')]));
  nodes.push(
    N('C2', ['L1_10'], [new CarryFromPrefix('CFP2', pref(1, 0), 'C2')]),
  );
  nodes.push(
    N('C3', ['SC_20'], [new CarryFromPrefix('CFP3', pref(2, 0), 'C3')]),
  );
  nodes.push(
    N('C4', ['L2_30'], [new CarryFromPrefix('CFP4', pref(3, 0), 'C4')]),
  );

  // ---------- Sums ----------
  nodes.push(N('S0', [], [new SumFromPC('S0A', 'P0', 'C0', 'S0')]));
  nodes.push(N('S1', ['C1'], [new SumFromPC('S1A', 'P1', 'C1', 'S1')]));
  nodes.push(N('S2', ['C2'], [new SumFromPC('S2A', 'P2', 'C2', 'S2')]));
  nodes.push(N('S3', ['C3'], [new SumFromPC('S3A', 'P3', 'C3', 'S3')]));

  // ---------- Free rows after last consumers ----------
  nodes.push(
    N('FREE_10', ['C2', 'SC_20', 'L2_30'], [
      new EnqueueClearRow('clr10', 'ROW10'),
      new AwaitRowFreed('wait10'),
    ]),
  );
  nodes.push(
    N('FREE_32', ['L2_30'], [
      new EnqueueClearRow('clr32', 'ROW32'),
      new AwaitRowFreed('wait32'),
    ]),
  );
  nodes.push(
    N('FREE_20', ['C3'], [
      new EnqueueClearRow('clr20', 'ROW20'),
      new AwaitRowFreed('wait20'),
    ]),
  );
  nodes.push(
    N('FREE_30', ['C4'], [
      new EnqueueClearRow('clr30', 'ROW30'),
      new AwaitRowFreed('wait30'),
    ]),
  );

  return new Plan(nodes);
}
