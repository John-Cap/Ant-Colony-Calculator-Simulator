import { Blackboard } from "../blackboard/blackboard";
import { all, knownPrefix, rowReady } from "../blackboard/guards";

// bootstrap
const bb = new Blackboard();
bb.on(ev => console.log('[bb]', ev));   // subscribe for step unlockers

// seed oracle truths as they become available
bb.setKnownVar('A', 0, 1);
bb.setKnownVar('B', 0, 0);
// ...
bb.setKnownPrefix('G', {hi:1, lo:0}, 1);

// provision rows (by the memory/table driver)
bb.setRowAllocated({kind:'G', span:{hi:1, lo:0}}, 'row-10');
bb.setRowState('row-10', 'Ready');

// check a step precondition
const canComputeC2 = all(
  knownPrefix('G', {hi:2, lo:0}),
  knownPrefix('P', {hi:2, lo:0}),
  rowReady({kind:'C', index:2})
);

if (canComputeC2(bb)) {
  // emit jobs for C2; job completion will write KnownVar('C',2,bit)
}