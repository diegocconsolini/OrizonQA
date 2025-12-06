/**
 * Security Module - Barrel Export
 *
 * Comprehensive security infrastructure for the AI Assistant Tools.
 * Implements 6-layer security architecture:
 *
 * Layer 1: Input Validation & Sanitization (inputValidator.js)
 * Layer 2: Authorization & Permission Checking (permissionChecker.js)
 * Layer 3: Rate Limiting & Abuse Prevention (rateLimiter.js)
 * Layer 4: Resource Ownership Verification (ownershipVerifier.js)
 * Layer 5: Comprehensive Audit Logging (auditLogger.js)
 * Layer 6: Dangerous Action Confirmation (confirmationManager.js)
 *
 * Usage:
 * import { validateInput, checkPermission, checkRateLimit, ... } from './security';
 */

// ============================================
// Layer 1: Input Validation
// ============================================

export {
  validateInput,
  validateString,
  validateNumber,
  validateBoolean,
  validateArray,
  validateObject,
  validatePath,
  validatePattern,
  validateUUID,
  validateEmail,
  validateURL,
  checkForInjection,
  removeControlChars,
  sanitizeHtml,
  InputValidationError,
} from './inputValidator.js';

// ============================================
// Layer 2: Permission Checking
// ============================================

export {
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
} from './permissionChecker.js';

// ============================================
// Layer 3: Rate Limiting
// ============================================

export {
  RATE_LIMITS,
  TOOL_CATEGORIES,
  checkRateLimit,
  recordError,
  checkSuspiciousPatterns,
  resetRateLimit,
  getRateLimitStatus,
  blockIp,
  unblockIp,
  cleanupExpiredEntries,
  RateLimitError,
} from './rateLimiter.js';

// ============================================
// Layer 4: Ownership Verification
// ============================================

export {
  RESOURCE_TYPES,
  TOOL_RESOURCE_MAP,
  verifyOwnership,
  verifyToolOwnership,
  verifyOwnershipBatch,
  checkSharedAccess,
  checkTeamAccess,
  OwnershipError,
} from './ownershipVerifier.js';

// ============================================
// Layer 5: Audit Logging
// ============================================

export {
  auditLogger,
  AuditLogger,
  LOG_CATEGORIES,
  LOG_LEVELS,
} from './auditLogger.js';

// ============================================
// Layer 6: Confirmation Management
// ============================================

export {
  CONFIRMATION_TYPES,
  createConfirmation,
  verifyConfirmation,
  confirmRequest,
  denyConfirmation,
  markExecuted,
  cancelConfirmation,
  getUserPendingConfirmations,
  getConfirmation,
  cleanupExpiredConfirmations,
  persistConfirmation,
  updateConfirmationStatus,
  ConfirmationError,
} from './confirmationManager.js';

// ============================================
// Combined Security Pipeline
// ============================================

/**
 * Execute the full security pipeline for a tool call.
 *
 * This function runs all security checks in order:
 * 1. Input validation
 * 2. Permission checking
 * 3. Rate limiting
 * 4. Ownership verification (if applicable)
 * 5. Confirmation handling (for dangerous tools)
 * 6. Audit logging
 *
 * @param {object} params - Security check parameters
 * @param {string} params.toolName - Name of the tool
 * @param {object} params.input - Tool input parameters
 * @param {object} params.inputSchema - Tool input schema for validation
 * @param {object} params.user - User object
 * @param {string} params.sessionId - Session identifier
 * @param {string} params.ipAddress - Client IP address
 * @param {object} params.db - Database client (for ownership checks)
 * @param {string} params.confirmationToken - Confirmation token (for dangerous actions)
 * @returns {Promise<object>} - Security check result
 */
