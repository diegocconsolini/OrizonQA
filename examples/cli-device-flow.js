#!/usr/bin/env node

/**
 * CLI Device Flow Authentication Example
 *
 * This script demonstrates how to authenticate with ORIZON QA
 * using GitHub Device Flow from a CLI tool.
 *
 * Usage:
 *   node examples/cli-device-flow.js
 *
 * Flow:
 * 1. Request device code from API
 * 2. Display user_code and verification URL to user
 * 3. Poll API until user completes authorization
 * 4. Receive user session and access token
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3033';

async function authenticateDeviceFlow() {
  console.log('🔐 Starting GitHub Device Flow authentication...\n');

  try {
    // Step 1: Initiate device flow
    console.log('⏳ Requesting device code...');
    const initiateResponse = await fetch(`${API_BASE}/api/auth/device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initiate' }),
    });

    const initiateData = await initiateResponse.json();

    if (initiateData.error) {
      console.error('❌ Error:', initiateData.error);
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      expires_in,
      interval,
    } = initiateData;

    // Step 2: Display instructions to user
    console.log('\n📋 Please complete the following steps:\n');
    console.log(`   1. Visit: ${verification_uri}`);
    console.log(`   2. Enter code: ${user_code}\n`);
    console.log(`⏱  Code expires in ${expires_in} seconds\n`);
    console.log('⏳ Waiting for authorization...\n');

    // Step 3: Poll for completion
    let pollInterval = (interval || 5) * 1000; // Convert to milliseconds
    let attempts = 0;
    const maxAttempts = Math.floor(expires_in / (interval || 5));

    while (attempts < maxAttempts) {
      await sleep(pollInterval);
      attempts++;

      const pollResponse = await fetch(`${API_BASE}/api/auth/device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'poll', device_code }),
      });

      const pollData = await pollResponse.json();

      if (pollData.status === 'pending') {
        process.stdout.write('.');
        continue;
      }

      if (pollData.status === 'slow_down') {
        pollInterval += 5000; // Increase interval by 5 seconds
        process.stdout.write('⏸');
        continue;
      }

      if (pollData.error) {
        console.error(`\n❌ Error: ${pollData.error}`);
        process.exit(1);
      }

      if (pollData.status === 'success') {
        console.log('\n\n✅ Authentication successful!\n');
        console.log('👤 User Info:');
        console.log(`   Name: ${pollData.user.name}`);
        console.log(`   Email: ${pollData.user.email}`);
        console.log(`   ID: ${pollData.user.id}\n`);

        // Save session or access token
        // In a real CLI, you would save this to a config file
        console.log('🔑 Session created');
        console.log('   You can now make authenticated API requests\n');

        return pollData.user;
      }
    }

    console.log('\n❌ Authentication timed out. Please try again.');
    process.exit(1);
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the authentication flow
if (require.main === module) {
  authenticateDeviceFlow()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { authenticateDeviceFlow };
