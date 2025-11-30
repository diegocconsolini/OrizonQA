import { db } from './db.js';

/**
 * Audit Log Utility
 *
 * Logs all security-critical actions for compliance and troubleshooting.
 *
 * Common actions:
 * - user.signup, user.login, user.logout, user.login_failed, user.login_blocked
 * - email.verify, email.verify_failed, email.resend_code
 * - password.reset_request, password.reset_complete, password.change
 * - session.create, session.refresh, session.expire
 * - api_key.create, api_key.update, api_key.delete
 * - account.delete, account.suspend, account.reactivate
 */

/**
 * Log an audit event
 *
 * @param {Object} params - Audit log parameters
 * @param {number|null} params.userId - User ID (if authenticated)
 * @param {string|null} params.userEmail - User email (stored separately in case user is deleted)
 * @param {string} params.action - Action name (e.g., 'user.login', 'password.reset_request')
 * @param {string|null} params.resourceType - Type of resource (e.g., 'user', 'session', 'analysis')
 * @param {string|null} params.resourceId - ID of the resource
 * @param {string|null} params.ipAddress - Client IP address
 * @param {string|null} params.userAgent - Client user agent
 * @param {Object} params.metadata - Additional context data
 * @param {boolean} params.success - Whether the action succeeded
 * @param {string|null} params.country - Country code (optional)
 * @param {string|null} params.city - City name (optional)
 * @returns {Promise<Object|null>} Created audit log entry or null if failed
 */
export async function logAudit({
  userId = null,
  userEmail = null,
  action,
  resourceType = null,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {},
  success = true,
  country = null,
  city = null,
}) {
  try {
    const query = `
      INSERT INTO audit_logs
      (user_id, user_email, action, resource_type, resource_id,
       ip_address, user_agent, metadata, success, country, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      JSON.stringify(metadata),
      success,
      country,
      city,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging should never break the app
    return null;
  }
}

/**
 * Extract IP address and user agent from Next.js request
 *
 * @param {Request} request - Next.js request object
 * @returns {Object} { ipAddress, userAgent }
 */
export function getRequestContext(request) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Query audit logs with filters
 *
 * @param {Object} params - Query parameters
 * @param {number|null} params.userId - Filter by user ID
 * @param {string|null} params.action - Filter by action
 * @param {number} params.limit - Max number of results (default 50)
 * @param {number} params.offset - Pagination offset (default 0)
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getAuditLogs({
  userId = null,
  action = null,
  limit = 50,
  offset = 0,
}) {
  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(userId);
      paramCount++;
    }

    if (action) {
      query += ` AND action = $${paramCount}`;
      values.push(action);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
}

/**
 * Check for failed login attempts (rate limiting)
 *
 * @param {string} email - User email to check
 * @param {number} minutes - Time window in minutes (default 15)
 * @returns {Promise<number>} Number of failed attempts in the time window
 */
export async function getFailedLoginAttempts(email, minutes = 15) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE user_email = $1
        AND action = 'user.login_failed'
        AND created_at > NOW() - INTERVAL '${minutes} minutes'
    `;

    const result = await db.query(query, [email]);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Failed to get failed login attempts:', error);
    return 0;
  }
}

/**
 * Get recent activity for a user
 *
 * @param {number} userId - User ID
 * @param {number} limit - Max number of results (default 10)
 * @returns {Promise<Array>} Recent audit log entries for the user
 */
export async function getUserActivity(userId, limit = 10) {
  try {
    const query = `
      SELECT *
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Failed to get user activity:', error);
    return [];
  }
}

/**
 * Get security events (failed logins, blocked attempts, etc.)
 *
 * @param {number} hours - Look back hours (default 24)
 * @param {number} limit - Max number of results (default 100)
 * @returns {Promise<Array>} Security-related audit log entries
 */
export async function getSecurityEvents(hours = 24, limit = 100) {
  try {
    const query = `
      SELECT *
      FROM audit_logs
      WHERE action IN (
        'user.login_failed',
        'user.login_blocked',
        'email.verify_failed',
        'password.reset_request',
        'account.delete',
        'account.suspend'
      )
        AND created_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Failed to get security events:', error);
    return [];
  }
}
