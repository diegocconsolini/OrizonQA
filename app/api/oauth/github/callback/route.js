/**
 * GitHub OAuth Callback API
 *
 * GET /api/oauth/github/callback?code=xxx&state=yyy
 *
 * Handles the OAuth callback from GitHub.
 * Exchanges authorization code for access token and saves connection.
 *
 * Query Parameters:
 *   - code: Authorization code from GitHub
 *   - state: CSRF protection state parameter
 *   - error: Error code (if user denied access)
 *   - error_description: Error description
 *
 * Success: Redirects to Settings page with success message
 * Error: Redirects to Settings page with error message
 */

import { NextResponse } from 'next/server';
import IntegrationManager from '@/lib/oauth/IntegrationManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for OAuth errors
    if (error) {
      const redirectUrl = new URL('/settings', request.url);
      redirectUrl.searchParams.set('oauth', 'error');
      redirectUrl.searchParams.set('provider', 'github');
      redirectUrl.searchParams.set('message', errorDescription || error);

      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      const redirectUrl = new URL('/settings', request.url);
      redirectUrl.searchParams.set('oauth', 'error');
      redirectUrl.searchParams.set('provider', 'github');
      redirectUrl.searchParams.set('message', 'Missing code or state parameter');

      return NextResponse.redirect(redirectUrl);
    }

    // Build redirect URI (must match the one used in /connect)
    const redirectUri = new URL('/api/oauth/github/callback', request.url).toString();

    // Initialize Integration Manager
    const manager = new IntegrationManager();

    // Handle callback (exchange code for token)
    const connection = await manager.handleCallback(
      code,
      state,
      'github',
      redirectUri
    );

    // Success - redirect to Settings with success message
    const successUrl = new URL('/settings', request.url);
    successUrl.searchParams.set('oauth', 'success');
    successUrl.searchParams.set('provider', 'github');
    successUrl.searchParams.set('username', connection.provider_username);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);

    // Error - redirect to Settings with error message
    const errorUrl = new URL('/settings', request.url);
    errorUrl.searchParams.set('oauth', 'error');
    errorUrl.searchParams.set('provider', 'github');
    errorUrl.searchParams.set('message', error.message || 'OAuth callback failed');

    return NextResponse.redirect(errorUrl);
  }
}
