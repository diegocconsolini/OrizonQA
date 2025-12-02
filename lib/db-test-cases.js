/**
 * Database Layer - Test Cases
 *
 * CRUD operations for test case management with AI metadata
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2.1
 */

import { query } from './db.js';

/**
 * Get all test cases for a project
 * @param {number} projectId - Project ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of test cases
 */
export async function getTestCasesByProject(projectId, filters = {}) {
  const { suite_id, status, priority, type, automated, search } = filters;

  let sql = `
    SELECT tc.*,
      ts.name as suite_name,
      u1.full_name as created_by_name,
      u2.full_name as updated_by_name,
      (SELECT COUNT(*) FROM test_coverage WHERE test_case_id = tc.id) as requirement_count
    FROM test_cases tc
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    LEFT JOIN users u1 ON tc.created_by = u1.id
    LEFT JOIN users u2 ON tc.updated_by = u2.id
    WHERE tc.project_id = $1
  `;

  const params = [projectId];
  let paramIndex = 2;

  if (suite_id) {
    sql += ` AND tc.suite_id = $${paramIndex++}`;
    params.push(suite_id);
  }
  if (status) {
    sql += ` AND tc.status = $${paramIndex++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND tc.priority = $${paramIndex++}`;
    params.push(priority);
  }
  if (type) {
    sql += ` AND tc.type = $${paramIndex++}`;
    params.push(type);
  }
  if (automated !== undefined) {
    sql += ` AND tc.automated = $${paramIndex++}`;
    params.push(automated);
  }
  if (search) {
    sql += ` AND (tc.title ILIKE $${paramIndex++} OR tc.description ILIKE $${paramIndex - 1} OR tc.key ILIKE $${paramIndex - 1})`;
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY tc.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get test case by ID
 * @param {number} testCaseId - Test case ID
 * @returns {Promise<Object|null>} Test case object or null
 */
export async function getTestCaseById(testCaseId) {
  const result = await query(`
    SELECT tc.*,
      ts.name as suite_name,
      ts.folder_path as suite_path,
      u1.full_name as created_by_name,
      u1.email as created_by_email,
      u2.full_name as updated_by_name,
      u2.email as updated_by_email,
      (SELECT COUNT(*) FROM test_coverage WHERE test_case_id = tc.id) as requirement_count,
      (SELECT COUNT(*) FROM test_run_cases WHERE test_case_id = tc.id) as execution_count
    FROM test_cases tc
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    LEFT JOIN users u1 ON tc.created_by = u1.id
    LEFT JOIN users u2 ON tc.updated_by = u2.id
    WHERE tc.id = $1
  `, [testCaseId]);

  return result.rows[0] || null;
}

/**
 * Get test case by key
 * @param {number} projectId - Project ID
 * @param {string} key - Test case key (e.g., "TC-1")
 * @returns {Promise<Object|null>} Test case object or null
 */
export async function getTestCaseByKey(projectId, key) {
  const result = await query(`
    SELECT tc.*
    FROM test_cases tc
    WHERE tc.project_id = $1 AND tc.key = $2
  `, [projectId, key]);

  return result.rows[0] || null;
}

/**
 * Create a new test case
 * @param {Object} testCaseData - Test case data
 * @returns {Promise<Object>} Created test case
 */
export async function createTestCase(testCaseData) {
  const {
    project_id,
    suite_id,
    key,
    title,
    description,
    preconditions,
    steps,
    expected_result,
    postconditions,
    priority = 'Medium',
    type = 'Functional',
    status = 'Draft',
    automated = false,
    automation_script,
    tags = [],
    custom_fields = {},
    estimated_time,
    created_by,
    ai_generated = false,
    ai_model,
    ai_prompt_template,
    analysis_id
  } = testCaseData;

  // Check if key already exists in project
  const existing = await getTestCaseByKey(project_id, key);
  if (existing) {
    throw new Error(`Test case key "${key}" already exists in this project`);
  }

  const result = await query(`
    INSERT INTO test_cases (
      project_id, suite_id, key, title, description, preconditions, steps,
      expected_result, postconditions, priority, type, status, automated,
      automation_script, tags, custom_fields, estimated_time, created_by,
      updated_by, ai_generated, ai_model, ai_prompt_template, analysis_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18, $19, $20, $21, $22)
    RETURNING *
  `, [
    project_id, suite_id, key, title, description, preconditions,
    JSON.stringify(steps), expected_result, postconditions, priority, type,
    status, automated, automation_script, JSON.stringify(tags),
    JSON.stringify(custom_fields), estimated_time, created_by, ai_generated,
    ai_model, ai_prompt_template, analysis_id
  ]);

  return result.rows[0];
}

/**
 * Update test case
 * @param {number} testCaseId - Test case ID
 * @param {number} userId - User ID (for updated_by)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated test case or null
 */
export async function updateTestCase(testCaseId, userId, updates) {
  const {
    suite_id,
    title,
    description,
    preconditions,
    steps,
    expected_result,
    postconditions,
    priority,
    type,
    status,
    automated,
    automation_script,
    tags,
    custom_fields,
    estimated_time
  } = updates;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (suite_id !== undefined) {
    fields.push(`suite_id = $${paramIndex++}`);
    values.push(suite_id);
  }
  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (preconditions !== undefined) {
    fields.push(`preconditions = $${paramIndex++}`);
    values.push(preconditions);
  }
  if (steps !== undefined) {
    fields.push(`steps = $${paramIndex++}`);
    values.push(JSON.stringify(steps));
  }
  if (expected_result !== undefined) {
    fields.push(`expected_result = $${paramIndex++}`);
    values.push(expected_result);
  }
  if (postconditions !== undefined) {
    fields.push(`postconditions = $${paramIndex++}`);
    values.push(postconditions);
  }
  if (priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(priority);
  }
  if (type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(type);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (automated !== undefined) {
    fields.push(`automated = $${paramIndex++}`);
    values.push(automated);
  }
  if (automation_script !== undefined) {
    fields.push(`automation_script = $${paramIndex++}`);
    values.push(automation_script);
  }
  if (tags !== undefined) {
    fields.push(`tags = $${paramIndex++}`);
    values.push(JSON.stringify(tags));
  }
  if (custom_fields !== undefined) {
    fields.push(`custom_fields = $${paramIndex++}`);
    values.push(JSON.stringify(custom_fields));
  }
  if (estimated_time !== undefined) {
    fields.push(`estimated_time = $${paramIndex++}`);
    values.push(estimated_time);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Increment version and set updated_by
  fields.push(`version = version + 1`);
  fields.push(`updated_by = $${paramIndex++}`);
  values.push(userId);
  fields.push(`updated_at = NOW()`);

  values.push(testCaseId);

  const result = await query(`
    UPDATE test_cases
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  return result.rows[0] || null;
}

/**
 * Delete test case
 * @param {number} testCaseId - Test case ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteTestCase(testCaseId) {
  const result = await query(`
    DELETE FROM test_cases
    WHERE id = $1
    RETURNING id
  `, [testCaseId]);

  return result.rows.length > 0;
}

/**
 * Bulk import test cases from AI analysis
 * @param {number} projectId - Project ID
 * @param {number} suiteId - Suite ID
 * @param {Array} testCases - Array of test case objects
 * @param {number} userId - User ID
 * @param {Object} aiMetadata - AI generation metadata
 * @returns {Promise<Object>} Import summary
 */
export async function bulkImportTestCases(projectId, suiteId, testCases, userId, aiMetadata = {}) {
  const imported = [];
  const errors = [];

  // Get next available key number
  const lastKeyResult = await query(`
    SELECT key FROM test_cases
    WHERE project_id = $1
    ORDER BY id DESC
    LIMIT 1
  `, [projectId]);

  let keyCounter = 1;
  if (lastKeyResult.rows.length > 0) {
    const lastKey = lastKeyResult.rows[0].key;
    const match = lastKey.match(/\d+$/);
    if (match) {
      keyCounter = parseInt(match[0]) + 1;
    }
  }

  for (const tc of testCases) {
    try {
      const key = `TC-${keyCounter++}`;
      const created = await createTestCase({
        project_id: projectId,
        suite_id: suiteId,
        key,
        title: tc.title,
        description: tc.description,
        preconditions: tc.preconditions,
        steps: tc.steps,
        expected_result: tc.expected_result,
        postconditions: tc.postconditions,
        priority: tc.priority || 'Medium',
        type: tc.type || 'Functional',
        status: 'Draft',
        automated: tc.automated || false,
        tags: tc.tags || [],
        custom_fields: tc.custom_fields || {},
        estimated_time: tc.estimated_time,
        created_by: userId,
        ai_generated: true,
        ai_model: aiMetadata.model,
        ai_prompt_template: aiMetadata.template,
        analysis_id: aiMetadata.analysis_id
      });
      imported.push(created);
    } catch (error) {
      errors.push({ title: tc.title, error: error.message });
    }
  }

  return {
    imported: imported.length,
    errors: errors.length,
    details: { imported, errors }
  };
}

/**
 * Get test case execution history
 * @param {number} testCaseId - Test case ID
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Execution history
 */
export async function getTestCaseExecutionHistory(testCaseId, limit = 10) {
  const result = await query(`
    SELECT
      trc.*,
      tr.name as run_name,
      tr.environment,
      tr.build_version,
      u.full_name as executed_by_name,
      tres.status as result_status,
      tres.comment as result_comment,
      tres.executed_at
    FROM test_run_cases trc
    JOIN test_runs tr ON trc.run_id = tr.id
    LEFT JOIN users u ON trc.assigned_to = u.id
    LEFT JOIN test_results tres ON tres.run_case_id = trc.id
    WHERE trc.test_case_id = $1
    ORDER BY trc.executed_at DESC NULLS LAST
    LIMIT $2
  `, [testCaseId, limit]);

  return result.rows;
}

/**
 * Get linked requirements for a test case
 * @param {number} testCaseId - Test case ID
 * @returns {Promise<Array>} Linked requirements
 */
export async function getTestCaseRequirements(testCaseId) {
  const result = await query(`
    SELECT r.*, tcov.coverage_type, tcov.created_at as linked_at
    FROM requirements r
    JOIN test_coverage tcov ON r.id = tcov.requirement_id
    WHERE tcov.test_case_id = $1
    ORDER BY tcov.created_at DESC
  `, [testCaseId]);

  return result.rows;
}

/**
 * Search test cases
 * @param {number} projectId - Project ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching test cases
 */
export async function searchTestCases(projectId, searchTerm) {
  const result = await query(`
    SELECT tc.*,
      ts.name as suite_name
    FROM test_cases tc
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    WHERE tc.project_id = $1
    AND (
      tc.title ILIKE $2 OR
      tc.description ILIKE $2 OR
      tc.key ILIKE $2 OR
      tc.tags::text ILIKE $2
    )
    ORDER BY tc.created_at DESC
    LIMIT 50
  `, [projectId, `%${searchTerm}%`]);

  return result.rows;
}

/**
 * Get AI-generated test cases
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} AI-generated test cases
 */
export async function getAIGeneratedTestCases(projectId) {
  const result = await query(`
    SELECT tc.*,
      ts.name as suite_name,
      a.prompt as analysis_prompt
    FROM test_cases tc
    LEFT JOIN test_suites ts ON tc.suite_id = ts.id
    LEFT JOIN analyses a ON tc.analysis_id = a.id
    WHERE tc.project_id = $1 AND tc.ai_generated = true
    ORDER BY tc.created_at DESC
  `, [projectId]);

  return result.rows;
}

/**
 * Get test case statistics for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Statistics
 */
export async function getTestCaseStats(projectId) {
  const result = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'Ready' THEN 1 END) as ready,
      COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft,
      COUNT(CASE WHEN status = 'Deprecated' THEN 1 END) as deprecated,
      COUNT(CASE WHEN automated = true THEN 1 END) as automated,
      COUNT(CASE WHEN ai_generated = true THEN 1 END) as ai_generated,
      COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical,
      COUNT(CASE WHEN priority = 'High' THEN 1 END) as high,
      COUNT(CASE WHEN priority = 'Medium' THEN 1 END) as medium,
      COUNT(CASE WHEN priority = 'Low' THEN 1 END) as low
    FROM test_cases
    WHERE project_id = $1
  `, [projectId]);

  return result.rows[0];
}
