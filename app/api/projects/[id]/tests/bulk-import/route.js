/**
 * API Route: /api/projects/[id]/tests/bulk-import
 *
 * POST - Bulk import test cases from AI-generated artifacts
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createTestCase } from '@/lib/db-test-cases';
import { userHasProjectAccess } from '@/lib/db-projects';

/**
 * POST /api/projects/[id]/tests/bulk-import
 * Bulk import test cases from AI analysis
 *
 * Body:
 * {
 *   tests: array of test case objects
 *   analysis_id: optional - link to analysis record
 * }
 *
 * Each test object should have:
 * {
 *   title: string
 *   description: string
 *   steps: array of {step, expected, data}
 *   priority: string
 *   type: string
 *   tags: array
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
    const { tests, analysis_id } = body;

    // Validate tests array
    if (!Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json(
        { error: 'Tests array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Import each test case
    const results = {
      success: [],
      failed: [],
      total: tests.length
    };

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];

      try {
        // Validate required fields
        if (!test.title) {
          results.failed.push({
            index: i,
            test,
            error: 'Title is required'
          });
          continue;
        }

        // Prepare test case data
        const testCaseData = {
          project_id: projectId,
          title: test.title,
          description: test.description || null,
          preconditions: test.preconditions || null,
          steps: test.steps || [],
          expected_result: test.expected_result || null,
          priority: test.priority || 'Medium',
          type: test.type || 'Functional',
          status: test.status || 'Draft',
          automated: test.automated || false,
          tags: test.tags || [],
          suite_id: test.suite_id || null,
          folder_path: test.folder_path || null,
          created_by: session.user.id,
          updated_by: session.user.id,
          analysis_id: analysis_id || null
        };

        const createdTest = await createTestCase(testCaseData);
        results.success.push({
          index: i,
          test: createdTest
        });

      } catch (error) {
        console.error(`Error importing test ${i}:`, error);
        results.failed.push({
          index: i,
          test,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.success.length} of ${results.total} test cases`
    });

  } catch (error) {
    console.error('Error bulk importing tests:', error);
    return NextResponse.json(
      { error: 'Failed to import tests', details: error.message },
      { status: 500 }
    );
  }
}
