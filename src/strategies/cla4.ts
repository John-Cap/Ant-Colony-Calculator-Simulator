import { Plan, PlanNode } from '../engine/plan.js';
import { ComputeP, ComputeG, MaterializeGP, CombineGP, CarryFromPrefix, SumFromPC } from '../engine/actions.js';
import { StringCell } from '../engine/cells.js';
import {
  AllocScratch, SetScratchValueFromPair, MarkScratchReady,
  BeginScratchClear, IncScratchOccupancy, DecScratchOccupancy
} from '../engine/memory_actions.js';

// … existing helpers …
const id = (role: string, i: number) => `${role}${i}`;
const pref = (hi: number, lo: number) => `PFX[${hi}:${lo}]`;

export function buildPlanCLA4(): Plan {
  const N = (id: string, deps: string[], actions: any[]) => new PlanNode(id, deps, actions);
  const nodes: PlanNode[] = [];

  // ---------- Cells to carry memory row IDs ----------
  const rowIds = ['ROW10','ROW32','ROW20','ROW30'];
  // We do not add them to nodes; main.ts will materialize these StringCells on the Grid.

  // ---------- Per-bit P/G and GP leaves ----------
  for (let i = 0; i < 4; i++) {
    nodes.push(N(`PG${i}`, [], [
      new ComputeP(`P${i}`, id('A', i), id('B', i), id('P', i)),
      new ComputeG(`G${i}`, id('A', i), id('B', i), id('G', i)),
    ]));
    nodes.push(N(`GP${i}`, [`PG${i}`], [
      new MaterializeGP(`M${i}`, id('G', i), id('P', i), `GP${i}`)
    ]));
  }

  // ---------- Allocate scratch rows for each prefix (store G_{span}) ----------
  nodes.push(N('ALLOC_10', [], [ new AllocScratch('alloc10', { kind: 'G', span: [1,0] }, 'ROW10') ]));
  nodes.push(N('ALLOC_32', [], [ new AllocScratch('alloc32', { kind: 'G', span: [3,2] }, 'ROW32') ]));
  nodes.push(N('ALLOC_20', [], [ new AllocScratch('alloc20', { kind: 'G', span: [2,0] }, 'ROW20') ]));
  nodes.push(N('ALLOC_30', [], [ new AllocScratch('alloc30', { kind: 'G', span: [3,0] }, 'ROW30') ]));

  // ---------- Level-1 prefixes ----------
  nodes.push(N('L1_10', ['GP0','GP1','ALLOC_10'], [
    new CombineGP('C_10','GP1','GP0', pref(1,0)),
    new SetScratchValueFromPair('set10','ROW10', pref(1,0),'G'),
    new IncScratchOccupancy('inc10','ROW10', 4),
    new MarkScratchReady('ready10','ROW10'),
  ]));

  nodes.push(N('L1_32', ['GP2','GP3','ALLOC_32'], [
    new CombineGP('C_32','GP3','GP2', pref(3,2)),
    new SetScratchValueFromPair('set32','ROW32', pref(3,2),'G'),
    new IncScratchOccupancy('inc32','ROW32', 4),
    new MarkScratchReady('ready32','ROW32'),
  ]));

  // ---------- Level-2 root ----------
  nodes.push(N('L2_30', ['L1_10','L1_32','ALLOC_30'], [
    new CombineGP('C_30', pref(3,2), pref(1,0), pref(3,0)),
    new SetScratchValueFromPair('set30','ROW30', pref(3,0),'G'),
    new IncScratchOccupancy('inc30','ROW30', 4),
    new MarkScratchReady('ready30','ROW30'),
  ]));

  // ---------- Small combine [2:0] ----------
  nodes.push(N('SC_20', ['GP2','L1_10','ALLOC_20'], [
    new CombineGP('C_20','GP2', pref(1,0), pref(2,0)),
    new SetScratchValueFromPair('set20','ROW20', pref(2,0),'G'),
    new IncScratchOccupancy('inc20','ROW20', 4),
    new MarkScratchReady('ready20','ROW20'),
  ]));

  // ---------- Carries ----------
  nodes.push(N('C1', ['GP0'],    [new CarryFromPrefix('CFP1','GP0','C1')]));
  nodes.push(N('C2', ['L1_10'],  [new CarryFromPrefix('CFP2',pref(1,0),'C2')]));
  nodes.push(N('C3', ['SC_20'],  [new CarryFromPrefix('CFP3',pref(2,0),'C3')]));
  nodes.push(N('C4', ['L2_30'],  [new CarryFromPrefix('CFP4',pref(3,0),'C4')]));

  // ---------- Sums ----------
  nodes.push(N('S0', [],         [new SumFromPC('S0A','P0','C0','S0')]));
  nodes.push(N('S1', ['C1'],     [new SumFromPC('S1A','P1','C1','S1')]));
  nodes.push(N('S2', ['C2'],     [new SumFromPC('S2A','P2','C2','S2')]));
  nodes.push(N('S3', ['C3'],     [new SumFromPC('S3A','P3','C3','S3')]));

  // ---------- Begin clearing after last consumers ----------
  nodes.push(N('FREE_10', ['C2','SC_20','L2_30'], [
    new BeginScratchClear('clr10','ROW10'),
    new DecScratchOccupancy('dec10','ROW10', 4),
  ]));
  nodes.push(N('FREE_32', ['L2_30'], [
    new BeginScratchClear('clr32','ROW32'),
    new DecScratchOccupancy('dec32','ROW32', 4),
  ]));
  nodes.push(N('FREE_20', ['C3'], [
    new BeginScratchClear('clr20','ROW20'),
    new DecScratchOccupancy('dec20','ROW20', 4),
  ]));
  nodes.push(N('FREE_30', ['C4'], [
    new BeginScratchClear('clr30','ROW30'),
    new DecScratchOccupancy('dec30','ROW30', 4),
  ]));

  return new Plan(nodes);
}
