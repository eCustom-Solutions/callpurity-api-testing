import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { normalizeToDidNumber } from '../utils/normalize.js';
import type { NumberEntry } from '../core/types.js';

export async function loadCsv(csvPath: string): Promise<NumberEntry[]> {
  const absPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  let content: string;
  try {
    content = await fs.readFile(absPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read CSV file at ${absPath}: ${err}`);
  }
  
  console.log(`🔍 CSV Loader Debug: File size: ${content.length} characters`);
  console.log(`🔍 CSV Loader Debug: File path: ${absPath}`);
  
  let records: any[];
  try {
    records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err}`);
  }
  
  console.log(`🔍 CSV Loader Debug: Found ${records.length} raw records`);
  console.log(`🔍 CSV Loader Debug: First record: ${JSON.stringify(records[0])}`);
  console.log(`🔍 CSV Loader Debug: Last record: ${JSON.stringify(records[records.length - 1])}`);
  
  const seen = new Set<string>();
  const result: NumberEntry[] = [];
  let skippedCount = 0;
  let duplicateCount = 0;
  
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rawNumber = (row.number || row['Phone Number'] || '').toString().trim();
    const normalized = normalizeToDidNumber(rawNumber);
    
    if (i < 5 || i > records.length - 5) {
      console.log(`🔍 CSV Loader Debug: Row ${i}: raw="${rawNumber}" -> normalized="${normalized}"`);
    }
    
    if (!normalized) {
      skippedCount++;
      continue;
    }
    if (seen.has(normalized)) {
      duplicateCount++;
      continue;
    }
    seen.add(normalized);
    const brandedName = (row.branded_name || row['Branded Name'] || row.brandedName || '').toString().trim() || undefined;
    result.push({ number: normalized, brandedName });
  }
  
  console.log(`🔍 CSV Loader Debug: Processed ${result.length} valid numbers`);
  console.log(`🔍 CSV Loader Debug: Skipped ${skippedCount} invalid numbers`);
  console.log(`🔍 CSV Loader Debug: Skipped ${duplicateCount} duplicate numbers`);
  
  return result;
}


