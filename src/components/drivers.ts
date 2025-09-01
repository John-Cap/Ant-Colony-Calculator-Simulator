// Generic, typed component driver registry.
// Keep imports with `.js` if you use ESModule / NodeNext.
import type { Component, Cell } from "../world/board.js";

/** A ports object is a mapping from role names to concrete Cell references. */
export type PortsBase = Record<string, Cell>;

/** Minimal context your drivers can use during 'operate' (extend later). */
export interface GateContext {
  placeTo(cellId: string): void;             // e.g., enqueue a placement job
  evictFrom(cellId: string): void;           // e.g., enqueue an eviction job
}

/** Generic driver contract.
 *  P is the exact ports shape (e.g., { inA: Cell; inB: Cell; pin: Cell }).
 *  O is the shape of the evaluation output (default: { [name]: 0|1 }).
 */
export interface ComponentDriver<
  P extends PortsBase,
  O extends Record<string, 0 | 1> = Record<string, 0 | 1>
> {
  [x: string]: any;
  /** Must return the *same* Cell object references from the component (no cloning). */
  ports(comp: Component): P;

  /** Optional convenience: evaluate using the component (will call ports internally). */
  evaluate?(comp: Component): O;

  /** Optional pure evaluation that takes an already-fetched ports object. */
  evaluateFromPorts?(ports: P): O;

  /** Optional 'operate' hook (e.g., on pin press) to mutate/bind outputs. */
  operate?(comp: Component, ctx: GateContext, bind: Record<string, string>): void;
}

/** Registry keyed by component type (e.g., "GateAND", "GateXOR"). */
const REG = new Map<string, ComponentDriver<any, any>>();

/** Register a driver for a given component type. Call once at startup. */
export function registerDriver<
  P extends PortsBase,
  O extends Record<string, 0 | 1> = Record<string, 0 | 1>
>(type: string, driver: ComponentDriver<P, O>): void {
  REG.set(type, driver);
}

/** Resolve a driver by type with its exact ports/output types. */
export function driverFor<
  P extends PortsBase,
  O extends Record<string, 0 | 1> = Record<string, 0 | 1>
>(type: string): ComponentDriver<P, O> {
  const d = REG.get(type);
  if (!d) throw new Error(`No driver registered for component type '${type}'`);
  return d as ComponentDriver<P, O>;
}

/** Utilities (optional): list or assert registry contents. */
export function listRegisteredTypes(): string[] {
  return Array.from(REG.keys()).sort();
}
