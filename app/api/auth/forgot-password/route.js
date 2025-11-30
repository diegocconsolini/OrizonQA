import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by generating a reset token and sending email.
 *
 * Request body:
 * - email: User's email address
 *
 * Response:
 * - 200: Reset email sent successfully (always returns success for security)
 * - 400: Invalid request (missing email)
 * - 429: Too many reset requests
 * - 500: Server error
 *
 * Security:
 * - Rate limiting: Max 3 reset requests per 15 minutes
 * - Generates secure UUID reset token
 * - Token expires after 1 hour
 * - Anti-enumeration (doesn't reveal if user exists)
 * - Audit logging for all attempts
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;
    const context = getRequestContext(request);

    // Validate input
    if (!email) {
      await logAudit({
        action: 'PASSWORD_RESET_REQUESTED',
        metadata: { reason: 'missing_email' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const userResult = await query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // If user doesn't exist, still return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      await logAudit({
        action: 'PASSWORD_RESET_REQUESTED',
        metadata: { email, reason: 'user_not_found' },
        success: false,
        ...context
      });

      // Return success message to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }

    const user = userResult.rows[0];

    // Check rate limiting (max 3 reset requests per 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const resetAttemptsResult = await query(
      `SELECT COUNT(*) as count
       FROM audit_logs
       WHERE user_id = $1
         AND action = 'PASSWORD_RESET_REQUESTED'
         AND created_at > $2`,
      [user.id, fifteenMinutesAgo]
    );

    const resetAttempts = parseInt(resetAttemptsResult.rows[0].count);

    if (resetAttempts >= 3) {
      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_FAILED',
        metadata: { email, reason: 'rate_limit_exceeded', attempts: resetAttempts },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Too many reset requests. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Generate secure reset token (UUID)
    const resetToken = crypto.randomUUID();

    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store reset token in database
    await query(
      `UPDATE users
       SET reset_token = $1,
           reset_token_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [resetToken, expiresAt, user.id]
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.full_name, resetToken);
    } catch (emailError) {
      console.error('Email send error:', emailError);

      await logAudit({
        userId: user.id,
        action: 'PASSWORD_RESET_FAILED',
        metadata: { email, reason: 'email_send_failed', error: emailError.message },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful reset request
    await logAudit({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      metadata: { email, resetAttempt: resetAttempts + 1 },
      success: true,
      ...context
    });

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
      expiresIn: 3600 // 1 hour in seconds
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    await logAudit({
      action: 'PASSWORD_RESET_ERROR',
      metadata: { error: error.message },
      success: false,
      ...getRequestContext(request)
    });

    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
