/**
 * Database Layer - Test Coverage (Traceability)
 *
 * Operations for requirements-to-tests traceability (Xray-style)
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2.1
 */

import { query } from './db.js';

/**
 * Link test case to requirement
 * @param {number} requirementId - Requirement ID
 * @param {number} testCaseId - Test case ID
 * @param {string} coverageType - Type of coverage (Covers, VerifiedBy, BlockedBy)
 * @returns {Promise<Object>} Created coverage link
 */
export async function linkTestToRequirement(requirementId, testCaseId, coverageType = 'Covers') {
  try {
    const result = await query(`
      INSERT INTO test_coverage (requirement_id, test_case_id, coverage_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (requirement_id, test_case_id) DO UPDATE
      SET coverage_type = EXCLUDED.coverage_type
      RETURNING *
    `, [requirementId, testCaseId, coverageType]);

    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to link test to requirement: ${error.message}`);
  }
}

/**
 * Unlink test case from requirement
 * @param {number} requirementId - Requirement ID
 * @param {number} testCaseId - Test case ID
 * @returns {Promise<boolean>} True if unlinked
 */
export async function unlinkTestFromRequirement(requirementId, testCaseId) {
  const result = await query(`
    DELETE FROM test_coverage
    WHERE requirement_id = $1 AND test_case_id = $2
    RETURNING id
  `, [requirementId, testCaseId]);

  return result.rows.length > 0;
}

/**
 * Get all test cases linked to a requirement
 * @param {number} requirementId - Requirement ID
 * @returns {Promise<Array>} Linked test cases with coverage info
 */
export async function getTestCasesForRequirement(requirementId) {
  const result = await query(`
    SELECT
      tc.*,
      tcov.coverage_type,
      tcov.created_at as linked_at,
      ts.name as suite_name,
      (SELECT status FROM test_run_cases WHERE test_case_id = tc.id ORDER BY executed_at DESC LIMIT 1) as last_execution_status
    FROM test_coverage tcov
    JOIN test_cases tc ON tcov.test_case_id = tc.id
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    WHERE tcov.requirement_id = $1
    ORDER BY tcov.created_at DESC
  `, [requirementId]);

  return result.rows;
}

/**
 * Get all requirements linked to a test case
 * @param {number} testCaseId - Test case ID
 * @returns {Promise<Array>} Linked requirements with coverage info
 */
export async function getRequirementsForTestCase(testCaseId) {
  const result = await query(`
    SELECT
      r.*,
      tcov.coverage_type,
      tcov.created_at as linked_at
    FROM test_coverage tcov
    JOIN requirements r ON tcov.requirement_id = r.id
    WHERE tcov.test_case_id = $1
    ORDER BY tcov.created_at DESC
  `, [testCaseId]);

  return result.rows;
}

/**
 * Bulk link multiple test cases to a requirement
 * @param {number} requirementId - Requirement ID
 * @param {Array<number>} testCaseIds - Array of test case IDs
 * @param {string} coverageType - Coverage type
 * @returns {Promise<Object>} Import summary
 */
export async function bulkLinkTestsToRequirement(requirementId, testCaseIds, coverageType = 'Covers') {
  const linked = [];
  const errors = [];

  for (const testCaseId of testCaseIds) {
    try {
      const link = await linkTestToRequirement(requirementId, testCaseId, coverageType);
      linked.push(link);
    } catch (error) {
      errors.push({ testCaseId, error: error.message });
    }
  }

  return {
    linked: linked.length,
    errors: errors.length,
    details: { linked, errors }
  };
}

/**
 * Bulk link a test case to multiple requirements
 * @param {number} testCaseId - Test case ID
 * @param {Array<number>} requirementIds - Array of requirement IDs
 * @param {string} coverageType - Coverage type
 * @returns {Promise<Object>} Import summary
 */
export async function bulkLinkTestToRequirements(testCaseId, requirementIds, coverageType = 'Covers') {
  const linked = [];
  const errors = [];

  for (const requirementId of requirementIds) {
    try {
      const link = await linkTestToRequirement(requirementId, testCaseId, coverageType);
      linked.push(link);
    } catch (error) {
      errors.push({ requirementId, error: error.message });
    }
  }

  return {
    linked: linked.length,
    errors: errors.length,
    details: { linked, errors }
  };
}

/**
 * Get coverage statistics for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Coverage statistics
 */
export async function getCoverageStats(projectId) {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM requirements WHERE project_id = $1) as total_requirements,
      (SELECT COUNT(DISTINCT requirement_id) FROM test_coverage WHERE requirement_id IN (SELECT id FROM requirements WHERE project_id = $1)) as covered_requirements,
      (SELECT COUNT(*) FROM test_cases WHERE project_id = $1) as total_tests,
      (SELECT COUNT(DISTINCT test_case_id) FROM test_coverage WHERE test_case_id IN (SELECT id FROM test_cases WHERE project_id = $1)) as linked_tests,
      (SELECT COUNT(*) FROM test_coverage WHERE requirement_id IN (SELECT id FROM requirements WHERE project_id = $1)) as total_links
  `, [projectId]);

  const stats = result.rows[0];
  stats.coverage_percentage = stats.total_requirements > 0
    ? Math.round((stats.covered_requirements / stats.total_requirements) * 100)
    : 0;

  return stats;
}

