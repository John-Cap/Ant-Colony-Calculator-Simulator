import { InMemoryGrid, BitCell, PairCell, StringCell } from './engine/cells.js';
import { VirtualExecutor } from './engine/plan.js';
import { buildPlanCLA4 } from './strategies/cla4.js';
import { toNibble, type Bit } from './core/bit.js';
import { MemoryTable } from './resources/memory.js';

function bits4(n: number): [Bit, Bit, Bit, Bit] { return toNibble(n) as [Bit,Bit,Bit,Bit]; }

async function runDemo(aDec: number, bDec: number, c0: Bit = 0) {
  const grid = new InMemoryGrid();

  // Core cells
  for (let i = 0; i < 4; i++) {
    grid.put(new BitCell(`A${i}`)); grid.put(new BitCell(`B${i}`));
    grid.put(new BitCell(`P${i}`)); grid.put(new BitCell(`G${i}`));
    grid.put(new PairCell(`GP${i}`));
    grid.put(new BitCell(`C${i}`)); grid.put(new BitCell(`S${i}`));
  }
  grid.put(new BitCell('C4'));
  grid.put(new BitCell('C0')); grid.get<BitCell>('C0').write(c0);

  // Pair outputs
  ['PFX[1:0]','PFX[3:2]','PFX[2:0]','PFX[3:0]'].forEach(id => grid.put(new PairCell(id)));

  // NEW: row-id carriers for memory rows
  ['ROW10','ROW32','ROW20','ROW30'].forEach(id => grid.put(new StringCell(id)));

  // Load inputs
  const A = bits4(aDec); const B = bits4(bDec);
  A.forEach((v,i)=>grid.get<BitCell>(`A${i}`).write(v));
  B.forEach((v,i)=>grid.get<BitCell>(`B${i}`).write(v));

  const plan = buildPlanCLA4();

  // Memory capacity: try 4 (OK). Change to 2 to see OutOfMemoryError.
  const memory = new MemoryTable(4);

  await new VirtualExecutor().run(plan, { grid, c0, memory });

  const S = [0,1,2,3].map(i => grid.get<BitCell>(`S${i}`).value) as [Bit,Bit,Bit,Bit];
  const [s0,s1,s2,s3] = S;
  const C4 = grid.get<BitCell>('C4').value;
  const sum = (C4 << 4) | (s3 << 3) | (s2 << 2) | (s1 << 1) | (s0 << 0);

  console.log(`${aDec} + ${bDec} = ${sum}  (C4 S3 S2 S1 S0 = ${C4} ${s3}${s2}${s1}${s0})`);
  console.log('Memory stats:', memory.stats());
  console.log('Memory rows:', memory.snapshot());
}

runDemo(13, 10).catch(err => { console.error(err); process.exit(1); });
