/**
 * GitHub Device Flow Authentication API
 *
 * Implements OAuth 2.0 Device Authorization Grant for CLI tools and headless environments.
 *
 * Flow:
 * 1. POST /api/auth/device/initiate - Start device flow, get device_code and user_code
 * 2. User visits verification_uri and enters user_code
 * 3. POST /api/auth/device/poll - Poll for completion with device_code
 * 4. Once authorized, returns access token
 *
 * Reference: https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;

/**
 * POST /api/auth/device/initiate
 *
 * Initiates the device flow by requesting a device code from GitHub.
 * Returns user_code and verification_uri for the user.
 */
export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'initiate') {
      // Request device code from GitHub
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          scope: 'read:user user:email', // Basic user info only (no repo access by default)
        }),
      });

      const data = await response.json();

      if (data.error) {
        return NextResponse.json(
          { error: data.error_description || 'Failed to initiate device flow' },
          { status: 400 }
        );
      }

      // Return device code info to client
      return NextResponse.json({
        device_code: data.device_code,
        user_code: data.user_code,
        verification_uri: data.verification_uri,
        expires_in: data.expires_in,
        interval: data.interval,
      });
    }

    if (action === 'poll') {
      const { device_code } = await request.json();

      if (!device_code) {
        return NextResponse.json(
          { error: 'device_code is required' },
          { status: 400 }
        );
      }

      // Poll GitHub for access token
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      const data = await response.json();

      // Handle pending authorization
      if (data.error === 'authorization_pending') {
        return NextResponse.json({ status: 'pending' });
      }

      // Handle slow down (rate limiting)
      if (data.error === 'slow_down') {
        return NextResponse.json({ status: 'slow_down' });
      }

      // Handle expired token
      if (data.error === 'expired_token') {
        return NextResponse.json(
          { error: 'Device code expired. Please restart the authentication flow.' },
          { status: 400 }
        );
      }

      // Handle access denied
      if (data.error === 'access_denied') {
        return NextResponse.json(
          { error: 'Access denied by user' },
          { status: 403 }
        );
      }

      // Handle other errors
      if (data.error) {
        return NextResponse.json(
          { error: data.error_description || 'Authentication failed' },
          { status: 400 }
        );
      }

      // Success - we have an access token
      const accessToken = data.access_token;

      // Fetch user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const githubUser = await userResponse.json();

      // Fetch user's primary email
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary)?.email || githubUser.email;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: 'No email found in GitHub account' },
          { status: 400 }
        );
      }

      // Check if user exists in database
      const existingUser = await query(
        'SELECT * FROM users WHERE email = $1',
        [primaryEmail.toLowerCase()]
      );

      let userId;
      let userName;

      if (existingUser.rows.length === 0) {
        // Create new user
        const result = await query(`
          INSERT INTO users (email, full_name, email_verified, is_active, created_at)
          VALUES ($1, $2, true, true, NOW())
          RETURNING id, email, full_name
        `, [primaryEmail.toLowerCase(), githubUser.name || githubUser.login]);

        userId = result.rows[0].id;
        userName = result.rows[0].full_name;

        // Log audit event
        await query(`
          INSERT INTO audit_logs (user_id, action, details, created_at)
          VALUES ($1, $2, $3, NOW())
        `, [
          userId,
          'user_registered',
          JSON.stringify({ method: 'github_device_flow', email: primaryEmail }),
        ]);
      } else {
        // Update existing user
        userId = existingUser.rows[0].id;
        userName = existingUser.rows[0].full_name;

        await query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [userId]
        );
      }

      // Generate a session token (you might want to use JWT here)
      // For now, return user info and let the client handle session creation
      return NextResponse.json({
        status: 'success',
        user: {
          id: userId,
          email: primaryEmail,
          name: userName,
        },
        github_access_token: accessToken, // Optional: return if you want to use GitHub API
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "initiate" or "poll"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Device flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
