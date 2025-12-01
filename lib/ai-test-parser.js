/**
 * AI Test Parser
 *
 * Utilities to parse AI-generated test artifacts (markdown/text) into structured test case objects
 */

/**
 * Parse AI-generated test cases from markdown text
 * @param {string} testCasesText - Raw test cases text from Claude
 * @returns {Array} Array of parsed test case objects
 */
export function parseAITestCases(testCasesText) {
  if (!testCasesText || typeof testCasesText !== 'string') {
    return [];
  }

  const tests = [];

  // Try to detect format: numbered tests, markdown headers, or scenarios
  const lines = testCasesText.split('\n');
  let currentTest = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect test case headers
    // Pattern 1: "## Test Case 1: ..." or "### Test: ..."
    const headerMatch = line.match(/^#{2,3}\s*(?:Test(?:\s+Case)?)\s*\d*:?\s*(.+)/i);
    if (headerMatch) {
      if (currentTest) {
        tests.push(currentTest);
      }
      currentTest = {
        title: headerMatch[1].trim(),
        description: '',
        steps: [],
        expected_result: '',
        priority: 'Medium',
        type: 'Functional',
        tags: []
      };
      currentSection = null;
      continue;
    }

    // Pattern 2: "**Test X:**" or "Test X:"
    const boldTestMatch = line.match(/^\*?\*?Test\s+\d+:?\*?\*?\s*(.+)/i);
    if (boldTestMatch) {
      if (currentTest) {
        tests.push(currentTest);
      }
      currentTest = {
        title: boldTestMatch[1].trim(),
        description: '',
        steps: [],
        expected_result: '',
        priority: 'Medium',
        type: 'Functional',
        tags: []
      };
      currentSection = null;
      continue;
    }

    if (!currentTest) continue;

    // Detect sections within a test
    const sectionMatch = line.match(/^\*?\*?(?:Description|Preconditions?|Steps?|Expected\s+Results?|Priority|Type|Tags?):?\*?\*?\s*(.*)$/i);
    if (sectionMatch) {
      const sectionName = sectionMatch[0].match(/(?:Description|Preconditions?|Steps?|Expected\s+Results?|Priority|Type|Tags?)/i)[0].toLowerCase();
      const sectionValue = sectionMatch[1].trim();

      if (sectionName.startsWith('desc')) {
        currentSection = 'description';
        if (sectionValue) currentTest.description = sectionValue;
      } else if (sectionName.startsWith('prec')) {
        currentSection = 'preconditions';
        if (sectionValue) currentTest.preconditions = sectionValue;
        else currentTest.preconditions = '';
      } else if (sectionName.startsWith('step')) {
        currentSection = 'steps';
      } else if (sectionName.startsWith('expect')) {
        currentSection = 'expected';
        if (sectionValue) currentTest.expected_result = sectionValue;
      } else if (sectionName.startsWith('prior')) {
        currentSection = null;
        currentTest.priority = extractPriority(sectionValue || line);
      } else if (sectionName.startsWith('type')) {
        currentSection = null;
        currentTest.type = extractType(sectionValue || line);
      } else if (sectionName.startsWith('tag')) {
        currentSection = 'tags';
        if (sectionValue) {
          currentTest.tags = sectionValue.split(/[,;]/).map(t => t.trim()).filter(Boolean);
        }
      }
      continue;
    }

    // Parse step lines (numbered or bulleted)
    const stepMatch = line.match(/^(?:\d+\.|\-|\*)\s*(.+)/);
    if (currentSection === 'steps' && stepMatch) {
      const stepText = stepMatch[1].trim();

      // Try to extract expected result from step (if it contains "→" or "=>")
      const stepParts = stepText.split(/\s*(?:→|=>|Expected:)\s*/i);
      const step = {
        step: stepParts[0].trim(),
        expected: stepParts[1]?.trim() || '',
        data: ''
      };

      currentTest.steps.push(step);
      continue;
    }

    // Accumulate content for current section
    if (currentSection === 'description') {
      currentTest.description += (currentTest.description ? '\n' : '') + line;
    } else if (currentSection === 'preconditions') {
      currentTest.preconditions += (currentTest.preconditions ? '\n' : '') + line;
    } else if (currentSection === 'expected') {
      currentTest.expected_result += (currentTest.expected_result ? '\n' : '') + line;
    } else if (currentSection === 'tags') {
      const moreTags = line.split(/[,;]/).map(t => t.trim()).filter(Boolean);
      currentTest.tags.push(...moreTags);
    }
  }

  // Add the last test
  if (currentTest) {
    tests.push(currentTest);
  }

  // If no tests were parsed with the above patterns, try simpler extraction
  if (tests.length === 0) {
    // Look for any headings that might be test titles
    const simpleTests = testCasesText.split(/\n\n+/);
    for (const block of simpleTests) {
      if (block.trim().length > 10) {
        const firstLine = block.split('\n')[0];
        tests.push({
          title: firstLine.replace(/^#{1,6}\s*/, '').trim() || 'Imported Test Case',
          description: block,
          steps: [],
          expected_result: '',
          priority: 'Medium',
          type: 'Functional',
          tags: ['ai-generated']
        });
      }
    }
  }

  // Add default tag
  tests.forEach(test => {
    if (!test.tags.includes('ai-generated')) {
      test.tags.push('ai-generated');
    }
  });

  return tests;
}

/**
 * Extract priority from text
 */
function extractPriority(text) {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('p0')) return 'Critical';
  if (lower.includes('high') || lower.includes('p1')) return 'High';
  if (lower.includes('low') || lower.includes('p3')) return 'Low';
  return 'Medium';
}

/**
 * Extract test type from text
 */
function extractType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('integration')) return 'Integration';
  if (lower.includes('e2e') || lower.includes('end-to-end')) return 'E2E';
  if (lower.includes('performance') || lower.includes('load')) return 'Performance';
  if (lower.includes('security') || lower.includes('penetration')) return 'Security';
  if (lower.includes('api') || lower.includes('endpoint')) return 'API';
  if (lower.includes('ui') || lower.includes('interface')) return 'UI';
  return 'Functional';
}

/**
 * Parse user stories into test cases (simpler format)
 * User stories are less structured, so we create one test per story
 */
export function parseUserStoriesToTests(userStoriesText) {
  if (!userStoriesText || typeof userStoriesText !== 'string') {
    return [];
  }

  const tests = [];
  const stories = userStoriesText.split(/\n\n+/);

  for (const story of stories) {
    const trimmed = story.trim();
    if (trimmed.length < 20) continue;

    const lines = trimmed.split('\n');
    const title = lines[0].replace(/^#{1,6}\s*/, '').replace(/^User Story\s*\d*:?\s*/i, '').trim();

    if (title) {
      tests.push({
        title: title,
        description: trimmed,
        steps: [],
        expected_result: '',
        priority: 'Medium',
        type: 'Functional',
        tags: ['user-story', 'ai-generated']
      });
    }
  }

  return tests;
}
