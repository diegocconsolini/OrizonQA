import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFormat, OUTPUT_FORMATS } from './outputFormats.js';
import { getFramework, TEST_FRAMEWORKS } from './testFrameworks.js';

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
 * @param {object} outputSettings - Optional output settings from OutputSettingsPanel
 * @returns {string} - Complete prompt for Claude
 */
export function buildPrompt(content, config, outputSettings = null) {
  const sections = [];

  // Get format and framework from new system or legacy config
  const format = outputSettings?.format || getFormat(config.outputFormat || 'markdown');
  const framework = outputSettings?.framework || getFramework(config.testFramework || 'generic');
  const contextPrompt = outputSettings?.contextPrompt || '';

  // System context
  sections.push(`You are an expert QA analyst and software testing specialist.
Your task is to analyze the provided codebase and generate comprehensive quality assurance artifacts.

Be thorough, professional, and focus on practical, actionable output that development teams can use immediately.`);

  // Add context if provided
  if (contextPrompt) {
    sections.push(contextPrompt);
  }

  // Code content - no truncation here, caller handles chunking for large content
  sections.push(`\n# Codebase to Analyze\n\n\`\`\`\n${content}\n\`\`\``);

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
    } else {
      // Fallback
      requirements.push(`## Test Cases

Generate comprehensive test cases covering:
- Happy path scenarios
- Validation and error handling
${config.edgeCases ? '- Edge cases and boundary conditions\n' : ''}${config.securityTests ? '- Security test scenarios (XSS, SQL injection, authentication, authorization)\n' : ''}`);
    }

    // Add framework-specific instructions from the new system
    if (framework && framework.promptInstructions) {
      requirements.push(`\n**Test Framework Instructions:**\n${framework.promptInstructions}`);
    } else {
      // Legacy fallback
      const frameworkHints = {
        jest: '\n**Framework**: Use Jest syntax with describe(), test(), expect() patterns.',
        vitest: '\n**Framework**: Use Vitest syntax with describe(), test(), expect(), vi.* patterns.',
        pytest: '\n**Framework**: Use Pytest syntax with fixtures and parametrize decorators.',
        junit: '\n**Framework**: Use JUnit 5 annotations like @Test, @BeforeEach, @Nested.',
        playwright: '\n**Framework**: Use Playwright syntax with test.describe(), page.*, expect() patterns.',
        cypress: '\n**Framework**: Use Cypress syntax with cy.*, describe(), it() patterns.',
        generic: '\n**Framework**: Use Given/When/Then format for clarity.'
      };
      requirements.push(frameworkHints[config.testFramework] || frameworkHints.generic);
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

  // Output format instructions from new system or legacy
  if (format && format.promptInstructions) {
    sections.push(`\n# Output Format Instructions\n\n${format.promptInstructions}`);
  } else {
    const formatInstructions = getFormatInstructions(config.outputFormat);
    sections.push(`\n${formatInstructions}`);
  }

  return sections.join('\n');
}

/**
 * Get output format instructions (legacy fallback)
 * @param {string} format - 'markdown', 'json', or 'jira'
 * @returns {string} - Format-specific instructions
 */
function getFormatInstructions(format) {
  // Try to get from new system first
  const formatDef = OUTPUT_FORMATS[format];
  if (formatDef && formatDef.promptInstructions) {
    return `# Output Format: ${formatDef.name}\n\n${formatDef.promptInstructions}`;
  }

  // Legacy fallback
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
 * @param {string} format - Expected format ('markdown', 'json', 'jira', or format ID)
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

/**
 * Get list of available output formats
 * @returns {Array} - Array of format objects with id, name, description
 */
export function getAvailableFormats() {
  return Object.values(OUTPUT_FORMATS).map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    category: f.category,
    extension: f.extension
  }));
}

/**
 * Get list of available test frameworks
 * @returns {Array} - Array of framework objects with id, name, language
 */
export function getAvailableFrameworks() {
  return Object.values(TEST_FRAMEWORKS).map(f => ({
    id: f.id,
    name: f.name,
    language: f.language,
    type: f.type
  }));
}

// ============================================================================
// MULTI-PASS ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Build a prompt for analyzing a single chunk in multi-pass analysis
 * @param {string} content - The formatted chunk content
 * @param {object} config - Analysis configuration
 * @param {number} chunkIndex - Current chunk index (0-based)
 * @param {number} totalChunks - Total number of chunks
 * @param {object} chunkDetail - Details about this chunk (files, summary)
 * @returns {string} - Complete prompt for this chunk
 */
