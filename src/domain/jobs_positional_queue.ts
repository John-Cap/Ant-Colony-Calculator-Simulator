import type { JobPos } from "./jobs_positional.js";

export type JobPosId = string;

export interface JobQueuePos {
  push(job: JobPos): JobPosId;
  pull(): JobPos | undefined;
  size(): number;
}

export class InMemoryJobQueuePos implements JobQueuePos {
  private q: { id: JobPosId; job: JobPos }[] = [];
  private next = 0;

  push(job: JobPos): JobPosId {
    const id = `pjob-${this.next++}`;
    this.q.push({ id, job });
    return id;
  }

  pull(): JobPos | undefined {
    const x = this.q.shift();
    return x?.job;
  }

  size(): number { return this.q.length; }
}
