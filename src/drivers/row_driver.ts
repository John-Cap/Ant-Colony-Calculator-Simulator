// src/drivers/row_driver.ts
import { Blackboard } from '../blackboard/blackboard.js';
import { Job } from '../engine/job_board.js';
import { RowKey } from '../blackboard/types.js';

function keyToString(k: RowKey): string {
    return k.kind === 'G' || k.kind === 'P'
        ? `${k.kind}[${k.span.hi}:${k.span.lo}]`
        : `${k.kind}[${k.index}]`;
}

/**
 * Teleport/instant processing:
 *  - FillRow: state Reserved/Filling -> Ready
 *  - ClearRow: Ready -> Free
 * Real ants will replace this with path/time-based execution.
 */
export class RowDriverTeleport {
    constructor(private bb: Blackboard) {}

    process(job: Job) {
        if (job.kind === 'FillRow') {
            const rowId = this.bb.rowIdFor(job.key);
            if (!rowId) throw new Error(`RowDriver: no row for ${keyToString(job.key)}`);
            // In a richer driver you’d increment a per-row occupancy counter too
            this.bb.setRowState(rowId, 'Filling');
            this.bb.setRowState(rowId, 'Ready');
            return;
        }
        if (job.kind === 'ClearRow') {
            this.bb.setRowState(job.rowId, 'Clearing');
            this.bb.setRowState(job.rowId, 'Free');
            return;
        }
    }
}