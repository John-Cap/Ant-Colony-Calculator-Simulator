import type { JobQueue, Job } from "../domain/jobs.js";
import type { MemoryRuntime } from "./memory_runtime.js";
import type { MemoryTable } from "../resources/memory.js";

/** Drains the job queue immediately (virtual mode, no travel time). */
export class VirtualAntWorker {
  constructor(private q: JobQueue, private rt: MemoryRuntime, private mem: MemoryTable) {}

  /** Run until the queue is empty. */
  drain() {
    for (;;) {
      const job = this.q.pull();
      if (!job) break;
      this.exec(job);
    }
  }

  private exec(job: Job) {
    switch (job.kind) {
      case "PlaceOnRow": {
        for (let i = 0; i < job.count; i++) this.rt.placeOne(job.rowId);
        // Row value must already be set. Mark ready here for convenience.
        this.mem.markReady(job.rowId);
        break;
      }
      case "ClearRow": {
        // Evict all tracked grains for this row.
        while (this.rt.count(job.rowId) > 0) this.rt.evictOne(job.rowId);
        // If occupancy is already zero, freeIfEmpty will transition to Free.
        try { this.mem.freeIfEmpty(job.rowId); } catch { /* not clearing or not empty yet */ }
        break;
      }
    }
  }
}