export function buildChunkPrompt(content, config, chunkIndex, totalChunks, chunkDetail = {}) {
  const sections = [];

  // Multi-pass context header
  sections.push(`# MULTI-PASS ANALYSIS - BATCH ${chunkIndex + 1} OF ${totalChunks}

You are analyzing a codebase in multiple batches to ensure 100% coverage.
This is batch ${chunkIndex + 1} of ${totalChunks}.`);

  if (chunkDetail.files) {
    sections.push(`This batch contains ${chunkDetail.files} files.`);
  }
  if (chunkDetail.summary) {
    sections.push(`Files in this batch: ${chunkDetail.summary}`);
  }

  sections.push(`
## IMPORTANT INSTRUCTIONS FOR BATCH ANALYSIS:

1. **Analyze ALL files in this batch thoroughly** - Every file must be covered
2. **Generate complete QA artifacts** for the code in this batch:
   - User stories based on the functionality
   - Test cases with proper coverage
   - Acceptance criteria for features found
3. **Use consistent formatting** - Your output will be combined with other batches
4. **Be thorough but avoid redundancy** - Focus on this batch's unique content
5. **Note cross-file relationships** when relevant to testing

---`);

  // Use the standard buildPrompt for the rest
  const basePrompt = buildPrompt(content, config);
  sections.push(basePrompt);

  return sections.join('\n');
}

/**
 * Build a synthesis prompt to combine results from multiple chunk analyses
 * @param {Array} chunkResults - Array of {index, result, files, summary} objects
 * @param {object} config - Analysis configuration
 * @returns {string} - Synthesis prompt
 */
export function buildSynthesisPrompt(chunkResults, config) {
  const sections = [];

  sections.push(`# ANALYSIS SYNTHESIS

You have analyzed a codebase in ${chunkResults.length} batches. Below are the results from each batch.

## Your Task: Synthesize Into Unified QA Document

Create a comprehensive, unified QA document by:

1. **Combine all user stories** - Remove duplicates while preserving unique stories
2. **Merge test cases** - Group related tests by feature/module, avoid redundancy
3. **Consolidate acceptance criteria** - Organize by feature area
4. **Ensure consistent numbering** - Renumber all items sequentially
5. **Remove overlapping content** - Keep the most complete version of similar items
6. **Maintain professional formatting** - The final document should be publication-ready

## Quality Requirements:
- The synthesized document must cover ALL functionality from ALL batches
- No user story, test case, or criterion should be lost
- Group related items logically by feature or module
- Ensure clear, actionable output

---

## BATCH RESULTS TO SYNTHESIZE:
`);

  // Add each chunk's results
  for (const chunk of chunkResults) {
    if (chunk.error) continue; // Skip failed chunks

    sections.push(`
### BATCH ${chunk.index + 1}: ${chunk.summary || 'Analysis Results'}
Files analyzed: ${chunk.files?.length || 'Unknown'}

${chunk.result}

---`);
  }

  // Add format instructions
  sections.push(`
## OUTPUT FORMAT

${getFormatInstructionsForSynthesis(config.outputFormat)}

Now synthesize all the above batch results into a single, unified QA document.`);

  return sections.join('\n');
}

/**
 * Get format instructions specifically for synthesis
 * @param {string} format - Output format
 * @returns {string} - Format instructions
 */
function getFormatInstructionsForSynthesis(format) {
  switch (format) {
    case 'json':
      return `Output the synthesized result as valid JSON with these sections:
\`\`\`json
{
  "userStories": [...],
  "testCases": [...],
  "acceptanceCriteria": [...]
}
\`\`\``;

    case 'jira':
      return `Format the output for Jira import:
- Use h1. for main sections
- Use h2. for feature areas
- Use proper Jira markup for lists and formatting`;

    default:
      return `Use clean Markdown formatting:
- # for main sections (User Stories, Test Cases, Acceptance Criteria)
- ## for feature/module groupings
- ### for individual items
- Proper bullet points and numbering
- Code blocks where appropriate`;
  }
}

/**
 * Merge multiple parsed responses into one
 * @param {Array} responses - Array of parsed response objects
 * @returns {object} - Merged response {userStories, testCases, acceptanceCriteria, raw}
 */
export function mergeResponses(responses) {
  const merged = {
    userStories: [],
    testCases: [],
    acceptanceCriteria: [],
    raw: []
  };

  for (const response of responses) {
    if (response.userStories) {
      merged.userStories.push(response.userStories);
    }
    if (response.testCases) {
      merged.testCases.push(response.testCases);
    }
    if (response.acceptanceCriteria) {
      merged.acceptanceCriteria.push(response.acceptanceCriteria);
    }
    if (response.raw) {
      merged.raw.push(response.raw);
    }
  }

  return {
    userStories: merged.userStories.join('\n\n---\n\n'),
    testCases: merged.testCases.join('\n\n---\n\n'),
    acceptanceCriteria: merged.acceptanceCriteria.join('\n\n---\n\n'),
    raw: merged.raw.join('\n\n===== BATCH SEPARATOR =====\n\n')
  };
}
