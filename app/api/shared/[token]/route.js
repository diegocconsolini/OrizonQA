import { NextResponse } from 'next/server';
import { getAnalysisByShareToken } from '@/lib/db';

/**
 * GET /api/shared/[token]
 * Get a shared analysis by token (public, no auth required)
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const { token } = params;

    if (!token || token.length !== 64) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 });
    }

    const analysis = await getAnalysisByShareToken(token);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found or no longer shared' }, { status: 404 });
    }

    // Parse JSON fields if needed
    const response = {
      ...analysis,
      config: typeof analysis.config === 'string' ? JSON.parse(analysis.config) : analysis.config,
      results: typeof analysis.results === 'string' ? JSON.parse(analysis.results) : analysis.results,
      token_usage: typeof analysis.token_usage === 'string' ? JSON.parse(analysis.token_usage) : analysis.token_usage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shared analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
