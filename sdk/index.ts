import { CallPuritySDK } from './client.js';

async function main() {
  try {
    // Login with environment credentials
    await CallPuritySDK.auth.login(process.env.EMAIL!, process.env.PASSWORD!);
    console.log('Login successful');
    
    // List accounts
    const accounts = await CallPuritySDK.accounts.list();
    console.log('Accounts:', accounts);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
