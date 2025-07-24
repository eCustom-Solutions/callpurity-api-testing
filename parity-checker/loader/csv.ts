import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { isValidPhoneNumber } from '../../sdk/utils/validators.js';

export interface CsvRow {
  number: string;
  brandedName?: string;
}

export async function loadCsv(csvPath: string): Promise<CsvRow[]> {
  const absPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  let content: string;
  try {
    content = await fs.readFile(absPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read CSV file at ${absPath}: ${err}`);
  }
  let records: any[];
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err}`);
  }
  const result: CsvRow[] = [];
  for (const row of records) {
    // Map 'Phone Number' to 'number' for sample/live CSVs
    const rawNumber = (row.number || row['Phone Number'] || '').toString().trim();
    if (!isValidPhoneNumber(rawNumber)) {
      continue;
    }
    result.push({ number: rawNumber });
  }
  return result;
}

// TEMPORARY TEST: Run this file directly to test CSV loading
if (import.meta.url === `file://${process.argv[1]}`) {
  loadCsv('./sample_numbers.csv').then(rows => {
    console.log(`Loaded ${rows.length} valid rows:`);
    console.dir(rows.slice(0, 5), { depth: null });
  }).catch(err => {
    console.error('Error loading CSV:', err);
  });
} 