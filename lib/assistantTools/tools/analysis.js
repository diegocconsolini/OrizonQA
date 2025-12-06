/**
 * Analysis Tools Handler
 *
 * Handles all analysis-related tools including file selection,
 * configuration, and analysis execution.
 */

/**
 * Execute an analysis tool
 *
 * @param {string} toolName - Name of the tool
 * @param {object} input - Validated input parameters
 * @param {object} context - Execution context
 * @returns {Promise<object>} - Tool result
 */
export async function executeAnalysisTool(toolName, input, context) {
  const { pageState = {}, userId, sessionId } = context;

  switch (toolName) {
    // ===== File Selection Tools =====
    case 'list_available_files':
      return listAvailableFiles(pageState);

    case 'select_file':
      return selectFile(input.path, pageState);

    case 'select_files_by_pattern':
      return selectFilesByPattern(input.pattern, pageState);

    case 'select_all_code_files':
      return selectAllCodeFiles(pageState);

    case 'clear_file_selection':
      return clearFileSelection(pageState);

    case 'get_file_content':
      return getFileContent(input.path, pageState);

    // ===== Configuration Tools =====
    case 'get_current_config':
      return getCurrentConfig(pageState);

    case 'set_analysis_options':
      return setAnalysisOptions(input, pageState);

    case 'set_output_format':
      return setOutputFormat(input.format, pageState);

    case 'set_test_framework':
      return setTestFramework(input.framework, pageState);

    case 'set_additional_context':
      return setAdditionalContext(input.context, pageState);

    // ===== Quick Actions =====
    case 'select_quick_action':
      return selectQuickAction(input.actionId, pageState);

    case 'list_quick_actions':
      return listQuickActions();

    // ===== Analysis Execution =====
    case 'start_analysis':
      return startAnalysis(pageState, context);

    case 'cancel_analysis':
      return cancelAnalysis(pageState);

    case 'get_analysis_status':
      return getAnalysisStatus(pageState);

    case 'get_analysis_results':
      return getAnalysisResults(pageState);

    default:
      return {
        success: false,
        error: `Unknown analysis tool: ${toolName}`,
      };
  }
}

// ===== File Selection Implementations =====

function listAvailableFiles(pageState) {
  const files = pageState.availableFiles || [];

  return {
    success: true,
    data: {
      files: files.map((f) => ({
        path: f.path,
        name: f.name,
        type: f.type,
        size: f.size,
        isSelected: pageState.selectedFiles?.includes(f.path) || false,
      })),
      totalCount: files.length,
      selectedCount: pageState.selectedFiles?.length || 0,
    },
  };
}

function selectFile(path, pageState) {
  const files = pageState.availableFiles || [];
  const file = files.find((f) => f.path === path);

  if (!file) {
    return {
      success: false,
      error: `File not found: ${path}`,
    };
  }

  const currentSelection = pageState.selectedFiles || [];
  if (currentSelection.includes(path)) {
    return {
      success: true,
      data: { message: 'File already selected', path },
      action: null, // No change needed
    };
  }

  return {
    success: true,
    data: { message: 'File selected', path },
    action: {
      type: 'SELECT_FILE',
      payload: { path },
    },
  };
}

function selectFilesByPattern(pattern, pageState) {
  const files = pageState.availableFiles || [];
  const regex = patternToRegex(pattern);
  const matches = files.filter((f) => regex.test(f.path));

  if (matches.length === 0) {
    return {
      success: false,
      error: `No files match pattern: ${pattern}`,
    };
  }

  return {
    success: true,
    data: {
      message: `Selected ${matches.length} files`,
      pattern,
      matchedFiles: matches.map((f) => f.path),
    },
    action: {
      type: 'SELECT_FILES_BY_PATTERN',
      payload: { paths: matches.map((f) => f.path) },
    },
  };
}

