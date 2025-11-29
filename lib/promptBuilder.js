import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load prompt templates
const TEMPLATES_DIR = path.join(__dirname, '../prompts/templates');

const loadTemplate = (filename) => {
  try {
    const filePath = path.join(TEMPLATES_DIR, filename);
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Warning: Could not load template ${filename}`);
    return '';
  }
};

// Template mappings
const TEMPLATES = {
  userStories: 'learning_user_story_reconstruction.md',
  testCases: 'testing_unit_test_generation.md',
  performanceTests: 'performance_test_scenario_generation.md',
  acceptanceCriteria: 'quality_documentation_generation.md'
};

/**
 * Build a prompt for QA analysis based on configuration
 * @param {string} content - The code content to analyze
 * @param {object} config - Analysis configuration
 * @returns {string} - Complete prompt for Claude
 */
export function buildPrompt(content, config) {
  const sections = [];

  // System context
  sections.push(`You are an expert QA analyst and software testing specialist.
Your task is to analyze the provided codebase and generate comprehensive quality assurance artifacts.

Be thorough, professional, and focus on practical, actionable output that development teams can use immediately.`);

  // Code content (truncate if too long)
  const truncatedContent = content.slice(0, 100000); // 100k chars max
  sections.push(`\n# Codebase to Analyze\n\n\`\`\`\n${truncatedContent}\n\`\`\``);

  if (content.length > 100000) {
    sections.push(`\n*Note: Content truncated to 100,000 characters for analysis.*`);
  }

  // Analysis requirements based on config
  const requirements = [];

  if (config.userStories) {
    const userStoryTemplate = loadTemplate(TEMPLATES.userStories);
    if (userStoryTemplate) {
      requirements.push(userStoryTemplate);
    } else {
      // Fallback if template not found
      requirements.push(`## User Stories

Generate user stories in the format:
- **User Role**: [Specific role or type of user]
- **Need**: [What the user wants to accomplish]
- **Functionality**: [The feature or capability that addresses the need]
- **Benefit**: [The value or advantage gained by the user]

${config.additionalContext ? `Additional Context: ${config.additionalContext}` : ''}`);
    }
  }

  if (config.testCases) {
    const testTemplate = loadTemplate(TEMPLATES.testCases);
    if (testTemplate) {
      requirements.push(testTemplate);

      // Add framework-specific instructions
      const frameworkHints = {
        jest: '\n**Framework**: Use Jest syntax with describe(), test(), expect() patterns.',
        pytest: '\n**Framework**: Use Pytest syntax with fixtures and parametrize decorators.',
        junit: '\n**Framework**: Use JUnit annotations like @Test, @Before, @After.',
        generic: '\n**Framework**: Use Given/When/Then format for clarity.'
      };

      requirements.push(frameworkHints[config.testFramework] || frameworkHints.generic);
    } else {
      // Fallback
      requirements.push(`## Test Cases

Generate comprehensive test cases covering:
- Happy path scenarios
- Validation and error handling
${config.edgeCases ? '- Edge cases and boundary conditions\n' : ''}${config.securityTests ? '- Security test scenarios (XSS, SQL injection, authentication, authorization)\n' : ''}
Format: ${config.testFramework || 'generic'} style`);
    }
  }

  if (config.acceptanceCriteria) {
    const criteriaTemplate = loadTemplate(TEMPLATES.acceptanceCriteria);
    if (criteriaTemplate) {
      requirements.push(criteriaTemplate);
    } else {
      // Fallback
      requirements.push(`## Acceptance Criteria

Generate clear, testable acceptance criteria for each feature identified.
Format as:
- **Feature**: [Feature name]
- **Criteria**:
  - [ ] [Specific, measurable criterion]
  - [ ] [Another criterion]`);
    }
  }

  // Add edge cases and security tests if requested
  if (config.edgeCases && config.testCases) {
    requirements.push(`\n**Important**: Include comprehensive edge case testing for boundary conditions, null values, empty inputs, maximum values, etc.`);
  }

  if (config.securityTests && config.testCases) {
    requirements.push(`\n**Important**: Include security-focused test scenarios covering:
- Input validation (XSS, SQL injection)
- Authentication and authorization
- Data exposure risks
- CSRF protection
- Secure data handling`);
  }

  sections.push('\n' + requirements.join('\n\n'));

  // Output format instructions
  const formatInstructions = getFormatInstructions(config.outputFormat);
  sections.push(`\n${formatInstructions}`);

  return sections.join('\n');
}

/**
 * Get output format instructions
 * @param {string} format - 'markdown', 'json', or 'jira'
 * @returns {string} - Format-specific instructions
 */
function getFormatInstructions(format) {
  switch (format) {
    case 'json':
      return `# Output Format: JSON

Return a valid JSON object with this exact structure:
\`\`\`json
{
  "userStories": [
    {
      "category": "Core Features",
      "stories": [
        {
          "role": "User role",
          "need": "What they want",
          "functionality": "Feature that addresses it",
          "benefit": "Value gained"
        }
      ]
    }
  ],
  "testCases": [
    {
      "name": "Test case name",
      "description": "What this tests",
      "steps": ["step1", "step2"],
      "expected": "Expected result",
      "category": "happy-path|edge-case|security"
    }
  ],
  "acceptanceCriteria": [
    {
      "feature": "Feature name",
      "criteria": ["criterion1", "criterion2"]
    }
  ]
}
\`\`\`

Ensure the JSON is valid and properly escaped.`;

    case 'jira':
      return `# Output Format: Jira Markup

Use Jira-compatible markup:
- h1. for main sections
- h2. for subsections
- * for bullet points
- # for numbered lists
- {code} for code blocks
- *bold* for emphasis
- _italic_ for secondary emphasis

Example:
h1. User Stories
h2. Core Features
* *User Role*: End User
* *Need*: View dashboard
* *Functionality*: Dashboard page with metrics
* *Benefit*: Quick overview of system status`;

    case 'markdown':
    default:
      return `# Output Format: Markdown

Format your response in clean, well-structured Markdown:
- Use # for main sections (User Stories, Test Cases, Acceptance Criteria)
- Use ## for subsections and categories
- Use ### for individual items
- Use bullet points (-) for lists
- Use **bold** for emphasis
- Use \`code blocks\` with language tags for code examples
- Use tables where appropriate for structured data

Keep the output organized, professional, and easy to read.`;
  }
}

/**
 * Parse Claude's response into structured sections
 * @param {string} text - Raw response from Claude
 * @param {string} format - Expected format ('markdown', 'json', 'jira')
 * @returns {object} - Parsed sections {userStories, testCases, acceptanceCriteria, raw}
 */
export function parseResponse(text, format) {
  if (format === 'json') {
    try {
      const parsed = JSON.parse(text);
      // Convert JSON arrays to readable strings
      return {
        userStories: JSON.stringify(parsed.userStories, null, 2),
        testCases: JSON.stringify(parsed.testCases, null, 2),
        acceptanceCriteria: JSON.stringify(parsed.acceptanceCriteria, null, 2),
        raw: text
      };
    } catch (error) {
      console.warn('Failed to parse JSON response, falling back to markdown parsing');
      // Fall through to markdown parsing
    }
  }

  // Parse markdown/jira format by section headers
  const result = {
    userStories: '',
    testCases: '',
    acceptanceCriteria: '',
    raw: text
  };

  // Split by major section headers
  const sections = text.split(/\n(?=#\s+|\nh1\.\s+)/);

  sections.forEach(section => {
    const lower = section.toLowerCase();

    if (lower.includes('user stor')) {
      result.userStories = section.trim();
    } else if (lower.includes('test case') || lower.includes('testing')) {
      result.testCases = section.trim();
    } else if (lower.includes('acceptance') || lower.includes('criteria')) {
      result.acceptanceCriteria = section.trim();
    }
  });

  // If sections are still empty, try to extract them more aggressively
  if (!result.userStories && !result.testCases && !result.acceptanceCriteria) {
    // Just return the whole text in each section
    // The user can navigate with tabs
    result.userStories = text;
    result.testCases = text;
    result.acceptanceCriteria = text;
  }

  return result;
}
