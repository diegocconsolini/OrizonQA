import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { toggleAnalysisSharing, getAnalysisSharingStatus } from '@/lib/db';

/**
 * GET /api/user/analyses/[id]/share
 * Get sharing status for an analysis
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const status = await getAnalysisSharingStatus(parseInt(id), session.user.id);

    if (!status) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Build the share URL if shared
    const shareUrl = status.isShared && status.shareToken
      ? `${process.env.NEXTAUTH_URL || 'https://orizon-qa.vercel.app'}/shared/${status.shareToken}`
      : null;

    return NextResponse.json({
      isShared: status.isShared,
      shareToken: status.shareToken,
      shareUrl
    });
  } catch (error) {
    console.error('Error getting sharing status:', error);
    return NextResponse.json(
      { error: 'Failed to get sharing status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/analyses/[id]/share
 * Toggle sharing for an analysis
 * Body: { enable: boolean }
 */
export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { enable } = await request.json();

    const result = await toggleAnalysisSharing(parseInt(id), session.user.id, enable);

    if (!result) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Build the share URL if shared
    const shareUrl = result.isShared && result.shareToken
      ? `${process.env.NEXTAUTH_URL || 'https://orizon-qa.vercel.app'}/shared/${result.shareToken}`
      : null;

    return NextResponse.json({
      isShared: result.isShared,
      shareToken: result.shareToken,
      shareUrl
    });
  } catch (error) {
    console.error('Error toggling sharing:', error);
    return NextResponse.json(
      { error: 'Failed to toggle sharing' },
      { status: 500 }
    );
  }
}
