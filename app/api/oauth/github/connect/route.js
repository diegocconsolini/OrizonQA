/**
 * GitHub OAuth Connect API
 *
 * POST /api/oauth/github/connect
 *
 * Initiates the OAuth flow by generating an authorization URL.
 * User will be redirected to GitHub to authorize access.
 *
 * Request Body:
 *   {
 *     "scopes": ["repo"],  // Additional scopes beyond default
 *     "redirectUri": "https://app.com/settings?oauth=callback"
 *   }
 *
 * Response:
 *   {
 *     "authUrl": "https://github.com/login/oauth/authorize?..."
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
    const { scopes = [], redirectUri } = body;

    // Validate input
    if (!redirectUri) {
      return NextResponse.json(
        { error: 'redirectUri is required' },
        { status: 400 }
      );
    }

    // Build full scope list (default + requested)
    const defaultScopes = ['read:user', 'user:email'];
    const requestedScopes = [...defaultScopes, ...scopes];

    // Remove duplicates
    const uniqueScopes = [...new Set(requestedScopes)];

    // Initialize Integration Manager
    const manager = new IntegrationManager();

    // Generate authorization URL
    const authUrl = await manager.initiateOAuth(
      userId,
      'github',
      uniqueScopes,
      redirectUri
    );

    return NextResponse.json({
      authUrl,
      scopes: uniqueScopes,
    });
  } catch (error) {
    console.error('GitHub OAuth connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
