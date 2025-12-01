import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAnalysisByIdForUser, deleteAnalysis } from '@/lib/db';

/**
 * GET /api/user/analyses/[id]
 * Get a single analysis by ID (only if owned by user)
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const analysis = await getAnalysisByIdForUser(parseInt(id), session.user.id);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Parse JSON fields
    const response = {
      ...analysis,
      config: typeof analysis.config === 'string' ? JSON.parse(analysis.config) : analysis.config,
      results: typeof analysis.results === 'string' ? JSON.parse(analysis.results) : analysis.results,
      token_usage: typeof analysis.token_usage === 'string' ? JSON.parse(analysis.token_usage) : analysis.token_usage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/analyses/[id]
 * Delete an analysis (only if owned by user)
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const deleted = await deleteAnalysis(parseInt(id), session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Analysis not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}
