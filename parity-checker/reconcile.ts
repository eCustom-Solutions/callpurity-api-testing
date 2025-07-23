export interface ReconcileResult {
  toAdd: any[];
  toDelete: any[];
  mismatched: any[];
}

export function reconcile(sourceList: any[], apiList: any[]): ReconcileResult {
  // Placeholder: return empty arrays
  return { toAdd: [], toDelete: [], mismatched: [] };
} 