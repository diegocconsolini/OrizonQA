/**
 * Test Script for AI Test Parser
 *
 * Run with: node test-ai-parser.js
 */

import { parseAITestCases, parseUserStoriesToTests } from './lib/ai-test-parser.js';

console.log('🧪 Testing AI Test Parser\n');

// Sample AI-generated test cases (markdown format)
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

## Test Case 3: API Endpoint Authentication

**Description:** Verify API endpoints require authentication

**Type:** API
**Priority:** High

**Steps:**
- Send GET request to /api/users without token
- Send POST request to /api/data without token

**Expected Result:** Both requests should return 401 Unauthorized
`;

const sampleUserStories = `
## User Story 1: As a customer, I want to filter products by category so that I can find items I'm interested in quickly

Acceptance Criteria:
- Category filter dropdown visible on products page
- Selecting a category updates the product list
- Can select multiple categories
- "Clear filters" button resets selection

## User Story 2: As an admin, I want to export user data to CSV so that I can analyze user metrics

Acceptance Criteria:
- Export button visible on users page
- Clicking export downloads CSV file
- CSV contains all user fields
- Filename includes current date
`;

console.log('📝 Sample Test Cases Input:');
console.log('─'.repeat(80));
console.log(sampleTestCases.substring(0, 200) + '...\n');

console.log('🔍 Parsing Test Cases...\n');
const parsedTests = parseAITestCases(sampleTestCases);

console.log(`✅ Parsed ${parsedTests.length} test cases:\n`);
parsedTests.forEach((test, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`  Title: ${test.title}`);
  console.log(`  Priority: ${test.priority}`);
  console.log(`  Type: ${test.type}`);
  console.log(`  Steps: ${test.steps.length}`);
  console.log(`  Tags: ${test.tags.join(', ')}`);
  if (test.steps.length > 0) {
    console.log(`  First Step: ${test.steps[0].step.substring(0, 50)}...`);
  }
  console.log('');
});

console.log('\n📝 Sample User Stories Input:');
console.log('─'.repeat(80));
console.log(sampleUserStories.substring(0, 200) + '...\n');

console.log('🔍 Parsing User Stories...\n');
const parsedStories = parseUserStoriesToTests(sampleUserStories);

console.log(`✅ Parsed ${parsedStories.length} user stories as tests:\n`);
parsedStories.forEach((test, index) => {
  console.log(`Story ${index + 1}:`);
  console.log(`  Title: ${test.title}`);
  console.log(`  Tags: ${test.tags.join(', ')}`);
  console.log('');
});

console.log('\n✅ All parser tests completed!');
console.log(`\nTotal tests that would be importable: ${parsedTests.length + parsedStories.length}`);
