/**
 * Audit Logger - Layer 5: Comprehensive Audit Logging
 *
 * Logs all tool executions for security monitoring, debugging, and compliance.
 * Supports multiple storage backends and structured log formats.
 *
 * Log Categories:
 * - TOOL_CALL: Tool execution attempts
 * - PERMISSION_DENIED: Permission check failures
 * - OWNERSHIP_DENIED: Ownership verification failures
 * - RATE_LIMITED: Rate limit violations
 * - VALIDATION_ERROR: Input validation failures
 * - CONFIRMATION_REQUIRED: Dangerous action confirmations
 * - EXECUTION_SUCCESS: Successful tool executions
 * - EXECUTION_ERROR: Tool execution errors
 */

// ============================================
// Log Categories
// ============================================

export const LOG_CATEGORIES = {
  TOOL_CALL: 'tool_call',
  PERMISSION_DENIED: 'permission_denied',
  OWNERSHIP_DENIED: 'ownership_denied',
  RATE_LIMITED: 'rate_limited',
  VALIDATION_ERROR: 'validation_error',
  CONFIRMATION_REQUIRED: 'confirmation_required',
  CONFIRMATION_GRANTED: 'confirmation_granted',
  CONFIRMATION_DENIED: 'confirmation_denied',
  EXECUTION_SUCCESS: 'execution_success',
  EXECUTION_ERROR: 'execution_error',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
};

// ============================================
// Log Levels
// ============================================

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Category to level mapping
const CATEGORY_LEVELS = {
  [LOG_CATEGORIES.TOOL_CALL]: LOG_LEVELS.INFO,
  [LOG_CATEGORIES.PERMISSION_DENIED]: LOG_LEVELS.WARN,
  [LOG_CATEGORIES.OWNERSHIP_DENIED]: LOG_LEVELS.WARN,
  [LOG_CATEGORIES.RATE_LIMITED]: LOG_LEVELS.WARN,
  [LOG_CATEGORIES.VALIDATION_ERROR]: LOG_LEVELS.WARN,
  [LOG_CATEGORIES.CONFIRMATION_REQUIRED]: LOG_LEVELS.INFO,
  [LOG_CATEGORIES.CONFIRMATION_GRANTED]: LOG_LEVELS.INFO,
  [LOG_CATEGORIES.CONFIRMATION_DENIED]: LOG_LEVELS.INFO,
  [LOG_CATEGORIES.EXECUTION_SUCCESS]: LOG_LEVELS.INFO,
  [LOG_CATEGORIES.EXECUTION_ERROR]: LOG_LEVELS.ERROR,
  [LOG_CATEGORIES.SUSPICIOUS_ACTIVITY]: LOG_LEVELS.CRITICAL,
};

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Minimum log level to record
  minLevel: LOG_LEVELS.INFO,

  // Enable database logging
  enableDbLogging: true,

  // Enable console logging
  enableConsoleLogging: process.env.NODE_ENV !== 'production',

  // Max input size to log (truncate if longer)
  maxInputLength: 1000,

  // Max result size to log
  maxResultLength: 500,

  // Sensitive fields to redact
  sensitiveFields: ['apiKey', 'password', 'token', 'secret', 'credential', 'authorization'],

  // Retention period in days
  retentionDays: 90,
};

// ============================================
// Main Logger Class
// ============================================

class AuditLogger {
  constructor(db = null) {
    this.db = db;
    this.buffer = [];
    this.flushInterval = null;
  }

  /**
   * Set database connection
   */
  setDatabase(db) {
    this.db = db;
  }

