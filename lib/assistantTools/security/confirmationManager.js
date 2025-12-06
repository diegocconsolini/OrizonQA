/**
 * Confirmation Manager - Layer 6: Dangerous Action Confirmation System
 *
 * Manages confirmation flows for dangerous operations.
 * Implements a secure token-based confirmation system with:
 * - Time-limited confirmations
 * - Session binding
 * - Action-specific tokens
 * - Audit trail
 *
 * Flow:
 * 1. User requests dangerous action
 * 2. System generates confirmation token
 * 3. User confirms with token
 * 4. System validates and executes
 */

import crypto from 'crypto';

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Confirmation token expiration (5 minutes)
  tokenExpirationMs: 5 * 60 * 1000,

  // Maximum pending confirmations per user
  maxPendingPerUser: 5,

  // Token length in bytes (24 bytes = 32 chars base64)
  tokenLength: 24,

  // Whether to require explicit confirmation text
  requireExplicitConfirmation: true,

  // Cleanup interval
  cleanupIntervalMs: 60 * 1000,
};

// ============================================
// Confirmation Types
// ============================================

export const CONFIRMATION_TYPES = {
  DESTRUCTIVE: 'destructive',     // Delete operations
  RESOURCE: 'resource',           // Resource-consuming operations
  SENSITIVE: 'sensitive',         // Security-sensitive operations
  BULK: 'bulk',                   // Bulk operations
};

// Type to severity mapping
const TYPE_SEVERITY = {
  [CONFIRMATION_TYPES.DESTRUCTIVE]: 3,
  [CONFIRMATION_TYPES.BULK]: 3,
  [CONFIRMATION_TYPES.SENSITIVE]: 2,
  [CONFIRMATION_TYPES.RESOURCE]: 1,
};

// ============================================
// In-Memory Storage
// ============================================

// Map<token, ConfirmationRequest>
const pendingConfirmations = new Map();

// Map<userId, Set<token>>
const userConfirmations = new Map();

// ============================================
// Confirmation Request Class
// ============================================

class ConfirmationRequest {
  constructor(options) {
    this.id = options.id;
    this.token = options.token;
    this.userId = options.userId;
    this.sessionId = options.sessionId;
    this.toolName = options.toolName;
    this.input = options.input;
    this.type = options.type;
    this.message = options.message;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + CONFIG.tokenExpirationMs;
    this.status = 'pending';
    this.confirmedAt = null;
    this.deniedAt = null;
    this.executedAt = null;
    this.metadata = options.metadata || {};
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  isValid(userId, sessionId) {
    if (this.isExpired()) return false;
    if (this.status !== 'pending') return false;
    if (this.userId !== userId) return false;
    if (this.sessionId && this.sessionId !== sessionId) return false;
    return true;
  }

  confirm() {
    this.status = 'confirmed';
    this.confirmedAt = Date.now();
  }

  deny() {
    this.status = 'denied';
    this.deniedAt = Date.now();
  }

  markExecuted() {
    this.status = 'executed';
    this.executedAt = Date.now();
  }

  toResponse() {
    return {
      id: this.id,
      token: this.token,
      toolName: this.toolName,
      type: this.type,
      message: this.message,
      expiresAt: new Date(this.expiresAt).toISOString(),
      expiresIn: Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000)),
      confirmationRequired: true,
    };
  }
}

// ============================================
// Main Functions
// ============================================

/**
 * Create a new confirmation request for a dangerous action.
 *
 * @param {string} toolName - Name of the tool
 * @param {object} input - Tool input parameters
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID (optional but recommended)
 * @param {string} type - Confirmation type
 * @param {string} message - User-facing confirmation message
 * @param {object} metadata - Additional metadata
 * @returns {ConfirmationRequest} - The confirmation request
 */
