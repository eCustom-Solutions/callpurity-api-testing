import fs from 'fs/promises';
import path from 'path';
import type { ReconcileResult } from '../core/types.js';

export async function writeJson(diff: ReconcileResult, outputPath: string): Promise<void> {
  const abs = path.isAbsolute(outputPath) ? outputPath : path.resolve(process.cwd(), outputPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const body = JSON.stringify(diff, null, 2);
  await fs.writeFile(abs, body, 'utf8');
  console.log(`Saved JSON diff to: ${abs}`);
}

