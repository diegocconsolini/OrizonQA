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
// Project Tools
// ============================================

export const listProjects = {
  name: 'list_projects',
  description: 'List all projects for the current user',
  input_schema: {
    type: 'object',
    properties: {
      page: { type: 'integer', description: 'Page number (default: 1)' },
      limit: { type: 'integer', description: 'Items per page (default: 20, max: 100)' },
      search: { type: 'string', description: 'Search by name or description' },
      status: { type: 'string', enum: ['active', 'archived', 'all'], description: 'Filter by status' },
    },
    required: [],
  },
};

export const getProject = {
  name: 'get_project',
  description: 'Get details of a specific project',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Project ID' } },
    required: ['id'],
  },
};

export const createProject = {
  name: 'create_project',
  description: 'Create a new project',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Project name (max 100 chars)' },
      description: { type: 'string', description: 'Project description (max 500 chars)' },
      repoUrl: { type: 'string', description: 'Repository URL (optional)' },
    },
    required: ['name'],
  },
};

export const updateProject = {
  name: 'update_project',
  description: 'Update an existing project',
  input_schema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Project ID' },
      updates: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'archived'] },
        },
      },
    },
    required: ['id', 'updates'],
  },
};

export const deleteProject = {
  name: 'delete_project',
  description: 'Delete a project (requires confirmation)',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Project ID' } },
    required: ['id'],
  },
};

export const getProjectStats = {
  name: 'get_project_stats',
  description: 'Get statistics for a project',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Project ID' } },
    required: ['id'],
  },
};

// ============================================
// Requirement Tools
// ============================================

export const listRequirements = {
  name: 'list_requirements',
  description: 'List requirements for a project',
  input_schema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      page: { type: 'integer' },
      limit: { type: 'integer' },
      status: { type: 'string', enum: ['draft', 'review', 'approved', 'implemented'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    },
    required: ['projectId'],
  },
};

export const getRequirement = {
  name: 'get_requirement',
  description: 'Get details of a specific requirement',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Requirement ID' } },
    required: ['id'],
  },
};

export const createRequirement = {
  name: 'create_requirement',
  description: 'Create a new requirement',
  input_schema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      title: { type: 'string', description: 'Requirement title' },
      description: { type: 'string', description: 'Detailed description' },
      type: { type: 'string', enum: ['functional', 'non-functional', 'technical'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    },
    required: ['projectId', 'title'],
  },
};

export const updateRequirement = {
  name: 'update_requirement',
  description: 'Update an existing requirement',
  input_schema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Requirement ID' },
      updates: { type: 'object' },
    },
    required: ['id', 'updates'],
  },
};

export const deleteRequirement = {
  name: 'delete_requirement',
  description: 'Delete a requirement (requires confirmation)',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Requirement ID' } },
    required: ['id'],
  },
};

// ============================================
// Test Case Tools
// ============================================

export const listTestCases = {
  name: 'list_test_cases',
  description: 'List test cases for a project',
  input_schema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      requirementId: { type: 'string', description: 'Filter by requirement' },
      status: { type: 'string', enum: ['draft', 'ready', 'passed', 'failed', 'blocked'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      page: { type: 'integer' },
      limit: { type: 'integer' },
    },
    required: ['projectId'],
  },
};

export const getTestCase = {
  name: 'get_test_case',
  description: 'Get details of a specific test case',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Test case ID' } },
    required: ['id'],
  },
};

export const createTestCase = {
  name: 'create_test_case',
  description: 'Create a new test case',
  input_schema: {
    type: 'object',
    properties: {
      projectId: { type: 'string', description: 'Project ID' },
      requirementId: { type: 'string', description: 'Linked requirement ID' },
      title: { type: 'string', description: 'Test case title' },
      description: { type: 'string', description: 'Test description' },
      steps: { type: 'array', items: { type: 'string' }, description: 'Test steps' },
      expectedResult: { type: 'string', description: 'Expected result' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      testType: { type: 'string', enum: ['functional', 'integration', 'unit', 'e2e', 'security'] },
    },
    required: ['projectId', 'title'],
  },
};

export const updateTestCase = {
  name: 'update_test_case',
  description: 'Update an existing test case',
  input_schema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Test case ID' },
      updates: { type: 'object' },
    },
    required: ['id', 'updates'],
  },
};

