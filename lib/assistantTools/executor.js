/**
 * Tool Executor
 *
 * Executes validated tool calls against the session context.
 * Returns results that can be sent back to Claude for continuation.
 */

import { validateToolCall, ValidationError } from './validator.js';
import { QUICK_ACTION_CONFIGS } from './definitions.js';

/**
 * Execute a tool call
 *
 * @param {string} toolName - Name of the tool to execute
 * @param {object} input - Tool input parameters
 * @param {object} context - Session context from the client
 * @returns {object} Result with success/error and data
 */
export async function executeTool(toolName, input, context) {
  try {
    // Validate first
    validateToolCall(toolName, input || {});

    // Execute based on tool name
    switch (toolName) {
      // ================================
      // File Selection Tools
      // ================================

      case 'list_available_files':
        return listAvailableFiles(input, context);

      case 'select_file':
        return selectFile(input, context);

      case 'select_files_by_pattern':
        return selectFilesByPattern(input, context);

      case 'select_all_code_files':
        return selectAllCodeFiles(input, context);

      case 'clear_file_selection':
        return clearFileSelection(context);

      case 'get_file_content':
        return getFileContent(input, context);

      // ================================
      // Configuration Tools
      // ================================

      case 'get_current_config':
        return getCurrentConfig(context);

      case 'set_analysis_options':
        return setAnalysisOptions(input, context);

      case 'set_output_format':
        return setOutputFormat(input, context);

      case 'set_test_framework':
        return setTestFramework(input, context);

      case 'set_additional_context':
        return setAdditionalContext(input, context);

      // ================================
      // Analysis Tools
      // ================================

      case 'start_analysis':
        return startAnalysis(input, context);

      case 'cancel_analysis':
        return cancelAnalysis(context);

      case 'get_analysis_status':
        return getAnalysisStatus(context);

      case 'get_analysis_results':
        return getAnalysisResults(input, context);

      // ================================
      // Navigation Tools
      // ================================

      case 'get_current_page':
        return getCurrentPage(context);

      case 'suggest_navigation':
        return suggestNavigation(input, context);

      // ================================
      // Quick Action Tools
      // ================================

      case 'select_quick_action':
        return selectQuickAction(input, context);

      case 'list_quick_actions':
        return listQuickActions();

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        isValidationError: true,
      };
    }

    console.error(`Tool execution error (${toolName}):`, error);
    return {
      success: false,
      error: error.message || 'Tool execution failed',
    };
  }
}

// ============================================
// File Selection Implementations
// ============================================

function listAvailableFiles(input, context) {
  const { fileTree = [], selectedRepo } = context;

  if (!fileTree || fileTree.length === 0) {
    return {
      success: true,
      data: {
        files: [],
        message: 'No files available. Please select a repository or upload files first.',
      },
    };
  }

  let files = flattenFileTree(fileTree);

  // Apply filter if provided
  if (input.filter) {
    files = files.filter((f) => f.path.endsWith(input.filter));
  }

  // Apply directory filter if provided
  if (input.directory) {
    const dir = input.directory.endsWith('/') ? input.directory : input.directory + '/';
    files = files.filter((f) => f.path.startsWith(dir));
  }

  return {
    success: true,
    data: {
      repository: selectedRepo?.name || 'uploaded files',
      totalFiles: files.length,
      files: files.slice(0, 100).map((f) => f.path), // Limit to 100
    },
  };
}

function selectFile(input, context) {
  const { fileTree = [], selectedFiles = [] } = context;
  const { path } = input;

  // Check if file exists in tree
  const files = flattenFileTree(fileTree);
  const fileExists = files.some((f) => f.path === path);

  if (!fileExists) {
    return {
      success: false,
      error: `File not found: ${path}`,
      availableHint: 'Use list_available_files to see available files',
    };
  }

  // Check if already selected
  if (selectedFiles.includes(path)) {
    return {
      success: true,
      data: {
        message: `File already selected: ${path}`,
        selectedCount: selectedFiles.length,
      },
      action: null, // No action needed
    };
  }

  return {
    success: true,
    data: {
      message: `Selected: ${path}`,
      selectedCount: selectedFiles.length + 1,
    },
    action: {
      type: 'SELECT_FILE',
      payload: { path },
    },
  };
}

function selectFilesByPattern(input, context) {
  const { fileTree = [], selectedFiles = [] } = context;
  const { pattern, maxFiles = 50 } = input;

  const files = flattenFileTree(fileTree);
  const regex = globToRegex(pattern);

  const matchingFiles = files
    .filter((f) => regex.test(f.path))
    .slice(0, Math.min(maxFiles, 100));

  if (matchingFiles.length === 0) {
    return {
      success: true,
      data: {
        message: `No files match pattern: ${pattern}`,
        matchCount: 0,
      },
    };
  }

  const paths = matchingFiles.map((f) => f.path);

  return {
    success: true,
    data: {
      message: `Found ${matchingFiles.length} files matching "${pattern}"`,
      matchCount: matchingFiles.length,
      files: paths,
    },
    action: {
      type: 'SELECT_FILES_BATCH',
      payload: { paths },
    },
  };
}

