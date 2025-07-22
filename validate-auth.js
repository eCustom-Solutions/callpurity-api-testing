#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple .env parser
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

async function validateAuth() {
  try {
    // Load environment variables from sdk/.env
    const envPath = join(__dirname, 'sdk', '.env');
    const env = parseEnvFile(envPath);
    
    // Get environment variables
    const email = env.EMAIL || process.env.EMAIL;
    const password = env.PASSWORD || process.env.PASSWORD;
    const apiBaseUrl = env.API_BASE_URL || process.env.API_BASE_URL || 'https://api.callpurity.com/latest';

    // Validate required environment variables
    if (!email || !password) {
      console.error('❌ Missing required environment variables:');
      console.error('   EMAIL and PASSWORD must be set in sdk/.env file');
      process.exit(1);
    }

    // Log the resolved API endpoint
    console.log('🔗 API Endpoint:', apiBaseUrl);
    console.log('📧 Email:', email);
    console.log('🔐 Attempting login...\n');

    // Import the SDK dynamically from the compiled dist directory
    const { CallPuritySDK } = await import('./sdk/dist/client.js');

    // Attempt login
    const authResponse = await CallPuritySDK.auth.login(email, password);

    // Log success
    console.log('✅ Login successful!');
    console.log('🎫 Access Token:', authResponse.access_token.substring(0, 20) + '...');
    console.log('🔄 Refresh Token:', authResponse.refresh_token.substring(0, 20) + '...');
    console.log('⏰ Expires In:', authResponse.expires_in, 'seconds');
    console.log('📅 Expires At:', new Date(authResponse.expires_at * 1000).toISOString());

    console.log('\n🎉 Authentication validation completed successfully!');

  } catch (error) {
    console.error('\n❌ Authentication failed:');
    
    // Handle API errors with structured error information
    if (error.status && error.message) {
      console.error('   HTTP Status:', error.status);
      console.error('   Error Message:', error.message);
      if (error.code) {
        console.error('   Error Code:', error.code);
      }
    } else {
      // Handle other types of errors (network, etc.)
      console.error('   Error:', error.message || error);
    }

    console.error('\n🔧 Troubleshooting tips:');
    console.error('   - Verify EMAIL and PASSWORD in sdk/.env file');
    console.error('   - Check API_BASE_URL is correct');
    console.error('   - Ensure network connectivity');
    console.error('   - Verify API endpoint is accessible');

    process.exit(1);
  }
}

// Run the validation
validateAuth(); 