/**
 * Enhanced Rate Limiter - Layer 3: Rate Limiting & Abuse Prevention
 *
 * Advanced rate limiting with abuse detection and progressive penalties.
 * Prevents API abuse, protects resources, and detects suspicious patterns.
 *
 * Features:
 * - Per-user, per-tool rate limits
 * - Sliding window algorithm
 * - Burst protection
 * - Progressive penalties for repeat offenders
 * - Suspicious pattern detection
 * - IP-based rate limiting
 * - Global rate limits
 */

// ============================================
// Rate Limit Configurations
// ============================================

/**
 * Rate limits by tool category.
 * windowMs: Time window in milliseconds
 * max: Maximum requests in window
 * burstMax: Maximum burst requests (shorter window)
 * burstWindowMs: Burst window in milliseconds
 */
export const RATE_LIMITS = {
  // ========== L1: Read-only tools (generous limits) ==========
  read: {
    windowMs: 60000,      // 1 minute
    max: 60,              // 60 per minute
    burstMax: 10,         // 10 per burst
    burstWindowMs: 1000,  // 1 second
  },

  // ========== L2: Suggestion tools ==========
  suggest: {
    windowMs: 60000,
    max: 30,
    burstMax: 5,
    burstWindowMs: 1000,
  },

  // ========== L3: Write tools (moderate limits) ==========
  write: {
    windowMs: 60000,
    max: 20,
    burstMax: 3,
    burstWindowMs: 1000,
  },

  // ========== L4: Dangerous tools (strict limits) ==========
  dangerous: {
    windowMs: 300000,     // 5 minutes
    max: 5,               // 5 per 5 minutes
    burstMax: 1,          // 1 per burst
    burstWindowMs: 5000,  // 5 seconds
  },

  // ========== Analysis tools (expensive operations) ==========
  analysis: {
    windowMs: 60000,
    max: 3,               // 3 analyses per minute
    burstMax: 1,
    burstWindowMs: 10000, // 10 seconds between analyses
  },

  // ========== Execution tools (resource-intensive) ==========
  execution: {
    windowMs: 300000,     // 5 minutes
    max: 3,               // 3 executions per 5 minutes
    burstMax: 1,
    burstWindowMs: 30000, // 30 seconds between executions
  },

  // ========== Default ==========
  default: {
    windowMs: 60000,
    max: 30,
    burstMax: 5,
    burstWindowMs: 1000,
  },
};

/**
 * Tool to category mapping
 */
export const TOOL_CATEGORIES = {
  // Read tools
  list_available_files: 'read',
  get_current_config: 'read',
  get_analysis_status: 'read',
  get_analysis_results: 'read',
  get_current_page: 'read',
  list_quick_actions: 'read',
  get_file_content: 'read',
  list_projects: 'read',
  get_project: 'read',
  list_requirements: 'read',
  get_requirement: 'read',
  list_test_cases: 'read',
  get_test_case: 'read',
  list_executions: 'read',
  get_execution: 'read',
  list_todos: 'read',
  get_todo: 'read',

  // Suggestion tools
  suggest_navigation: 'suggest',
  suggest_files: 'suggest',
  suggest_config: 'suggest',

  // Write tools
  select_file: 'write',
  select_files_by_pattern: 'write',
  select_all_code_files: 'write',
  clear_file_selection: 'write',
  set_analysis_options: 'write',
  set_output_format: 'write',
  set_test_framework: 'write',
  set_additional_context: 'write',
  select_quick_action: 'write',
  create_project: 'write',
  update_project: 'write',
  create_requirement: 'write',
  update_requirement: 'write',
  create_test_case: 'write',
  update_test_case: 'write',
  create_todo: 'write',
  update_todo: 'write',

  // Analysis tools
  start_analysis: 'analysis',
  cancel_analysis: 'write',

  // Execution tools
  start_execution: 'execution',
  retry_execution: 'execution',

  // Dangerous tools
  delete_project: 'dangerous',
  delete_requirement: 'dangerous',
  delete_test_case: 'dangerous',
  delete_execution: 'dangerous',
  delete_analysis: 'dangerous',
  delete_todo: 'dangerous',
  bulk_delete: 'dangerous',
  clear_history: 'dangerous',
  update_api_key: 'dangerous',
  clear_cache: 'dangerous',
  reset_settings: 'dangerous',
};

