// import type { Bit, SymbolKey } from '../domain/symbols.js';
// import { MemoryRegistry } from './registry.js';
// import type { Board } from '../world/board.js';
// import { MemoryRowDriver } from '../components/memrow_driver.js';
// import type { JobsQueue, JobChain } from './jobs/types.js'; // your existing job abstractions

// export class MemoryRuntime {
//   constructor(
//     private board: Board,
//     private registry: MemoryRegistry,
//     private jobs: JobsQueue,          // enqueue JobChain for ants
//   ) {}

//   /** Is the symbol physically present and marked Ready? */
//   has(symbol: SymbolKey): boolean {
//     return this.registry.has(symbol);
//   }

//   /** Read the bit if Ready; otherwise undefined. */
//   tryRead(symbol: SymbolKey): Bit | undefined {
//     return this.registry.read(symbol);
//   }

//   /** Wait until Ready, then read (polling or await on a condition; simple polling shown). */
//   async read(symbol: SymbolKey, pollMs = 10, timeoutMs = 2000): Promise<Bit> {
//     const start = Date.now();
//     while (!this.has(symbol)) {
//       if (Date.now() - start > timeoutMs) throw new Error(`Timeout reading ${symbol}`);
//       await new Promise(r => setTimeout(r, pollMs));
//     }
//     const b = this.tryRead(symbol);
//     if (b === undefined) throw new Error(`Ready without value for ${symbol}`);
//     return b;
//   }

//   /** Reserve the bound row (ants should clear first if occupied). */
//   reserve(symbol: SymbolKey): void {
//     const rowId = this.registry.lookup(symbol);
//     if (!rowId) throw new Error(`No row bound for ${symbol}`);
//     const row = this.findRow(rowId);
//     MemoryRowDriver.setReserved(row, 1);
//     this.registry.setState(rowId, 'Reserved');
//   }

//   /** Commit a bit: schedule ant job(s) to place it into Val, mark Ready, update registry. */
//   commitBit(symbol: SymbolKey, bit: Bit): void {
//     const rowId = this.registry.lookup(symbol);
//     if (!rowId) throw new Error(`No row bound for ${symbol}`);

//     // Create a job chain: clear existing Val → place/evict grain(s) → set Ready.
//     const chain: JobChain = {
//       name: `commit:${symbol}`,
//       steps: [
//         { kind: 'ClearCell', rowId, role: 'Val' },
//         bit === 1
//           ? { kind: 'PlaceInCell', rowId, role: 'Val' }
//           : { kind: 'Noop' },
//         { kind: 'SetFlag', rowId, role: 'Ready', value: 1 },
//         { kind: 'SetFlag', rowId, role: 'Reserved', value: 0 },
//       ]
//     };

//     this.jobs.enqueue(chain);

//     // For debug/teleport mode, you might do it immediately instead of enqueuing:
//     // const row = this.findRow(rowId);
//     // MemoryRowDriver.setVal(row, bit);
//     // MemoryRowDriver.setReady(row, 1);
//     // MemoryRowDriver.setReserved(row, 0);

//     this.registry.setState(rowId, 'Ready', bit);
//   }

//   /** Utility: find the Component by rowId. */
//   private findRow(rowId: string) {
//     for (const s of this.board.sectors) {
//       for (const comp of s.components) {
//         // housing or row
//         if (comp.id === rowId) return comp;
//         for (const child of comp.children) {
//           if (child.id === rowId) return child;
//         }
//       }
//     }
//     throw new Error(`Row ${rowId} not found`);
//   }
// }
