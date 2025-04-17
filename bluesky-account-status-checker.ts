import { BskyAgent } from "@atproto/api";
import * as fs from "fs";

// Types
interface Account {
  username: string;
  password: string;
}

interface AccountStatus {
  username: string;
  did?: string;
  active: boolean;
  banned: boolean;
  spamLabeled: boolean;
  error?: string;
  labels?: string[];
}

// Configuration
const ACCOUNTS_FILE = "accounts.json";
const OUTPUT_FILE = "account_status_report.json";
const BATCH_DELAY = 2000; // 2 seconds between batches to avoid rate limits

// Main function
async function main() {
  console.log("=== Bluesky Account Status Checker ===");
  
  // Load accounts from JSON file
  let accounts: Account[] = [];
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    accounts = JSON.parse(data);
    console.log(`Loaded ${accounts.length} accounts from ${ACCOUNTS_FILE}`);
  } catch (error) {
    console.error(`Error loading accounts from ${ACCOUNTS_FILE}:`, error);
    process.exit(1);
  }
  
  // Create agent for API calls
  const agent = new BskyAgent({ service: "https://bsky.social" });
  
  // Process accounts
  const results: AccountStatus[] = [];
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    console.log(`\nChecking account ${i + 1}/${accounts.length}: ${account.username}`);
    
    const status: AccountStatus = {
      username: account.username,
      active: false,
      banned: false,
      spamLabeled: false
    };
    
    try {
      // Try to login
      const loginResponse = await agent.login({
        identifier: account.username,
        password: account.password
      });
      
      // If login successful, account is active
      status.active = true;
      status.did = loginResponse.data.did;
      
      // Check for labels on the account
      const profileResponse = await agent.getProfile({ actor: status.did });
      
      // Check if account has labels
      if (profileResponse.data.labels && profileResponse.data.labels.length > 0) {
        status.labels = profileResponse.data.labels.map(label => label.val);
        
        // Check if any label is spam
        if (status.labels.includes('spam')) {
          status.spamLabeled = true;
        }
      }
      
      // Log out
      await agent.logout();
      
    } catch (error: any) {
      // Check if error is related to banned account
      if (error.status === 401 && error.error === 'AuthenticationRequired') {
        status.banned = true;
        status.error = "Authentication failed - account may be banned";
      } else {
        status.error = `Error: ${error.message || JSON.stringify(error)}`;
      }
    }
    
    // Add to results
    results.push(status);
    
    // Show interim status
    console.log(`Status for ${account.username}:`);
    console.log(`- Active: ${status.active}`);
    console.log(`- Banned: ${status.banned}`);
    console.log(`- Spam labeled: ${status.spamLabeled}`);
    if (status.error) {
      console.log(`- Error: ${status.error}`);
    }
    
    // Add delay between account checks to avoid rate limits
    if (i < accounts.length - 1) {
      console.log(`Waiting ${BATCH_DELAY/1000} seconds before next account...`);
      await delay(BATCH_DELAY);
    }
  }
  
  // Create summary
  const summary = {
    totalAccounts: accounts.length,
    activeAccounts: results.filter(r => r.active).length,
    bannedAccounts: results.filter(r => r.banned).length,
    spamLabeledAccounts: results.filter(r => r.spamLabeled).length,
    accountsWithErrors: results.filter(r => r.error).length,
    checkedAt: new Date().toISOString(),
    accounts: results
  };
  
  // Save results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));
  console.log(`\nAccount status report saved to ${OUTPUT_FILE}`);
  
  // Print summary
  console.log("\n=== Summary ===");
  console.log(`Total accounts checked: ${summary.totalAccounts}`);
  console.log(`Active accounts: ${summary.activeAccounts}`);
  console.log(`Banned accounts: ${summary.bannedAccounts}`);
  console.log(`Spam labeled accounts: ${summary.spamLabeledAccounts}`);
  console.log(`Accounts with errors: ${summary.accountsWithErrors}`);
}

// Helper function for delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});