// ============================================
// Abuse Detection Configuration
// ============================================

const ABUSE_CONFIG = {
  // Number of violations before escalation
  violationThreshold: 3,

  // Penalty multiplier for each violation level
  penaltyMultiplier: 2,

  // Maximum penalty (rate limit multiplier)
  maxPenalty: 16,

  // Time to decay one violation level (ms)
  violationDecayMs: 3600000, // 1 hour

  // Patterns that indicate suspicious activity
  suspiciousPatterns: {
    // Rapid tool switching (might be probing)
    rapidToolSwitching: {
      threshold: 10, // Different tools
      windowMs: 10000, // In 10 seconds
    },
    // Repeated validation errors (might be fuzzing)
    repeatedValidationErrors: {
      threshold: 5,
      windowMs: 60000,
    },
    // Repeated permission denials (might be privilege escalation attempt)
    repeatedPermissionDenials: {
      threshold: 3,
      windowMs: 60000,
    },
    // Repeated ownership denials (might be IDOR attempt)
    repeatedOwnershipDenials: {
      threshold: 3,
      windowMs: 60000,
    },
  },
};

// ============================================
// In-Memory Storage
// ============================================

// Map<userId:toolName, { timestamps: number[], violations: number, lastViolation: number }>
const userToolStore = new Map();

// Map<userId, { toolCalls: Map<toolName, number>, errors: { validation: number[], permission: number[], ownership: number[] } }>
const userActivityStore = new Map();

// Map<ipAddress, { timestamps: number[], blocked: boolean, blockedUntil: number }>
const ipStore = new Map();

// Global rate limit tracking
const globalStore = {
  timestamps: [],
  analysisCount: 0,
  executionCount: 0,
};

// ============================================
// Main Rate Limiting Functions
// ============================================

/**
 * Check if a request should be rate limited
 *
 * @param {string} userId - User identifier
 * @param {string} toolName - Tool being called
 * @param {object} options - Additional options (ipAddress, etc.)
 * @returns {object} - { allowed: boolean, retryAfter?: number, reason?: string }
 */
export function checkRateLimit(userId, toolName, options = {}) {
  const now = Date.now();

  // Check IP-based rate limit first
  if (options.ipAddress) {
    const ipResult = checkIpRateLimit(options.ipAddress, now);
    if (!ipResult.allowed) {
      return ipResult;
    }
  }

  // Check global rate limits
  const globalResult = checkGlobalRateLimit(toolName, now);
  if (!globalResult.allowed) {
    return globalResult;
  }

  // Get rate limit config for tool
  const category = TOOL_CATEGORIES[toolName] || 'default';
  const config = RATE_LIMITS[category];

  // Get or create user entry
  const key = `${userId}:${toolName}`;
  let entry = userToolStore.get(key);
  if (!entry) {
    entry = { timestamps: [], violations: 0, lastViolation: 0 };
    userToolStore.set(key, entry);
  }

  // Apply violation penalty
  const effectiveConfig = applyViolationPenalty(config, entry.violations);

  // Clean old timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < effectiveConfig.windowMs);

  // Check burst limit
  const recentBurst = entry.timestamps.filter(t => now - t < effectiveConfig.burstWindowMs);
  if (recentBurst.length >= effectiveConfig.burstMax) {
    // Record violation
    recordViolation(entry, now);
    trackActivity(userId, toolName, 'rate_limit');

    return {
      allowed: false,
      retryAfter: Math.ceil((effectiveConfig.burstWindowMs - (now - recentBurst[0])) / 1000),
      reason: 'Burst rate limit exceeded',
      violationLevel: entry.violations,
    };
  }

  // Check window limit
  if (entry.timestamps.length >= effectiveConfig.max) {
    // Record violation
    recordViolation(entry, now);
    trackActivity(userId, toolName, 'rate_limit');

    return {
      allowed: false,
      retryAfter: Math.ceil((effectiveConfig.windowMs - (now - entry.timestamps[0])) / 1000),
      reason: 'Rate limit exceeded',
      violationLevel: entry.violations,
    };
  }

  // Add timestamp
  entry.timestamps.push(now);

  // Track activity for pattern detection
  trackActivity(userId, toolName, 'success');

  return { allowed: true };
}