function selectAllCodeFiles(input, context) {
  const { fileTree = [] } = context;
  const { maxFiles = 50 } = input;

  const files = flattenFileTree(fileTree);

  // Filter to code files only
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.rb', '.php', '.cs', '.cpp', '.c', '.h'];
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'coverage'];

  const codeFiles = files.filter((f) => {
    // Check extension
    const hasCodeExt = codeExtensions.some((ext) => f.path.endsWith(ext));
    if (!hasCodeExt) return false;

    // Check excluded directories
    const inExcludedDir = excludeDirs.some((dir) => f.path.includes(`/${dir}/`) || f.path.startsWith(`${dir}/`));
    if (inExcludedDir) return false;

    return true;
  });

  const selectedFiles = codeFiles.slice(0, Math.min(maxFiles, 100));
  const paths = selectedFiles.map((f) => f.path);

  return {
    success: true,
    data: {
      message: `Selected ${selectedFiles.length} code files`,
      selectedCount: selectedFiles.length,
      totalCodeFiles: codeFiles.length,
      files: paths,
    },
    action: {
      type: 'SELECT_FILES_BATCH',
      payload: { paths },
    },
  };
}

function clearFileSelection(context) {
  const { selectedFiles = [] } = context;

  return {
    success: true,
    data: {
      message: `Cleared ${selectedFiles.length} selected files`,
      previousCount: selectedFiles.length,
    },
    action: {
      type: 'CLEAR_SELECTION',
    },
  };
}

function getFileContent(input, context) {
  const { fileTree = [], fileContents = {} } = context;
  const { path, maxLines = 100 } = input;

  // Check if file exists
  const files = flattenFileTree(fileTree);
  const fileExists = files.some((f) => f.path === path);

  if (!fileExists) {
    return {
      success: false,
      error: `File not found: ${path}`,
    };
  }

  // Check if content is available
  const content = fileContents[path];
  if (!content) {
    return {
      success: true,
      data: {
        message: 'File content not yet loaded. It will be available after analysis starts.',
        path,
        contentAvailable: false,
      },
    };
  }

  // Truncate to maxLines
  const lines = content.split('\n');
  const truncated = lines.slice(0, Math.min(maxLines, 500)).join('\n');

  return {
    success: true,
    data: {
      path,
      content: truncated,
      totalLines: lines.length,
      truncated: lines.length > maxLines,
    },
  };
}

// ============================================
// Configuration Implementations
// ============================================

function getCurrentConfig(context) {
  const { config = {} } = context;

  return {
    success: true,
    data: {
      config: {
        userStories: config.userStories ?? true,
        testCases: config.testCases ?? true,
        acceptanceCriteria: config.acceptanceCriteria ?? true,
        edgeCases: config.edgeCases ?? false,
        securityTests: config.securityTests ?? false,
        outputFormat: config.outputFormat ?? 'markdown',
        testFramework: config.testFramework ?? 'generic',
        additionalContext: config.additionalContext ?? '',
      },
    },
  };
}

