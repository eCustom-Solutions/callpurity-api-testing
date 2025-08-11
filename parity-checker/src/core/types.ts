export interface NumberEntry {
  number: string;
  brandedName?: string;
}

export interface ReconcileMismatchEntry {
  number: string;
  sourceBrandedName?: string;
  apiBrandedName?: string;
}

export interface ReconcileResult {
  toAdd: NumberEntry[];
  toDelete: NumberEntry[];
  mismatched: ReconcileMismatchEntry[];
}

export interface CliOptions {
  csvPath: string;
  jsonPath?: string;
  accountId?: string;
  orgId?: string;
}


