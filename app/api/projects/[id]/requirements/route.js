/**
 * API Route: /api/projects/[id]/requirements
 *
 * GET - List all requirements for a project
 * POST - Create a new requirement
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userHasProjectAccess } from '@/lib/db-projects';
import {
  getRequirementsByProject,
  createRequirement
} from '@/lib/db-requirements';

/**
 * GET /api/projects/[id]/requirements
 * List requirements with optional filters
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

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      version: searchParams.get('version') || undefined
    };

    const requirements = await getRequirementsByProject(projectId, filters);

    return NextResponse.json({
      success: true,
      requirements
    });

  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirements', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/requirements
 * Create a new requirement
 *
 * Body:
 * {
 *   key: string (required, e.g., "REQ-1")
 *   title: string (required)
 *   description: string (optional)
 *   type: string (optional, default: "Story")
 *   status: string (optional, default: "Open")
 *   priority: string (optional, default: "Medium")
 *   version: string (optional)
 *   external_id: string (optional, e.g., Jira ID)
 *   external_url: string (optional)
 * }
 */
export async function POST(request, { params }) {
  try {
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

    const body = await request.json();
    const {
      key,
      title,
      description,
      type,
      status,
      priority,
      version,
      external_id,
      external_url
    } = body;

    // Validation
    if (!key || !title) {
      return NextResponse.json(
        { error: 'Key and title are required' },
        { status: 400 }
      );
    }

    // Validate key format (alphanumeric with optional hyphen/underscore)
    const keyRegex = /^[A-Z0-9_-]{2,50}$/i;
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        { error: 'Requirement key must be 2-50 alphanumeric characters (hyphens and underscores allowed)' },
        { status: 400 }
      );
    }

    // Create requirement
    const requirement = await createRequirement({
      project_id: projectId,
      key,
      title,
      description: description || null,
      type: type || 'Story',
      status: status || 'Open',
      priority: priority || 'Medium',
      version: version || null,
      external_id: external_id || null,
      external_url: external_url || null,
      created_by: session.user.id
    });

    return NextResponse.json({
      success: true,
      requirement
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating requirement:', error);

    // Handle duplicate key error
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create requirement', details: error.message },
      { status: 500 }
    );
  }
}
