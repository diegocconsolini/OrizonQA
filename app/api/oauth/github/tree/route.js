/**
 * GitHub Repository Tree API
 *
 * GET /api/oauth/github/tree?connectionId=&owner=&repo=&branch=
 *
 * Fetches repository file tree using authenticated OAuth connection.
 * Required for accessing private repositories.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import * as oauthDb from '@/lib/db-oauth-connections';

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

    const connectionId = searchParams.get('connectionId');
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch') || 'main';

    if (!connectionId || !owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: connectionId, owner, repo' },
        { status: 400 }
      );
    }

    // Get connection and verify ownership
    const connection = await oauthDb.getConnectionById(
      parseInt(connectionId, 10),
      userId
    );

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    if (connection.provider !== 'github') {
      return NextResponse.json(
        { error: 'Invalid provider for this endpoint' },
        { status: 400 }
      );
    }

    // Fetch tree from GitHub API with authentication
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub API error:', response.status, errorData);

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Repository or branch not found' },
          { status: 404 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        // Token might be invalid/expired
        await oauthDb.markConnectionError(connection.id, 'Token unauthorized');
        return NextResponse.json(
          { error: 'GitHub authorization expired. Please reconnect.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch repository tree' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Update last_used_at
    await oauthDb.touchConnection(connection.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub tree API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repository tree' },
      { status: 500 }
    );
  }
}
