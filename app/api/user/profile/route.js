import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';

/**
 * Password validation helper
 */
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Contains uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Contains lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Contains number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Contains special character');
  return errors;
}

/**
 * GET /api/user/profile
 * Get user profile information
 */
export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT id, email, full_name, created_at, email_verified, last_login FROM users WHERE id = $1',
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at,
      emailVerified: user.email_verified,
      lastLogin: user.last_login
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Update user profile (name) or change password
 *
 * Body options:
 * - { fullName: string } - Update display name
 * - { currentPassword, newPassword } - Change password
 */
export async function PATCH(request) {
  const context = getRequestContext(request);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, currentPassword, newPassword } = body;
    const userId = session.user.id;

    // Update name
    if (fullName !== undefined) {
      if (!fullName || fullName.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters' },
          { status: 400 }
        );
      }

      await query(
        'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
        [fullName.trim(), userId]
      );

      await logAudit({
        userId,
        userEmail: session.user.email,
        action: 'PROFILE_UPDATE',
        resourceType: 'user',
        resourceId: userId.toString(),
        success: true,
        metadata: { field: 'fullName' },
        ...context
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });
    }

    // Change password
    if (currentPassword && newPassword) {
      // Get current password hash
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password_hash
      );

      if (!isValidPassword) {
        await logAudit({
          userId,
          userEmail: session.user.email,
          action: 'PASSWORD_CHANGE_FAILED',
          success: false,
          metadata: { reason: 'invalid_current_password' },
          ...context
        });

        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Validate new password strength
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        return NextResponse.json(
          { error: 'New password does not meet requirements', details: passwordErrors },
          { status: 400 }
        );
      }

      // Check new password is different from current
      const isSamePassword = await bcrypt.compare(
        newPassword,
        userResult.rows[0].password_hash
      );

      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password must be different from current password' },
          { status: 400 }
        );
      }

      // Hash and update password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      await logAudit({
        userId,
        userEmail: session.user.email,
        action: 'PASSWORD_CHANGED',
        resourceType: 'user',
        resourceId: userId.toString(),
        success: true,
        ...context
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    }

    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
