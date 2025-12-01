/**
 * API Route: /api/projects/[id]
 *
 * GET - Get project details
 * PUT - Update project
 * DELETE - Delete project (soft delete)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats
} from '@/lib/db-projects';

/**
 * GET /api/projects/[id]
 * Get project details with statistics
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

    // In Next.js 15+, params is a Promise
    const params = await context.params;
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID', received: params.id },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, session.user.id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get detailed statistics
    const stats = await getProjectStats(projectId);

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update project details
 *
 * Body:
 * {
 *   name: string (optional)
 *   description: string (optional)
 *   settings: object (optional)
 *   is_active: boolean (optional)
 * }
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
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, settings, is_active } = body;

    // Validate at least one field is provided
    if (name === undefined && description === undefined && settings === undefined && is_active === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update' },
        { status: 400 }
      );
    }

    // Update project
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (settings !== undefined) updates.settings = settings;
    if (is_active !== undefined) updates.is_active = is_active;

    const project = await updateProject(projectId, session.user.id, updates);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (soft delete by default)
 *
 * Query params:
 * - hard=true: Permanently delete (requires confirmation)
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
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Soft delete (set is_active = false)
    const deleted = await deleteProject(projectId, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Project not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project archived successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', details: error.message },
      { status: 500 }
    );
  }
}
