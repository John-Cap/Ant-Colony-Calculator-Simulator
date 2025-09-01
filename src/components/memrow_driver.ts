import type { Cell, Component } from '../world/board.js';
import type { ComponentDriver, PortsBase } from './drivers.js'; // your existing generic driver types

export type MemRowRole =
  | 'P' | 'G' | 'C' | 'S'
  | 'i4' | 'i3' | 'i2' | 'i1' | 'i0'
  | 'Val' | 'Reserved' | 'Ready';

export type MemRowPorts = PortsBase & Record<MemRowRole, Cell>;

function requireRole(comp: Component, role: string): Cell {
  const c = comp.cells.find(c => c.tags?.[0] === role || (c as any).role === role);
  if (!c) throw new Error(`MemoryRow ${comp.id} missing role '${role}'`);
  return c as Cell;
}

export const MemoryRowDriver: ComponentDriver<MemRowPorts, {}> = {
  ports(comp: Component): MemRowPorts {
    const get = (r: MemRowRole) => requireRole(comp, r);
    return {
      P: get('P'), G: get('G'), C: get('C'), S: get('S'),
      i4: get('i4'), i3: get('i3'), i2: get('i2'), i1: get('i1'), i0: get('i0'),
      Val: get('Val'), Reserved: get('Reserved'), Ready: get('Ready')
    };
  },

  // No pure evaluate for a row; it is storage. Provide tiny helpers:
  // These are "immediate" versions; your ant-backed variants live in the runtime (see below).
  setReserved(comp: Component, v: 0|1) {
    const { Reserved } = this.ports(comp);
    Reserved.occupancy = v;
  },

  setReady(comp: Component, v: 0|1) {
    const { Ready } = this.ports(comp);
    Ready.occupancy = v;
  },

  setVal(comp: Component, bit: 0|1) {
    const { Val } = this.ports(comp);
    Val.occupancy = bit;
  }
};
