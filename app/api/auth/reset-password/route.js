import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';

/**
 * POST /api/auth/reset-password
 *
 * Resets user password using a valid reset token.
 *
 * Request body:
 * - token: Reset token from email link
 * - password: New password (must meet strength requirements)
 *
 * Response:
 * - 200: Password reset successfully
 * - 400: Invalid request (missing fields, weak password)
 * - 401: Invalid or expired token
 * - 500: Server error
 *
 * Security:
 * - Validates token and expiration
 * - Enforces password strength requirements
 * - Hashes password with bcrypt (10 rounds)
 * - Clears reset token after use
 * - Audit logging for all attempts
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;
    const context = getRequestContext(request);

    // Validate input
    if (!token || !password) {
      await logAudit({
        action: 'PASSWORD_RESET_FAILED',
        metadata: { reason: 'missing_fields' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordCriteria = [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'Contains uppercase letter' },
      { test: /[a-z]/.test(password), label: 'Contains lowercase letter' },
      { test: /[0-9]/.test(password), label: 'Contains number' },
      { test: /[^a-zA-Z0-9]/.test(password), label: 'Contains special character' }
    ];

    const unmetCriteria = passwordCriteria.filter(c => !c.test);

    if (unmetCriteria.length > 0) {
      await logAudit({
        action: 'PASSWORD_RESET_FAILED',
        metadata: { reason: 'weak_password', unmetCriteria: unmetCriteria.map(c => c.label) },
        success: false,
        ...context
      });

      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          requirements: passwordCriteria.map(c => ({ ...c, met: c.test }))
        },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const userResult = await query(
      'SELECT id, email, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      await logAudit({
        action: 'PASSWORD_RESET_FAILED',
        metadata: { reason: 'invalid_token' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(user.reset_token_expires);

    if (now > expiresAt) {
      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_FAILED',
        metadata: { email: user.email, reason: 'token_expired' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Log successful password reset
    await logAudit({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      metadata: { email: user.email },
      success: true,
      ...context
    });

    return NextResponse.json({
      message: 'Password reset successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Reset password error:', error);

    await logAudit({
      action: 'PASSWORD_RESET_ERROR',
      metadata: { error: error.message },
      success: false,
      ...getRequestContext(request)
    });

    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