/**
 * Check IP-based rate limit
 */
function checkIpRateLimit(ipAddress, now) {
  let entry = ipStore.get(ipAddress);
  if (!entry) {
    entry = { timestamps: [], blocked: false, blockedUntil: 0 };
    ipStore.set(ipAddress, entry);
  }

  // Check if blocked
  if (entry.blocked) {
    if (now < entry.blockedUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        reason: 'IP temporarily blocked due to abuse',
      };
    }
    // Unblock
    entry.blocked = false;
    entry.timestamps = [];
  }

  // Clean old timestamps (1 minute window)
  entry.timestamps = entry.timestamps.filter(t => now - t < 60000);

  // Check limit (100 requests per minute per IP)
  if (entry.timestamps.length >= 100) {
    entry.blocked = true;
    entry.blockedUntil = now + 300000; // Block for 5 minutes
    return {
      allowed: false,
      retryAfter: 300,
      reason: 'IP rate limit exceeded',
    };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

/**
 * Check global rate limits
 */
function checkGlobalRateLimit(toolName, now) {
  // Clean old timestamps
  globalStore.timestamps = globalStore.timestamps.filter(t => now - t < 60000);

  // Global limit: 1000 requests per minute across all users
  if (globalStore.timestamps.length >= 1000) {
    return {
      allowed: false,
      retryAfter: 5,
      reason: 'System is busy, please try again shortly',
    };
  }

  globalStore.timestamps.push(now);
  return { allowed: true };
}

/**
 * Apply violation penalty to rate limit config
 */
function applyViolationPenalty(config, violations) {
  if (violations === 0) return config;

  const penalty = Math.min(
    Math.pow(ABUSE_CONFIG.penaltyMultiplier, violations),
    ABUSE_CONFIG.maxPenalty
  );

  return {
    ...config,
    max: Math.max(1, Math.floor(config.max / penalty)),
    burstMax: Math.max(1, Math.floor(config.burstMax / penalty)),
  };
}

/**
 * Record a rate limit violation
 */
function recordViolation(entry, now) {
  // Decay old violations
  if (entry.lastViolation && now - entry.lastViolation > ABUSE_CONFIG.violationDecayMs) {
    entry.violations = Math.max(0, entry.violations - 1);
  }

  entry.violations++;
  entry.lastViolation = now;
}

// ============================================
// Activity Tracking & Pattern Detection
// ============================================

/**
 * Track user activity for pattern detection
 */
function trackActivity(userId, toolName, eventType) {
  let activity = userActivityStore.get(userId);
  if (!activity) {
    activity = {
      toolCalls: new Map(),
      errors: { validation: [], permission: [], ownership: [] },
    };
    userActivityStore.set(userId, activity);
  }

  const now = Date.now();

  // Track tool calls
  if (!activity.toolCalls.has(toolName)) {
    activity.toolCalls.set(toolName, []);
  }
  activity.toolCalls.get(toolName).push(now);
}

/**
 * Record an error for pattern detection
 */
export function recordError(userId, errorType) {
  let activity = userActivityStore.get(userId);
  if (!activity) {
    activity = {
      toolCalls: new Map(),
      errors: { validation: [], permission: [], ownership: [] },
    };
    userActivityStore.set(userId, activity);
  }

  const now = Date.now();

  if (activity.errors[errorType]) {
    activity.errors[errorType].push(now);
  }
}

/**
 * Check for suspicious patterns
 */
export function checkSuspiciousPatterns(userId) {
  const activity = userActivityStore.get(userId);
  if (!activity) return { suspicious: false };

  const now = Date.now();
  const patterns = ABUSE_CONFIG.suspiciousPatterns;
  const detected = [];

  // Check rapid tool switching
  const recentTools = new Set();
  for (const [toolName, timestamps] of activity.toolCalls) {
    const recent = timestamps.filter(t => now - t < patterns.rapidToolSwitching.windowMs);
    if (recent.length > 0) {
      recentTools.add(toolName);
    }
  }
  if (recentTools.size >= patterns.rapidToolSwitching.threshold) {
    detected.push('rapid_tool_switching');
  }

  // Check repeated validation errors
  const recentValidationErrors = activity.errors.validation.filter(
    t => now - t < patterns.repeatedValidationErrors.windowMs
  );
  if (recentValidationErrors.length >= patterns.repeatedValidationErrors.threshold) {
    detected.push('repeated_validation_errors');
  }

  // Check repeated permission denials
  const recentPermissionDenials = activity.errors.permission.filter(
    t => now - t < patterns.repeatedPermissionDenials.windowMs
  );
  if (recentPermissionDenials.length >= patterns.repeatedPermissionDenials.threshold) {
    detected.push('repeated_permission_denials');
  }

  // Check repeated ownership denials
  const recentOwnershipDenials = activity.errors.ownership.filter(
    t => now - t < patterns.repeatedOwnershipDenials.windowMs
  );
  if (recentOwnershipDenials.length >= patterns.repeatedOwnershipDenials.threshold) {
    detected.push('repeated_ownership_denials');
  }

  return {
    suspicious: detected.length > 0,
    patterns: detected,
    severity: detected.length >= 3 ? 'high' : detected.length >= 2 ? 'medium' : 'low',
  };
}

// ============================================
// Management Functions
// ============================================

/**
 * Reset rate limit for a user
 */
export function resetRateLimit(userId, toolName = null) {
  if (toolName) {
    userToolStore.delete(`${userId}:${toolName}`);
  } else {
    for (const key of userToolStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        userToolStore.delete(key);
      }
    }
    userActivityStore.delete(userId);
  }
}

