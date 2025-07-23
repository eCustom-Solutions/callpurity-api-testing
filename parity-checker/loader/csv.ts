import fs from 'fs/promises';

export interface CsvRow {
  number: string;
  brandedName?: string;
}

export async function loadCsv(path: string): Promise<CsvRow[]> {
  // Placeholder: just return an empty array for now
  return [];
} 