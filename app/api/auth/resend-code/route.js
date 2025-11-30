import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';
import { sendVerificationEmail } from '@/lib/email';

/**
 * POST /api/auth/resend-code
 *
 * Resends a verification code to a user's email address.
 *
 * Request body:
 * - email: User's email address
 *
 * Response:
 * - 200: Verification code sent successfully
 * - 400: Invalid request (missing email, already verified, too many requests)
 * - 404: User not found
 * - 500: Server error
 *
 * Security:
 * - Rate limiting: Max 3 resend attempts per 15 minutes
 * - Generates new 6-digit code with 10-minute expiry
 * - Logs all resend attempts
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;
    const context = getRequestContext(request);

    // Validate input
    if (!email) {
      await logAudit({
        action: 'RESEND_CODE_FAILED',
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
      'SELECT id, email, full_name, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal that user doesn't exist for security
      await logAudit({
        action: 'RESEND_CODE_FAILED',
        metadata: { email, reason: 'user_not_found' },
        success: false,
        ...context
      });

      // Return success to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      await logAudit({
        userId: user.id,
        action: 'RESEND_CODE_FAILED',
        metadata: { email, reason: 'already_verified' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check rate limiting (max 3 resend attempts per 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const resendAttemptsResult = await query(
      `SELECT COUNT(*) as count
       FROM audit_logs
       WHERE user_id = $1
         AND action = 'VERIFICATION_CODE_RESENT'
         AND created_at > $2`,
      [user.id, fifteenMinutesAgo]
    );

    const resendAttempts = parseInt(resendAttemptsResult.rows[0].count);

    if (resendAttempts >= 3) {
      await logAudit({
        userId: user.id,
        action: 'RESEND_CODE_FAILED',
        metadata: { email, reason: 'rate_limit_exceeded', attempts: resendAttempts },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Too many resend attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    // Generate new verification code (6 digits)
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new verification code
    await query(
      `UPDATE users
       SET verification_code = $1,
           verification_code_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [verificationCode, expiresAt, user.id]
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.full_name, verificationCode);
    } catch (emailError) {
      console.error('Email send error:', emailError);

      await logAudit({
        userId: user.id,
        action: 'RESEND_CODE_FAILED',
        metadata: { email, reason: 'email_send_failed', error: emailError.message },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful resend
    await logAudit({
      userId: user.id,
      action: 'VERIFICATION_CODE_RESENT',
      metadata: { email, resendAttempt: resendAttempts + 1 },
      success: true,
      ...context
    });

    return NextResponse.json({
      message: 'Verification code sent successfully',
      email: user.email,
      expiresIn: 600 // 10 minutes in seconds
    });

  } catch (error) {
    console.error('Resend code error:', error);

    await logAudit({
      action: 'RESEND_CODE_ERROR',
      metadata: { error: error.message },
      success: false,
      ...getRequestContext(request)
    });

    return NextResponse.json(
      { error: 'An error occurred while resending the code. Please try again.' },
      { status: 500 }
    );
  }
}
