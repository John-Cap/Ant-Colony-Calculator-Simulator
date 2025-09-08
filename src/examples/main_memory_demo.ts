// e.g., src/main_memory_demo.ts
import { loadBoard } from '../config/loader.js';
import { MemoryRegistry } from '../memory/registry.js';
import { MemoryRuntime } from '../memory/runtime.js';
import { keyOf } from '../domain/symbols.js';
import { InMemoryJobsQueue } from '../jobs/in_memory_queue.js'; // trivial queue + virtual worker
import { demoMemoryTableBoard } from '../components/memory_table.js';

const spec = demoMemoryTableBoard(20);
const board = loadBoard(spec);

const registry = new MemoryRegistry();

// bind some symbols to concrete rows
registry.bind(keyOf('G', [2,0]), 'mem:housing:0/row-00');
registry.bind(keyOf('C', 3),      'mem:housing:0/row-01');
registry.bind(keyOf('S', 1),      'mem:housing:0/row-02');

const jobs = new InMemoryJobsQueue(); // or your real pool
const mem = new MemoryRuntime(board, registry, jobs);

// Example flow
mem.reserve(keyOf('G', [2,0]));
mem.commitBit(keyOf('G', [2,0]), 1);

(async () => {
  const bit = await mem.read(keyOf('G', [2,0]));
  console.log('G[2:0] =', bit);
})();