export function createConfirmation(toolName, input, userId, sessionId, type, message, metadata = {}) {
  // Clean up expired confirmations first
  cleanupExpiredConfirmations();

  // Check user's pending confirmation limit
  const userTokens = userConfirmations.get(userId);
  if (userTokens && userTokens.size >= CONFIG.maxPendingPerUser) {
    // Remove oldest
    const oldest = [...pendingConfirmations.entries()]
      .filter(([, req]) => req.userId === userId)
      .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];

    if (oldest) {
      cancelConfirmation(oldest[0], userId);
    }
  }

  // Generate secure token
  const token = generateSecureToken();
  const id = `conf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

  // Create confirmation request
  const request = new ConfirmationRequest({
    id,
    token,
    userId,
    sessionId,
    toolName,
    input: sanitizeInputForStorage(input),
    type: type || CONFIRMATION_TYPES.DESTRUCTIVE,
    message,
    metadata,
  });

  // Store
  pendingConfirmations.set(token, request);

  // Track per user
  if (!userConfirmations.has(userId)) {
    userConfirmations.set(userId, new Set());
  }
  userConfirmations.get(userId).add(token);

  return request;
}

/**
 * Verify a confirmation token and return the original request.
 *
 * @param {string} token - Confirmation token
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID (optional)
 * @returns {object} - { valid: boolean, request?: ConfirmationRequest, error?: string }
 */
export function verifyConfirmation(token, userId, sessionId = null) {
  if (!token) {
    return { valid: false, error: 'No confirmation token provided' };
  }

  const request = pendingConfirmations.get(token);
  if (!request) {
    return { valid: false, error: 'Confirmation not found or already processed' };
  }

  if (request.isExpired()) {
    // Clean up expired request
    cancelConfirmation(token, userId);
    return { valid: false, error: 'Confirmation has expired. Please try again.' };
  }

  if (request.userId !== userId) {
    return { valid: false, error: 'Confirmation does not belong to this user' };
  }

  if (request.sessionId && sessionId && request.sessionId !== sessionId) {
    return { valid: false, error: 'Confirmation must be used in the same session' };
  }

  if (request.status !== 'pending') {
    return { valid: false, error: `Confirmation already ${request.status}` };
  }

  return { valid: true, request };
}

/**
 * Confirm a pending request and mark it ready for execution.
 *
 * @param {string} token - Confirmation token
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {object} - { success: boolean, request?: ConfirmationRequest, error?: string }
 */
export function confirmRequest(token, userId, sessionId = null) {
  const verification = verifyConfirmation(token, userId, sessionId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  const request = verification.request;
  request.confirm();

  return {
    success: true,
    request,
    toolName: request.toolName,
    input: request.input,
  };
}

/**
 * Deny a pending confirmation request.
 *
 * @param {string} token - Confirmation token
 * @param {string} userId - User ID
 * @returns {object} - { success: boolean, error?: string }
 */
export function denyConfirmation(token, userId) {
  const request = pendingConfirmations.get(token);
  if (!request) {
    return { success: false, error: 'Confirmation not found' };
  }

  if (request.userId !== userId) {
    return { success: false, error: 'Confirmation does not belong to this user' };
  }

  request.deny();

  // Clean up
  pendingConfirmations.delete(token);
  const userTokens = userConfirmations.get(userId);
  if (userTokens) {
    userTokens.delete(token);
  }

  return { success: true };
}

/**
 * Mark a confirmed request as executed.
 *
 * @param {string} token - Confirmation token
 * @returns {boolean} - Success
 */
export function markExecuted(token) {
  const request = pendingConfirmations.get(token);
  if (!request || request.status !== 'confirmed') {
    return false;
  }

  request.markExecuted();

  // Clean up after execution
  const userId = request.userId;
  pendingConfirmations.delete(token);
  const userTokens = userConfirmations.get(userId);
  if (userTokens) {
    userTokens.delete(token);
  }

  return true;
}

/**
 * Cancel a pending confirmation.
 *
 * @param {string} token - Confirmation token
 * @param {string} userId - User ID
 */
export function cancelConfirmation(token, userId) {
  const request = pendingConfirmations.get(token);
  if (request && request.userId === userId) {
    pendingConfirmations.delete(token);
  }

  const userTokens = userConfirmations.get(userId);
  if (userTokens) {
    userTokens.delete(token);
  }
}

/**
 * Get all pending confirmations for a user.
 *
 * @param {string} userId - User ID
 * @returns {Array} - Array of confirmation responses
 */
export function getUserPendingConfirmations(userId) {
  const userTokens = userConfirmations.get(userId);
  if (!userTokens) return [];

  const pending = [];
  for (const token of userTokens) {
    const request = pendingConfirmations.get(token);
    if (request && !request.isExpired() && request.status === 'pending') {
      pending.push(request.toResponse());
    }
  }

  return pending;
}

/**
 * Get a specific confirmation by ID.
 *
 * @param {string} confirmationId - Confirmation ID
 * @param {string} userId - User ID
 * @returns {object|null} - Confirmation response or null
 */
export function getConfirmation(confirmationId, userId) {
  for (const [, request] of pendingConfirmations) {
    if (request.id === confirmationId && request.userId === userId) {
      return request.toResponse();
    }
  }
  return null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a secure random token.
 */
function generateSecureToken() {
  return crypto.randomBytes(CONFIG.tokenLength).toString('base64url');
}

/**
 * Sanitize input for storage (remove sensitive data).
 */
function sanitizeInputForStorage(input) {
  if (!input) return {};

  const sanitized = { ...input };

  // Remove sensitive fields
  const sensitiveFields = ['apiKey', 'password', 'token', 'secret'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Clean up expired confirmations.
 */
export function cleanupExpiredConfirmations() {
  const now = Date.now();

  for (const [token, request] of pendingConfirmations.entries()) {
    if (request.isExpired()) {
      pendingConfirmations.delete(token);

      const userTokens = userConfirmations.get(request.userId);
      if (userTokens) {
        userTokens.delete(token);
        if (userTokens.size === 0) {
          userConfirmations.delete(request.userId);
        }
      }
    }
  }
}

// Auto-cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredConfirmations, CONFIG.cleanupIntervalMs);
}

// ============================================
// Database Integration (Optional)
// ============================================

/**
 * Store confirmation in database for persistence.
 * Called after creating a confirmation.
 *
 * @param {ConfirmationRequest} request - The confirmation request
 * @param {object} db - Database client
 */
export async function persistConfirmation(request, db) {
  if (!db) return;

  try {
    await db.query(
      `INSERT INTO ai_pending_confirmations (
        id, token, user_id, session_id, tool_name, input,
        type, message, status, created_at, expires_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        request.id,
        request.token,
        request.userId,
        request.sessionId,
        request.toolName,
        JSON.stringify(request.input),
        request.type,
        request.message,
        request.status,
        new Date(request.createdAt).toISOString(),
        new Date(request.expiresAt).toISOString(),
        JSON.stringify(request.metadata),
      ]
    );
  } catch (error) {
    console.error('Failed to persist confirmation:', error);
  }
}

/**
 * Update confirmation status in database.
 *
 * @param {string} token - Confirmation token
 * @param {string} status - New status
 * @param {object} db - Database client
 */
export async function updateConfirmationStatus(token, status, db) {
  if (!db) return;

  try {
    const updates = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'denied') updates.denied_at = new Date().toISOString();
    if (status === 'executed') updates.executed_at = new Date().toISOString();

    await db.query(
      `UPDATE ai_pending_confirmations
       SET status = $1, confirmed_at = $2, denied_at = $3, executed_at = $4
       WHERE token = $5`,
      [status, updates.confirmed_at, updates.denied_at, updates.executed_at, token]
    );
  } catch (error) {
    console.error('Failed to update confirmation status:', error);
  }
}

// ============================================
// Error Class
// ============================================

export class ConfirmationError extends Error {
  constructor(message, type = 'required') {
    super(message);
    this.name = 'ConfirmationError';
    this.isConfirmationError = true;
    this.statusCode = 428; // Precondition Required
    this.type = type;
  }
}

// ============================================
// Export
// ============================================

export default {
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
};
