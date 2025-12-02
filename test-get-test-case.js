/**
 * Test script to debug getTestCaseById
 */

import { getTestCaseById } from './lib/db-test-cases.js';

console.log('Testing getTestCaseById for test case #3...\n');

try {
  const testCase = await getTestCaseById(3);

  if (testCase) {
    console.log('✅ Successfully fetched test case:');
    console.log(JSON.stringify(testCase, null, 2));
  } else {
    console.log('❌ Test case not found');
  }
} catch (error) {
  console.error('❌ Error fetching test case:');
  console.error(error);
}

process.exit(0);
