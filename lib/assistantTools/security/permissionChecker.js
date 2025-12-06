/**
 * Permission Checker - Layer 2: Authorization & Permission Checking
 *
 * Implements a 4-level permission system for AI assistant tools.
 * Each tool has an assigned permission level, and users must have
 * sufficient permissions to execute tools.
 *
 * Permission Levels:
 * - L1: Read Only (view data, get status)
 * - L2: Read + Suggest (L1 + navigation suggestions)
 * - L3: Read + Write (L2 + modify config, select files)
 * - L4: Full Access (L3 + dangerous operations, requires confirmation)
 */

// ============================================
// Permission Level Definitions
// ============================================

export const PERMISSION_LEVELS = {
  L1: 1, // Read Only
  L2: 2, // Read + Suggest
  L3: 3, // Read + Write
  L4: 4, // Full Access
};

// Default permission level for authenticated users
export const DEFAULT_USER_LEVEL = PERMISSION_LEVELS.L3;

// Permission level for anonymous/guest users
export const GUEST_USER_LEVEL = PERMISSION_LEVELS.L1;

// ============================================
// Tool Permission Map
// ============================================

/**
 * Maps each tool to its required permission level.
 * Tools not listed default to L3 (Read + Write).
 */
export const TOOL_PERMISSIONS = {
  // ========== L1: Read Only ==========
  // These tools only read data and cannot modify state
  list_available_files: PERMISSION_LEVELS.L1,
  get_current_config: PERMISSION_LEVELS.L1,
  get_analysis_status: PERMISSION_LEVELS.L1,
  get_analysis_results: PERMISSION_LEVELS.L1,
  get_current_page: PERMISSION_LEVELS.L1,
  list_quick_actions: PERMISSION_LEVELS.L1,
  get_file_content: PERMISSION_LEVELS.L1,

  // Dashboard tools (read)
  get_dashboard_stats: PERMISSION_LEVELS.L1,
  get_recent_analyses: PERMISSION_LEVELS.L1,
  get_usage_metrics: PERMISSION_LEVELS.L1,

  // Projects tools (read)
  list_projects: PERMISSION_LEVELS.L1,
  get_project: PERMISSION_LEVELS.L1,
  get_project_stats: PERMISSION_LEVELS.L1,

  // Requirements tools (read)
  list_requirements: PERMISSION_LEVELS.L1,
  get_requirement: PERMISSION_LEVELS.L1,
  get_requirement_tests: PERMISSION_LEVELS.L1,

  // Test Cases tools (read)
  list_test_cases: PERMISSION_LEVELS.L1,
  get_test_case: PERMISSION_LEVELS.L1,
  get_test_history: PERMISSION_LEVELS.L1,

  // Executions tools (read)
  list_executions: PERMISSION_LEVELS.L1,
  get_execution: PERMISSION_LEVELS.L1,
  get_execution_logs: PERMISSION_LEVELS.L1,

  // History tools (read)
  list_analyses: PERMISSION_LEVELS.L1,
  get_analysis: PERMISSION_LEVELS.L1,
  search_analyses: PERMISSION_LEVELS.L1,

  // Todos tools (read)
  list_todos: PERMISSION_LEVELS.L1,
  get_todo: PERMISSION_LEVELS.L1,

  // Settings tools (read)
  get_settings: PERMISSION_LEVELS.L1,
  get_integrations_status: PERMISSION_LEVELS.L1,

  // ========== L2: Read + Suggest ==========
  // These tools can suggest actions but not execute them
  suggest_navigation: PERMISSION_LEVELS.L2,
  suggest_files: PERMISSION_LEVELS.L2,
  suggest_config: PERMISSION_LEVELS.L2,
  recommend_tests: PERMISSION_LEVELS.L2,

  // ========== L3: Read + Write ==========
  // These tools can modify session state (default for most tools)
  select_file: PERMISSION_LEVELS.L3,
  select_files_by_pattern: PERMISSION_LEVELS.L3,
  select_all_code_files: PERMISSION_LEVELS.L3,
  clear_file_selection: PERMISSION_LEVELS.L3,
  set_analysis_options: PERMISSION_LEVELS.L3,
  set_output_format: PERMISSION_LEVELS.L3,
  set_test_framework: PERMISSION_LEVELS.L3,
  set_additional_context: PERMISSION_LEVELS.L3,
  select_quick_action: PERMISSION_LEVELS.L3,
  cancel_analysis: PERMISSION_LEVELS.L3,

  // Projects tools (write - session scoped)
  create_project: PERMISSION_LEVELS.L3,
  update_project: PERMISSION_LEVELS.L3,

  // Requirements tools (write)
  create_requirement: PERMISSION_LEVELS.L3,
  update_requirement: PERMISSION_LEVELS.L3,

  // Test Cases tools (write)
  create_test_case: PERMISSION_LEVELS.L3,
  update_test_case: PERMISSION_LEVELS.L3,
  import_tests: PERMISSION_LEVELS.L3,

  // Todos tools (write)
  create_todo: PERMISSION_LEVELS.L3,
  update_todo: PERMISSION_LEVELS.L3,
  complete_todo: PERMISSION_LEVELS.L3,

  // Analysis tools (write - requires API key)
  start_analysis: PERMISSION_LEVELS.L3,

  // ========== L4: Full Access (Dangerous) ==========
  // These tools require explicit confirmation
  delete_project: PERMISSION_LEVELS.L4,
  delete_requirement: PERMISSION_LEVELS.L4,
  delete_test_case: PERMISSION_LEVELS.L4,
  delete_execution: PERMISSION_LEVELS.L4,
  delete_analysis: PERMISSION_LEVELS.L4,
  delete_todo: PERMISSION_LEVELS.L4,
  bulk_delete: PERMISSION_LEVELS.L4,

  // Execution tools (can consume resources)
  start_execution: PERMISSION_LEVELS.L4,
  retry_execution: PERMISSION_LEVELS.L4,

  // Settings tools (dangerous)
  update_api_key: PERMISSION_LEVELS.L4,
  clear_cache: PERMISSION_LEVELS.L4,
  reset_settings: PERMISSION_LEVELS.L4,
  disconnect_integration: PERMISSION_LEVELS.L4,

  // History tools (dangerous)
  clear_history: PERMISSION_LEVELS.L4,
  revoke_share: PERMISSION_LEVELS.L4,
};

