/**
 * API Route: /api/projects/[id]/tests/[testId]
 *
 * GET - Get test case details
 * PUT - Update test case
 * DELETE - Delete test case (soft delete)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getTestCaseById,
  updateTestCase,
  deleteTestCase
} from '@/lib/db-test-cases';
import { userHasProjectAccess } from '@/lib/db-projects';

/**
 * GET /api/projects/[id]/tests/[testId]
 * Get test case details
 */
export async function GET(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const projectId = parseInt(params.id);
    const testId = parseInt(params.testId);

    if (isNaN(projectId) || isNaN(testId)) {
      return NextResponse.json(
        { error: 'Invalid project or test ID' },
        { status: 400 }
      );
    }

    // Check project access
    const hasAccess = await userHasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const testCase = await getTestCaseById(testId);

    if (!testCase || testCase.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      testCase
    });

  } catch (error) {
    console.error('Error fetching test case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/tests/[testId]
 * Update test case
 *
 * Body: Any test case fields to update
 */
export async function PUT(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const projectId = parseInt(params.id);
    const testId = parseInt(params.testId);

    if (isNaN(projectId) || isNaN(testId)) {
      return NextResponse.json(
        { error: 'Invalid project or test ID' },
        { status: 400 }
      );
    }

    // Check project access
    const hasAccess = await userHasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Verify test case belongs to project
    const existingTest = await getTestCaseById(testId);
    if (!existingTest || existingTest.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Add updated_by to updates
    const updates = {
      ...body,
      updated_by: session.user.id
    };

    const testCase = await updateTestCase(testId, updates);

    if (!testCase) {
      return NextResponse.json(
        { error: 'Failed to update test case' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testCase
    });

  } catch (error) {
    console.error('Error updating test case:', error);
    return NextResponse.json(
      { error: 'Failed to update test case', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/tests/[testId]
 * Delete test case (soft delete by setting status to 'Deprecated')
 */
export async function DELETE(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const projectId = parseInt(params.id);
    const testId = parseInt(params.testId);

    if (isNaN(projectId) || isNaN(testId)) {
      return NextResponse.json(
        { error: 'Invalid project or test ID' },
        { status: 400 }
      );
    }

    // Check project access
    const hasAccess = await userHasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Verify test case belongs to project
    const existingTest = await getTestCaseById(testId);
    if (!existingTest || existingTest.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteTestCase(testId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete test case' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test case deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test case:', error);
    return NextResponse.json(
      { error: 'Failed to delete test case', details: error.message },
      { status: 500 }
    );
  }
}
