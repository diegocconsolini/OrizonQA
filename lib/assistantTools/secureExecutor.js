/**
 * Secure Tool Executor
 *
 * Wraps tool execution with the full 6-layer security pipeline.
 * This is the main entry point for executing AI assistant tools.
 *
 * Security Pipeline:
 * 1. Input Validation
 * 2. Permission Checking
 * 3. Rate Limiting
 * 4. Ownership Verification
 * 5. Confirmation Handling
 * 6. Audit Logging
 */

import { getToolByName } from './definitions.js';
import {
  validateInput,
  checkPermission,
  checkRateLimit,
  verifyToolOwnership,
  auditLogger,
  createConfirmation,
  verifyConfirmation,
  markExecuted,
  recordError,
  checkSuspiciousPatterns,
  InputValidationError,
  PermissionError,
  RateLimitError,
  OwnershipError,
  ConfirmationError,
  CONFIRMATION_TYPES,
} from './security/index.js';

// Import tool handlers
import { executeAnalysisTool } from './tools/analysis.js';
import { executeProjectTool } from './tools/projects.js';
import { executeTodoTool } from './tools/todos.js';
import { executeDashboardTool } from './tools/dashboard.js';
import { executeNavigationTool } from './tools/navigation.js';
import { executeSettingsTool } from './tools/settings.js';

/**
 * Tool category to handler mapping
 */
const TOOL_HANDLERS = {
  // Analysis page tools (files, config, analysis)
  list_available_files: executeAnalysisTool,
  select_file: executeAnalysisTool,
  select_files_by_pattern: executeAnalysisTool,
  select_all_code_files: executeAnalysisTool,
  clear_file_selection: executeAnalysisTool,
  get_file_content: executeAnalysisTool,
  get_current_config: executeAnalysisTool,
  set_analysis_options: executeAnalysisTool,
  set_output_format: executeAnalysisTool,
  set_test_framework: executeAnalysisTool,
  set_additional_context: executeAnalysisTool,
  select_quick_action: executeAnalysisTool,
  list_quick_actions: executeAnalysisTool,
  start_analysis: executeAnalysisTool,
  cancel_analysis: executeAnalysisTool,
  get_analysis_status: executeAnalysisTool,
  get_analysis_results: executeAnalysisTool,

  // Project tools
  list_projects: executeProjectTool,
  get_project: executeProjectTool,
  create_project: executeProjectTool,
  update_project: executeProjectTool,
  delete_project: executeProjectTool,
  get_project_stats: executeProjectTool,

  // Requirement tools
  list_requirements: executeProjectTool,
  get_requirement: executeProjectTool,
  create_requirement: executeProjectTool,
  update_requirement: executeProjectTool,
  delete_requirement: executeProjectTool,

  // Test case tools
  list_test_cases: executeProjectTool,
  get_test_case: executeProjectTool,
  create_test_case: executeProjectTool,
  update_test_case: executeProjectTool,
  delete_test_case: executeProjectTool,

  // Todo tools
  list_todos: executeTodoTool,
  get_todo: executeTodoTool,
  create_todo: executeTodoTool,
  update_todo: executeTodoTool,
  complete_todo: executeTodoTool,
  delete_todo: executeTodoTool,

  // Dashboard tools
  get_dashboard_stats: executeDashboardTool,
  get_recent_analyses: executeDashboardTool,
  get_usage_metrics: executeDashboardTool,

  // Navigation tools
  get_current_page: executeNavigationTool,
  suggest_navigation: executeNavigationTool,

  // Settings tools
  get_settings: executeSettingsTool,
  update_api_key: executeSettingsTool,
  clear_cache: executeSettingsTool,
  reset_settings: executeSettingsTool,
};

/**
 * Execute a tool with full security pipeline
 *
 * @param {object} params - Execution parameters
 * @param {string} params.toolName - Name of the tool to execute
 * @param {object} params.input - Tool input parameters
 * @param {object} params.context - Execution context (user, session, page state)
 * @param {object} params.user - User object (from session)
 * @param {string} params.sessionId - Session identifier
 * @param {string} params.ipAddress - Client IP address
 * @param {object} params.db - Database client (optional, for ownership checks)
 * @param {string} params.confirmationToken - Confirmation token (for dangerous actions)
 * @returns {Promise<object>} - Execution result
 */
