import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSharedAnalysesByUser } from '@/lib/db';

/**
 * GET /api/user/shares
 * Get all shared analyses for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shares = await getSharedAnalysesByUser(session.user.id);

    // Transform data for frontend
    const transformedShares = shares.map(share => ({
      id: share.id,
      createdAt: share.created_at,
      inputType: share.input_type,
      provider: share.provider,
      model: share.model,
      githubUrl: share.github_url,
      githubBranch: share.github_branch,
      tokenUsage: share.token_usage,
      shareToken: share.share_token,
      isShared: share.is_shared,
      shareUrl: share.is_shared ? `/shared/${share.share_token}` : null
    }));

    // Count active shares
    const activeCount = transformedShares.filter(s => s.isShared).length;

    return NextResponse.json({
      shares: transformedShares,
      total: transformedShares.length,
      activeCount
    });
  } catch (error) {
    console.error('GET /api/user/shares error:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}
