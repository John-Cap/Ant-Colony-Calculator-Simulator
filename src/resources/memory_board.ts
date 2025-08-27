import type { MemKey } from "./memory.js";

export type Site = "Var" | "IdxLo" | "IdxHi" | "Value";
export interface CellPos { x: number; y: number; }

export interface RowCells {
  rowId: string;
  key: MemKey;
  var: CellPos;
  value: CellPos;
  idxLo?: CellPos;
  idxHi?: CellPos;
}

type TemplateCells = Omit<RowCells, "rowId" | "key">;

export function keySig(key: MemKey): string {
  const [hi, lo] = key.span;
  return `${key.kind}[${hi}:${lo}]`;
}

export function requiredSitesForKey(key: MemKey) {
  const [hi, lo] = key.span;
  const s: Site[] = ["Var", "Value"];
  if (hi === lo) s.push("IdxLo"); else s.push("IdxLo", "IdxHi");
  return s;
}

export class MemoryBoard {
  private byRow = new Map<string, RowCells>();
  private templates = new Map<string, TemplateCells>();

  setTemplate(key: MemKey, cells: TemplateCells): void {
    this.templates.set(keySig(key), cells);
  }
  hasTemplateFor(key: MemKey): boolean { return this.templates.has(keySig(key)); }

  realize(key: MemKey, rowId: string): RowCells {
    const t = this.templates.get(keySig(key));
    if (!t) throw new Error(`MemoryBoard: no template for ${keySig(key)}`);
    const rcBase = { rowId, key, var: t.var, value: t.value };
    const rc = {
    ...rcBase,
    ...(t.idxLo ? { idxLo: t.idxLo } : {}),
    ...(t.idxHi ? { idxHi: t.idxHi } : {}),
    } as RowCells;

    this.byRow.set(rowId, rc);
    return rc;
  }

  register(row: RowCells): void { this.byRow.set(row.rowId, row); }
  get(rowId: string): RowCells {
    const r = this.byRow.get(rowId);
    if (!r) throw new Error(`MemoryBoard: row ${rowId} not found`);
    return r;
  }
  has(rowId: string): boolean { return this.byRow.has(rowId); }
  remove(rowId: string): void { this.byRow.delete(rowId); }
  list(): RowCells[] { return Array.from(this.byRow.values()); }
}

export function installDefault4BitTemplates(
  board: MemoryBoard,
  opts?: { origin?: CellPos; dx?: number; dy?: number }
): void {
  const origin = opts?.origin ?? { x: 2, y: 1 };
  const dx = opts?.dx ?? 1;
  const dy = opts?.dy ?? 2;

  const colVar   = origin.x + 0 * dx;
  const colIdxLo = origin.x + 1 * dx;
  const colIdxHi = origin.x + 2 * dx;
  const colVal   = origin.x + 3 * dx;

  const y10 = origin.y + 0 * dy;
  const y32 = origin.y + 1 * dy;
  const y20 = origin.y + 2 * dy;
  const y30 = origin.y + 3 * dy;

  board.setTemplate({ kind: "G", span: [1, 0] }, {
    var:   { x: colVar,   y: y10 },
    idxLo: { x: colIdxLo, y: y10 },
    value: { x: colVal,   y: y10 },
  });
  board.setTemplate({ kind: "G", span: [3, 2] }, {
    var:   { x: colVar,   y: y32 },
    idxLo: { x: colIdxLo, y: y32 },
    idxHi: { x: colIdxHi, y: y32 },
    value: { x: colVal,   y: y32 },
  });
  board.setTemplate({ kind: "G", span: [2, 0] }, {
    var:   { x: colVar,   y: y20 },
    idxLo: { x: colIdxLo, y: y20 },
    idxHi: { x: colIdxHi, y: y20 },
    value: { x: colVal,   y: y20 },
  });
  board.setTemplate({ kind: "G", span: [3, 0] }, {
    var:   { x: colVar,   y: y30 },
    idxLo: { x: colIdxLo, y: y30 },
    idxHi: { x: colIdxHi, y: y30 },
    value: { x: colVal,   y: y30 },
  });
}
