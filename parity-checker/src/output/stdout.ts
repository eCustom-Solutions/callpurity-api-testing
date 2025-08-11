import type { ReconcileResult } from '../core/types.js';

export function writeStdout(diff: ReconcileResult): void {
  console.log('--- Parity Check Report (Dry Run) ---');
  console.log(`To Add:      ${diff.toAdd.length}`);
  console.log(`To Delete:   ${diff.toDelete.length}`);
  console.log(`Mismatched:  ${diff.mismatched.length}`);

  if (diff.toAdd.length > 0) {
    console.log('\nSample To Add:');
    console.table(diff.toAdd.slice(0, 5));
    if (diff.toAdd.length > 5) console.log(`...and ${diff.toAdd.length - 5} more`);
  }
  if (diff.toDelete.length > 0) {
    console.log('\nSample To Delete:');
    console.table(diff.toDelete.slice(0, 5));
    if (diff.toDelete.length > 5) console.log(`...and ${diff.toDelete.length - 5} more`);
  }
  if (diff.mismatched.length > 0) {
    console.log('\nSample Mismatched:');
    console.table(diff.mismatched.slice(0, 5));
    if (diff.mismatched.length > 5) console.log(`...and ${diff.mismatched.length - 5} more`);
  }
}