export async function runSecurityPipeline(params) {
  const {
    toolName,
    input,
    inputSchema,
    user,
    sessionId,
    ipAddress,
    db,
    confirmationToken,
  } = params;

  const userId = user?.id || 'anonymous';
  const startTime = Date.now();

  // Import functions (avoiding circular dependencies)
  const { validateInput } = await import('./inputValidator.js');
  const { checkPermission, isDangerousTool } = await import('./permissionChecker.js');
  const { checkRateLimit, recordError: recordRateLimitError, checkSuspiciousPatterns } = await import('./rateLimiter.js');
  const { verifyToolOwnership } = await import('./ownershipVerifier.js');
  const { auditLogger } = await import('./auditLogger.js');
  const {
    createConfirmation,
    verifyConfirmation,
    markExecuted,
    CONFIRMATION_TYPES,
  } = await import('./confirmationManager.js');

  try {
    // Log tool call attempt
    await auditLogger.logToolCall(toolName, input, userId, {
      sessionId,
      ipAddress,
    });

    // ===== Layer 1: Input Validation =====
    let validatedInput = input;
    if (inputSchema) {
      try {
        validatedInput = validateInput(input, inputSchema, 'input');
      } catch (error) {
        recordRateLimitError(userId, 'validation');
        await auditLogger.logValidationError(toolName, input, error, userId);
        return {
          allowed: false,
          error: error.message,
          errorType: 'validation',
          statusCode: 400,
        };
      }
    }

    // ===== Layer 2: Permission Checking =====
    const permissionResult = checkPermission(toolName, user);
    if (!permissionResult.allowed) {
      recordRateLimitError(userId, 'permission');
      await auditLogger.logPermissionDenied(
        toolName,
        userId,
        permissionResult.requiredLevel,
        permissionResult.userLevel
      );
      return {
        allowed: false,
        error: permissionResult.reason,
        errorType: 'permission',
        statusCode: 403,
      };
    }

    // ===== Layer 3: Rate Limiting =====
    const rateLimitResult = checkRateLimit(userId, toolName, { ipAddress });
    if (!rateLimitResult.allowed) {
      await auditLogger.logRateLimited(
        toolName,
        userId,
        rateLimitResult.retryAfter
      );
      return {
        allowed: false,
        error: rateLimitResult.reason,
        errorType: 'rate_limit',
        statusCode: 429,
        retryAfter: rateLimitResult.retryAfter,
      };
    }

    // Check for suspicious patterns
    const suspiciousCheck = checkSuspiciousPatterns(userId);
    if (suspiciousCheck.suspicious && suspiciousCheck.severity === 'high') {
      await auditLogger.logSuspiciousActivity(
        `Suspicious patterns detected: ${suspiciousCheck.patterns.join(', ')}`,
        userId,
        { patterns: suspiciousCheck.patterns }
      );
      // Don't block, but flag for review
    }

    // ===== Layer 4: Ownership Verification =====
    if (db) {
      const ownershipResult = await verifyToolOwnership(
        toolName,
        validatedInput,
        userId,
        db
      );

      if (!ownershipResult.noVerificationRequired && !ownershipResult.isOwner) {
        recordRateLimitError(userId, 'ownership');
        await auditLogger.logOwnershipDenied(
          toolName,
          ownershipResult.resourceType,
          ownershipResult.resourceId,
          userId
        );
        return {
          allowed: false,
          error: ownershipResult.error || 'Access denied to resource',
          errorType: 'ownership',
          statusCode: 403,
        };
      }
    }

    // ===== Layer 6: Confirmation (for dangerous tools) =====
    if (isDangerousTool(toolName)) {
      // Check if confirmation token provided
      if (confirmationToken) {
        const confirmResult = verifyConfirmation(confirmationToken, userId, sessionId);
        if (!confirmResult.valid) {
          return {
            allowed: false,
            error: confirmResult.error,
            errorType: 'confirmation',
            statusCode: 428,
          };
        }

        // Mark as executed after successful verification
        // (actual execution happens in the caller)
        confirmResult.request.confirm();
      } else {
        // Create confirmation request
        const confirmationType = getConfirmationType(toolName);
        const confirmationMessage = permissionResult.confirmationMessage || `Confirm execution of ${toolName}?`;

        const confirmation = createConfirmation(
          toolName,
          validatedInput,
          userId,
          sessionId,
          confirmationType,
          confirmationMessage,
          { ipAddress }
        );

        await auditLogger.logConfirmationRequired(toolName, userId, confirmation.id);

        return {
          allowed: false,
          requiresConfirmation: true,
          confirmation: confirmation.toResponse(),
          errorType: 'confirmation_required',
          statusCode: 428,
        };
      }
    }

    // ===== All checks passed =====
    const duration = Date.now() - startTime;

    return {
      allowed: true,
      validatedInput,
      user,
      duration,
      confirmationToken: confirmationToken || null,
    };

  } catch (error) {
    // Unexpected error
    await auditLogger.logError(toolName, input, error, userId);

    return {
      allowed: false,
      error: 'Security check failed',
      errorType: 'internal',
      statusCode: 500,
    };
  }
}

/**
 * Helper to get confirmation type for a tool
 */
function getConfirmationType(toolName) {
  const { CONFIRMATION_TYPES } = require('./confirmationManager.js');

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

// ============================================
// Default Export
// ============================================

export default {
  // Pipeline
  runSecurityPipeline,

  // Re-export all security modules
  inputValidator: () => import('./inputValidator.js'),
  permissionChecker: () => import('./permissionChecker.js'),
  rateLimiter: () => import('./rateLimiter.js'),
  ownershipVerifier: () => import('./ownershipVerifier.js'),
  auditLogger: () => import('./auditLogger.js'),
  confirmationManager: () => import('./confirmationManager.js'),
};
