/**
 * GitHub Repositories API
 *
 * GET /api/oauth/github/repositories?connectionId=123
 *
 * Lists repositories for a connected GitHub account.
 *
 * Query Parameters:
 *   - connectionId: OAuth connection ID
 *   - page: Page number (default: 1)
 *   - perPage: Results per page (default: 30)
 *   - visibility: 'all', 'public', or 'private' (default: 'all')
 *   - sort: 'updated', 'pushed', 'full_name' (default: 'updated')
 *
 * Response:
 *   {
 *     "repositories": [
 *       {
 *         "id": 123,
 *         "name": "repo-name",
 *         "full_name": "owner/repo-name",
 *         "owner": "owner",
 *         "private": false,
 *         "description": "...",
 *         "url": "https://github.com/owner/repo-name",
 *         "default_branch": "main",
 *         "stars": 42,
 *         "language": "JavaScript"
 *       }
 *     ],
 *     "count": 10
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

    const connectionId = parseInt(searchParams.get('connectionId'), 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '30', 10);
    const visibility = searchParams.get('visibility') || 'all';
    const sort = searchParams.get('sort') || 'updated';

    // Validate connectionId
    if (!connectionId || isNaN(connectionId)) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    // Initialize Integration Manager
    const manager = new IntegrationManager();

    // List repositories
    const repositories = await manager.listRepositories(
      connectionId,
      userId,
      {
        page,
        perPage,
        visibility,
        sort,
      }
    );

    return NextResponse.json({
      repositories,
      count: repositories.length,
      page,
      perPage,
    });
  } catch (error) {
    console.error('GitHub repositories error:', error);

    // Handle specific errors
    if (error.message === 'Connection not found') {
      return NextResponse.json(
        { error: 'Connection not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
