#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CallPurityOrchestrator {
  constructor() {
    this.emailIngestorDir = join(__dirname, 'email-ingestor');
    this.parityCheckerDir = join(__dirname, 'parity-checker');
    this.sdkDir = join(__dirname, 'sdk');
  }

  async runCommand(cmd, args, cwd, description) {
    console.log(`\n🔄 ${description}...`);
    console.log(`Running: ${cmd} ${args.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      const childProcess = spawn(cmd, args, { 
        cwd, 
        stdio: 'inherit', 
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      
      childProcess.on('exit', (code) => {
        if (code === 0) {
          console.log(`✅ ${description} completed successfully`);
          resolve();
        } else {
          console.error(`❌ ${description} failed with exit code ${code}`);
          reject(new Error(`${cmd} exited with code ${code}`));
        }
      });
      
      childProcess.on('error', (err) => {
        console.error(`❌ ${description} error:`, err.message);
        reject(err);
      });
    });
  }

  async fetchLatestEmail() {
    console.log('\n📧 STEP 1: Fetching latest email and staging CSV...');
    await this.runCommand('npm', ['run', 'fetch'], this.emailIngestorDir, 'Email fetch and CSV staging');
  }

  async runParityDry() {
    console.log('\n🔍 STEP 2: Running parity checker dry-run...');
    await this.runCommand('npm', ['run', 'sync:dry'], this.parityCheckerDir, 'Parity checker dry-run');
  }

  async runParityApply(maxAdd = 2000, maxDelete = 2000) {
    console.log('\n🚀 STEP 3: Applying changes to API...');
    const args = [
      'run', 'sync:apply', '--', 
      '--yes', 
      '--max-add', maxAdd.toString(),
      '--max-delete', maxDelete.toString()
    ];
    await this.runCommand('npm', args, this.parityCheckerDir, 'Parity checker apply');
  }

  async exportCurrentState() {
    console.log('\n📊 STEP 4: Exporting current API state...');
    await this.runCommand('npm', ['run', 'export:dids'], this.parityCheckerDir, 'API state export');
  }

  async runCompleteWorkflow(options = {}) {
    const { 
      dryRunOnly = false, 
      maxAdd = 2000, 
      maxDelete = 2000,
      exportState = true 
    } = options;

    try {
      console.log('🎯 Starting CallPurity Orchestration Workflow');
      console.log('=' .repeat(50));

      // Step 1: Fetch latest email
      await this.fetchLatestEmail();

      if (dryRunOnly) {
        // Step 2: Dry-run only
        await this.runParityDry();
        console.log('\n✅ Workflow completed (dry-run only)');
        return;
      }

      // Step 2: Dry-run first
      await this.runParityDry();

      // Step 3: Apply changes
      await this.runParityApply(maxAdd, maxDelete);

      // Step 4: Export final state
      if (exportState) {
        await this.exportCurrentState();
      }

      console.log('\n🎉 Complete workflow finished successfully!');
      console.log('=' .repeat(50));

    } catch (error) {
      console.error('\n💥 Workflow failed:', error.message);
      process.exit(1);
    }
  }

  async showStatus() {
    console.log('\n📋 CallPurity Orchestrator Status');
    console.log('=' .repeat(40));
    
    try {
      // Check email-ingestor
      const emailPkg = JSON.parse(await fs.readFile(join(this.emailIngestorDir, 'package.json'), 'utf8'));
      console.log(`📧 Email Ingestor: v${emailPkg.version}`);
      
      // Check parity-checker
      const parityPkg = JSON.parse(await fs.readFile(join(this.parityCheckerDir, 'package.json'), 'utf8'));
      console.log(`🔍 Parity Checker: v${parityPkg.version}`);
      
      // Check SDK
      const sdkPkg = JSON.parse(await fs.readFile(join(this.sdkDir, 'package.json'), 'utf8'));
      console.log(`🛠️  SDK: v${sdkPkg.version}`);
      
    } catch (error) {
      console.log('⚠️  Could not read package versions');
    }
  }
}

// CLI interface
async function main() {
  const orchestrator = new CallPurityOrchestrator();
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'fetch':
      await orchestrator.fetchLatestEmail();
      break;
      
    case 'dry':
      await orchestrator.fetchLatestEmail();
      await orchestrator.runParityDry();
      break;
      
    case 'weekly':
      await orchestrator.runCompleteWorkflow({ 
        dryRunOnly: false, 
        maxAdd: 2000, 
        maxDelete: 2000 
      });
      break;
      
    case 'status':
      await orchestrator.showStatus();
      break;
      
    case 'help':
    default:
      console.log(`
🎯 CallPurity Orchestrator

Usage: node orchestrator.js <command>

Commands:
  fetch     - Fetch latest email and stage CSV
  dry       - Fetch + run parity checker dry-run
  weekly    - Complete workflow: fetch + dry-run + apply + export
  status    - Show orchestrator and module status
  help      - Show this help message

Examples:
  node orchestrator.js fetch     # Just fetch email
  node orchestrator.js dry       # Fetch + see what would change
  node orchestrator.js weekly    # Complete automation workflow
      `);
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CallPurityOrchestrator };
