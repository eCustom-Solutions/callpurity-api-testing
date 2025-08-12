import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { isValidDIDNumber } from '../../../sdk/utils/validators.js';
import type { NumberEntry } from '../core/types.js';

export async function loadCsv(csvPath: string): Promise<NumberEntry[]> {
  const absPath = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  let content: string;
  try {
    content = await fs.readFile(absPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read CSV file at ${absPath}: ${err}`);
  }
  let records: any[];
  try {
    records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw new Error(`Failed to parse CSV: ${err}`);
  }
  const seen = new Set<string>();
  const result: NumberEntry[] = [];
  for (const row of records) {
    const rawNumber = (row.number || row['Phone Number'] || '').toString().trim();
    const normalized = normalizeToDidNumber(rawNumber);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const brandedName = (row.branded_name || row['Branded Name'] || row.brandedName || '').toString().trim() || undefined;
    result.push({ number: normalized, brandedName });
  }
  return result;
}

function normalizeToDidNumber(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (!isValidDIDNumber(ten)) return null;
  return ten;
}