export const deleteTestCase = {
  name: 'delete_test_case',
  description: 'Delete a test case (requires confirmation)',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Test case ID' } },
    required: ['id'],
  },
};

// ============================================
// Todo Tools
// ============================================

export const listTodos = {
  name: 'list_todos',
  description: 'List todos for the current user',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'all'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      search: { type: 'string' },
      page: { type: 'integer' },
      limit: { type: 'integer' },
    },
    required: [],
  },
};

export const getTodo = {
  name: 'get_todo',
  description: 'Get details of a specific todo',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Todo ID' } },
    required: ['id'],
  },
};

export const createTodo = {
  name: 'create_todo',
  description: 'Create a new todo',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Todo title' },
      description: { type: 'string', description: 'Todo description' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      dueDate: { type: 'string', description: 'Due date (ISO format)' },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['title'],
  },
};

export const updateTodo = {
  name: 'update_todo',
  description: 'Update an existing todo',
  input_schema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Todo ID' },
      updates: { type: 'object' },
    },
    required: ['id', 'updates'],
  },
};

export const completeTodo = {
  name: 'complete_todo',
  description: 'Mark a todo as completed',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Todo ID' } },
    required: ['id'],
  },
};

export const deleteTodo = {
  name: 'delete_todo',
  description: 'Delete a todo',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Todo ID' } },
    required: ['id'],
  },
};

// ============================================
// Dashboard Tools
// ============================================

export const getDashboardStats = {
  name: 'get_dashboard_stats',
  description: 'Get overall dashboard statistics',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const getRecentAnalyses = {
  name: 'get_recent_analyses',
  description: 'Get recent analysis history',
  input_schema: {
    type: 'object',
    properties: { limit: { type: 'integer', description: 'Number of analyses to return (default: 10)' } },
    required: [],
  },
};

export const getUsageMetrics = {
  name: 'get_usage_metrics',
  description: 'Get usage metrics over time',
  input_schema: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['7d', '30d', '90d'], description: 'Time period' },
    },
    required: [],
  },
};

// ============================================
// Settings Tools
// ============================================

export const getSettings = {
  name: 'get_settings',
  description: 'Get current user settings',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const updateApiKey = {
  name: 'update_api_key',
  description: 'Initiate API key update (redirects to settings)',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const clearCache = {
  name: 'clear_cache',
  description: 'Clear local cache and IndexedDB data',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const resetSettings = {
  name: 'reset_settings',
  description: 'Reset all settings to defaults (requires confirmation)',
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
  // File Selection (6)
  listAvailableFiles,
  selectFile,
  selectFilesByPattern,
  selectAllCodeFiles,
  clearFileSelection,
  getFileContent,
  // Configuration (5)
  getCurrentConfig,
  setAnalysisOptions,
  setOutputFormat,
  setTestFramework,
  setAdditionalContext,
  // Analysis (4)
  startAnalysis,
  cancelAnalysis,
  getAnalysisStatus,
  getAnalysisResults,
  // Navigation (2)
  getCurrentPage,
  suggestNavigation,
  // Quick Actions (2)
  selectQuickAction,
  listQuickActions,
  // Projects (6)
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  // Requirements (5)
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  // Test Cases (5)
  listTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  // Todos (6)
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  completeTodo,
  deleteTodo,
  // Dashboard (3)
  getDashboardStats,
  getRecentAnalyses,
  getUsageMetrics,
  // Settings (4)
  getSettings,
  updateApiKey,
  clearCache,
  resetSettings,
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