export async function executeToolSecurely(params) {
  const {
    toolName,
    input = {},
    context = {},
    user = null,
    sessionId = null,
    ipAddress = null,
    db = null,
    confirmationToken = null,
  } = params;

  const userId = user?.id || 'anonymous';
  const startTime = Date.now();

  try {
    // Get tool definition
    const tool = getToolByName(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
        errorType: 'unknown_tool',
        statusCode: 400,
      };
    }

    // Log tool call attempt
    await auditLogger.logToolCall(toolName, input, userId, {
      sessionId,
      ipAddress,
      page: context.currentPage,
    });

    // ===== Layer 1: Input Validation =====
    let validatedInput = input;
    if (tool.input_schema) {
      try {
        validatedInput = validateInput(input, tool.input_schema, 'input');
      } catch (error) {
        if (error instanceof InputValidationError) {
          recordError(userId, 'validation');
          await auditLogger.logValidationError(toolName, input, error, userId);
          return {
            success: false,
            error: error.message,
            errorType: 'validation',
            statusCode: 400,
          };
        }
        throw error;
      }
    }

    // ===== Layer 2: Permission Check =====
    const permResult = checkPermission(toolName, user, { confirmed: !!confirmationToken });
    if (!permResult.allowed) {
      recordError(userId, 'permission');
      await auditLogger.logPermissionDenied(
        toolName,
        userId,
        permResult.requiredLevel,
        permResult.userLevel
      );
      return {
        success: false,
        error: permResult.reason,
        errorType: 'permission',
        statusCode: 403,
        requiredLevel: permResult.requiredLevel,
        userLevel: permResult.userLevel,
      };
    }

    // ===== Layer 3: Rate Limiting =====
    const rateResult = checkRateLimit(userId, toolName, { ipAddress });
    if (!rateResult.allowed) {
      await auditLogger.logRateLimited(toolName, userId, rateResult.retryAfter);
      return {
        success: false,
        error: rateResult.reason,
        errorType: 'rate_limit',
        statusCode: 429,
        retryAfter: rateResult.retryAfter,
      };
    }

    // Check for suspicious patterns
    const suspiciousCheck = checkSuspiciousPatterns(userId);
    if (suspiciousCheck.suspicious && suspiciousCheck.severity === 'high') {
      await auditLogger.logSuspiciousActivity(
        `Suspicious patterns: ${suspiciousCheck.patterns.join(', ')}`,
        userId,
        { patterns: suspiciousCheck.patterns }
      );
      // Log but don't block - allow security team to review
    }

    // ===== Layer 4: Ownership Verification =====
    if (db) {
      const ownershipResult = await verifyToolOwnership(toolName, validatedInput, userId, db);
      if (!ownershipResult.noVerificationRequired && !ownershipResult.isOwner) {
        recordError(userId, 'ownership');
        await auditLogger.logOwnershipDenied(
          toolName,
          ownershipResult.resourceType,
          ownershipResult.resourceId,
          userId
        );
        return {
          success: false,
          error: ownershipResult.error || 'Access denied to resource',
          errorType: 'ownership',
          statusCode: 403,
        };
      }
    }

    // ===== Layer 6: Confirmation Check (for dangerous tools) =====
    if (permResult.requiresConfirmation) {
      if (confirmationToken) {
        // Verify the confirmation token
        const verifyResult = verifyConfirmation(confirmationToken, userId, sessionId);
        if (!verifyResult.valid) {
          return {
            success: false,
            error: verifyResult.error,
            errorType: 'confirmation_invalid',
            statusCode: 400,
          };
        }
        // Token is valid, proceed with execution
      } else {
        // Create new confirmation request
        const confirmation = createConfirmation(
          toolName,
          validatedInput,
          userId,
          sessionId,
          getConfirmationType(toolName),
          permResult.confirmationMessage,
          { ipAddress }
        );

        await auditLogger.log('confirmation_required', {
          toolName,
          userId,
          metadata: { confirmationId: confirmation.id },
        });

        return {
          success: false,
          requiresConfirmation: true,
          confirmation: confirmation.toResponse(),
          errorType: 'confirmation_required',
          statusCode: 428,
        };
      }
    }

    // ===== Execute Tool =====
    const handler = TOOL_HANDLERS[toolName];
    if (!handler) {
      // Fallback to legacy executor
      const { executeTool } = await import('./executor.js');
      const result = await executeTool(toolName, validatedInput, context);
      return processResult(result, toolName, validatedInput, userId, startTime, confirmationToken);
    }

    const result = await handler(toolName, validatedInput, {
      ...context,
      user,
      userId,
      sessionId,
      db,
    });

    return processResult(result, toolName, validatedInput, userId, startTime, confirmationToken);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Tool execution error (${toolName}):`, error);

    await auditLogger.logError(toolName, input, error, userId);

    return {
      success: false,
      error: error.message || 'Tool execution failed',
      errorType: 'internal',
      statusCode: 500,
      duration,
    };
  }
}

/**
 * Process execution result and log appropriately
 */
async function processResult(result, toolName, input, userId, startTime, confirmationToken) {
  const duration = Date.now() - startTime;

  if (result.success) {
    // Mark confirmation as executed if applicable
    if (confirmationToken) {
      markExecuted(confirmationToken);
    }

    await auditLogger.logSuccess(toolName, input, result.data, userId, duration, {
      hasAction: !!result.action,
    });

    return {
      ...result,
      duration,
      statusCode: 200,
    };
  } else {
    await auditLogger.logError(toolName, input, { message: result.error }, userId);

    return {
      ...result,
      duration,
      statusCode: result.statusCode || 400,
    };
  }
}

/**
 * Get confirmation type for a tool
 */
function getConfirmationType(toolName) {
  if (toolName.startsWith('delete_') || toolName.includes('bulk_') || toolName.includes('clear_')) {
    return CONFIRMATION_TYPES.DESTRUCTIVE;
  }
  if (toolName.includes('execution') || toolName.includes('analysis')) {
    return CONFIRMATION_TYPES.RESOURCE;
  }
  if (toolName.includes('api_key') || toolName.includes('integration')) {
    return CONFIRMATION_TYPES.SENSITIVE;
  }
  return CONFIRMATION_TYPES.DESTRUCTIVE;
}

/**
 * Batch execute multiple tools
 * Useful for complex operations requiring multiple tool calls
 */
export async function executeToolsBatch(tools, params) {
  const results = [];

  for (const { toolName, input } of tools) {
    const result = await executeToolSecurely({
      ...params,
      toolName,
      input,
    });

    results.push({
      toolName,
      ...result,
    });

    // Stop on first error for dependent operations
    if (!result.success && params.stopOnError) {
      break;
    }
  }

  return {
    success: results.every(r => r.success),
    results,
    totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
  };
}

export default {
  executeToolSecurely,
  executeToolsBatch,
};
