/**
 * GitHub OAuth Revoke API
 *
 * POST /api/oauth/github/revoke
 *
 * Revokes (disconnects) a GitHub OAuth connection.
 * Deletes the access token from the database and optionally revokes it at GitHub.
 *
 * Request Body:
 *   {
 *     "connectionId": 123
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "message": "GitHub connection revoked successfully"
 *   }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import IntegrationManager from '@/lib/oauth/IntegrationManager';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { connectionId } = body;

    // Validate input
    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    // Initialize Integration Manager
    const manager = new IntegrationManager();

    // Revoke connection
    await manager.revokeConnection(
      parseInt(connectionId, 10),
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'GitHub connection revoked successfully',
    });
  } catch (error) {
    console.error('GitHub revoke error:', error);

    // Handle specific errors
    if (error.message === 'Connection not found') {
      return NextResponse.json(
        { error: 'Connection not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to revoke connection' },
      { status: 500 }
    );
  }
}
