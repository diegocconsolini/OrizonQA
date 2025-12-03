import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/user/analytics
 *
 * Returns aggregated analytics for the user's analyses.
 * Supports period filtering: 7d, 30d, 90d, all
 */
export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range based on period
    let dateFilter = '';
    let previousDateFilter = '';
    const now = new Date();

    if (period !== 'all') {
      const days = parseInt(period);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);

      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      dateFilter = `AND created_at >= '${startDate.toISOString()}'`;
      previousDateFilter = `AND created_at >= '${previousStartDate.toISOString()}' AND created_at < '${startDate.toISOString()}'`;
    }

    // Get current period stats
    const currentStatsResult = await query(`
      SELECT
        COUNT(*) as total_analyses,
        COALESCE(SUM(
          COALESCE((token_usage->>'input_tokens')::int, 0) +
          COALESCE((token_usage->>'output_tokens')::int, 0)
        ), 0) as total_tokens
      FROM analyses
      WHERE user_id = $1 ${dateFilter}
    `, [userId]);

    const currentStats = currentStatsResult.rows[0];
    const totalAnalyses = parseInt(currentStats.total_analyses) || 0;
    const totalTokens = parseInt(currentStats.total_tokens) || 0;

    // Get previous period stats for comparison
    let analysesChange = 0;
    let tokensChange = 0;

    if (period !== 'all') {
      const previousStatsResult = await query(`
        SELECT
          COUNT(*) as total_analyses,
          COALESCE(SUM(
            COALESCE((token_usage->>'input_tokens')::int, 0) +
            COALESCE((token_usage->>'output_tokens')::int, 0)
          ), 0) as total_tokens
        FROM analyses
        WHERE user_id = $1 ${previousDateFilter}
      `, [userId]);

      const previousStats = previousStatsResult.rows[0];
      const prevAnalyses = parseInt(previousStats.total_analyses) || 0;
      const prevTokens = parseInt(previousStats.total_tokens) || 0;

      if (prevAnalyses > 0) {
        analysesChange = ((totalAnalyses - prevAnalyses) / prevAnalyses) * 100;
      }
      if (prevTokens > 0) {
        tokensChange = ((totalTokens - prevTokens) / prevTokens) * 100;
      }
    }

    // Get last analysis timestamp
    const lastAnalysisResult = await query(`
      SELECT created_at
      FROM analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    const lastAnalysisAt = lastAnalysisResult.rows[0]?.created_at || null;

    // Get breakdown by provider WITH tokens
    const byProviderResult = await query(`
      SELECT
        provider,
        COUNT(*) as count,
        COALESCE(SUM(
          COALESCE((token_usage->>'input_tokens')::int, 0) +
          COALESCE((token_usage->>'output_tokens')::int, 0)
        ), 0) as tokens
      FROM analyses
      WHERE user_id = $1 ${dateFilter}
      GROUP BY provider
      ORDER BY count DESC
    `, [userId]);

    const totalForProvider = byProviderResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const byProvider = byProviderResult.rows.map(row => ({
      name: row.provider === 'claude' ? 'Claude' : 'LM Studio',
      count: parseInt(row.count),
      tokens: parseInt(row.tokens),
      percentage: totalForProvider > 0 ? Math.round((parseInt(row.count) / totalForProvider) * 100) : 0,
      color: row.provider === 'claude' ? '#00D4FF' : '#FF9500'
    }));

    // Get breakdown by input type WITH tokens
    const byInputTypeResult = await query(`
      SELECT
        input_type,
        COUNT(*) as count,
        COALESCE(SUM(
          COALESCE((token_usage->>'input_tokens')::int, 0) +
          COALESCE((token_usage->>'output_tokens')::int, 0)
        ), 0) as tokens
      FROM analyses
      WHERE user_id = $1 ${dateFilter}
      GROUP BY input_type
      ORDER BY count DESC
    `, [userId]);

    const totalForInputType = byInputTypeResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const inputTypeColors = {
      github: '#6A00FF',
      paste: '#00D4FF',
      file: '#FF9500'
    };
    const inputTypeNames = {
      github: 'GitHub',
      paste: 'Paste',
      file: 'File Upload'
    };

    const byInputType = byInputTypeResult.rows.map(row => ({
      name: inputTypeNames[row.input_type] || row.input_type,
      count: parseInt(row.count),
      tokens: parseInt(row.tokens),
      percentage: totalForInputType > 0 ? Math.round((parseInt(row.count) / totalForInputType) * 100) : 0,
      color: inputTypeColors[row.input_type] || '#888888'
    }));

    // Get daily usage for the period
    const dailyUsageResult = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(
          COALESCE((token_usage->>'input_tokens')::int, 0) +
          COALESCE((token_usage->>'output_tokens')::int, 0)
        ), 0) as tokens
      FROM analyses
      WHERE user_id = $1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId]);

    const dailyUsage = dailyUsageResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
      tokens: parseInt(row.tokens)
    }));

    // Get activity heatmap data (day of week x hour)
    const heatmapResult = await query(`
      SELECT
        EXTRACT(DOW FROM created_at) as day,
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM analyses
      WHERE user_id = $1 ${dateFilter}
      GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY day, hour
    `, [userId]);

    const heatmapData = heatmapResult.rows.map(row => ({
      day: parseInt(row.day),
      hour: parseInt(row.hour),
      count: parseInt(row.count)
    }));

    // Get recent analyses
    const recentAnalysesResult = await query(`
      SELECT
        id,
        created_at,
        input_type,
        provider,
        model,
        github_url,
        COALESCE((token_usage->>'input_tokens')::int, 0) +
        COALESCE((token_usage->>'output_tokens')::int, 0) as tokens
      FROM analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    const recentAnalyses = recentAnalysesResult.rows.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      inputType: row.input_type,
      provider: row.provider,
      model: row.model,
      githubUrl: row.github_url,
      tokens: parseInt(row.tokens)
    }));

    // Calculate average tokens per analysis
    const avgTokensPerAnalysis = totalAnalyses > 0 ? Math.round(totalTokens / totalAnalyses) : 0;

    return NextResponse.json({
      summary: {
        totalAnalyses,
        totalTokens,
        avgTokensPerAnalysis,
        lastAnalysisAt,
        analysesChange: Math.round(analysesChange * 10) / 10,
        tokensChange: Math.round(tokensChange * 10) / 10
      },
      byProvider,
      byInputType,
      dailyUsage,
      heatmapData,
      recentAnalyses
    });

  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
