#!/usr/bin/env ts-node
import fs from 'fs/promises';
import path from 'path';

function parseArgs(argv: string[]) {
  const options: { src?: string; dst?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--src') options.src = argv[++i];
    else if (arg === '--dst') options.dst = argv[++i];
  }
  return options;
}

async function readCsvNumbers(filePath: string): Promise<Set<string>> {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const text = await fs.readFile(abs, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return new Set();
  const header = lines[0].toLowerCase();
  let idx = 0;
  // Determine column index
  const columns = lines[0].split(',');
  if (header.includes('phone number')) {
    idx = columns.findIndex(c => c.trim().toLowerCase().includes('phone number'));
  } else if (header.includes('number')) {
    idx = columns.findIndex(c => c.trim().toLowerCase() === 'number');
  } else {
    idx = 0;
  }
  const out = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const raw = (cols[idx] || '').toString();
    const norm = normalizeToDid(raw);
    if (norm) out.add(norm);
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function normalizeToDid(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return /^[2-9]\d{9}$/.test(ten) ? ten : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.src || !args.dst) {
    console.error('Usage: compare-csv --src <source.csv> --dst <export.csv>');
    process.exit(1);
  }
  const [srcSet, dstSet] = await Promise.all([
    readCsvNumbers(args.src),
    readCsvNumbers(args.dst),
  ]);

  const toAdd: string[] = [];
  const toDelete: string[] = [];

  for (const n of srcSet) if (!dstSet.has(n)) toAdd.push(n);
  for (const n of dstSet) if (!srcSet.has(n)) toDelete.push(n);

  console.log('--- CSV Comparison ---');
  console.log(`Source count: ${srcSet.size}`);
  console.log(`Export count: ${dstSet.size}`);
  console.log(`To Add (in source, not in export): ${toAdd.length}`);
  console.log(`To Delete (in export, not in source): ${toDelete.length}`);
  if (toAdd.length) console.log('Sample toAdd:', toAdd.slice(0, 10));
  if (toDelete.length) console.log('Sample toDelete:', toDelete.slice(0, 10));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


