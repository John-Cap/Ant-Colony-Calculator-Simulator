import { Id, RowKey } from "../blackboard/types";

export type Job =
  | { kind: 'FillRow'; key: RowKey; count: number }     // place N grains
  | { kind: 'ClearRow'; rowId: Id };                    // evict grains

export class JobBoard {
  private q: Job[] = [];
  enqueue(j: Job) { this.q.push(j); }
  take(): Job | undefined { return this.q.shift(); }
  get length() { return this.q.length; }
}
