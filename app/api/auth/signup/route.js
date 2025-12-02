import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db.js';
import { logAudit, getRequestContext } from '@/lib/auditLog.js';
import { sendVerificationEmail } from '@/lib/email.js';

/**
 * Password validation helper
 * Returns array of error messages (empty if valid)
 */
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/auth/signup
 *
 * Register a new user account
 *
 * Request body:
 * - fullName: string (required)
 * - email: string (required, valid email format)
 * - password: string (required, must meet strength criteria)
 *
 * Response:
 * - 201: User created successfully, returns { userId, message }
 * - 400: Invalid input
 * - 409: Email already exists
 * - 500: Server error
 */
export async function POST(request) {
  const { ipAddress, userAgent } = getRequestContext(request);
  let email = null;

  try {
    // Parse request body
    const body = await request.json();
    const { fullName, email: requestEmail, password } = body;
    email = requestEmail;

    // Validate required fields
    if (!fullName || !email || !password) {
      await logAudit({
        userEmail: email,
        action: 'user.signup',
        success: false,
        ipAddress,
        userAgent,
        metadata: { error: 'Missing required fields' }
      });

      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      await logAudit({
        userEmail: email,
        action: 'user.signup',
        success: false,
        ipAddress,
        userAgent,
        metadata: { error: 'Invalid email format' }
      });

      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      await logAudit({
        userEmail: email,
        action: 'user.signup',
        success: false,
        ipAddress,
        userAgent,
        metadata: { error: 'Weak password', passwordErrors }
      });

      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordErrors
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUserResult = await query(existingUserQuery, [email]);

    if (existingUserResult.rows.length > 0) {
      await logAudit({
        userEmail: email,
        action: 'user.signup',
        success: false,
        ipAddress,
        userAgent,
        metadata: { error: 'Email already exists' }
      });

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set verification code expiry to 10 minutes from now
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Insert user into database
    const insertQuery = `
      INSERT INTO users
      (email, full_name, password_hash, verification_code, verification_code_expires, email_verified)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING id
    `;

    const insertResult = await query(insertQuery, [
      email,
      fullName,
      passwordHash,
      verificationCode,
      verificationCodeExpires
    ]);

    const userId = insertResult.rows[0].id;

    // Log successful signup
    await logAudit({
      userId,
      userEmail: email,
      action: 'user.signup',
      resourceType: 'user',
      resourceId: userId.toString(),
      success: true,
      ipAddress,
      userAgent,
      metadata: { fullName }
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, fullName, verificationCode);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the signup if email fails - user can request resend
    }

    return NextResponse.json(
      {
        userId,
        message: 'Account created successfully. Please check your email for the verification code.'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);

    // Log audit event for unexpected errors
    await logAudit({
      userEmail: email,
      action: 'user.signup',
      success: false,
      ipAddress,
      userAgent,
      metadata: {
        error: 'Internal server error',
        errorMessage: error.message
      }
    });

    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}
