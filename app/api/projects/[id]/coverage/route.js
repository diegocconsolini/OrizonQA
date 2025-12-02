/**
 * API Route: /api/projects/[id]/coverage
 *
 * GET - Get coverage statistics and traceability matrix
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userHasProjectAccess } from '@/lib/db-projects';
import {
  getCoverageStats,
  getTraceabilityMatrix,
  getUncoveredRequirements,
  getUnlinkedTestCases,
  getCoverageByType,
  getCoverageByPriority
} from '@/lib/db-test-coverage';

/**
 * GET /api/projects/[id]/coverage
 * Get comprehensive coverage data for a project
 *
 * Query params:
 * - view: 'stats' | 'matrix' | 'gaps' | 'breakdown' (default: 'stats')
 */
export async function GET(request, context) {
  try {
    const params = await context.params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = parseInt(params.id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Check access
    const hasAccess = await userHasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'stats';

    let data = {};

    switch (view) {
      case 'stats':
        // Overall coverage statistics
        data.stats = await getCoverageStats(projectId);
        break;

      case 'matrix':
        // Full traceability matrix
        data.matrix = await getTraceabilityMatrix(projectId);
        break;

      case 'gaps':
        // Uncovered requirements and unlinked tests
        data.uncovered_requirements = await getUncoveredRequirements(projectId);
        data.unlinked_test_cases = await getUnlinkedTestCases(projectId);
        break;

      case 'breakdown':
        // Coverage breakdown by type and priority
        data.by_type = await getCoverageByType(projectId);
        data.by_priority = await getCoverageByPriority(projectId);
        break;

      case 'all':
        // Return all coverage data (comprehensive view)
        data.stats = await getCoverageStats(projectId);
        data.matrix = await getTraceabilityMatrix(projectId);
        data.uncovered_requirements = await getUncoveredRequirements(projectId);
        data.unlinked_test_cases = await getUnlinkedTestCases(projectId);
        data.by_type = await getCoverageByType(projectId);
        data.by_priority = await getCoverageByPriority(projectId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid view parameter. Must be: stats, matrix, gaps, breakdown, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      view,
      ...data
    });

  } catch (error) {
    console.error('Error fetching coverage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coverage data', details: error.message },
      { status: 500 }
    );
  }
}
