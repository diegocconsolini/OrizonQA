/**
 * Assistant Tool Definitions
 *
 * Secure tool definitions for Claude to interact with the application.
 * All tools have strict input validation to prevent exploitation.
 *
 * Security measures:
 * - Path traversal prevention (no "..", no absolute paths)
 * - Whitelist enum validation
 * - Length limits on all strings
 * - Safe glob patterns only
 * - Session-scoped operations
 */

// ============================================
// File Selection Tools
// ============================================

export const listAvailableFiles = {
  name: 'list_available_files',
  description: 'List all files available in the current repository or upload. Returns file paths that can be selected for analysis.',
  input_schema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        description: 'Optional file extension filter (e.g., ".js", ".py", ".tsx")',
      },
      directory: {
        type: 'string',
        description: 'Optional directory path to list (relative to root)',
      },
    },
    required: [],
  },
};

export const selectFile = {
  name: 'select_file',
  description: 'Select a specific file for analysis. The file must exist in the current file tree.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to select (must exist in file tree)',
      },
    },
    required: ['path'],
  },
};

export const selectFilesByPattern = {
  name: 'select_files_by_pattern',
  description: 'Select multiple files matching a glob pattern (e.g., "src/**/*.js", "*.test.ts")',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match files (e.g., "src/**/*.js")',
      },
      maxFiles: {
        type: 'integer',
        description: 'Maximum number of files to select (default: 50, max: 100)',
      },
    },
    required: ['pattern'],
  },
};

export const selectAllCodeFiles = {
  name: 'select_all_code_files',
  description: 'Select all code files in the project (automatically excludes node_modules, .git, dist, build, etc.)',
  input_schema: {
    type: 'object',
    properties: {
      maxFiles: {
        type: 'integer',
        description: 'Maximum files to select (default: 50, max: 100)',
      },
    },
    required: [],
  },
};

export const clearFileSelection = {
  name: 'clear_file_selection',
  description: 'Clear all currently selected files',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const getFileContent = {
  name: 'get_file_content',
  description: 'Get the content of a specific file (must be in the current file tree)',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to read',
      },
      maxLines: {
        type: 'integer',
        description: 'Maximum lines to return (default: 100, max: 500)',
      },
    },
    required: ['path'],
  },
};

// ============================================
// Configuration Tools
// ============================================

export const getCurrentConfig = {
  name: 'get_current_config',
  description: 'Get the current analysis configuration settings',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const setAnalysisOptions = {
  name: 'set_analysis_options',
  description: 'Configure what to generate in the analysis (test cases, user stories, acceptance criteria, etc.)',
  input_schema: {
    type: 'object',
    properties: {
      userStories: {
        type: 'boolean',
        description: 'Generate user stories from the code',
      },
      testCases: {
        type: 'boolean',
        description: 'Generate test cases',
      },
      acceptanceCriteria: {
        type: 'boolean',
        description: 'Generate acceptance criteria',
      },
      edgeCases: {
        type: 'boolean',
        description: 'Include edge case analysis',
      },
      securityTests: {
        type: 'boolean',
        description: 'Include security-focused test cases',
      },
    },
    required: [],
  },
};

export const setOutputFormat = {
  name: 'set_output_format',
  description: 'Set the output format for generated content',
  input_schema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['markdown', 'json', 'yaml', 'gherkin', 'jira', 'testrail', 'azure'],
        description: 'Output format for the generated content',
      },
    },
    required: ['format'],
  },
};

export const setTestFramework = {
  name: 'set_test_framework',
  description: 'Set the test framework style for generated tests',
  input_schema: {
    type: 'object',
    properties: {
      framework: {
        type: 'string',
        enum: ['generic', 'jest', 'pytest', 'junit', 'mocha', 'vitest'],
        description: 'Test framework to use for generated tests',
      },
    },
    required: ['framework'],
  },
};

export const setAdditionalContext = {
  name: 'set_additional_context',
  description: 'Add custom context or instructions for the analysis',
  input_schema: {
    type: 'object',
    properties: {
      context: {
        type: 'string',
        description: 'Additional context or instructions (max 2000 chars)',
      },
    },
    required: ['context'],
  },
};

