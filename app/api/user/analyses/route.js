import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAnalysesByUser, getAnalysisCountByUser, query } from '@/lib/db';

/**
 * GET /api/user/analyses
 *
 * Fetch user's analyses with pagination and stats
 *
 * Query params:
 * - limit: number of analyses to return (default: 10)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch analyses
    const analyses = await getAnalysesByUser(session.user.id, limit, offset);

    // Get total count
    const total = await getAnalysisCountByUser(session.user.id);

    // Calculate stats (total tokens used)
    // Note: SUM returns null if all values are null, so use COALESCE around SUM
    let stats = { total: 0, totalTokens: 0 };
    try {
      const statsResult = await query(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(
            COALESCE((token_usage->>'input_tokens')::integer, 0) +
            COALESCE((token_usage->>'output_tokens')::integer, 0)
          ), 0) as total_tokens
        FROM analyses
        WHERE user_id = $1
      `, [session.user.id]);

      const row = statsResult.rows[0];
      stats = {
        total: parseInt(row?.total || '0', 10) || 0,
        totalTokens: parseInt(row?.total_tokens || '0', 10) || 0
      };
    } catch (statsError) {
      console.error('Error calculating stats (non-fatal):', statsError);
      // Continue with default stats - don't fail the whole request
    }

    return NextResponse.json({
      analyses,
      total,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching user analyses:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch analyses', details: error.message },
      { status: 500 }
    );
  }
}
