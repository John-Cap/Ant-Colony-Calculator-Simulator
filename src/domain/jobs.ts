export type JobId = string;

export type Job =
  | { kind: "PlaceOnRow"; rowId: string; count: number } // place N grains onto row
  | { kind: "ClearRow";   rowId: string };               // evict all grains from row

export interface JobQueue {
  push(job: Job): JobId;
  pull(): Job | undefined;          // FIFO for now
  size(): number;
}

export class InMemoryJobQueue implements JobQueue {
  private q: { id: JobId; job: Job }[] = [];
  private next = 0;
  push(job: Job): JobId { const id = `job-${this.next++}`; this.q.push({ id, job }); return id; }
  pull(): Job | undefined { const x = this.q.shift(); return x?.job; }
  size(): number { return this.q.length; }
}
