/**
 * API Route: /api/projects/[id]/requirements/[reqId]
 *
 * GET - Get requirement details
 * PUT - Update requirement
 * DELETE - Delete requirement
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userHasProjectAccess } from '@/lib/db-projects';
import {
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getRequirementTestCases
} from '@/lib/db-requirements';

/**
 * GET /api/projects/[id]/requirements/[reqId]
 * Get requirement details with linked test cases
 */
export async function GET(request, { params }) {
  try {
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

    const requirement = await getRequirementById(requirementId);

    if (!requirement || requirement.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    // Get linked test cases
    const testCases = await getRequirementTestCases(requirementId);

    return NextResponse.json({
      success: true,
      requirement: {
        ...requirement,
        test_cases: testCases
      }
    });

  } catch (error) {
    console.error('Error fetching requirement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirement', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/requirements/[reqId]
 * Update requirement
 *
 * Body:
 * {
 *   title: string (optional)
 *   description: string (optional)
 *   type: string (optional)
 *   status: string (optional)
 *   priority: string (optional)
 *   version: string (optional)
 *   external_id: string (optional)
 *   external_url: string (optional)
 * }
 */
export async function PUT(request, { params }) {
  try {
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
    const existing = await getRequirementById(requirementId);
    if (!existing || existing.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      status,
      priority,
      version,
      external_id,
      external_url
    } = body;

    // Validate at least one field is provided
    if (
      title === undefined &&
      description === undefined &&
      type === undefined &&
      status === undefined &&
      priority === undefined &&
      version === undefined &&
      external_id === undefined &&
      external_url === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update' },
        { status: 400 }
      );
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (version !== undefined) updates.version = version;
    if (external_id !== undefined) updates.external_id = external_id;
    if (external_url !== undefined) updates.external_url = external_url;

    const requirement = await updateRequirement(requirementId, updates);

    return NextResponse.json({
      success: true,
      requirement
    });

  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json(
      { error: 'Failed to update requirement', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/requirements/[reqId]
 * Delete requirement
 */
export async function DELETE(request, { params }) {
  try {
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
    const existing = await getRequirementById(requirementId);
    if (!existing || existing.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteRequirement(requirementId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete requirement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Requirement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting requirement:', error);
    return NextResponse.json(
      { error: 'Failed to delete requirement', details: error.message },
      { status: 500 }
    );
  }
}
