import { ReconcileResult } from '../reconcile.js';

export function writeStdout(diff: ReconcileResult) {
  // Placeholder: just print the keys and counts
  console.log('--- Parity Check Report (Dry Run) ---');
  console.log('To Add:', diff.toAdd.length);
  console.log('To Delete:', diff.toDelete.length);
  console.log('Mismatched:', diff.mismatched.length);
} 