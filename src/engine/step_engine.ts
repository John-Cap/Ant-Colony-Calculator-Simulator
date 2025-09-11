// src/engine/step_engine.ts
import { Blackboard } from '../blackboard/blackboard.js';

export type Step = {
    id: string;
    guard: (bb: Blackboard) => boolean;
    run: (bb: Blackboard) => Promise<void> | void;
    once?: boolean;
    _done?: boolean;
};

export class StepEngine {
    private steps: Step[] = [];
    constructor(private bb: Blackboard) {}

    register(step: Step) { this.steps.push(step); }

    /** Fire all eligible steps until quiescent (or max rounds). */
    async fire(maxRounds = 50) {
        for (let round = 0; round < maxRounds; round++) {
            let fired = 0;
            for (const s of this.steps) {
                if (s._done && s.once) continue;
                if (s.guard(this.bb)) {
                    await s.run(this.bb);
                    fired++;
                    if (s.once) s._done = true;
                }
            }
            if (fired === 0) return;
        }
        throw new Error('StepEngine: convergence not reached');
    }
}
