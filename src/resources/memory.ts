/**
 * MemoryTable — backend for scratch "rows" that ants physicalize on the board.
 * Fixed capacity, safe state transitions, and incremental clearing.
 */

export type Bit = 0 | 1;

export type VarKind = "G" | "P" | "C" | "S";
export type Span = readonly [hi: number, lo: number]; // hi==lo for single index

export interface MemKey {
  kind: VarKind;
  span: Span;
}

export type RowState = "Free" | "Reserved" | "Busy" | "Ready" | "Clearing";

export interface MemRow {
  id: string;
  /** Set on allocate; cleared when the row returns to Free. */
  key: MemKey | undefined;
  /** Bit value; may be set while building, must be defined before Ready. */
  value: Bit | undefined;
  state: RowState;
  /** Count of physical grains currently on this row. */
  occupancy: number;
}

export class OutOfMemoryError extends Error {
  constructor(msg = "MemoryTable capacity exhausted") { super(msg); }
}
export class InvalidTransitionError extends Error {
  constructor(msg: string) { super(msg); }
}
export class UnknownRowError extends Error {
  constructor(id: string) { super(`Unknown memory row '${id}'`); }
}

function check(cond: boolean, err: Error): void {
  if (!cond) throw err;
}

export class MemoryTable {
  private rows = new Map<string, MemRow>();
  private freeList: string[] = [];

  constructor(capacity: number, ids?: string[]) {
    check(capacity > 0, new OutOfMemoryError("Capacity must be > 0"));
    if (ids && ids.length !== capacity) {
      throw new Error(`If ids are provided, length must equal capacity (${capacity})`);
    }
    for (let i = 0; i < capacity; i++) {
      const id = ids ? ids[i]! : `row-${String(i).padStart(3, "0")}`;
      const row: MemRow = { id, key: undefined, value: undefined, state: "Free", occupancy: 0 };
      this.rows.set(id, row);
      this.freeList.push(id);
    }
  }

  /** Read-only view (same objects; treat as immutable from the outside). */
  snapshot(): ReadonlyArray<MemRow> {
    return Array.from(this.rows.values());
  }

  getRow(id: string): MemRow {
    const row = this.rows.get(id);
    if (!row) throw new UnknownRowError(id);
    return row;
  }

  /** Allocate a Free row, set its key, move to Reserved, and return the row id. */
  allocate(key: MemKey): string {
    const id = this.freeList.shift();
    if (!id) throw new OutOfMemoryError();
    const row = this.getRow(id);
    check(row.state === "Free", new InvalidTransitionError(`Row ${id} not Free`));
    row.key = { kind: key.kind, span: key.span };
    row.value = undefined;
    row.state = "Reserved";
    row.occupancy = 0;
    return id;
  }

  /** Optional: set/overwrite the evolving value while building the row. */
  setValue(id: string, value: Bit): void {
    const row = this.getRow(id);
    check(
      row.state === "Reserved" || row.state === "Busy",
      new InvalidTransitionError(`setValue only in Reserved/Busy; row ${id} is ${row.state}`)
    );
    row.value = value;
  }

  /** Mark row work as actively ongoing (between Reserved and Ready). */
  markBusy(id: string): void {
    const row = this.getRow(id);
    check(row.state === "Reserved", new InvalidTransitionError(`markBusy requires Reserved; row ${id} is ${row.state}`));
    row.state = "Busy";
  }

  /** Mark row ready to be read; requires value to be set. */
  markReady(id: string): void {
    const row = this.getRow(id);
    check(
      row.state === "Reserved" || row.state === "Busy",
      new InvalidTransitionError(`markReady requires Reserved/Busy; row ${id} is ${row.state}`)
    );
    check(
      row.value !== undefined,
      new InvalidTransitionError(`markReady requires value to be set for row ${id}`)
    );
    row.state = "Ready";
  }

  /** Begin clearing: ants will evict grains one-by-one. */
  beginClear(id: string): void {
    const row = this.getRow(id);
    check(
      row.state === "Ready" || row.state === "Reserved" || row.state === "Busy",
      new InvalidTransitionError(`beginClear requires Ready/Reserved/Busy; row ${id} is ${row.state}`)
    );
    row.state = "Clearing";
    // keep key/value until fully freed
  }

  /** Grain layer hook: a grain was placed onto this row. */
  incOccupancy(id: string): void {
    const row = this.getRow(id);
    row.occupancy += 1;
  }

  /** Grain layer hook: a grain was removed; may free the row if clearing completes. */
  decOccupancy(id: string): void {
    const row = this.getRow(id);
    check(row.occupancy > 0, new InvalidTransitionError(`decOccupancy underflow on row ${id}`));
    row.occupancy -= 1;
    if (row.occupancy === 0 && row.state === "Clearing") {
      this.finalFree(id);
    }
  }

  /** Force-free a Clearing row that is already empty. */
  freeIfEmpty(id: string): void {
    const row = this.getRow(id);
    check(row.state === "Clearing", new InvalidTransitionError(`freeIfEmpty requires Clearing; row ${id} is ${row.state}`));
    check(row.occupancy === 0, new InvalidTransitionError(`freeIfEmpty requires occupancy=0; row ${id} has ${row.occupancy}`));
    this.finalFree(id);
  }

  /** Stats for dashboards/tests. */
  stats() {
    let Free = 0, Reserved = 0, Busy = 0, Ready = 0, Clearing = 0;
    for (const r of this.rows.values()) {
      if (r.state === "Free") Free++;
      else if (r.state === "Reserved") Reserved++;
      else if (r.state === "Busy") Busy++;
      else if (r.state === "Ready") Ready++;
      else if (r.state === "Clearing") Clearing++;
    }
    return { capacity: this.rows.size, Free, Reserved, Busy, Ready, Clearing };
  }

  // — internal —

  private finalFree(id: string): void {
    const row = this.getRow(id);
    row.key = undefined;
    row.value = undefined;
    row.state = "Free";
    row.occupancy = 0;
    this.freeList.push(id);
  }
}
