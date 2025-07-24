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

// TEMPORARY TEST: Run this file directly to test reconciliation logic
if (import.meta.url === `file://${process.argv[1]}`) {
  // Test case 1: Basic reconciliation
  const sourceList = [
    { number: '1234567890', brandedName: 'Test DID 1' },
    { number: '0987654321', brandedName: 'Test DID 2' },
    { number: '5555555555', brandedName: 'Test DID 3' }
  ];
  
  const apiList = [
    { number: '1234567890', brandedName: 'Test DID 1' }, // Same
    { number: '0987654321', brandedName: 'Different Name' }, // Mismatched
    { number: '1111111111', brandedName: 'API Only DID' } // API only
  ];
  
  const result = reconcile(sourceList, apiList);
  
  console.log('--- Reconciliation Test ---');
  console.log('Source list:', sourceList.length, 'items');
  console.log('API list:', apiList.length, 'items');
  console.log('To Add:', result.toAdd.length, 'items');
  console.log('To Delete:', result.toDelete.length, 'items');
  console.log('Mismatched:', result.mismatched.length, 'items');
  console.log('\nDetailed Results:');
  console.log('To Add:', result.toAdd);
  console.log('To Delete:', result.toDelete);
  console.log('Mismatched:', result.mismatched);
} 