import { query } from './db.js';

/**
 * Audit Log Utility
 *
 * Logs all security-critical actions for compliance and troubleshooting.
 */

/**
 * Log an audit event
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
    const result = await query(`
      INSERT INTO audit_logs
      (user_id, user_email, action, resource_type, resource_id,
       ip_address, user_agent, metadata, success, country, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, userEmail, action, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(metadata), success, country, city]);

    return result.rows[0];
  } catch (error) {
    console.error('Failed to log audit:', error);
    return null;
  }
}

/**
 * Extract IP address and user agent from Next.js request
 */
export function getRequestContext(request) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Check for failed login attempts (rate limiting)
 */
export async function getFailedLoginAttempts(email, minutes = 15) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE user_email = $1
        AND action = 'user.login_failed'
        AND created_at > NOW() - INTERVAL '${minutes} minutes'
    `, [email]);

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Failed to get failed login attempts:', error);
    return 0;
  }
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId, limit = 10) {
  try {
    const result = await query(`
      SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
    `, [userId, limit]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get user activity:', error);
    return [];
  }
}

/**
 * Get security events
 */
export async function getSecurityEvents(hours = 24, limit = 100) {
  try {
    const result = await query(`
      SELECT * FROM audit_logs
      WHERE action IN ('user.login_failed', 'user.login_blocked', 'email.verify_failed', 'password.reset_request')
        AND created_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get security events:', error);
    return [];
  }
}
