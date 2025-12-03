import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { logAudit, getRequestContext } from '@/lib/auditLog';

/**
 * DELETE /api/user/delete
 * Delete user account and all associated data
 *
 * Body:
 * - password: string - User's current password for confirmation
 *
 * This will delete:
 * - All user analyses
 * - All user sessions
 * - The user account itself
 */
export async function DELETE(request) {
  const context = getRequestContext(request);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;
    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    // Get user and verify password
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      await logAudit({
        userId,
        userEmail,
        action: 'ACCOUNT_DELETE_FAILED',
        success: false,
        metadata: { reason: 'invalid_password' },
        ...context
      });

      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      );
    }

    // Get counts for logging
    const analysesCount = await query(
      'SELECT COUNT(*) as count FROM analyses WHERE user_id = $1',
      [userId]
    );

    // Begin deletion - analyses cascade delete due to foreign key
    // But we'll be explicit for audit purposes

    // Delete all analyses
    await query('DELETE FROM analyses WHERE user_id = $1', [userId]);

    // Delete all sessions
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    // Delete audit logs (optional - you might want to keep these)
    // await query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);

    // Log deletion before deleting user (so we have the user_id)
    await logAudit({
      userId,
      userEmail,
      action: 'ACCOUNT_DELETED',
      resourceType: 'user',
      resourceId: userId.toString(),
      success: true,
      metadata: {
        analysesDeleted: parseInt(analysesCount.rows[0].count, 10)
      },
      ...context
    });

    // Delete the user
    await query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);

    await logAudit({
      action: 'ACCOUNT_DELETE_ERROR',
      success: false,
      metadata: { error: error.message },
      ...context
    });

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
