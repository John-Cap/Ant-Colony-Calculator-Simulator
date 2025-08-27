import { xor, and, or, type Bit, type GP } from '../core/bit.js';
import { BitCell, PairCell, type Grid } from './cells.js';
import type { MemoryTable } from '../resources/memory.js';
import type { GrainPool } from '../resources/grains.js';
import { JobQueue } from '../domain/jobs.js';
import { VirtualAntWorker } from '../sim/virtual_worker.js';
import { MemoryBoard } from '../resources/memory_board.js';
import { JobQueuePos } from '../domain/jobs_positional_queue.js';
import { RealtimeAntWorkerPool } from '../sim/realtime_worker.js';
import { MemoryRuntime } from '../sim/memory_runtime.js';

export interface ExecContext {
  grid: Grid;
  c0: Bit;
  memory?: MemoryTable;
  grains?: GrainPool;
  jobs?: JobQueue;
  worker?: VirtualAntWorker;
  board?: MemoryBoard;
}

export interface Action { id: string; execute(ctx: ExecContext): void; }

export class ComputeP implements Action {
  constructor(public id: string, private a: string, private b: string, private out: string) {}
  execute(ctx: ExecContext) {
    const A = ctx.grid.get<BitCell>(this.a).value;
    const B = ctx.grid.get<BitCell>(this.b).value;
    ctx.grid.get<BitCell>(this.out).write(xor(A, B));
  }
}

export class ComputeG implements Action {
  constructor(public id: string, private a: string, private b: string, private out: string) {}
  execute(ctx: ExecContext) {
    const A = ctx.grid.get<BitCell>(this.a).value;
    const B = ctx.grid.get<BitCell>(this.b).value;
    ctx.grid.get<BitCell>(this.out).write(and(A, B));
  }
}

export class MaterializeGP implements Action {
  constructor(public id: string, private g: string, private p: string, private out: string) {}
  execute(ctx: ExecContext) {
    const G = ctx.grid.get<BitCell>(this.g).value;
    const P = ctx.grid.get<BitCell>(this.p).value;
    ctx.grid.get<PairCell>(this.out).write({ G, P });
  }
}

/** Combine: out = right ∘ left  (right = higher indices) */
export class CombineGP implements Action {
  constructor(public id: string, private right: string, private left: string, private out: string) {}
  execute(ctx: ExecContext) {
    const R = ctx.grid.get<PairCell>(this.right).value;
    const L = ctx.grid.get<PairCell>(this.left).value;
    const G: Bit = (R.G === 1 || (R.P === 1 && L.G === 1)) ? 1 : 0;
    const P: Bit = and(R.P, L.P);
    ctx.grid.get<PairCell>(this.out).write({ G, P });
  }
}

/** Carry: Ci = G ∨ (P · C0) using a prefix (G,P) for [i-1:0] or [i:0] per call-site */
export class CarryFromPrefix implements Action {
  constructor(public id: string, private prefix: string, private out: string) {}
  execute(ctx: ExecContext) {
    const gp = ctx.grid.get<PairCell>(this.prefix).value;
    const c: Bit = (gp.G === 1 || (gp.P === 1 && ctx.c0 === 1)) ? 1 : 0;
    ctx.grid.get<BitCell>(this.out).write(c);
  }
}

/** S_i = P_i ⊕ C_i */
export class SumFromPC implements Action {
  constructor(public id: string, private p: string, private c: string, private out: string) {}
  execute(ctx: ExecContext) {
    const P = ctx.grid.get<BitCell>(this.p).value;
    const C = ctx.grid.get<BitCell>(this.c).value;
    ctx.grid.get<BitCell>(this.out).write(xor(P, C));
  }
}

export interface ExecContext {
  grid: Grid;
  c0: Bit;

  // virtual (bulk) resources
  memory?: MemoryTable;
  grains?: GrainPool;
  jobs?: JobQueue;
  worker?: VirtualAntWorker;

  // realtime (positional) resources — optional until you use them
  board?: MemoryBoard;
  jobsPos?: JobQueuePos;
  workerRT?: RealtimeAntWorkerPool;
  rt?: MemoryRuntime;              // shared runtime (already used by virtual worker)
  repoPos?: { x: number; y: number };
  memTickMs?: number;              // tick quantum for Await*Realtime actions
}