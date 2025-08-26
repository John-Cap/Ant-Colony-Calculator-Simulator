import type { Action, ExecContext } from './actions.js';

export class PlanNode {
  constructor(public readonly id: string, public readonly deps: string[], public readonly actions: Action[]) {}
}

export class Plan { constructor(public readonly nodes: PlanNode[]) {} }

/** Zero-latency, dependency-driven executor (virtual mode). */
export class VirtualExecutor {
  async run(plan: Plan, ctx: ExecContext): Promise<void> {
    const remaining = new Map(plan.nodes.map(n => [n.id, n]));
    const done = new Set<string>();
    while (remaining.size > 0) {
      const next = [...remaining.values()].find(n => n.deps.every(d => done.has(d)));
      if (!next) throw new Error('Cycle or unmet dependency in plan');
      for (const a of next.actions) a.execute(ctx); // atomic block; no timing
      done.add(next.id);
      remaining.delete(next.id);
    }
  }
}