// ============================================
// Dangerous Tools List
// ============================================

/**
 * Tools that require explicit confirmation before execution.
 * These are typically delete operations or resource-consuming actions.
 */
export const DANGEROUS_TOOLS = new Set([
  // Delete operations
  'delete_project',
  'delete_requirement',
  'delete_test_case',
  'delete_execution',
  'delete_analysis',
  'delete_todo',
  'bulk_delete',
  'clear_history',

  // Resource-consuming operations
  'start_execution',
  'retry_execution',

  // Settings operations
  'update_api_key',
  'clear_cache',
  'reset_settings',
  'disconnect_integration',
  'revoke_share',
]);

// ============================================
// Permission Checking Functions
// ============================================

/**
 * Check if a user has permission to execute a tool
 *
 * @param {string} toolName - Name of the tool to check
 * @param {object} user - User object with permissions
 * @param {object} options - Additional options
 * @returns {object} - { allowed: boolean, reason?: string, requiresConfirmation?: boolean }
 */
export function checkPermission(toolName, user = null, options = {}) {
  // Get required permission level for tool
  const requiredLevel = getToolPermissionLevel(toolName);

  // Get user's permission level
  const userLevel = getUserPermissionLevel(user);

  // Check if user has sufficient permissions
  if (userLevel < requiredLevel) {
    return {
      allowed: false,
      reason: getPermissionDeniedMessage(toolName, requiredLevel, userLevel),
      requiredLevel,
      userLevel,
    };
  }

  // Check if tool is dangerous and requires confirmation
  const isDangerous = DANGEROUS_TOOLS.has(toolName);
  if (isDangerous && !options.confirmed) {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationType: getConfirmationType(toolName),
      confirmationMessage: getConfirmationMessage(toolName),
    };
  }

  // Permission granted
  return {
    allowed: true,
    requiresConfirmation: false,
  };
}

/**
 * Get the permission level required for a tool
 */
export function getToolPermissionLevel(toolName) {
  return TOOL_PERMISSIONS[toolName] ?? PERMISSION_LEVELS.L3;
}

/**
 * Get the user's permission level
 */
export function getUserPermissionLevel(user) {
  // No user = guest
  if (!user) {
    return GUEST_USER_LEVEL;
  }

  // Check for admin/elevated permissions
  if (user.isAdmin || user.role === 'admin') {
    return PERMISSION_LEVELS.L4;
  }

  // Check for custom permission level
  if (user.permissionLevel !== undefined) {
    return Math.min(user.permissionLevel, PERMISSION_LEVELS.L4);
  }

  // Authenticated user gets default level
  return DEFAULT_USER_LEVEL;
}

