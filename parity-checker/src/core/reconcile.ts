import { NumberEntry, ReconcileResult } from '../core/types.js';

export function reconcile(sourceList: NumberEntry[], apiList: NumberEntry[]): ReconcileResult {
  const sourceMap = new Map<string, string | undefined>();
  const apiMap = new Map<string, string | undefined>();

  for (const item of sourceList) {
    sourceMap.set(item.number, item.brandedName);
  }

  for (const item of apiList) {
    apiMap.set(item.number, item.brandedName);
  }

  const toAdd: NumberEntry[] = [];
  const toDelete: NumberEntry[] = [];
  const mismatched: ReconcileResult['mismatched'] = [];

  for (const [number, brandedName] of sourceMap) {
    if (!apiMap.has(number)) {
      toAdd.push({ number, brandedName });
    }
  }

  for (const [number, brandedName] of apiMap) {
    if (!sourceMap.has(number)) {
      toDelete.push({ number, brandedName });
    }
  }

  for (const [number, sourceBrandedName] of sourceMap) {
    if (apiMap.has(number)) {
      const apiBrandedName = apiMap.get(number);
      if (sourceBrandedName !== apiBrandedName) {
        mismatched.push({ number, sourceBrandedName, apiBrandedName });
      }
    }
  }

  return { toAdd, toDelete, mismatched };
}


