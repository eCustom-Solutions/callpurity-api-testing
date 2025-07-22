#!/usr/bin/env node

import dotenv from 'dotenv';
import { CallPuritySDK } from '../client.js';

// Load environment variables
dotenv.config();

interface DiscoveredIds {
  accountId: string;
  accountName: string;
  organizations: Array<{
    organizationId: string;
    organizationName: string;
  }>;
}

async function bootstrapDiscovery() {
  try {
    // Get environment variables
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const apiBaseUrl = process.env.API_BASE_URL || 'https://api.callpurity.com/latest';

    // Validate required environment variables
    if (!email || !password) {
      console.error('❌ Missing required environment variables:');
      console.error('   EMAIL and PASSWORD must be set in .env file');
      process.exit(1);
    }

    console.log('🔗 API Endpoint:', apiBaseUrl);
    console.log('📧 Email:', email);
    console.log('🔍 Starting account and organization discovery...\n');

    // Step 1: Authenticate
    console.log('🔐 Authenticating...');
    const authResponse = await CallPuritySDK.auth.login(email, password);
    console.log('✅ Authentication successful\n');

    // Step 2: List all accounts
    console.log('📊 Discovering accounts...');
    const accountsResponse = await CallPuritySDK.accounts.list();
    
    console.log('📄 Full API Response:');
    console.log(JSON.stringify(accountsResponse, null, 2));
    console.log();
    
    // Handle the new API response format
    const accounts = accountsResponse;
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No accounts found');
      console.log('💡 This could mean:');
      console.log('   - No accounts exist in this environment');
      console.log('   - Your account doesn\'t have access to any accounts');
      console.log('   - The API is in a sandbox/test state');
      process.exit(0);
    }

    console.log(`✅ Found ${accounts.length} account(s):`);
    accounts.forEach((account: any) => {
      console.log(`   - ${account.account_name} (ID: ${account.account_id})`);
    });
    console.log();

    // Step 3: Discover organizations for each account
    const discoveredIds: DiscoveredIds[] = [];

    for (const account of accounts) {
      const accountName = account.account_name;
      const accountId = account.account_id;
      
      console.log(`🏢 Discovering organizations for account: ${accountName} (${accountId})`);
      
      const accountData: DiscoveredIds = {
        accountId: accountId,
        accountName: accountName,
        organizations: []
      };

      try {
        // Check if there are existing organizations in the account response
        if (account.organizations && account.organizations.length > 0) {
          console.log(`   ✅ Found ${account.organizations.length} existing organization(s):`);
          account.organizations.forEach((org: any) => {
            console.log(`      - ${org.name || org.organization_name} (${org.id || org.organization_id})`);
            accountData.organizations.push({
              organizationId: org.id || org.organization_id,
              organizationName: org.name || org.organization_name
            });
          });
        } else {
          console.log(`   📝 No existing organizations found. Creating test organization...`);
          
          // Create a test organization
          const testOrgPayload = {
            business_info: {
              legal_company_name: "Test Organization LLC",
              dba: "Test Org",
              ein: "123456789",
              business_phone_number: "5551234567",
              employee_count: 10,
              website: "https://testorg.example.com",
              quantity_of_phone_numbers: 5,
              address: "123 Test Street",
              city: "Test City",
              state: "CA",
              zip_code: "90210"
            },
            contact_info: {
              first_name: "Test",
              last_name: "User",
              email: "test@example.com",
              phone: "5559876543"
            },
            calling_behavior: {
              telecom_provider: "Test Provider",
              own_dids: false,
              dialing_opt_in_data: true,
              using_opt_in_data_provider: false,
              tcpa_dnc_violation: null,
              calls_per_day: 100,
              max_redial_attempts_daily_per_lead: 3,
              max_redial_attempts_weekly_per_lead: 5
            }
          };
          
          try {
            const newOrg = await CallPuritySDK.organizations.create(accountId, testOrgPayload);
            console.log(`   ✅ Created test organization with ID: ${newOrg.organization_id}`);
            
            accountData.organizations.push({
              organizationId: newOrg.organization_id,
              organizationName: "Test Organization LLC" // Use the name from our payload
            });
          } catch (createError: any) {
            console.log(`   ❌ Failed to create organization: ${createError.message}`);
            if (createError.status) {
              console.log(`   HTTP Status: ${createError.status}`);
            }
            console.log(`   💡 You may need to create organizations manually through the API or web interface`);
            console.log(`   🔧 For integration tests, you can use a known organization ID or skip organization tests`);
          }
        }
        
        discoveredIds.push(accountData);
        
      } catch (error: any) {
        console.log(`   ❌ Error with organizations: ${error.message}`);
        if (error.status) {
          console.log(`   HTTP Status: ${error.status}`);
        }
        // Still add the account even if org operations fail
        discoveredIds.push(accountData);
      }
    }

    // Step 4: Print results in .env format
    console.log('\n📋 Discovered IDs for .env configuration:');
    console.log('=' .repeat(50));
    
    if (discoveredIds.length > 0) {
      // Use the first account as the default test account
      const firstAccount = discoveredIds[0];
      console.log(`TEST_ACCOUNT_ID=${firstAccount.accountId}`);
      console.log(`# Account: ${firstAccount.accountName}`);
      
      if (firstAccount.organizations.length > 0) {
        // Use the first organization as the default test org
        const firstOrg = firstAccount.organizations[0];
        console.log(`TEST_ORG_ID=${firstOrg.organizationId}`);
        console.log(`# Organization: ${firstOrg.organizationName}`);
      } else {
        console.log('# TEST_ORG_ID=<manual-discovery-required>');
        console.log('# Note: Organization discovery not implemented');
      }
      
      console.log();
      console.log('# All discovered accounts:');
      discoveredIds.forEach(account => {
        console.log(`# - ${account.accountName} (${account.accountId})`);
        if (account.organizations.length > 0) {
          account.organizations.forEach(org => {
            console.log(`#   └─ ${org.organizationName} (${org.organizationId})`);
          });
        } else {
          console.log(`#   └─ <no organizations discovered>`);
        }
      });
    }

    console.log('\n🎉 Discovery completed successfully!');
    console.log('💡 Copy the TEST_ACCOUNT_ID and TEST_ORG_ID values above to your .env file');

  } catch (error: any) {
    console.error('\n❌ Discovery failed:');
    
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
    console.error('   - Verify EMAIL and PASSWORD in .env file');
    console.error('   - Check API_BASE_URL is correct');
    console.error('   - Ensure network connectivity');
    console.error('   - Verify API endpoint is accessible');
    console.error('   - Check if your account has access to the accounts list');

    process.exit(1);
  }
}

// Run the discovery
bootstrapDiscovery(); 