/**
 * Get traceability matrix for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Traceability matrix data
 */
export async function getTraceabilityMatrix(projectId) {
  const result = await query(`
    SELECT
      r.id as requirement_id,
      r.key as requirement_key,
      r.title as requirement_title,
      r.type as requirement_type,
      r.status as requirement_status,
      r.priority as requirement_priority,
      COUNT(DISTINCT tcov.test_case_id) as test_count,
      COUNT(CASE WHEN trc.status = 'Passed' THEN 1 END) as passed_count,
      COUNT(CASE WHEN trc.status = 'Failed' THEN 1 END) as failed_count,
      COUNT(CASE WHEN trc.status = 'Blocked' THEN 1 END) as blocked_count,
      COUNT(CASE WHEN trc.status = 'Untested' THEN 1 END) as untested_count,
      CASE
        WHEN COUNT(DISTINCT tcov.test_case_id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN trc.status = 'Passed' THEN 1 END)::numeric / COUNT(DISTINCT tcov.test_case_id)) * 100)
      END as pass_rate,
      json_agg(
        json_build_object(
          'test_id', tc.id,
          'test_key', tc.key,
          'test_title', tc.title,
          'test_status', tc.status,
          'coverage_type', tcov.coverage_type,
          'last_result', trc.status
        ) ORDER BY tc.key
      ) FILTER (WHERE tc.id IS NOT NULL) as linked_tests
    FROM requirements r
    LEFT JOIN test_coverage tcov ON r.id = tcov.requirement_id
    LEFT JOIN test_cases tc ON tcov.test_case_id = tc.id
    LEFT JOIN LATERAL (
      SELECT status
      FROM test_run_cases
      WHERE test_case_id = tc.id
      ORDER BY executed_at DESC NULLS LAST
      LIMIT 1
    ) trc ON true
    WHERE r.project_id = $1
    GROUP BY r.id, r.key, r.title, r.type, r.status, r.priority
    ORDER BY r.key
  `, [projectId]);

  return result.rows;
}

/**
 * Get uncovered requirements (no linked tests)
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Uncovered requirements
 */
export async function getUncoveredRequirements(projectId) {
  const result = await query(`
    SELECT r.*
    FROM requirements r
    WHERE r.project_id = $1
    AND r.id NOT IN (SELECT DISTINCT requirement_id FROM test_coverage)
    ORDER BY r.priority DESC, r.created_at DESC
  `, [projectId]);

  return result.rows;
}

/**
 * Get unlinked test cases (not linked to any requirement)
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Unlinked test cases
 */
export async function getUnlinkedTestCases(projectId) {
  const result = await query(`
    SELECT tc.*, ts.name as suite_name
    FROM test_cases tc
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    WHERE tc.project_id = $1
    AND tc.id NOT IN (SELECT DISTINCT test_case_id FROM test_coverage)
    ORDER BY tc.created_at DESC
  `, [projectId]);

  return result.rows;
}

/**
 * Get coverage by requirement type
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Coverage grouped by requirement type
 */