function selectAllCodeFiles(pageState) {
  const files = pageState.availableFiles || [];
  const codeExtensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.py',
    '.java',
    '.go',
    '.rb',
    '.rs',
    '.c',
    '.cpp',
    '.h',
    '.cs',
    '.php',
    '.swift',
    '.kt',
    '.scala',
    '.vue',
    '.svelte',
  ];

  const codeFiles = files.filter((f) =>
    codeExtensions.some((ext) => f.path.endsWith(ext))
  );

  return {
    success: true,
    data: {
      message: `Selected ${codeFiles.length} code files`,
      selectedFiles: codeFiles.map((f) => f.path),
    },
    action: {
      type: 'SELECT_ALL_CODE_FILES',
      payload: { paths: codeFiles.map((f) => f.path) },
    },
  };
}

function clearFileSelection(pageState) {
  const currentSelection = pageState.selectedFiles || [];

  return {
    success: true,
    data: {
      message: `Cleared ${currentSelection.length} selected files`,
      previousCount: currentSelection.length,
    },
    action: {
      type: 'CLEAR_FILE_SELECTION',
      payload: {},
    },
  };
}

function getFileContent(path, pageState) {
  const files = pageState.availableFiles || [];
  const file = files.find((f) => f.path === path);

  if (!file) {
    return {
      success: false,
      error: `File not found: ${path}`,
    };
  }

  // Content might be stored in pageState or need to be fetched
  const content = pageState.fileContents?.[path] || file.content;

  if (!content) {
    return {
      success: false,
      error: `Content not available for: ${path}. File may need to be fetched first.`,
    };
  }

  return {
    success: true,
    data: {
      path,
      content: content.slice(0, 50000), // Limit content size
      size: content.length,
      truncated: content.length > 50000,
    },
  };
}

// ===== Configuration Implementations =====

function getCurrentConfig(pageState) {
  return {
    success: true,
    data: {
      analysisOptions: pageState.analysisOptions || {
        userStories: true,
        testCases: true,
        acceptanceCriteria: true,
        edgeCases: false,
        securityTests: false,
      },
      outputFormat: pageState.outputFormat || 'markdown',
      testFramework: pageState.testFramework || 'jest',
      additionalContext: pageState.additionalContext || '',
      selectedFiles: pageState.selectedFiles || [],
      quickAction: pageState.selectedQuickAction || null,
    },
  };
}

