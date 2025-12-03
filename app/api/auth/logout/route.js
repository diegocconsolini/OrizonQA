import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';

/**
 * POST /api/auth/logout
 *
 * Custom logout endpoint that:
 * 1. Revokes GitHub OAuth token if present
 * 2. Returns success so client can proceed with NextAuth signOut
 *
 * GitHub token revocation uses the OAuth application endpoint:
 * DELETE https://api.github.com/applications/{client_id}/token
 *
 * Note: This requires Basic auth with client_id:client_secret
 */
export async function POST(request) {
  try {
    // Get the JWT token which contains the access token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If user logged in with GitHub and has an access token, revoke it
    if (token?.provider === 'github' && token?.accessToken) {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          // GitHub OAuth token revocation endpoint
          // https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-token
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
                access_token: token.accessToken
              }),
            }
          );

          if (response.status === 204) {
            console.log('GitHub token revoked successfully');
          } else if (response.status === 404) {
            // Token already revoked or invalid - that's fine
            console.log('GitHub token already revoked or not found');
          } else {
            console.error('Failed to revoke GitHub token:', response.status);
          }
        } catch (error) {
          // Don't fail the logout if token revocation fails
          console.error('Error revoking GitHub token:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logout processed'
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
