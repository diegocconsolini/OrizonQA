/**
 * Database Layer - Requirements
 *
 * CRUD operations for requirements management (Xray-style)
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2.1
 */

import { query } from './db.js';

/**
 * Get all requirements for a project
 * @param {number} projectId - Project ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of requirements
 */
export async function getRequirementsByProject(projectId, filters = {}) {
  const { type, status, priority, version } = filters;

  let sql = `
    SELECT r.*,
      u.name as created_by_name,
      (SELECT COUNT(*) FROM test_coverage WHERE requirement_id = r.id) as test_count
    FROM requirements r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.project_id = $1
  `;

  const params = [projectId];
  let paramIndex = 2;

  if (type) {
    sql += ` AND r.type = $${paramIndex++}`;
    params.push(type);
  }
  if (status) {
    sql += ` AND r.status = $${paramIndex++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND r.priority = $${paramIndex++}`;
    params.push(priority);
  }
  if (version) {
    sql += ` AND r.version = $${paramIndex++}`;
    params.push(version);
  }

  sql += ' ORDER BY r.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get requirement by ID
 * @param {number} requirementId - Requirement ID
 * @returns {Promise<Object|null>} Requirement object or null
 */
export async function getRequirementById(requirementId) {
  const result = await query(`
    SELECT r.*,
      u.name as created_by_name,
      u.email as created_by_email,
      (SELECT COUNT(*) FROM test_coverage WHERE requirement_id = r.id) as test_count
    FROM requirements r
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = $1
  `, [requirementId]);

  return result.rows[0] || null;
}

/**
 * Get requirement by key
 * @param {number} projectId - Project ID
 * @param {string} key - Requirement key (e.g., "REQ-1")
 * @returns {Promise<Object|null>} Requirement object or null
 */
export async function getRequirementByKey(projectId, key) {
  const result = await query(`
    SELECT r.*
    FROM requirements r
    WHERE r.project_id = $1 AND r.key = $2
  `, [projectId, key]);

  return result.rows[0] || null;
}

/**
 * Create a new requirement
 * @param {Object} requirementData - Requirement data
 * @returns {Promise<Object>} Created requirement
 */
export async function createRequirement(requirementData) {
  const {
    project_id,
    key,
    title,
    description,
    type = 'Story',
    status = 'Open',
    priority = 'Medium',
    version,
    external_id,
    external_url,
    created_by
  } = requirementData;

  // Check if key already exists in project
  const existing = await getRequirementByKey(project_id, key);
  if (existing) {
    throw new Error(`Requirement key "${key}" already exists in this project`);
  }

  const result = await query(`
    INSERT INTO requirements (
      project_id, key, title, description, type, status, priority,
      version, external_id, external_url, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    project_id, key, title, description, type, status, priority,
    version, external_id, external_url, created_by
  ]);

  return result.rows[0];
}

/**
 * Update requirement
 * @param {number} requirementId - Requirement ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated requirement or null
 */
export async function updateRequirement(requirementId, updates) {
  const {
    title,
    description,
    type,
    status,
    priority,
    version,
    external_id,
    external_url
  } = updates;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(type);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(priority);
  }
  if (version !== undefined) {
    fields.push(`version = $${paramIndex++}`);
    values.push(version);
  }
  if (external_id !== undefined) {
    fields.push(`external_id = $${paramIndex++}`);
    values.push(external_id);
  }
  if (external_url !== undefined) {
    fields.push(`external_url = $${paramIndex++}`);
    values.push(external_url);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(requirementId);

  const result = await query(`
    UPDATE requirements
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  return result.rows[0] || null;
}

/**
 * Delete requirement
 * @param {number} requirementId - Requirement ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteRequirement(requirementId) {
  const result = await query(`
    DELETE FROM requirements
    WHERE id = $1
    RETURNING id
  `, [requirementId]);

  return result.rows.length > 0;
}

/**
 * Get requirements with coverage statistics
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Requirements with coverage data
 */
export async function getRequirementsWithCoverage(projectId) {
  const result = await query(`
    SELECT r.*,
      COUNT(tc.id) as linked_tests,
      COUNT(CASE WHEN trc.status = 'Passed' THEN 1 END) as passed_tests,
      COUNT(CASE WHEN trc.status = 'Failed' THEN 1 END) as failed_tests,
      CASE
        WHEN COUNT(tc.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN trc.status = 'Passed' THEN 1 END)::numeric / COUNT(tc.id)) * 100)
      END as coverage_percentage
    FROM requirements r
    LEFT JOIN test_coverage tcov ON r.id = tcov.requirement_id
    LEFT JOIN test_cases tc ON tcov.test_case_id = tc.id
    LEFT JOIN test_run_cases trc ON tc.id = trc.test_case_id
    WHERE r.project_id = $1
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `, [projectId]);

  return result.rows;
}

/**
 * Get linked test cases for a requirement
 * @param {number} requirementId - Requirement ID
 * @returns {Promise<Array>} Linked test cases
 */
export async function getRequirementTestCases(requirementId) {
  const result = await query(`
    SELECT tc.*, tcov.coverage_type, tcov.created_at as linked_at
    FROM test_cases tc
    JOIN test_coverage tcov ON tc.id = tcov.test_case_id
    WHERE tcov.requirement_id = $1
    ORDER BY tcov.created_at DESC
  `, [requirementId]);

  return result.rows;
}

/**
 * Bulk import requirements from external system
 * @param {number} projectId - Project ID
 * @param {Array} requirements - Array of requirement objects
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Import summary
 */
export async function bulkImportRequirements(projectId, requirements, userId) {
  const imported = [];
  const errors = [];

  for (const req of requirements) {
    try {
      const created = await createRequirement({
        project_id: projectId,
        key: req.key,
        title: req.title,
        description: req.description,
        type: req.type || 'Story',
        status: req.status || 'Open',
        priority: req.priority || 'Medium',
        version: req.version,
        external_id: req.external_id,
        external_url: req.external_url,
        created_by: userId
      });
      imported.push(created);
    } catch (error) {
      errors.push({ key: req.key, error: error.message });
    }
  }

  return {
    imported: imported.length,
    errors: errors.length,
    details: { imported, errors }
  };
}

/**
 * Get requirements by version
 * @param {number} projectId - Project ID
 * @param {string} version - Version string
 * @returns {Promise<Array>} Requirements for version
 */
export async function getRequirementsByVersion(projectId, version) {
  const result = await query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM test_coverage WHERE requirement_id = r.id) as test_count
    FROM requirements r
    WHERE r.project_id = $1 AND r.version = $2
    ORDER BY r.key
  `, [projectId, version]);

  return result.rows;
}

/**
 * Search requirements
 * @param {number} projectId - Project ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching requirements
 */
export async function searchRequirements(projectId, searchTerm) {
  const result = await query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM test_coverage WHERE requirement_id = r.id) as test_count
    FROM requirements r
    WHERE r.project_id = $1
    AND (
      r.title ILIKE $2 OR
      r.description ILIKE $2 OR
      r.key ILIKE $2
    )
    ORDER BY r.created_at DESC
    LIMIT 50
  `, [projectId, `%${searchTerm}%`]);

  return result.rows;
}