function setAnalysisOptions(input, context) {
  const updates = {};
  const fields = ['userStories', 'testCases', 'acceptanceCriteria', 'edgeCases', 'securityTests'];

  for (const field of fields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  const changedFields = Object.keys(updates);

  return {
    success: true,
    data: {
      message: changedFields.length > 0
        ? `Updated: ${changedFields.join(', ')}`
        : 'No changes made',
      updates,
    },
    action: {
      type: 'UPDATE_CONFIG',
      payload: updates,
    },
  };
}

function setOutputFormat(input, context) {
  const { format } = input;

  return {
    success: true,
    data: {
      message: `Output format set to: ${format}`,
      format,
    },
    action: {
      type: 'UPDATE_CONFIG',
      payload: { outputFormat: format },
    },
  };
}

function setTestFramework(input, context) {
  const { framework } = input;

  return {
    success: true,
    data: {
      message: `Test framework set to: ${framework}`,
      framework,
    },
    action: {
      type: 'UPDATE_CONFIG',
      payload: { testFramework: framework },
    },
  };
}

function setAdditionalContext(input, context) {
  const { context: additionalContext } = input;

  return {
    success: true,
    data: {
      message: 'Additional context updated',
      contextLength: additionalContext.length,
    },
    action: {
      type: 'UPDATE_CONFIG',
      payload: { additionalContext },
    },
  };
}

// ============================================
// Analysis Implementations
// ============================================

function startAnalysis(input, context) {
  const { selectedFiles = [], canAnalyze = false, hasApiKey = false } = context;

  if (!hasApiKey) {
    return {
      success: false,
      error: 'API key not configured. Please add your Claude API key in Settings.',
    };
  }

  if (selectedFiles.length === 0) {
    return {
      success: false,
      error: 'No files selected. Please select files for analysis first.',
    };
  }

  if (!canAnalyze) {
    return {
      success: false,
      error: 'Cannot start analysis. Please ensure all requirements are met.',
    };
  }

  return {
    success: true,
    data: {
      message: `Starting analysis of ${selectedFiles.length} files...`,
      fileCount: selectedFiles.length,
    },
    action: {
      type: 'START_ANALYSIS',
    },
  };
}

function cancelAnalysis(context) {
  const { isAnalyzing = false } = context;

  if (!isAnalyzing) {
    return {
      success: true,
      data: {
        message: 'No analysis is currently running',
      },
    };
  }

  return {
    success: true,
    data: {
      message: 'Cancelling analysis...',
    },
    action: {
      type: 'CANCEL_ANALYSIS',
    },
  };
}

function getAnalysisStatus(context) {
  const { isAnalyzing = false, isComplete = false, progress = {}, error } = context;

  return {
    success: true,
    data: {
      status: isAnalyzing ? 'analyzing' : isComplete ? 'complete' : error ? 'error' : 'idle',
      isAnalyzing,
      isComplete,
      progress: {
        current: progress.current || 0,
        total: progress.total || 0,
        percentage: progress.percentage || 0,
      },
      error: error || null,
    },
  };
}

function getAnalysisResults(input, context) {
  const { results = {}, isComplete = false } = context;
  const { section = 'all', maxLength = 5000 } = input;

  if (!isComplete) {
    return {
      success: false,
      error: 'Analysis not complete yet',
    };
  }

  let data = {};
  const limit = Math.min(maxLength, 10000);

  if (section === 'all' || section === 'testCases') {
    data.testCases = truncateString(results.testCases || '', limit);
  }
  if (section === 'all' || section === 'userStories') {
    data.userStories = truncateString(results.userStories || '', limit);
  }
  if (section === 'all' || section === 'acceptanceCriteria') {
    data.acceptanceCriteria = truncateString(results.acceptanceCriteria || '', limit);
  }

  return {
    success: true,
    data: {
      section,
      results: data,
      truncated: Object.values(data).some((v) => v.length === limit),
    },
  };
}

// ============================================
// Navigation Implementations
// ============================================

function getCurrentPage(context) {
  const { currentPage = '/analyze-v2', selectedRepo, selectedFiles = [], isAnalyzing = false, isComplete = false } = context;

  return {
    success: true,
    data: {
      page: currentPage,
      state: {
        hasRepo: !!selectedRepo,
        repoName: selectedRepo?.name || null,
        selectedFileCount: selectedFiles.length,
        isAnalyzing,
        isComplete,
      },
    },
  };
}

function suggestNavigation(input, context) {
  const { page, reason } = input;

  return {
    success: true,
    data: {
      suggestion: {
        page,
        reason: reason || getDefaultNavigationReason(page),
        type: 'navigation_suggestion',
      },
      message: `I suggest navigating to ${page}${reason ? `: ${reason}` : ''}`,
    },
    // NOTE: Does not include action - user must click to navigate
  };
}

function getDefaultNavigationReason(page) {
  const reasons = {
    '/analyze': 'Use the original analysis page with more options',
    '/analyze-v2': 'Use the new chat-based analysis interface',
    '/execute': 'Execute generated tests',
    '/reports': 'View test execution reports',
    '/projects': 'Manage projects and requirements',
    '/settings': 'Configure API keys and preferences',
    '/history': 'View past analyses',
  };
  return reasons[page] || '';
}

// ============================================
// Quick Action Implementations
// ============================================

function selectQuickAction(input, context) {
  const { action } = input;

  const config = QUICK_ACTION_CONFIGS[action];
  if (!config) {
    return {
      success: false,
      error: `Unknown quick action: ${action}`,
    };
  }

  return {
    success: true,
    data: {
      message: `Selected quick action: ${config.label}`,
      action,
      config: config.config,
      description: config.description,
    },
    action: {
      type: 'SELECT_QUICK_ACTION',
      payload: {
        action,
        config: config.config,
      },
    },
  };
}

function listQuickActions() {
  const actions = Object.entries(QUICK_ACTION_CONFIGS).map(([id, config]) => ({
    id,
    label: config.label,
    description: config.description,
  }));

  return {
    success: true,
    data: {
      actions,
    },
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Flatten file tree to array of files
 */
function flattenFileTree(tree) {
  if (!Array.isArray(tree)) return [];

  const files = [];

  function traverse(nodes, parentPath = '') {
    for (const node of nodes) {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

      if (node.type === 'file') {
        files.push({ path: node.path || fullPath, name: node.name });
      } else if (node.type === 'directory' && node.children) {
        traverse(node.children, fullPath);
      }
    }
  }

  traverse(tree);
  return files;
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR>>/g, '.*');

  return new RegExp(`^${escaped}$`);
}

/**
 * Truncate string to max length
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength);
}

export default { executeTool };
