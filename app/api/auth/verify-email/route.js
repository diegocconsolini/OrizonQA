import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';

/**
 * POST /api/auth/verify-email
 *
 * Verifies a user's email address using a 6-digit verification code.
 *
 * Request body:
 * - email: User's email address
 * - code: 6-digit verification code
 *
 * Response:
 * - 200: Email verified successfully
 * - 400: Invalid request (missing fields, invalid code format)
 * - 401: Invalid or expired verification code
 * - 404: User not found
 * - 500: Server error
 *
 * Security:
 * - Checks code expiration (10 minutes)
 * - Clears verification code after successful verification
 * - Logs all verification attempts (success and failure)
 * - Rate limiting handled by audit log analysis
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code } = body;
    const context = getRequestContext(request);

    // Validate input
    if (!email || !code) {
      await logAudit({
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'missing_fields' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      await logAudit({
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'invalid_code_format' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    // Get user from database
    const userResult = await query(
      'SELECT id, email, email_verified, verification_code, verification_code_expires FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      await logAudit({
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'user_not_found' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      await logAudit({
        userId: user.id,
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'already_verified' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if code exists
    if (!user.verification_code) {
      await logAudit({
        userId: user.id,
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'no_code_found' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 401 }
      );
    }

    // Check if code expired
    const now = new Date();
    const expiresAt = new Date(user.verification_code_expires);

    if (now > expiresAt) {
      await logAudit({
        userId: user.id,
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'code_expired' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Verification code expired. Please request a new one.' },
        { status: 401 }
      );
    }

    // Verify code
    if (user.verification_code !== code) {
      await logAudit({
        userId: user.id,
        action: 'EMAIL_VERIFICATION_FAILED',
        metadata: { email, reason: 'invalid_code' },
        success: false,
        ...context
      });

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    // Mark email as verified and clear verification code
    await query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_code = NULL,
           verification_code_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // Log successful verification
    await logAudit({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      metadata: { email },
      success: true,
      ...context
    });

    return NextResponse.json({
      message: 'Email verified successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Email verification error:', error);

    await logAudit({
      action: 'EMAIL_VERIFICATION_ERROR',
      metadata: { error: error.message },
      success: false,
      ...getRequestContext(request)
    });

    return NextResponse.json(
      { error: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}
