/**
 * GitHub Repository Content API
 *
 * POST /api/oauth/github/content
 *
 * Batch fetch file contents using authenticated OAuth connection.
 * Required for accessing private repository files.
 *
 * Request body:
 * {
 *   connectionId: number,
 *   owner: string,
 *   repo: string,
 *   branch: string,
 *   paths: string[]  // Array of file paths to fetch
 * }
 *
 * Response:
 * {
 *   files: [{ path, content, size, sha }],
 *   failed: [{ path, error }],
 *   rateLimit: { remaining, reset }
 * }
 *
 * Uses GitHub Contents API with raw media type for direct content.
 * Files >1MB use the Blobs API automatically.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import * as oauthDb from '@/lib/db-oauth-connections';

const MAX_BATCH_SIZE = 50;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB - GitHub Contents API limit

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

    const { connectionId, owner, repo, branch = 'main', paths } = body;

    // Validate required parameters
    if (!connectionId || !owner || !repo || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Missing required parameters: connectionId, owner, repo, paths[]' },
        { status: 400 }
      );
    }

    if (paths.length === 0) {
      return NextResponse.json(
        { files: [], failed: [], rateLimit: null },
        { status: 200 }
      );
    }

    if (paths.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} files per request` },
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

    // Common headers for GitHub API
    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Accept': 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // Fetch all files in parallel
    const results = await Promise.allSettled(
      paths.map(async (filePath) => {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
          // Check for large file that needs Blobs API
          if (response.status === 403) {
            const errorBody = await response.json().catch(() => ({}));
            if (errorBody.errors?.some(e => e.code === 'too_large')) {
              // Try Blobs API for large files
              return await fetchLargeFile(owner, repo, filePath, branch, headers);
            }
          }

          if (response.status === 404) {
            throw new Error('File not found');
          }

          if (response.status === 401 || response.status === 403) {
            throw new Error('Authorization failed');
          }

          throw new Error(`GitHub API error: ${response.status}`);
        }

        // For raw media type, response is the file content directly
        const content = await response.text();

        return {
          path: filePath,
          content,
          size: content.length,
          sha: response.headers.get('etag')?.replace(/"/g, '') || null
        };
      })
    );

    // Separate successful and failed fetches
    const files = [];
    const failed = [];
    let authError = false;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        files.push(result.value);
      } else {
        const error = result.reason?.message || 'Unknown error';
        if (error.includes('Authorization')) {
          authError = true;
        }
        failed.push({
          path: paths[index],
          error
        });
      }
    });

    // If all files failed with auth error, mark connection
    if (authError && files.length === 0) {
      await oauthDb.markConnectionError(connection.id, 'Token unauthorized');
      return NextResponse.json(
        { error: 'GitHub authorization expired. Please reconnect.' },
        { status: 401 }
      );
    }

    // Update last_used_at
    await oauthDb.touchConnection(connection.id);

    // Get rate limit info from last response header (best effort)
    const rateLimit = {
      remaining: null,
      reset: null
    };

    return NextResponse.json({
      files,
      failed,
      rateLimit
    });

  } catch (error) {
    console.error('GitHub content API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file contents' },
      { status: 500 }
    );
  }
}

/**
 * Fetch large files using GitHub Blobs API
 * Used when file exceeds 1MB Contents API limit
 */
async function fetchLargeFile(owner, repo, filePath, branch, headers) {
  // First get the file's blob SHA from the tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeResponse = await fetch(treeUrl, {
    headers: { ...headers, 'Accept': 'application/vnd.github+json' }
  });

  if (!treeResponse.ok) {
    throw new Error('Failed to get repository tree');
  }

  const treeData = await treeResponse.json();
  const fileEntry = treeData.tree?.find(entry => entry.path === filePath);

  if (!fileEntry || fileEntry.type !== 'blob') {
    throw new Error('File not found in tree');
  }

  // Fetch the blob content
  const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${fileEntry.sha}`;
  const blobResponse = await fetch(blobUrl, {
    headers: { ...headers, 'Accept': 'application/vnd.github+json' }
  });

  if (!blobResponse.ok) {
    throw new Error('Failed to fetch blob');
  }

  const blobData = await blobResponse.json();

  // Decode base64 content
  let content;
  if (blobData.encoding === 'base64') {
    content = Buffer.from(blobData.content, 'base64').toString('utf-8');
  } else {
    content = blobData.content;
  }

  return {
    path: filePath,
    content,
    size: blobData.size,
    sha: fileEntry.sha
  };
}
