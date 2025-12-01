/**
 * Database Layer - Projects
 *
 * CRUD operations for project management
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2.1
 */

import { query } from './db.js';

/**
 * Get all projects for a user
 * @param {number} userId - User ID
 * @param {boolean} activeOnly - Filter only active projects
 * @returns {Promise<Array>} List of projects
 */
export async function getProjectsByUser(userId, activeOnly = true) {
  const sql = activeOnly
    ? `SELECT p.*,
        (SELECT COUNT(*) FROM test_cases WHERE project_id = p.id) as test_count,
        (SELECT COUNT(*) FROM requirements WHERE project_id = p.id) as requirement_count,
        (SELECT COUNT(*) FROM test_runs WHERE project_id = p.id) as run_count
       FROM projects p
       WHERE (p.owner_id = $1 OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $1))
       AND p.is_active = true
       ORDER BY p.updated_at DESC`
    : `SELECT p.*,
        (SELECT COUNT(*) FROM test_cases WHERE project_id = p.id) as test_count,
        (SELECT COUNT(*) FROM requirements WHERE project_id = p.id) as requirement_count,
        (SELECT COUNT(*) FROM test_runs WHERE project_id = p.id) as run_count
       FROM projects p
       WHERE p.owner_id = $1 OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
       ORDER BY p.updated_at DESC`;

  const result = await query(sql, [userId]);
  return result.rows;
}

/**
 * Get project by ID
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for access control)
 * @returns {Promise<Object|null>} Project object or null
 */
export async function getProjectById(projectId, userId) {
  const result = await query(`
    SELECT p.*,
      u.full_name as owner_name,
      u.email as owner_email,
      (SELECT COUNT(*) FROM test_cases WHERE project_id = p.id) as test_count,
      (SELECT COUNT(*) FROM requirements WHERE project_id = p.id) as requirement_count,
      (SELECT COUNT(*) FROM test_runs WHERE project_id = p.id) as run_count,
      (SELECT COUNT(*) FROM defects WHERE project_id = p.id) as defect_count
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1
    AND (p.owner_id = $2 OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2))
  `, [projectId, userId]);

  return result.rows[0] || null;
}

/**
 * Get project by key
 * @param {string} key - Project key (e.g., "PROJ")
 * @param {number} userId - User ID (for access control)
 * @returns {Promise<Object|null>} Project object or null
 */
export async function getProjectByKey(key, userId) {
  const result = await query(`
    SELECT p.*
    FROM projects p
    WHERE p.key = $1
    AND (p.owner_id = $2 OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2))
  `, [key, userId]);

  return result.rows[0] || null;
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {string} projectData.name - Project name
 * @param {string} projectData.key - Project key (unique)
 * @param {string} projectData.description - Project description
 * @param {number} projectData.owner_id - Owner user ID
 * @param {Object} projectData.settings - Project settings (JSONB)
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  const { name, key, description, owner_id, settings = {} } = projectData;

  // Check if key already exists
  const existingProject = await query(
    'SELECT id FROM projects WHERE key = $1',
    [key]
  );

  if (existingProject.rows.length > 0) {
    throw new Error(`Project key "${key}" already exists`);
  }

  const result = await query(`
    INSERT INTO projects (name, key, description, owner_id, settings)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name, key, description, owner_id, JSON.stringify(settings)]);

  return result.rows[0];
}

/**
 * Update project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for access control)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated project or null
 */
export async function updateProject(projectId, userId, updates) {
  const { name, description, settings, is_active } = updates;

  // Build dynamic UPDATE query
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (settings !== undefined) {
    fields.push(`settings = $${paramIndex++}`);
    values.push(JSON.stringify(settings));
  }
  if (is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Always update updated_at
  fields.push(`updated_at = NOW()`);

  // Add projectId and userId to values
  values.push(projectId, userId);

  const result = await query(`
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex++}
    AND owner_id = $${paramIndex}
    RETURNING *
  `, values);

  return result.rows[0] || null;
}

/**
 * Delete project (soft delete - set is_active to false)
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for access control)
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteProject(projectId, userId) {
  const result = await query(`
    UPDATE projects
    SET is_active = false, updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING id
  `, [projectId, userId]);

  return result.rows.length > 0;
}

/**
 * Hard delete project (permanently delete)
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID (for access control)
 * @returns {Promise<boolean>} True if deleted
 */
export async function hardDeleteProject(projectId, userId) {
  const result = await query(`
    DELETE FROM projects
    WHERE id = $1 AND owner_id = $2
    RETURNING id
  `, [projectId, userId]);

  return result.rows.length > 0;
}

/**
 * Get project members
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of project members
 */
export async function getProjectMembers(projectId) {
  const result = await query(`
    SELECT pm.*, u.full_name, u.email
    FROM project_members pm
    LEFT JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = $1
    ORDER BY pm.added_at DESC
  `, [projectId]);

  return result.rows;
}

/**
 * Add project member
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID to add
 * @param {string} role - Role (Admin, Manager, Tester, Viewer)
 * @param {number} addedBy - User ID who is adding the member
 * @returns {Promise<Object>} Added member
 */
export async function addProjectMember(projectId, userId, role, addedBy) {
  const result = await query(`
    INSERT INTO project_members (project_id, user_id, role, added_by)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (project_id, user_id) DO UPDATE
    SET role = EXCLUDED.role
    RETURNING *
  `, [projectId, userId, role, addedBy]);

  return result.rows[0];
}

/**
 * Remove project member
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID to remove
 * @returns {Promise<boolean>} True if removed
 */
export async function removeProjectMember(projectId, userId) {
  const result = await query(`
    DELETE FROM project_members
    WHERE project_id = $1 AND user_id = $2
    RETURNING id
  `, [projectId, userId]);

  return result.rows.length > 0;
}

/**
 * Check if user has access to project
 * @param {number} projectId - Project ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user has access
 */
export async function userHasProjectAccess(projectId, userId) {
  const result = await query(`
    SELECT 1
    FROM projects p
    WHERE p.id = $1
    AND (p.owner_id = $2 OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $2))
    LIMIT 1
  `, [projectId, userId]);

  return result.rows.length > 0;
}

/**
 * Get project statistics
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Project statistics
 */
export async function getProjectStats(projectId) {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM test_cases WHERE project_id = $1) as total_tests,
      (SELECT COUNT(*) FROM test_cases WHERE project_id = $1 AND status = 'Ready') as ready_tests,
      (SELECT COUNT(*) FROM requirements WHERE project_id = $1) as total_requirements,
      (SELECT COUNT(*) FROM test_runs WHERE project_id = $1) as total_runs,
      (SELECT COUNT(*) FROM test_runs WHERE project_id = $1 AND status = 'Open') as active_runs,
      (SELECT COUNT(*) FROM defects WHERE project_id = $1) as total_defects,
      (SELECT COUNT(*) FROM defects WHERE project_id = $1 AND status = 'Open') as open_defects
  `, [projectId]);

  return result.rows[0];
}
