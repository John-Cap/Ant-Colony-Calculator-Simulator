import type { JobPos } from "../domain/jobs_positional.js";
import type { JobQueuePos } from "../domain/jobs_positional_queue.js";
import type { MemoryBoard } from "../resources/memory_board.js";
import type { MemoryTable } from "../resources/memory.js";
import type { GrainPool, GrainId, WorldPos } from "../resources/grains.js";
import { MemoryRuntime } from "./memory_runtime.js";

export interface AntRT {
  id: string;
  pos: WorldPos;
  speed: number;                       // cells/sec
  carrying: GrainId | undefined;       // <-- explicit union
  current: JobPos | undefined;         // <-- explicit union
}

export interface WorldConfig {
  repoPos: WorldPos;
}

function dist(a: WorldPos, b: WorldPos) {
  const dx = b.x - a.x, dy = b.y - a.y;
  return Math.hypot(dx, dy);
}
function stepToward(p: WorldPos, dest: WorldPos, maxD: number): WorldPos {
  const d = dist(p, dest);
  if (d <= maxD || d === 0) return { x: dest.x, y: dest.y };
  const r = maxD / d;
  return { x: p.x + (dest.x - p.x) * r, y: p.y + (dest.y - p.y) * r };
}

export class RealtimeAntWorkerPool {
  constructor(
    private ants: AntRT[],
    private q: JobQueuePos,
    private world: WorldConfig,
    private board: MemoryBoard,
    private grains: GrainPool,
    private mem: MemoryTable,
    private rt: MemoryRuntime,
  ) {
    // Ensure fields exist under exactOptionalPropertyTypes
    for (const a of this.ants) {
      if (typeof a.carrying === "undefined") a.carrying = undefined;
      if (typeof a.current === "undefined") a.current = undefined;
    }
  }

  tick(dtMs: number) {
    const dt = dtMs / 1000;

    // Assign jobs to idle ants
    for (const ant of this.ants) {
      if (!ant.current) {
        const job = this.q.pull();
        if (job) ant.current = job;
      }
    }

    // Progress jobs
    for (const ant of this.ants) {
      if (!ant.current) continue;
      this.execStep(ant, ant.current, dt);
    }
  }

  private execStep(ant: AntRT, job: JobPos, dt: number) {
    switch (job.kind) {
      case "FetchFromRepo": {
        const g = this.grains.borrowToLoose(job.near);
        ant.carrying = g.id;
        ant.current = undefined;
        break;
      }
      case "PickLoose": {
        if (ant.carrying) throw new Error(`Ant ${ant.id} already carrying`);
        ant.carrying = job.grainId;
        ant.current = undefined;
        break;
      }
      case "CarryTo": {
        const maxD = ant.speed * dt;
        const next = stepToward(ant.pos, job.dest, maxD);
        ant.pos = next;
        if (next.x === job.dest.x && next.y === job.dest.y) {
          ant.current = undefined; // arrived
        }
        break;
      }
      case "PlaceInRow": {
        if (!ant.carrying) throw new Error(`Ant ${ant.id} has nothing to place`);
        const gid = ant.carrying;
        this.grains.placeIntoSlot(gid, job.rowId);
        this.rt.recordPlace(job.rowId, gid);
        ant.carrying = undefined;

        const row = this.mem.getRow(job.rowId);
        if (row.value !== undefined) {
          const [hi, lo] = row.key!.span;
          const required = 2 + (hi === lo ? 1 : 2);
          if (row.occupancy >= required && (row.state === "Reserved" || row.state === "Busy")) {
            this.mem.markReady(job.rowId);
          }
        }
        ant.current = undefined;
        break;
      }
      case "EvictFromRow": {
        this.grains.removeFromSlotToLoose(job.grainId, ant.pos);
        this.rt.recordEvict(job.rowId, job.grainId, ant.pos);
        ant.carrying = job.grainId;
        ant.current = undefined;
        break;
      }
      case "ReturnToRepo": {
        if (!ant.carrying) throw new Error(`Ant ${ant.id} has nothing to return`);
        this.grains.returnLooseToRepo(ant.carrying);
        ant.carrying = undefined;
        ant.current = undefined;
        break;
      }
    }
  }
}