  /**
   * Log a tool execution event
   */
  async log(category, data) {
    const entry = this.createLogEntry(category, data);

    // Console logging
    if (CONFIG.enableConsoleLogging) {
      this.consoleLog(entry);
    }

    // Database logging
    if (CONFIG.enableDbLogging && this.db) {
      await this.dbLog(entry);
    }

    return entry;
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(category, data) {
    const level = CATEGORY_LEVELS[category] ?? LOG_LEVELS.INFO;

    // Skip if below minimum level
    if (level < CONFIG.minLevel) {
      return null;
    }

    const entry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      category,
      level,
      levelName: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level),

      // User info
      userId: data.userId || null,
      sessionId: data.sessionId || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,

      // Tool info
      toolName: data.toolName || null,
      input: this.sanitizeInput(data.input),
      result: this.truncateResult(data.result),

      // Outcome
      success: data.success ?? null,
      error: data.error || null,
      errorType: data.errorType || null,

      // Context
      page: data.page || null,
      duration: data.duration || null,
      metadata: data.metadata || {},
    };

    return entry;
  }

  /**
   * Sanitize input by redacting sensitive fields
   */
  sanitizeInput(input) {
    if (!input) return null;

    const sanitized = JSON.stringify(input, (key, value) => {
      // Redact sensitive fields
      if (CONFIG.sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        return '[REDACTED]';
      }
      return value;
    });

    // Truncate if too long
    if (sanitized.length > CONFIG.maxInputLength) {
      return sanitized.slice(0, CONFIG.maxInputLength) + '...[TRUNCATED]';
    }

    return sanitized;
  }

  /**
   * Truncate result for logging
   */
  truncateResult(result) {
    if (!result) return null;

    const str = typeof result === 'string' ? result : JSON.stringify(result);
    if (str.length > CONFIG.maxResultLength) {
      return str.slice(0, CONFIG.maxResultLength) + '...[TRUNCATED]';
    }
    return str;
  }

  /**
   * Log to console
   */
  consoleLog(entry) {
    if (!entry) return;

    const prefix = `[${entry.timestamp}] [${entry.levelName}] [${entry.category}]`;
    const message = `${prefix} Tool: ${entry.toolName || 'N/A'}, User: ${entry.userId || 'anonymous'}`;

    switch (entry.level) {
      case LOG_LEVELS.DEBUG:
        console.debug(message, entry);
        break;
      case LOG_LEVELS.INFO:
        console.info(message);
        break;
      case LOG_LEVELS.WARN:
        console.warn(message, entry.error || '');
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.CRITICAL:
        console.error(message, entry.error || '', entry);
        break;
    }
  }

  /**
   * Log to database
   */
  async dbLog(entry) {
    if (!entry || !this.db) return;

    try {
      await this.db.query(
        `INSERT INTO ai_action_log (
          id, timestamp, category, level, user_id, session_id,
          tool_name, input, result, success, error, error_type,
          page, duration, ip_address, user_agent, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          entry.id,
          entry.timestamp,
          entry.category,
          entry.level,
          entry.userId,
          entry.sessionId,
          entry.toolName,
          entry.input,
          entry.result,
          entry.success,
          entry.error,
          entry.errorType,
          entry.page,
          entry.duration,
          entry.ipAddress,
          entry.userAgent,
          JSON.stringify(entry.metadata),
        ]
      );
    } catch (error) {
      console.error('Failed to write audit log to database:', error);
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  /**
   * Log tool call attempt
   */
  async logToolCall(toolName, input, userId, metadata = {}) {
    return this.log(LOG_CATEGORIES.TOOL_CALL, {
      toolName,
      input,
      userId,
      metadata,
    });
  }

  /**
   * Log successful execution
   */
  async logSuccess(toolName, input, result, userId, duration, metadata = {}) {
    return this.log(LOG_CATEGORIES.EXECUTION_SUCCESS, {
      toolName,
      input,
      result,
      userId,
      success: true,
      duration,
      metadata,
    });
  }

  /**
   * Log execution error
   */
  async logError(toolName, input, error, userId, metadata = {}) {
    return this.log(LOG_CATEGORIES.EXECUTION_ERROR, {
      toolName,
      input,
      userId,
      success: false,
      error: error.message || String(error),
      errorType: error.name || 'Error',
      metadata,
    });
  }

  /**
   * Log permission denied
   */
  async logPermissionDenied(toolName, userId, requiredLevel, userLevel, metadata = {}) {
    return this.log(LOG_CATEGORIES.PERMISSION_DENIED, {
      toolName,
      userId,
      success: false,
      error: `Permission denied: requires L${requiredLevel}, user has L${userLevel}`,
      errorType: 'PermissionError',
      metadata: { ...metadata, requiredLevel, userLevel },
    });
  }

  /**
   * Log ownership denied
   */
  async logOwnershipDenied(toolName, resourceType, resourceId, userId, metadata = {}) {
    return this.log(LOG_CATEGORIES.OWNERSHIP_DENIED, {
      toolName,
      userId,
      success: false,
      error: `Ownership denied for ${resourceType}:${resourceId}`,
      errorType: 'OwnershipError',
      metadata: { ...metadata, resourceType, resourceId },
    });
  }

  /**
   * Log rate limit violation
   */
  async logRateLimited(toolName, userId, retryAfter, metadata = {}) {
    return this.log(LOG_CATEGORIES.RATE_LIMITED, {
      toolName,
      userId,
      success: false,
      error: `Rate limited. Retry after ${retryAfter}s`,
      errorType: 'RateLimitError',
      metadata: { ...metadata, retryAfter },
    });
  }

  /**
   * Log validation error
   */
  async logValidationError(toolName, input, error, userId, metadata = {}) {
    return this.log(LOG_CATEGORIES.VALIDATION_ERROR, {
      toolName,
      input,
      userId,
      success: false,
      error: error.message || String(error),
      errorType: 'ValidationError',
      metadata,
    });
  }

  /**
   * Log confirmation required
   */
  async logConfirmationRequired(toolName, userId, confirmationId, metadata = {}) {
    return this.log(LOG_CATEGORIES.CONFIRMATION_REQUIRED, {
      toolName,
      userId,
      metadata: { ...metadata, confirmationId },
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(description, userId, metadata = {}) {
    return this.log(LOG_CATEGORIES.SUSPICIOUS_ACTIVITY, {
      userId,
      error: description,
      metadata,
    });
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get recent logs for a user
   */
  async getUserLogs(userId, limit = 100, offset = 0) {
    if (!this.db) return [];

    const result = await this.db.query(
      `SELECT * FROM ai_action_log
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get logs by category
   */
  async getLogsByCategory(category, limit = 100, offset = 0) {
    if (!this.db) return [];

    const result = await this.db.query(
      `SELECT * FROM ai_action_log
       WHERE category = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [category, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get security-relevant logs (warnings and above)
   */
  async getSecurityLogs(limit = 100, offset = 0) {
    if (!this.db) return [];

    const result = await this.db.query(
      `SELECT * FROM ai_action_log
       WHERE level >= $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [LOG_LEVELS.WARN, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId = null, days = 30) {
    if (!this.db) return null;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    let query = `
      SELECT
        tool_name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed,
        AVG(duration) as avg_duration
      FROM ai_action_log
      WHERE timestamp >= $1
    `;

    const params = [dateThreshold.toISOString()];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    query += ' GROUP BY tool_name ORDER BY total_calls DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Cleanup old logs
   */
  async cleanupOldLogs() {
    if (!this.db) return;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - CONFIG.retentionDays);

    await this.db.query(
      'DELETE FROM ai_action_log WHERE timestamp < $1',
      [threshold.toISOString()]
    );
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate unique log ID
 */
function generateLogId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `log_${timestamp}_${random}`;
}

// ============================================
// Singleton Instance
// ============================================

const auditLogger = new AuditLogger();

// ============================================
// Export
// ============================================

export {
  auditLogger,
  AuditLogger,
  LOG_CATEGORIES,
  LOG_LEVELS,
};

export default auditLogger;
