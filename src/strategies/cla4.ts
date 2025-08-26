import { Plan, PlanNode } from '../engine/plan.js';
import { ComputeP, ComputeG, MaterializeGP, CombineGP, CarryFromPrefix, SumFromPC } from '../engine/actions.js';

const id = (role: string, i: number) => `${role}${i}`;
const pref = (hi: number, lo: number) => `PFX[${hi}:${lo}]`;

export function buildPlanCLA4(): Plan {
  const N = (id: string, deps: string[], actions: any[]) => new PlanNode(id, deps, actions);
  const nodes: PlanNode[] = [];

  // Per-bit P/G and GP leaves
  for (let i = 0; i < 4; i++) {
    nodes.push(N(`PG${i}`, [], [
      new ComputeP(`P${i}`, id('A', i), id('B', i), id('P', i)),
      new ComputeG(`G${i}`, id('A', i), id('B', i), id('G', i)),
    ]));
    nodes.push(N(`GP${i}`, [`PG${i}`], [
      new MaterializeGP(`M${i}`, id('G', i), id('P', i), `GP${i}`)
    ]));
  }

  // Level-1
  nodes.push(N('L1_10', ['GP0','GP1'], [new CombineGP('C_10','GP1','GP0', pref(1,0))]));
  nodes.push(N('L1_32', ['GP2','GP3'], [new CombineGP('C_32','GP3','GP2', pref(3,2))]));

  // Level-2 root
  nodes.push(N('L2_30', ['L1_10','L1_32'], [new CombineGP('C_30', pref(3,2), pref(1,0), pref(3,0))]));

  // Small combine [2:0] = [2:2] ∘ [1:0]
  nodes.push(N('SC_20', ['GP2','L1_10'], [new CombineGP('C_20','GP2', pref(1,0), pref(2,0))]));

  // Carries (C0 supplied at runtime in ExecContext)
  nodes.push(N('C1', ['GP0'],    [new CarryFromPrefix('CFP1','GP0','C1')]));
  nodes.push(N('C2', ['L1_10'],  [new CarryFromPrefix('CFP2',pref(1,0),'C2')]));
  nodes.push(N('C3', ['SC_20'],  [new CarryFromPrefix('CFP3',pref(2,0),'C3')]));
  nodes.push(N('C4', ['L2_30'],  [new CarryFromPrefix('CFP4',pref(3,0),'C4')]));

  // Sums
  nodes.push(N('S0', [],         [new SumFromPC('S0A','P0','C0','S0')]));
  nodes.push(N('S1', ['C1'],     [new SumFromPC('S1A','P1','C1','S1')]));
  nodes.push(N('S2', ['C2'],     [new SumFromPC('S2A','P2','C2','S2')]));
  nodes.push(N('S3', ['C3'],     [new SumFromPC('S3A','P3','C3','S3')]));

  return new Plan(nodes);
}
