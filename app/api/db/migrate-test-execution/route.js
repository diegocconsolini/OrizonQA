import { NextResponse } from 'next/server';
import { initTestExecutionTables } from '@/lib/db';

/**
 * GET /api/db/migrate-test-execution
 *
 * Initialize test execution tables in the database.
 * This should be called once when setting up or upgrading.
 *
 * Tables created:
 * - targets: Flexible scope for test execution
 * - test_executions: Execution records
 * - test_results: Individual test results
 * - execution_credits: Future billing support
 *
 * Also adds columns to analyses table:
 * - target_id
 * - execution_status
 * - last_execution_id
 */
export async function GET() {
  try {
    const success = await initTestExecutionTables();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test execution tables initialized successfully',
        tables: [
          'targets',
          'test_executions',
          'test_results',
          'execution_credits'
        ],
        columns: [
          'analyses.target_id',
          'analyses.execution_status',
          'analyses.last_execution_id'
        ]
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize tables'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
