/**
 * API Route: /api/projects
 *
 * GET - List all projects for the authenticated user
 * POST - Create a new project
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getProjectsByUser,
  createProject,
  addProjectMember
} from '@/lib/db-projects';

/**
 * GET /api/projects
 * List all projects for authenticated user
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const projects = await getProjectsByUser(session.user.id, activeOnly);

    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 *
 * Body:
 * {
 *   name: string (required)
 *   key: string (required, unique, e.g., "PROJ")
 *   description: string (optional)
 *   settings: object (optional)
 * }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, key, description, settings } = body;

    // Validation
    if (!name || !key) {
      return NextResponse.json(
        { error: 'Name and key are required' },
        { status: 400 }
      );
    }

    // Validate key format (alphanumeric, uppercase, max 10 chars)
    const keyRegex = /^[A-Z0-9]{2,10}$/;
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        { error: 'Project key must be 2-10 uppercase alphanumeric characters' },
        { status: 400 }
      );
    }

    // Create project
    const project = await createProject({
      name,
      key,
      description: description || null,
      owner_id: session.user.id,
      settings: settings || {}
    });

    // Automatically add creator as Admin member
    await addProjectMember(project.id, session.user.id, 'Admin', session.user.id);

    return NextResponse.json({
      success: true,
      project
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);

    // Handle duplicate key error
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}
