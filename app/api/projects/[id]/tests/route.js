/**
 * API Route: /api/projects/[id]/tests
 *
 * GET - Get all test cases for a project
 * POST - Create a new test case
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getTestCasesByProject,
  createTestCase
} from '@/lib/db-test-cases';
import { userHasProjectAccess } from '@/lib/db-projects';

/**
 * GET /api/projects/[id]/tests
 * Get all test cases for a project with optional filters
 *
 * Query params:
 * - suite_id: Filter by test suite
 * - status: Filter by status (Draft, Ready, Deprecated)
 * - priority: Filter by priority (Critical, High, Medium, Low)
 * - type: Filter by type (Functional, Integration, Performance, etc.)
 * - automated: Filter by automation status (true/false)
 * - search: Search in title, description, key
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
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
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

    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const filters = {
      suite_id: searchParams.get('suite_id') ? parseInt(searchParams.get('suite_id')) : undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      type: searchParams.get('type') || undefined,
      automated: searchParams.get('automated') ? searchParams.get('automated') === 'true' : undefined,
      search: searchParams.get('search') || undefined
    };

    const testCases = await getTestCasesByProject(projectId, filters);

    return NextResponse.json({
      success: true,
      testCases
    });

  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test cases', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/tests
 * Create a new test case
 *
 * Body:
 * {
 *   title: string (required)
 *   description: string
 *   preconditions: string
 *   steps: array of {step, expected, data}
 *   expected_result: string
 *   priority: string (Critical, High, Medium, Low)
 *   type: string (Functional, Integration, Performance, etc.)
 *   status: string (Draft, Ready)
 *   automated: boolean
 *   tags: array of strings
 *   suite_id: number
 *   folder_path: string
 * }
 */
export async function POST(request, context) {
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

    // Check project access
    const hasAccess = await userHasProjectAccess(projectId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      preconditions,
      steps,
      expected_result,
      priority,
      type,
      status,
      automated,
      tags,
      suite_id,
      folder_path
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create test case
    const testCaseData = {
      project_id: projectId,
      title,
      description: description || null,
      preconditions: preconditions || null,
      steps: steps || [],
      expected_result: expected_result || null,
      priority: priority || 'Medium',
      type: type || 'Functional',
      status: status || 'Draft',
      automated: automated || false,
      tags: tags || [],
      suite_id: suite_id || null,
      folder_path: folder_path || null,
      created_by: session.user.id,
      updated_by: session.user.id
    };

    const testCase = await createTestCase(testCaseData);

    return NextResponse.json({
      success: true,
      testCase
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      { error: 'Failed to create test case', details: error.message },
      { status: 500 }
    );
  }
}
