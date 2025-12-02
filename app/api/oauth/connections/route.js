/**
 * OAuth Connections API
 *
 * GET /api/oauth/connections?provider=github
 *
 * Lists all OAuth connections for the authenticated user.
 *
 * Query Parameters:
 *   - provider: Filter by provider (optional)
 *
 * Response:
 *   {
 *     "connections": [
 *       {
 *         "id": 1,
 *         "provider": "github",
 *         "provider_username": "johndoe",
 *         "provider_user_id": "12345",
 *         "scopes": ["read:user", "user:email", "repo"],
 *         "status": "active",
 *         "metadata": {
 *           "email": "john@example.com",
 *           "avatar_url": "https://...",
 *           "name": "John Doe"
 *         },
 *         "token_expires_at": null,
 *         "last_used_at": "2025-12-01T10:00:00Z",
 *         "created_at": "2025-12-01T08:00:00Z"
 *       }
 *     ]
 *   }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import IntegrationManager from '@/lib/oauth/IntegrationManager';

export async function GET(request) {
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
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    // Initialize Integration Manager
    const manager = new IntegrationManager();

    // Get user's connections
    const connections = await manager.getUserConnections(userId, provider);

    // Remove sensitive data (access tokens)
    const sanitized = connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      provider_username: conn.provider_username,
      provider_user_id: conn.provider_user_id,
      scopes: conn.scopes,
      status: conn.status,
      metadata: conn.metadata,
      token_expires_at: conn.token_expires_at,
      last_used_at: conn.last_used_at,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
    }));

    return NextResponse.json({
      connections: sanitized,
    });
  } catch (error) {
    console.error('OAuth connections error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
