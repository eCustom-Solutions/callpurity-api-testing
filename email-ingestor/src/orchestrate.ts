import { spawn } from 'child_process';
import path from 'path';

const PARITY_ROOT = process.env.PARITY_ROOT || path.resolve(process.cwd(), '../parity-checker');

export async function runParityDry(csvPath: string): Promise<void> {
  await runCmd('npm', ['run', 'sync:dry', '--', '--csv', csvPath], { cwd: PARITY_ROOT });
}

export async function runParityApply(csvPath: string): Promise<void> {
  await runCmd('npm', ['run', 'sync:apply', '--', '--csv', csvPath, '--yes', '--max-add', '2000', '--max-delete', '2000'], { cwd: PARITY_ROOT });
}

async function runCmd(cmd: string, args: string[], opts: { cwd: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, stdio: 'inherit', env: process.env as any });
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
    p.on('error', reject);
  });
}


