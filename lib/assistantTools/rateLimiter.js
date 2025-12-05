/**
 * Rate Limiter for Assistant Tools
 *
 * Prevents abuse by limiting how often tools can be called.
 * Uses in-memory storage (resets on server restart).
 */

// Rate limit configurations per tool
const RATE_LIMITS = {
  // Analysis tools - expensive operations
  start_analysis: { windowMs: 60000, max: 3 }, // 3 per minute
  get_file_content: { windowMs: 10000, max: 10 }, // 10 per 10 seconds

  // Selection tools - medium frequency
  select_file: { windowMs: 1000, max: 20 }, // 20 per second
  select_files_by_pattern: { windowMs: 5000, max: 5 }, // 5 per 5 seconds
  select_all_code_files: { windowMs: 5000, max: 3 }, // 3 per 5 seconds
  clear_file_selection: { windowMs: 1000, max: 10 }, // 10 per second

  // Read-only tools - high frequency allowed
  list_available_files: { windowMs: 1000, max: 20 },
  get_current_config: { windowMs: 1000, max: 30 },
  get_analysis_status: { windowMs: 1000, max: 30 },
  get_analysis_results: { windowMs: 5000, max: 10 },
  get_current_page: { windowMs: 1000, max: 30 },
  list_quick_actions: { windowMs: 1000, max: 30 },

  // Config tools - medium frequency
  set_analysis_options: { windowMs: 1000, max: 10 },
  set_output_format: { windowMs: 1000, max: 10 },
  set_test_framework: { windowMs: 1000, max: 10 },
  set_additional_context: { windowMs: 5000, max: 5 },
  select_quick_action: { windowMs: 1000, max: 10 },

  // Navigation tools
  suggest_navigation: { windowMs: 5000, max: 5 },

  // Default for unknown tools
  default: { windowMs: 1000, max: 50 },
};

// In-memory store for rate limiting
// Map<userId:toolName, { timestamps: number[], blocked: boolean }>
const rateLimitStore = new Map();

/**
 * Check if a tool call is rate limited
 *
 * @param {string} userId - User identifier (can be session ID)
 * @param {string} toolName - Name of the tool being called
 * @returns {object} - { allowed: boolean, retryAfter?: number }
 */
export function checkRateLimit(userId, toolName) {
  const limit = RATE_LIMITS[toolName] || RATE_LIMITS.default;
  const key = `${userId}:${toolName}`;
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Clean old timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < limit.windowMs);

  // Check if over limit
  if (entry.timestamps.length >= limit.max) {
    const oldestTimestamp = entry.timestamps[0];
    const retryAfter = Math.ceil((limit.windowMs - (now - oldestTimestamp)) / 1000);

    return {
      allowed: false,
      retryAfter,
      message: `Rate limited. Try again in ${retryAfter} seconds.`,
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);

  return { allowed: true };
}

/**
 * Reset rate limit for a user/tool combination
 * Useful for testing or admin operations
 */
export function resetRateLimit(userId, toolName = null) {
  if (toolName) {
    rateLimitStore.delete(`${userId}:${toolName}`);
  } else {
    // Reset all tools for this user
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Get current rate limit status for a user/tool
 */
export function getRateLimitStatus(userId, toolName) {
  const limit = RATE_LIMITS[toolName] || RATE_LIMITS.default;
  const key = `${userId}:${toolName}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      used: 0,
      max: limit.max,
      windowMs: limit.windowMs,
      remaining: limit.max,
    };
  }

  const now = Date.now();
  const validTimestamps = entry.timestamps.filter((t) => now - t < limit.windowMs);

  return {
    used: validTimestamps.length,
    max: limit.max,
    windowMs: limit.windowMs,
    remaining: Math.max(0, limit.max - validTimestamps.length),
  };
}

/**
 * Cleanup old entries periodically
 * Call this on a timer to prevent memory leaks
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  const maxWindowMs = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowMs));

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries with all timestamps expired
    entry.timestamps = entry.timestamps.filter((t) => now - t < maxWindowMs);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

export default {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  cleanupExpiredEntries,
};