/**
 * Check if a tool is dangerous
 */
export function isDangerousTool(toolName) {
  return DANGEROUS_TOOLS.has(toolName);
}

/**
 * Get permission denied message
 */
function getPermissionDeniedMessage(toolName, required, actual) {
  const levelNames = {
    [PERMISSION_LEVELS.L1]: 'Read Only',
    [PERMISSION_LEVELS.L2]: 'Read + Suggest',
    [PERMISSION_LEVELS.L3]: 'Read + Write',
    [PERMISSION_LEVELS.L4]: 'Full Access',
  };

  return `Permission denied for '${toolName}'. Requires ${levelNames[required]} (L${required}), ` +
    `but you have ${levelNames[actual]} (L${actual}).`;
}

/**
 * Get confirmation type for dangerous tool
 */
function getConfirmationType(toolName) {
  if (toolName.startsWith('delete_') || toolName.includes('bulk_delete') || toolName.includes('clear_')) {
    return 'destructive';
  }
  if (toolName.includes('execution') || toolName === 'start_analysis') {
    return 'resource';
  }
  if (toolName.includes('api_key') || toolName.includes('integration')) {
    return 'sensitive';
  }
  return 'dangerous';
}

/**
 * Get confirmation message for dangerous tool
 */
function getConfirmationMessage(toolName) {
  const messages = {
    // Delete operations
    delete_project: 'This will permanently delete the project and all associated data. This action cannot be undone.',
    delete_requirement: 'This will permanently delete the requirement and unlink all associated test cases.',
    delete_test_case: 'This will permanently delete the test case and all execution history.',
    delete_execution: 'This will permanently delete the execution record and results.',
    delete_analysis: 'This will permanently delete the analysis and its results.',
    delete_todo: 'This will permanently delete the todo item.',
    bulk_delete: 'This will permanently delete multiple items. This action cannot be undone.',
    clear_history: 'This will permanently delete all analysis history. This action cannot be undone.',

    // Execution operations
    start_execution: 'This will start a test execution which may consume API credits and resources.',
    retry_execution: 'This will re-run the test execution which may consume additional resources.',

    // Settings operations
    update_api_key: 'This will update your API key. Make sure you trust the source of this request.',
    clear_cache: 'This will clear all cached data. Some data may need to be re-fetched.',
    reset_settings: 'This will reset all settings to defaults. Your preferences will be lost.',
    disconnect_integration: 'This will disconnect the integration and may affect synced data.',
    revoke_share: 'This will revoke access to the shared link. Anyone with the link will lose access.',
  };

  return messages[toolName] || `Are you sure you want to execute '${toolName}'? This is a sensitive operation.`;
}

// ============================================
// Batch Permission Check
// ============================================

/**
 * Check permissions for multiple tools at once
 */
export function checkPermissions(toolNames, user = null) {
  const results = {};

  for (const toolName of toolNames) {
    results[toolName] = checkPermission(toolName, user);
  }

  return results;
}

/**
 * Get all tools available to a user at their permission level
 */
export function getAvailableTools(user = null) {
  const userLevel = getUserPermissionLevel(user);
  const available = [];
  const restricted = [];

  for (const [toolName, requiredLevel] of Object.entries(TOOL_PERMISSIONS)) {
    if (userLevel >= requiredLevel) {
      available.push({
        name: toolName,
        level: requiredLevel,
        dangerous: DANGEROUS_TOOLS.has(toolName),
      });
    } else {
      restricted.push({
        name: toolName,
        level: requiredLevel,
        reason: `Requires L${requiredLevel}`,
      });
    }
  }

  return { available, restricted, userLevel };
}

// ============================================
// Permission Error
// ============================================

export class PermissionError extends Error {
  constructor(message, toolName, requiredLevel, userLevel) {
    super(message);
    this.name = 'PermissionError';
    this.isPermissionError = true;
    this.statusCode = 403;
    this.toolName = toolName;
    this.requiredLevel = requiredLevel;
    this.userLevel = userLevel;
  }
}

// ============================================
// Export
// ============================================

export default {
  PERMISSION_LEVELS,
  TOOL_PERMISSIONS,
  DANGEROUS_TOOLS,
  checkPermission,
  checkPermissions,
  getToolPermissionLevel,
  getUserPermissionLevel,
  isDangerousTool,
  getAvailableTools,
  PermissionError,
};