export async function getCoverageByType(projectId) {
  const result = await query(`
    SELECT
      r.type,
      COUNT(DISTINCT r.id) as total_requirements,
      COUNT(DISTINCT tcov.requirement_id) as covered_requirements,
      ROUND((COUNT(DISTINCT tcov.requirement_id)::numeric / NULLIF(COUNT(DISTINCT r.id), 0)) * 100) as coverage_percentage
    FROM requirements r
    LEFT JOIN test_coverage tcov ON r.id = tcov.requirement_id
    WHERE r.project_id = $1
    GROUP BY r.type
    ORDER BY r.type
  `, [projectId]);

  return result.rows;
}

/**
 * Get coverage by priority
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Coverage grouped by priority
 */
export async function getCoverageByPriority(projectId) {
  const result = await query(`
    SELECT
      r.priority,
      COUNT(DISTINCT r.id) as total_requirements,
      COUNT(DISTINCT tcov.requirement_id) as covered_requirements,
      ROUND((COUNT(DISTINCT tcov.requirement_id)::numeric / NULLIF(COUNT(DISTINCT r.id), 0)) * 100) as coverage_percentage
    FROM requirements r
    LEFT JOIN test_coverage tcov ON r.id = tcov.requirement_id
    WHERE r.project_id = $1
    GROUP BY r.priority
    ORDER BY
      CASE r.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5
      END
  `, [projectId]);

  return result.rows;
}

/**
 * Get coverage trends over time
 * @param {number} projectId - Project ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Coverage trend data
 */
export async function getCoverageTrend(projectId, days = 30) {
  const result = await query(`
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '1 day' * $2,
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date as date
    ),
    coverage_by_date AS (
      SELECT
        ds.date,
        COUNT(DISTINCT r.id) as total_requirements,
        COUNT(DISTINCT CASE WHEN tcov.created_at::date <= ds.date THEN tcov.requirement_id END) as covered_requirements
      FROM date_series ds
      CROSS JOIN requirements r
      LEFT JOIN test_coverage tcov ON r.id = tcov.requirement_id
      WHERE r.project_id = $1
      GROUP BY ds.date
    )
    SELECT
      date,
      total_requirements,
      covered_requirements,
      ROUND((covered_requirements::numeric / NULLIF(total_requirements, 0)) * 100) as coverage_percentage
    FROM coverage_by_date
    ORDER BY date
  `, [projectId, days]);

  return result.rows;
}

/**
 * Validate coverage links (check for orphaned records)
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Validation report
 */
export async function validateCoverage(projectId) {
  // Check for coverage links to non-existent requirements
  const orphanedRequirements = await query(`
    SELECT tcov.id, tcov.requirement_id, tcov.test_case_id
    FROM test_coverage tcov
    WHERE tcov.requirement_id NOT IN (SELECT id FROM requirements WHERE project_id = $1)
  `, [projectId]);

  // Check for coverage links to non-existent test cases
  const orphanedTestCases = await query(`
    SELECT tcov.id, tcov.requirement_id, tcov.test_case_id
    FROM test_coverage tcov
    WHERE tcov.test_case_id NOT IN (SELECT id FROM test_cases WHERE project_id = $1)
  `, [projectId]);

  return {
    valid: orphanedRequirements.rows.length === 0 && orphanedTestCases.rows.length === 0,
    orphaned_requirements: orphanedRequirements.rows.length,
    orphaned_test_cases: orphanedTestCases.rows.length,
    details: {
      orphaned_requirements: orphanedRequirements.rows,
      orphaned_test_cases: orphanedTestCases.rows
    }
  };
}

/**
 * Clean up orphaned coverage links
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Cleanup summary
 */
export async function cleanupOrphanedCoverage(projectId) {
  // Delete coverage links to non-existent requirements
  const deletedReqLinks = await query(`
    DELETE FROM test_coverage
    WHERE requirement_id NOT IN (SELECT id FROM requirements WHERE project_id = $1)
    RETURNING id
  `, [projectId]);

  // Delete coverage links to non-existent test cases
  const deletedTestLinks = await query(`
    DELETE FROM test_coverage
    WHERE test_case_id NOT IN (SELECT id FROM test_cases WHERE project_id = $1)
    RETURNING id
  `, [projectId]);

  return {
    deleted_requirement_links: deletedReqLinks.rows.length,
    deleted_test_case_links: deletedTestLinks.rows.length,
    total_deleted: deletedReqLinks.rows.length + deletedTestLinks.rows.length
  };
}