/**
 * Get rate limit status for a user/tool
 */
export function getRateLimitStatus(userId, toolName) {
  const category = TOOL_CATEGORIES[toolName] || 'default';
  const config = RATE_LIMITS[category];
  const key = `${userId}:${toolName}`;
  const entry = userToolStore.get(key);

  if (!entry) {
    return {
      used: 0,
      max: config.max,
      windowMs: config.windowMs,
      remaining: config.max,
      violations: 0,
    };
  }

  const now = Date.now();
  const validTimestamps = entry.timestamps.filter(t => now - t < config.windowMs);
  const effectiveConfig = applyViolationPenalty(config, entry.violations);

  return {
    used: validTimestamps.length,
    max: effectiveConfig.max,
    windowMs: config.windowMs,
    remaining: Math.max(0, effectiveConfig.max - validTimestamps.length),
    violations: entry.violations,
    penalized: entry.violations > 0,
  };
}

/**
 * Block an IP address
 */
export function blockIp(ipAddress, durationMs = 3600000) {
  const now = Date.now();
  ipStore.set(ipAddress, {
    timestamps: [],
    blocked: true,
    blockedUntil: now + durationMs,
  });
}

/**
 * Unblock an IP address
 */
export function unblockIp(ipAddress) {
  ipStore.delete(ipAddress);
}

/**
 * Cleanup expired entries
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  const maxWindowMs = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs));

  // Cleanup user tool entries
  for (const [key, entry] of userToolStore.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < maxWindowMs);
    if (entry.timestamps.length === 0 && entry.violations === 0) {
      userToolStore.delete(key);
    }
  }

  // Cleanup IP entries
  for (const [ip, entry] of ipStore.entries()) {
    if (!entry.blocked && entry.timestamps.length === 0) {
      ipStore.delete(ip);
    } else if (entry.blocked && now > entry.blockedUntil) {
      ipStore.delete(ip);
    }
  }

  // Cleanup activity store
  for (const [userId, activity] of userActivityStore.entries()) {
    let hasActivity = false;

    for (const timestamps of activity.toolCalls.values()) {
      const filtered = timestamps.filter(t => now - t < 3600000);
      if (filtered.length > 0) hasActivity = true;
    }

    for (const errorType of Object.keys(activity.errors)) {
      activity.errors[errorType] = activity.errors[errorType].filter(t => now - t < 3600000);
      if (activity.errors[errorType].length > 0) hasActivity = true;
    }

    if (!hasActivity) {
      userActivityStore.delete(userId);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

// ============================================
// Error Class
// ============================================

export class RateLimitError extends Error {
  constructor(message, retryAfter, violations = 0) {
    super(message);
    this.name = 'RateLimitError';
    this.isRateLimitError = true;
    this.statusCode = 429;
    this.retryAfter = retryAfter;
    this.violations = violations;
  }
}

// ============================================
// Export
// ============================================

export default {
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
};
