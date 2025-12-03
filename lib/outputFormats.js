/**
 * Output Format Definitions
 * Complete format specifications with samples and prompt instructions
 */

export const FORMAT_CATEGORIES = {
  docs: {
    id: 'docs',
    label: 'Documentation',
    icon: 'FileText',
    description: 'Human-readable documentation formats'
  },
  data: {
    id: 'data',
    label: 'Data Export',
    icon: 'Database',
    description: 'Structured data formats for processing'
  },
  integration: {
    id: 'integration',
    label: 'Integrations',
    icon: 'Plug',
    description: 'Test management tool formats'
  },
  bdd: {
    id: 'bdd',
    label: 'BDD/Specs',
    icon: 'CheckSquare',
    description: 'Behavior-driven development formats'
  }
};

export const OUTPUT_FORMATS = {
  // Documentation Formats
  markdown: {
    id: 'markdown',
    name: 'Markdown',
    icon: 'FileText',
    category: 'docs',
    extension: '.md',
    mimeType: 'text/markdown',
    description: 'Clean, readable documentation format',
    sample: `# User Stories

## Feature: User Authentication

### US-001: User Login
**As a** registered user
**I want to** log in with my email and password
**So that** I can access my dashboard

#### Acceptance Criteria
- [ ] User can enter email and password
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to dashboard

---

# Test Cases

## TC-001: Valid Login
**Priority:** High | **Type:** Functional

**Preconditions:**
- User account exists with email: test@example.com

**Steps:**
1. Navigate to /login
2. Enter email: test@example.com
3. Enter password: ValidPass123
4. Click "Sign In" button

**Expected Result:**
- User is redirected to /dashboard
- Welcome message displays user name`,
    promptInstructions: `Format your response in clean, well-structured Markdown:
- Use # for main sections (User Stories, Test Cases, Acceptance Criteria)
- Use ## for features/categories
- Use ### for individual items with IDs (US-001, TC-001)
- Use **bold** for field labels (As a, I want to, So that)
- Use - [ ] for acceptance criteria checkboxes
- Use numbered lists for test steps
- Use tables where appropriate for structured data
- Include Priority and Type metadata for test cases
- Keep the output organized and easy to read`
  },

  html: {
    id: 'html',
    name: 'HTML Report',
    icon: 'Globe',
    category: 'docs',
    extension: '.html',
    mimeType: 'text/html',
    description: 'Styled HTML report with collapsible sections',
    sample: `<!DOCTYPE html>
<html>
<head>
  <title>QA Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
    .section { margin: 2rem 0; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
    .section h2 { margin-top: 0; color: #1f2937; }
    .test-case { background: #f9fafb; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    .priority-high { border-left: 4px solid #ef4444; }
    .priority-medium { border-left: 4px solid #f59e0b; }
    .steps { counter-reset: step; }
    .steps li { counter-increment: step; }
    .steps li::marker { content: "Step " counter(step) ": "; font-weight: 600; }
  </style>
</head>
<body>
  <h1>QA Analysis Report</h1>
  <div class="section">
    <h2>User Stories</h2>
    <!-- User stories content -->
  </div>
  <div class="section">
    <h2>Test Cases</h2>
    <div class="test-case priority-high">
      <h3>TC-001: Valid Login</h3>
      <p><strong>Priority:</strong> High</p>
      <ol class="steps">
        <li>Navigate to /login</li>
        <li>Enter valid credentials</li>
      </ol>
    </div>
  </div>
</body>
</html>`,
    promptInstructions: `Generate a complete, standalone HTML document:
- Include inline CSS styles (no external dependencies)
- Use semantic HTML5 elements (section, article, details)
- Add CSS classes for priority levels (priority-high, priority-medium, priority-low)
- Use collapsible <details> elements for long sections
- Include a table of contents with anchor links
- Make test steps numbered with CSS counters
- Add visual indicators for test status and priority
- Ensure the document is print-friendly`
  },

  // Data Formats
  json: {
    id: 'json',
    name: 'JSON',
    icon: 'Braces',
    category: 'data',
    extension: '.json',
    mimeType: 'application/json',
    description: 'Structured JSON for API integration',
    sample: `{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "source": "ORIZON QA Analyzer",
    "version": "1.0"
  },
  "userStories": [
    {
      "id": "US-001",
      "title": "User Login",
      "role": "registered user",
      "goal": "log in with email and password",
      "benefit": "access my dashboard",
      "priority": "high",
      "acceptanceCriteria": [
        "User can enter email and password",
        "Invalid credentials show error message",
        "Successful login redirects to dashboard"
      ]
    }
  ],
  "testCases": [
    {
      "id": "TC-001",
      "title": "Valid Login",
      "description": "Verify user can login with valid credentials",
      "priority": "high",
      "type": "functional",
      "preconditions": ["User account exists"],
      "steps": [
        { "step": 1, "action": "Navigate to /login", "expected": "Login page displays" },
        { "step": 2, "action": "Enter valid email", "expected": "Email field populated" },
        { "step": 3, "action": "Enter valid password", "expected": "Password field populated" },
        { "step": 4, "action": "Click Sign In", "expected": "Redirect to dashboard" }
      ],
      "expectedResult": "User is logged in and sees dashboard"
    }
  ]
}`,
    promptInstructions: `Return a valid JSON object with this structure:
{
  "metadata": { "generatedAt": "ISO date", "source": "ORIZON", "version": "1.0" },
  "userStories": [
    {
      "id": "US-XXX",
      "title": "string",
      "role": "string",
      "goal": "string",
      "benefit": "string",
      "priority": "high|medium|low",
      "acceptanceCriteria": ["string"]
    }
  ],
  "testCases": [
    {
      "id": "TC-XXX",
      "title": "string",
      "description": "string",
      "priority": "high|medium|low",
      "type": "functional|integration|security|performance",
      "preconditions": ["string"],
      "steps": [{ "step": number, "action": "string", "expected": "string" }],
      "expectedResult": "string",
      "tags": ["string"]
    }
  ],
  "acceptanceCriteria": [
    { "feature": "string", "criteria": ["string"] }
  ]
}
Ensure the JSON is valid and properly escaped. Use sequential IDs.`
  },

  yaml: {
    id: 'yaml',
    name: 'YAML',
    icon: 'FileCode',
    category: 'data',
    extension: '.yaml',
    mimeType: 'text/yaml',
    description: 'Human-readable YAML configuration format',
    sample: `metadata:
  generatedAt: 2024-01-15T10:30:00Z
  source: ORIZON QA Analyzer

userStories:
  - id: US-001
    title: User Login
    role: registered user
    goal: log in with email and password
    benefit: access my dashboard
    priority: high
    acceptanceCriteria:
      - User can enter email and password
      - Invalid credentials show error message
      - Successful login redirects to dashboard

testCases:
  - id: TC-001
    title: Valid Login
    priority: high
    type: functional
    preconditions:
      - User account exists
    steps:
      - step: 1
        action: Navigate to /login
        expected: Login page displays
      - step: 2
        action: Enter valid credentials
        expected: Fields populated
      - step: 3
        action: Click Sign In
        expected: Redirect to dashboard
    expectedResult: User sees dashboard`,
    promptInstructions: `Generate valid YAML with this structure:
- Use 2-space indentation
- Use proper YAML arrays with - prefix
- Include metadata section with timestamp
- Group by userStories, testCases, acceptanceCriteria
- Use multi-line strings with | for long descriptions
- Keep keys lowercase with camelCase
- Include priority and type fields for all items`
  },

  csv: {
    id: 'csv',
    name: 'CSV Spreadsheet',
    icon: 'Table',
    category: 'data',
    extension: '.csv',
    mimeType: 'text/csv',
    description: 'Comma-separated values for Excel/Sheets',
    sample: `"ID","Type","Title","Description","Priority","Steps","Expected Result","Tags"
"TC-001","Functional","Valid Login","Verify login with valid credentials","High","1. Navigate to /login|2. Enter email|3. Enter password|4. Click Sign In","User sees dashboard","auth,smoke"
"TC-002","Functional","Invalid Login","Verify error on invalid credentials","High","1. Navigate to /login|2. Enter invalid email|3. Click Sign In","Error message displays","auth,negative"
"TC-003","Security","SQL Injection","Test SQL injection on login","Critical","1. Enter ' OR '1'='1 in email|2. Click Sign In","Request rejected, error logged","auth,security"`,
    promptInstructions: `Generate CSV with these columns in order:
ID,Type,Title,Description,Priority,Steps,Expected Result,Tags

Rules:
- First row must be column headers
- Wrap all values in double quotes
- Escape internal quotes by doubling them ("")
- Separate steps with pipe character (|) within the Steps cell
- Separate tags with comma within the Tags cell
- Priority values: Critical, High, Medium, Low
- Type values: Functional, Integration, Security, Performance, Usability`
  },

  // Integration Formats
  jira: {
    id: 'jira',
    name: 'Jira Markup',
    icon: 'Trello',
    category: 'integration',
    extension: '.txt',
    mimeType: 'text/plain',
    description: 'Jira wiki markup for copy-paste',
    sample: `h1. User Stories

h2. US-001: User Login

*As a* registered user
*I want to* log in with my email and password
*So that* I can access my dashboard

h3. Acceptance Criteria
* User can enter email and password
* Invalid credentials show error message
* Successful login redirects to dashboard

----

h1. Test Cases

h2. TC-001: Valid Login

||Field||Value||
|Priority|High|
|Type|Functional|
|Automation|Manual|

h3. Preconditions
# User account exists with valid credentials

h3. Test Steps
||Step||Action||Expected Result||
|1|Navigate to /login|Login page displays|
|2|Enter email: test@example.com|Email field populated|
|3|Enter password: ValidPass123|Password masked|
|4|Click "Sign In" button|Redirect to dashboard|

h3. Expected Result
User is logged in and sees personalized dashboard`,
    promptInstructions: `Use Jira wiki markup syntax:
- h1. for main sections
- h2. for items (US-001, TC-001)
- h3. for subsections
- *bold* for emphasis
- _italic_ for secondary text
- # for numbered lists
- * for bullet points
- ||Header|| for table headers
- |Cell| for table cells
- ---- for horizontal rules
- {code:java}...{code} for code blocks
- {noformat}...{noformat} for preformatted text

Include tables for test step details with Step, Action, Expected Result columns.`
  },

  testrail: {
    id: 'testrail',
    name: 'TestRail CSV',
    icon: 'LayoutList',
    category: 'integration',
    extension: '.csv',
    mimeType: 'text/csv',
    description: 'TestRail import format (CSV)',
    sample: `"Title","Section","Template","Type","Priority","Preconditions","Steps","Expected Result","References"
"Valid Login","Authentication","Test Case (Steps)","Functional","High","User account exists","Step 1: Navigate to /login
Step 2: Enter email test@example.com
Step 3: Enter password
Step 4: Click Sign In","User redirected to dashboard",""
"Invalid Login","Authentication","Test Case (Steps)","Negative","High","","Step 1: Navigate to /login
Step 2: Enter invalid email
Step 3: Click Sign In","Error message: Invalid credentials",""`,
    promptInstructions: `Generate TestRail-compatible CSV with these required columns:
Title, Section, Template, Type, Priority, Preconditions, Steps, Expected Result, References

Rules:
- Template should be "Test Case (Steps)" for step-based tests
- Type values: Functional, Negative, Boundary, Security, Performance, Usability
- Priority values: Critical, High, Medium, Low
- Steps should be formatted as "Step 1: action\\nStep 2: action" with newlines
- Section is the folder/category for the test
- References can include ticket IDs (JIRA-123)`
  },

  xray: {
    id: 'xray',
    name: 'Xray JSON',
    icon: 'Radar',
    category: 'integration',
    extension: '.json',
    mimeType: 'application/json',
    description: 'Xray test case import format for Jira',
    sample: `{
  "testInfo": {
    "projectKey": "PROJ",
    "summary": "Valid Login Test",
    "type": "Manual",
    "steps": [
      {
        "action": "Navigate to /login",
        "data": "",
        "result": "Login page is displayed"
      },
      {
        "action": "Enter email: {{email}}",
        "data": "test@example.com",
        "result": "Email field shows the entered value"
      },
      {
        "action": "Enter password: {{password}}",
        "data": "ValidPass123",
        "result": "Password is masked"
      },
      {
        "action": "Click Sign In button",
        "data": "",
        "result": "User is redirected to dashboard"
      }
    ],
    "labels": ["authentication", "smoke", "critical"]
  }
}`,
    promptInstructions: `Generate Xray-compatible JSON for Jira import:
{
  "testInfo": {
    "projectKey": "PROJ",
    "summary": "Test case title",
    "type": "Manual",
    "steps": [
      {
        "action": "Step description with {{placeholders}}",
        "data": "Test data value",
        "result": "Expected result"
      }
    ],
    "labels": ["tag1", "tag2"]
  }
}

For multiple test cases, return an array of testInfo objects.
Use {{placeholder}} syntax for test data variables.`
  },

  azure: {
    id: 'azure',
    name: 'Azure DevOps CSV',
    icon: 'Cloud',
    category: 'integration',
    extension: '.csv',
    mimeType: 'text/csv',
    description: 'Azure Test Plans import format',
    sample: `"ID","Work Item Type","Title","State","Priority","Steps","Assigned To","Area Path","Tags"
"","Test Case","Valid Login","Design","2","<steps><step><parameterizedString>Navigate to /login</parameterizedString><description>Open the login page</description></step><step><parameterizedString>Enter email</parameterizedString><expectedResult>Email field populated</expectedResult></step></steps>","","Project\\Authentication","auth;smoke"
"","Test Case","Invalid Login","Design","2","<steps><step><parameterizedString>Enter invalid credentials</parameterizedString><expectedResult>Error message displayed</expectedResult></step></steps>","","Project\\Authentication","auth;negative"`,
    promptInstructions: `Generate Azure DevOps Test Case CSV with columns:
ID, Work Item Type, Title, State, Priority, Steps, Assigned To, Area Path, Tags

Rules:
- Leave ID empty for new test cases
- Work Item Type must be "Test Case"
- State should be "Design" for new cases
- Priority is 1-4 (1=Critical, 2=High, 3=Medium, 4=Low)
- Steps must use XML format: <steps><step><parameterizedString>action</parameterizedString><expectedResult>result</expectedResult></step></steps>
- Tags separated by semicolon
- Area Path uses backslash separators`
  },

  // BDD Formats
  gherkin: {
    id: 'gherkin',
    name: 'Gherkin (Cucumber)',
    icon: 'CheckSquare',
    category: 'bdd',
    extension: '.feature',
    mimeType: 'text/plain',
    description: 'Cucumber/Behave feature files',
    sample: `@authentication @critical
Feature: User Authentication
  As a registered user
  I want to log in with my credentials
  So that I can access my personalized dashboard

  Background:
    Given I am on the login page

  @smoke @happy-path
  Scenario: Successful login with valid credentials
    When I enter email "test@example.com"
    And I enter password "ValidPass123"
    And I click the "Sign In" button
    Then I should be redirected to the dashboard
    And I should see a welcome message with my name

  @negative
  Scenario: Failed login with invalid password
    When I enter email "test@example.com"
    And I enter password "wrongpassword"
    And I click the "Sign In" button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  @data-driven
  Scenario Outline: Login validation with various inputs
    When I enter email "<email>"
    And I enter password "<password>"
    And I click the "Sign In" button
    Then I should see "<result>"

    Examples:
      | email              | password      | result                    |
      | test@example.com   | ValidPass123  | dashboard                 |
      | invalid            | ValidPass123  | Invalid email format      |
      | test@example.com   |               | Password is required      |
      |                    | ValidPass123  | Email is required         |`,
    promptInstructions: `Generate Gherkin feature files following Cucumber best practices:

Structure:
- Start with @tags on the line before Feature
- Feature: title (single feature per file)
- Include As a/I want to/So that narrative
- Use Background for common setup steps
- Each Scenario has descriptive title

Keywords (must be exact):
- Feature, Background, Scenario, Scenario Outline
- Given, When, Then, And, But
- Examples (with table for Scenario Outline)

Best Practices:
- Use declarative style (describe what, not how)
- Keep scenarios atomic and focused
- Use @tags for categorization (@smoke, @critical, @wip)
- Scenario Outlines for data-driven tests
- Background for repeated Given steps
- Double-quoted strings for values
- Tables use | separators with header row`
  },

  robot: {
    id: 'robot',
    name: 'Robot Framework',
    icon: 'Bot',
    category: 'bdd',
    extension: '.robot',
    mimeType: 'text/plain',
    description: 'Robot Framework test files',
    sample: `*** Settings ***
Documentation    User Authentication Test Suite
Library          SeleniumLibrary
Resource         ../resources/common.robot
Suite Setup      Open Browser To Login Page
Suite Teardown   Close All Browsers
Test Tags        authentication

*** Variables ***
\${LOGIN_URL}     http://example.com/login
\${VALID_EMAIL}   test@example.com
\${VALID_PASS}    ValidPass123

*** Test Cases ***
Valid Login With Correct Credentials
    [Documentation]    Verify user can login with valid email and password
    [Tags]    smoke    critical    happy-path
    Given I Am On Login Page
    When I Enter Email    \${VALID_EMAIL}
    And I Enter Password    \${VALID_PASS}
    And I Click Sign In Button
    Then I Should Be On Dashboard
    And Welcome Message Should Contain    Test User

Invalid Login Shows Error Message
    [Documentation]    Verify error message for invalid credentials
    [Tags]    negative
    Given I Am On Login Page
    When I Enter Email    \${VALID_EMAIL}
    And I Enter Password    wrongpassword
    And I Click Sign In Button
    Then Error Message Should Be Visible    Invalid credentials
    And I Should Remain On Login Page

*** Keywords ***
I Am On Login Page
    Go To    \${LOGIN_URL}
    Wait Until Element Is Visible    id=email-input

I Enter Email
    [Arguments]    \${email}
    Input Text    id=email-input    \${email}

I Enter Password
    [Arguments]    \${password}
    Input Password    id=password-input    \${password}

I Click Sign In Button
    Click Button    id=signin-button
    Wait Until Page Does Not Contain Element    id=signin-button

I Should Be On Dashboard
    Location Should Contain    /dashboard`,
    promptInstructions: `Generate Robot Framework test files with proper structure:

Sections (must start with ***):
*** Settings ***    - Library imports, setup/teardown
*** Variables ***   - Test data variables with \${NAME} syntax
*** Test Cases ***  - Test case definitions
*** Keywords ***    - Reusable keyword definitions

Syntax Rules:
- Use 4 spaces or 2+ spaces between columns
- Variables: \${VARIABLE_NAME}
- [Documentation] for test descriptions
- [Tags] for test categorization
- [Arguments] for keyword parameters
- Given/When/Then/And for BDD-style keywords

Best Practices:
- Clear test case names (Title Case)
- Document each test case
- Use tags: smoke, critical, negative, wip
- Suite Setup/Teardown for browser lifecycle
- Reusable keywords for common actions
- Variables for test data`
  }
};

/**
 * Get formats by category
 */
export function getFormatsByCategory(categoryId) {
  return Object.values(OUTPUT_FORMATS).filter(f => f.category === categoryId);
}

/**
 * Get format by ID
 */
export function getFormat(formatId) {
  return OUTPUT_FORMATS[formatId] || OUTPUT_FORMATS.markdown;
}

/**
 * Get all format IDs
 */
export function getAllFormatIds() {
  return Object.keys(OUTPUT_FORMATS);
}
