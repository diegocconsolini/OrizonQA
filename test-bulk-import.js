/**
 * Test script for bulk importing AI-generated test cases
 */

import { parseAITestCases } from './lib/ai-test-parser.js';

console.log('🧪 Testing Bulk Import API\n');

// Sample AI-generated test cases (from test-ai-parser.js)
const sampleTestCases = `
## Test Case 1: User Login with Valid Credentials

**Description:** Verify that a user can successfully log in with valid username and password.

**Preconditions:** User account exists in the system

**Steps:**
1. Navigate to login page
2. Enter valid username "testuser@example.com"
3. Enter valid password "Password123"
4. Click the "Login" button

**Expected Result:** User should be redirected to the dashboard and see welcome message

**Priority:** High
**Type:** Functional

## Test Case 2: Password Reset Flow

**Description:** Test the complete password reset workflow

**Steps:**
1. Click "Forgot Password" link
2. Enter registered email address
3. Submit the form → Email should be sent
4. Click reset link in email → Should open reset password page
5. Enter new password
6. Confirm new password
7. Submit form

**Expected Result:** Password should be updated and user can login with new password

**Priority:** Critical
**Type:** Integration
`;

try {
  // Parse the test cases
  console.log('1️⃣ Parsing AI-generated test cases...');
  const parsedTests = parseAITestCases(sampleTestCases);
  console.log(`   ✅ Parsed ${parsedTests.length} test cases\n`);

  parsedTests.forEach((test, idx) => {
    console.log(`   Test ${idx + 1}:`);
    console.log(`     - Title: ${test.title}`);
    console.log(`     - Priority: ${test.priority}`);
    console.log(`     - Type: ${test.type}`);
    console.log(`     - Steps: ${test.steps.length}`);
  });

  // Now test the API endpoint
  console.log('\n2️⃣ Testing bulk import API endpoint...');
  console.log('   Making POST request to /api/projects/2/tests/bulk-import');

  const response = await fetch('http://localhost:3033/api/projects/2/tests/bulk-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tests: parsedTests
    })
  });

  const data = await response.json();

  if (response.ok) {
    console.log(`   ✅ Bulk import successful!`);
    console.log(`   Total: ${data.results.total}`);
    console.log(`   Success: ${data.results.success.length}`);
    console.log(`   Failed: ${data.results.failed.length}\n`);

    if (data.results.success.length > 0) {
      console.log('   Imported test cases:');
      data.results.success.forEach((test, idx) => {
        console.log(`     ${idx + 1}. ${test.key}: ${test.title}`);
      });
    }

    if (data.results.failed.length > 0) {
      console.log('\n   Failed imports:');
      data.results.failed.forEach((fail, idx) => {
        console.log(`     ${idx + 1}. ${fail.title}: ${fail.error}`);
      });
    }
  } else {
    console.log(`   ❌ Bulk import failed: ${data.error}`);
  }

} catch (error) {
  console.error('❌ Error during bulk import test:');
  console.error(error.message);
}

process.exit(0);
