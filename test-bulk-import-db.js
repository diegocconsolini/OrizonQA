/**
 * Test script for bulk importing test cases (database layer)
 */

import { parseAITestCases } from './lib/ai-test-parser.js';
import { bulkImportTestCases, getTestCasesByProject } from './lib/db-test-cases.js';

console.log('🧪 Testing Bulk Import (Database Layer)\n');

const projectId = 2;
const suiteId = null; // No suite for now
const userId = 2;

// Sample AI-generated test cases
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
3. Submit the form
4. Click reset link in email
5. Enter new password
6. Confirm new password
7. Submit form

**Expected Result:** Password should be updated and user can login with new password

**Priority:** Critical
**Type:** Integration

## Test Case 3: Invalid Login Attempt

**Description:** Verify system handles invalid credentials properly

**Steps:**
1. Navigate to login page
2. Enter invalid username
3. Enter invalid password
4. Click login button

**Expected Result:** Error message displayed, user remains on login page

**Priority:** Medium
**Type:** Functional
`;

try {
  // Count existing tests
  console.log('1️⃣ Counting existing test cases...');
  const existingTests = await getTestCasesByProject(projectId);
  console.log(`   Found ${existingTests.length} existing test cases\n`);

  // Parse the test cases
  console.log('2️⃣ Parsing AI-generated test cases...');
  const parsedTests = parseAITestCases(sampleTestCases);
  console.log(`   ✅ Parsed ${parsedTests.length} test cases\n`);

  // Bulk import
  console.log('3️⃣ Importing test cases...');
  const result = await bulkImportTestCases(
    projectId,
    suiteId,
    parsedTests,
    userId,
    {
      model: 'claude-sonnet-4-20250514',
      template: 'AI Generated Test Cases'
    }
  );

  console.log(`   ✅ Import complete!`);
  console.log(`   Imported: ${result.imported}`);
  console.log(`   Errors: ${result.errors}\n`);

  if (result.details.imported.length > 0) {
    console.log('   Successfully imported:');
    result.details.imported.forEach((test) => {
      console.log(`     - ${test.key}: ${test.title} (${test.priority})`);
    });
  }

  if (result.details.errors.length > 0) {
    console.log('\n   Failed imports:');
    result.details.errors.forEach((err) => {
      console.log(`     - ${err.title}: ${err.error}`);
    });
  }

  // Verify final count
  console.log('\n4️⃣ Verifying import...');
  const finalTests = await getTestCasesByProject(projectId);
  console.log(`   Total test cases now: ${finalTests.length}`);
  console.log(`   New tests added: ${finalTests.length - existingTests.length}\n`);

} catch (error) {
  console.error('❌ Error during bulk import:');
  console.error(error);
}

process.exit(0);
