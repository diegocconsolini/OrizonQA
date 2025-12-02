/**
 * API Route: /api/projects/[id]/requirements/[reqId]/tests
 *
 * POST - Link a test case to this requirement
 * DELETE - Unlink a test case from this requirement
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userHasProjectAccess } from '@/lib/db-projects';
import { getRequirementById } from '@/lib/db-requirements';
import { linkTestToRequirement, unlinkTestFromRequirement } from '@/lib/db-test-coverage';

/**
 * POST /api/projects/[id]/requirements/[reqId]/tests
 * Link a test case to a requirement
 *
 * Body:
 * {
 *   test_case_id: number (required)
 *   coverage_type: string (optional, default: "Covers")
 * }
 */
export async function POST(request, context) {
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
    const requirementId = parseInt(params.reqId);

    if (isNaN(projectId) || isNaN(requirementId)) {
      return NextResponse.json(
        { error: 'Invalid project or requirement ID' },
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

    // Verify requirement belongs to project
    const requirement = await getRequirementById(requirementId);
    if (!requirement || requirement.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { test_case_id, coverage_type } = body;

    if (!test_case_id) {
      return NextResponse.json(
        { error: 'test_case_id is required' },
        { status: 400 }
      );
    }

    const link = await linkTestToRequirement(
      requirementId,
      test_case_id,
      coverage_type || 'Covers'
    );

    return NextResponse.json({
      success: true,
      link
    }, { status: 201 });

  } catch (error) {
    console.error('Error linking test to requirement:', error);
    return NextResponse.json(
      { error: 'Failed to link test case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/requirements/[reqId]/tests
 * Unlink a test case from a requirement
 *
 * Body:
 * {
 *   test_case_id: number (required)
 * }
 */
export async function DELETE(request, context) {
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
    const requirementId = parseInt(params.reqId);

    if (isNaN(projectId) || isNaN(requirementId)) {
      return NextResponse.json(
        { error: 'Invalid project or requirement ID' },
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

    // Verify requirement belongs to project
    const requirement = await getRequirementById(requirementId);
    if (!requirement || requirement.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { test_case_id } = body;

    if (!test_case_id) {
      return NextResponse.json(
        { error: 'test_case_id is required' },
        { status: 400 }
      );
    }

    const deleted = await unlinkTestFromRequirement(requirementId, test_case_id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Test case was not linked to this requirement' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test case unlinked successfully'
    });

  } catch (error) {
    console.error('Error unlinking test from requirement:', error);
    return NextResponse.json(
      { error: 'Failed to unlink test case', details: error.message },
      { status: 500 }
    );
  }
}
