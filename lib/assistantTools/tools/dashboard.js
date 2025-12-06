/**
 * Dashboard Tools Handler
 *
 * Handles dashboard statistics and metrics operations.
 */

import { getUserStats, getRecentAnalyses, getUsageMetrics } from '@/lib/db.js';

/**
 * Execute a dashboard tool
 */
export async function executeDashboardTool(toolName, input, context) {
  const { userId } = context;

  try {
    switch (toolName) {
      case 'get_dashboard_stats':
        return await getDashboardStats(userId);
      case 'get_recent_analyses':
        return await getRecentAnalysesList(input, userId);
      case 'get_usage_metrics':
        return await getUsageMetricsList(input, userId);
      default:
        return { success: false, error: `Unknown dashboard tool: ${toolName}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getDashboardStats(userId) {
  const stats = await getUserStats(userId);

  return {
    success: true,
    data: {
      stats: {
        totalAnalyses: stats.total_analyses || 0,
        totalTokens: stats.total_tokens || 0,
        testsGenerated: stats.tests_generated || 0,
        projectsCount: stats.projects_count || 0,
        requirementsCount: stats.requirements_count || 0,
        testCasesCount: stats.test_cases_count || 0,
        executionsCount: stats.executions_count || 0,
        passRate: stats.pass_rate || 0,
      },
    },
  };
}

async function getRecentAnalysesList(input, userId) {
  const { limit = 10 } = input;
  const analyses = await getRecentAnalyses(userId, limit);

  return {
    success: true,
    data: {
      analyses: analyses.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        tokensUsed: a.tokens_used,
        createdAt: a.created_at,
      })),
      count: analyses.length,
    },
  };
}

async function getUsageMetricsList(input, userId) {
  const { period = '30d' } = input;
  const metrics = await getUsageMetrics(userId, period);

  return {
    success: true,
    data: {
      period,
      metrics: {
        dailyUsage: metrics.daily_usage || [],
        totalTokens: metrics.total_tokens || 0,
        analysisCount: metrics.analysis_count || 0,
        averageTokensPerAnalysis: metrics.avg_tokens || 0,
      },
    },
  };
}

export default { executeDashboardTool };
