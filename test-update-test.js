/**
 * Test script for updating a test case
 */

import { updateTestCase, getTestCaseById } from './lib/db-test-cases.js';

console.log('🧪 Testing Update Test Case API\n');

const testCaseId = 3;
const userId = 2; // Your user ID

try {
  // First, get the current test case
  console.log('1️⃣ Fetching current test case...');
  const before = await getTestCaseById(testCaseId);
  console.log(`   Current title: "${before.title}"`);
  console.log(`   Current priority: ${before.priority}`);
  console.log(`   Current version: ${before.version}\n`);

  // Update the test case
  console.log('2️⃣ Updating test case...');
  const updates = {
    title: 'Updated Test Case Title',
    priority: 'High',
    description: 'This is an updated description',
    status: 'Ready'
  };

  const updated = await updateTestCase(testCaseId, userId, updates);

  if (updated) {
    console.log('   ✅ Update successful!');
    console.log(`   New title: "${updated.title}"`);
    console.log(`   New priority: ${updated.priority}`);
    console.log(`   New status: ${updated.status}`);
    console.log(`   New version: ${updated.version}`);
    console.log(`   Updated by: ${updated.updated_by}\n`);

    // Verify the update
    console.log('3️⃣ Verifying update...');
    const after = await getTestCaseById(testCaseId);

    if (after.title === updates.title && after.priority === updates.priority) {
      console.log('   ✅ Update verified in database!\n');
    } else {
      console.log('   ❌ Update verification failed\n');
    }
  } else {
    console.log('   ❌ Update failed - no result returned\n');
  }

} catch (error) {
  console.error('❌ Error during update test:');
  console.error(error);
}

process.exit(0);
