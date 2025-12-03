import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getConnectionsByUser, deleteConnection } from '@/lib/db-oauth-connections';

/**
 * POST /api/auth/logout
 *
 * Custom logout endpoint that:
 * 1. Retrieves encrypted GitHub OAuth token from database
 * 2. Revokes the token with GitHub API
 * 3. Deletes the token from database
 * 4. Returns success so client can proceed with NextAuth signOut
 *
 * Security:
 * - Tokens are stored encrypted (AES-256-GCM) in database
 * - Tokens are never exposed in JWT or client-side
 * - Tokens are decrypted only when needed for revocation
 *
 * GitHub token revocation uses the OAuth application endpoint:
 * DELETE https://api.github.com/applications/{client_id}/token
 */
export async function POST(request) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      // No session - still return success (user might already be logged out)
      return NextResponse.json({
        success: true,
        message: 'No active session'
      });
    }

    const userId = parseInt(session.user.id, 10);

    // Get GitHub auth connections for this user
    const connections = await getConnectionsByUser(userId, 'github_auth');

    if (connections.length > 0) {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      for (const connection of connections) {
        // Revoke token with GitHub API
        if (connection.access_token && clientId && clientSecret) {
          try {
            const response = await fetch(
              `https://api.github.com/applications/${clientId}/token`,
              {
                method: 'DELETE',
                headers: {
                  'Accept': 'application/vnd.github+json',
                  'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_token: connection.access_token
                }),
              }
            );

            if (response.status === 204) {
              console.log('GitHub token revoked successfully for user:', userId);
            } else if (response.status === 404) {
              console.log('GitHub token already revoked or not found for user:', userId);
            } else {
              console.error('Failed to revoke GitHub token:', response.status);
            }
          } catch (error) {
            console.error('Error revoking GitHub token:', error.message);
          }
        }

        // Delete the connection from database (regardless of revocation success)
        try {
          await deleteConnection(connection.id, userId);
          console.log('Deleted GitHub auth connection:', connection.id);
        } catch (error) {
          console.error('Error deleting connection:', error.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logout processed successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success - we don't want to prevent logout on errors
    return NextResponse.json({
      success: true,
      message: 'Logout processed with warnings'
    });
  }
}