// ============================================
// Analysis Tools
// ============================================

export const startAnalysis = {
  name: 'start_analysis',
  description: 'Start code analysis with the current configuration. Requires explicit confirmation.',
  input_schema: {
    type: 'object',
    properties: {
      confirm: {
        type: 'boolean',
        description: 'Must be true to start analysis (prevents accidental triggers)',
      },
    },
    required: ['confirm'],
  },
};

export const cancelAnalysis = {
  name: 'cancel_analysis',
  description: 'Cancel the currently running analysis',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const getAnalysisStatus = {
  name: 'get_analysis_status',
  description: 'Get the current analysis status and progress',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const getAnalysisResults = {
  name: 'get_analysis_results',
  description: 'Get results from the completed analysis',
  input_schema: {
    type: 'object',
    properties: {
      section: {
        type: 'string',
        enum: ['all', 'testCases', 'userStories', 'acceptanceCriteria'],
        description: 'Which section of results to retrieve',
      },
      maxLength: {
        type: 'integer',
        description: 'Maximum characters to return (default: 5000, max: 10000)',
      },
    },
    required: [],
  },
};

// ============================================
// Navigation Tools
// ============================================

export const getCurrentPage = {
  name: 'get_current_page',
  description: 'Get information about the current page and its state',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const suggestNavigation = {
  name: 'suggest_navigation',
  description: 'Suggest navigating to a different page (does NOT auto-navigate, returns a suggestion for the user)',
  input_schema: {
    type: 'object',
    properties: {
      page: {
        type: 'string',
        enum: ['/analyze', '/analyze-v2', '/execute', '/reports', '/projects', '/settings', '/history'],
        description: 'Page to suggest',
      },
      reason: {
        type: 'string',
        description: 'Brief reason for the suggestion',
      },
    },
    required: ['page'],
  },
};

// ============================================
// Quick Action Tools
// ============================================

export const selectQuickAction = {
  name: 'select_quick_action',
  description: 'Select a predefined quick action (api-tests, user-stories, full-suite, security)',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['api-tests', 'user-stories', 'full-suite', 'security'],
        description: 'Quick action to select',
      },
    },
    required: ['action'],
  },
};

export const listQuickActions = {
  name: 'list_quick_actions',
  description: 'List all available quick actions and their descriptions',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// ============================================
// Tool Collection
// ============================================

export const ALL_TOOLS = [
  // File Selection
  listAvailableFiles,
  selectFile,
  selectFilesByPattern,
  selectAllCodeFiles,
  clearFileSelection,
  getFileContent,
  // Configuration
  getCurrentConfig,
  setAnalysisOptions,
  setOutputFormat,
  setTestFramework,
  setAdditionalContext,
  // Analysis
  startAnalysis,
  cancelAnalysis,
  getAnalysisStatus,
  getAnalysisResults,
  // Navigation
  getCurrentPage,
  suggestNavigation,
  // Quick Actions
  selectQuickAction,
  listQuickActions,
];

export const TOOL_NAMES = new Set(ALL_TOOLS.map((t) => t.name));

/**
 * Get tool definition by name
 */
export function getToolByName(name) {
  return ALL_TOOLS.find((t) => t.name === name);
}

/**
 * Quick action configs
 */
export const QUICK_ACTION_CONFIGS = {
  'api-tests': {
    label: 'API Tests',
    description: 'Generate API and integration tests',
    config: { testCases: true, userStories: false, acceptanceCriteria: false },
  },
  'user-stories': {
    label: 'User Stories',
    description: 'Generate user stories from code',
    config: { testCases: false, userStories: true, acceptanceCriteria: false },
  },
  'full-suite': {
    label: 'Full QA Suite',
    description: 'Generate tests, user stories, and acceptance criteria',
    config: { testCases: true, userStories: true, acceptanceCriteria: true },
  },
  security: {
    label: 'Security Tests',
    description: 'Generate security-focused test cases',
    config: { testCases: true, securityTests: true, userStories: false, acceptanceCriteria: false },
  },
};
