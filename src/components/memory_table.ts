// src/config/memory_table.ts

import { BoardSpec, CellSpec, ComponentSpec } from "../config/schema";

/** Roles in one memory row, left→right. */
export const MEM_ROW_ROLES = [
  "P", "G", "C", "S",    // variable columns
  "i4", "i3", "i2", "i1", "i0",  // index columns
  "Val",                 // value (computed bit)
  "Reserved",            // reservation flag
  "Ready"                // read-ready flag
] as const;
export type MemRowRole = typeof MEM_ROW_ROLES[number];

/** Build one horizontal strip of 12 cells with the given origin and sizing. */
export function buildMemoryRow(
  id: string,
  origin: { x: number; y: number },
  cell:   { w: number; h: number; gap: number },
  capacity = 1
): ComponentSpec {
  const cells: CellSpec[] = [];
  let x = origin.x;
  for (const role of MEM_ROW_ROLES) {
    cells.push({
      id: `${id}/${role}`,
      role,
      x, y: origin.y, w: cell.w, h: cell.h,
      capacity
    });
    x += cell.w + cell.gap;
  }
  const rowW = MEM_ROW_ROLES.length * cell.w + (MEM_ROW_ROLES.length - 1) * cell.gap;
  const rowH = cell.h;

  return {
    id,
    type: "MemoryRow",
    x: origin.x, y: origin.y,
    w: rowW, h: rowH,
    solid: false,
    cells,
    children: []
  };
}

/** Build the housing that stacks N rows inside its bounds. */
export function buildMemoryHousing(
  id: string,
  origin: { x: number; y: number },
  size:   { w: number; h: number },
  rows:   number,
  opts?: {
    padding?: { l: number; t: number; r: number; b: number };
    cell?: { w: number; h: number; gap: number };
    rowGap?: number;
    capacity?: number;
  }
): ComponentSpec {
  const padding = opts?.padding ?? { l: 16, t: 16, r: 16, b: 16 };
  const cell    = opts?.cell    ?? { w: 18, h: 18, gap: 6 };
  const rowGap  = opts?.rowGap  ?? 10;
  const cap     = opts?.capacity ?? 1;

  const children: ComponentSpec[] = [];
  const innerX = origin.x + padding.l;
  const innerY = origin.y + padding.t;

  const rowH = cell.h;  // rows are just the cell height
  let y = innerY;

  for (let r = 0; r < rows; r++) {
    const rowId = `${id}/row-${String(r).padStart(2, "0")}`;
    children.push(buildMemoryRow(rowId, { x: innerX, y }, cell, cap));
    y += rowH + rowGap;
  }

  return {
    id,
    type: "MemoryHousing",
    x: origin.x, y: origin.y, w: size.w, h: size.h,
    solid: true,
    cells: [],          // housing has no own cells; rows do
    children
  };
}

/** A convenience full board with one sector and one housing, useful for tests. */
export function demoMemoryTableBoard(rows = 20): BoardSpec {
  const housing = buildMemoryHousing(
    "mem:housing:0",
    { x: 40, y: 40 },
    { w: 820, h: 520 },
    rows,
    {
      padding: { l: 24, t: 24, r: 24, b: 24 },
      cell: { w: 20, h: 20, gap: 8 },
      rowGap: 12,
      capacity: 1
    }
  );

  return {
    sectors: [
      {
        id: "sec:memory",
        x: 0, y: 0, w: 900, h: 600,
        components: [housing]
      }
    ]
  };
}
