export interface ReconcileResult {
  toAdd: any[];
  toDelete: any[];
  mismatched: any[];
}

export function reconcile(sourceList: any[], apiList: any[]): ReconcileResult {
  // Create maps for O(1) lookups
  const sourceMap = new Map<string, string | undefined>();
  const apiMap = new Map<string, string | undefined>();
  
  // Build source map
  for (const item of sourceList) {
    sourceMap.set(item.number, item.brandedName);
  }
  
  // Build API map
  for (const item of apiList) {
    apiMap.set(item.number, item.brandedName);
  }
  
  const toAdd: any[] = [];
  const toDelete: any[] = [];
  const mismatched: any[] = [];
  
  // Find numbers to add (in source but not in API)
  for (const [number, brandedName] of sourceMap) {
    if (!apiMap.has(number)) {
      toAdd.push({ number, brandedName });
    }
  }
  
  // Find numbers to delete (in API but not in source)
  for (const [number, brandedName] of apiMap) {
    if (!sourceMap.has(number)) {
      toDelete.push({ number, brandedName });
    }
  }
  
  // Find mismatched branded names (in both but different)
  for (const [number, sourceBrandedName] of sourceMap) {
    if (apiMap.has(number)) {
      const apiBrandedName = apiMap.get(number);
      if (sourceBrandedName !== apiBrandedName) {
        mismatched.push({
          number,
          sourceBrandedName,
          apiBrandedName
        });
      }
    }
  }
  
  return { toAdd, toDelete, mismatched };
} 