function setAnalysisOptions(options, pageState) {
  const validOptions = [
    'userStories',
    'testCases',
    'acceptanceCriteria',
    'edgeCases',
    'securityTests',
  ];

  const invalidOptions = Object.keys(options).filter(
    (k) => !validOptions.includes(k)
  );
  if (invalidOptions.length > 0) {
    return {
      success: false,
      error: `Invalid options: ${invalidOptions.join(', ')}. Valid options: ${validOptions.join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      message: 'Analysis options updated',
      options,
    },
    action: {
      type: 'SET_ANALYSIS_OPTIONS',
      payload: options,
    },
  };
}

function setOutputFormat(format, pageState) {
  const validFormats = [
    'markdown',
    'json',
    'html',
    'yaml',
    'csv',
    'jira',
    'testrail',
    'azure',
    'gherkin',
  ];

  if (!validFormats.includes(format)) {
    return {
      success: false,
      error: `Invalid format: ${format}. Valid formats: ${validFormats.join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      message: `Output format set to ${format}`,
      format,
    },
    action: {
      type: 'SET_OUTPUT_FORMAT',
      payload: { format },
    },
  };
}

function setTestFramework(framework, pageState) {
  const validFrameworks = ['jest', 'vitest', 'mocha', 'pytest', 'junit', 'generic'];

  if (!validFrameworks.includes(framework)) {
    return {
      success: false,
      error: `Invalid framework: ${framework}. Valid frameworks: ${validFrameworks.join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      message: `Test framework set to ${framework}`,
      framework,
    },
    action: {
      type: 'SET_TEST_FRAMEWORK',
      payload: { framework },
    },
  };
}

function setAdditionalContext(contextText, pageState) {
  return {
    success: true,
    data: {
      message: 'Additional context updated',
      contextLength: contextText.length,
    },
    action: {
      type: 'SET_ADDITIONAL_CONTEXT',
      payload: { context: contextText },
    },
  };
}

// ===== Quick Action Implementations =====

const QUICK_ACTIONS = [
  {
    id: 'unit-tests',
    name: 'Generate Unit Tests',
    description: 'Generate comprehensive unit tests for the selected code',
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: false,
    },
  },
  {
    id: 'user-stories',
    name: 'Extract User Stories',
    description: 'Extract user stories and requirements from the codebase',
    config: {
      userStories: true,
      testCases: false,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false,
    },
  },
  {
    id: 'full-analysis',
    name: 'Full QA Analysis',
    description: 'Complete analysis including all QA artifacts',
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: true,
      securityTests: true,
    },
  },
  {
    id: 'security-tests',
    name: 'Security Test Generation',
    description: 'Generate security-focused test cases',
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: false,
      securityTests: true,
    },
  },
  {
    id: 'api-tests',
    name: 'API Test Generation',
    description: 'Generate tests for API endpoints',
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: true,
      securityTests: false,
    },
  },
];

function listQuickActions() {
  return {
    success: true,
    data: {
      actions: QUICK_ACTIONS,
      count: QUICK_ACTIONS.length,
    },
  };
}

function selectQuickAction(actionId, pageState) {
  const action = QUICK_ACTIONS.find((a) => a.id === actionId);

  if (!action) {
    return {
      success: false,
      error: `Unknown quick action: ${actionId}. Available: ${QUICK_ACTIONS.map((a) => a.id).join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      message: `Quick action selected: ${action.name}`,
      action: action,
    },
    action: {
      type: 'SELECT_QUICK_ACTION',
      payload: {
        actionId,
        config: action.config,
      },
    },
  };
}

// ===== Analysis Execution Implementations =====

function startAnalysis(pageState, context) {
  // Check prerequisites
  const selectedFiles = pageState.selectedFiles || [];
  if (selectedFiles.length === 0) {
    return {
      success: false,
      error: 'No files selected. Please select files before starting analysis.',
    };
  }

  // Check if analysis is already running
  if (pageState.analysisStatus === 'running') {
    return {
      success: false,
      error: 'Analysis is already running. Please wait or cancel the current analysis.',
    };
  }

  // Check if API key is available
  if (!context.hasApiKey && !pageState.apiKey) {
    return {
      success: false,
      error: 'No API key available. Please configure your Claude API key in settings.',
    };
  }

  return {
    success: true,
    data: {
      message: 'Analysis started',
      filesCount: selectedFiles.length,
      options: pageState.analysisOptions,
    },
    action: {
      type: 'START_ANALYSIS',
      payload: {
        files: selectedFiles,
        options: pageState.analysisOptions,
        format: pageState.outputFormat,
        framework: pageState.testFramework,
        context: pageState.additionalContext,
      },
    },
  };
}

function cancelAnalysis(pageState) {
  if (pageState.analysisStatus !== 'running') {
    return {
      success: false,
      error: 'No analysis is currently running.',
    };
  }

  return {
    success: true,
    data: {
      message: 'Analysis cancellation requested',
    },
    action: {
      type: 'CANCEL_ANALYSIS',
      payload: {},
    },
  };
}

function getAnalysisStatus(pageState) {
  return {
    success: true,
    data: {
      status: pageState.analysisStatus || 'idle',
      progress: pageState.analysisProgress || 0,
      currentStep: pageState.analysisStep || null,
      startedAt: pageState.analysisStartedAt || null,
      estimatedCompletion: pageState.analysisEstimatedCompletion || null,
    },
  };
}

function getAnalysisResults(pageState) {
  if (!pageState.analysisResults) {
    return {
      success: false,
      error: 'No analysis results available. Please run an analysis first.',
    };
  }

  return {
    success: true,
    data: {
      results: pageState.analysisResults,
      completedAt: pageState.analysisCompletedAt,
      duration: pageState.analysisDuration,
      tokenUsage: pageState.analysisTokenUsage,
    },
  };
}

// ===== Utility Functions =====

function patternToRegex(pattern) {
  // Convert glob-like pattern to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export default {
  executeAnalysisTool,
};
