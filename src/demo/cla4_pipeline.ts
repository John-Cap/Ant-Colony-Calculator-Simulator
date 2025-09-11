// src/demo/cla4_pipeline.ts
import { Blackboard } from '../blackboard/blackboard.js';
import { JobBoard } from '../engine/job_board.js';
import { StepEngine } from '../engine/step_engine.js';
import { rowReady, knownPrefix, all } from '../blackboard/guards.js';
import { Span } from '../blackboard/types.js';
import { RowDriverTeleport } from '../drivers/row_driver.js';
import { seedOracle } from '../oracle/virtual_oracle.js';

const span = (hi: number, lo: number): Span => ({ hi, lo });

export async function runCLA4Demo(a: number, b: number, c0: 0|1) {
    const bb = new Blackboard();
    const jobs = new JobBoard();
    const rows = new RowDriverTeleport(bb);
    const engine = new StepEngine(bb);

    // 1) Seed oracle truths
    seedOracle(bb, a, b, c0, 4);

    // 2) Provision physical rows (as if the memory-table driver did it)
    const mapRow = (key: any, rowId: string) => {
        bb.setRowAllocated(key, rowId);
        bb.setRowState(rowId, 'Reserved');
    };
    mapRow({ kind: 'G', span: span(1,0) }, 'row-10');
    mapRow({ kind: 'G', span: span(3,2) }, 'row-32');
    mapRow({ kind: 'G', span: span(3,0) }, 'row-30');
    mapRow({ kind: 'G', span: span(2,0) }, 'row-20');

    // 3) Steps: when a prefix value is known, fill its row.
    const fillPrefix = (hi: number, lo: number) => engine.register({
        id: `fill G[${hi}:${lo}]`,
        once: true,
        guard: knownPrefix('G', span(hi,lo)), // value known by oracle
        run: () => jobs.enqueue({ kind: 'FillRow', key: { kind:'G', span: span(hi,lo) }, count: 4 }),
    });

    fillPrefix(1,0);
    fillPrefix(3,2);
    fillPrefix(3,0);
    fillPrefix(2,0);

    // 4) Steps: after a row is ready & "consumed", clear it.
    const clearWhenReady = (rowId: string, hi: number, lo: number) => engine.register({
        id: `clear row ${rowId}`,
        once: true,
        guard: all(rowReady({ kind:'G', span: span(hi,lo) })), // ready per blackboard
        run: () => jobs.enqueue({ kind: 'ClearRow', rowId }),
    });

    clearWhenReady('row-10', 1,0);
    clearWhenReady('row-32', 3,2);
    clearWhenReady('row-30', 3,0);
    clearWhenReady('row-20', 2,0);

    // 5) Drive the job board with the teleport row driver
    const drainJobs = () => {
        while (jobs.length) {
            const j = jobs.take()!;
            // In a UI build, you would schedule ants here instead of teleporting.
            rows.process(j);
        }
    };

    // 6) Run
    await engine.fire();
    drainJobs();           // process FillRow
    await engine.fire();
    drainJobs();           // process ClearRow

    // 7) Report
    console.log('== Blackboard snapshot ==');
    bb.dump();
}