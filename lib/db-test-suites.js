/**
 * Database Layer - Test Suites
 *
 * CRUD operations for hierarchical test suite organization
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2.1
 */

import { query } from './db.js';

/**
 * Get all test suites for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} List of test suites with hierarchy
 */
export async function getTestSuitesByProject(projectId) {
  const result = await query(`
    SELECT ts.*,
      u.full_name as created_by_name,
      (SELECT COUNT(*) FROM test_cases WHERE suite_id = ts.id) as test_count,
      (SELECT COUNT(*) FROM test_suites WHERE parent_id = ts.id) as child_count
    FROM test_suites ts
    LEFT JOIN users u ON ts.created_by = u.id
    WHERE ts.project_id = $1
    ORDER BY ts.folder_path, ts.name
  `, [projectId]);

  return result.rows;
}

/**
 * Get test suite by ID
 * @param {number} suiteId - Test suite ID
 * @returns {Promise<Object|null>} Test suite object or null
 */
export async function getTestSuiteById(suiteId) {
  const result = await query(`
    SELECT ts.*,
      u.full_name as created_by_name,
      u.email as created_by_email,
      (SELECT COUNT(*) FROM test_cases WHERE suite_id = ts.id) as test_count,
      (SELECT COUNT(*) FROM test_suites WHERE parent_id = ts.id) as child_count
    FROM test_suites ts
    LEFT JOIN users u ON ts.created_by = u.id
    WHERE ts.id = $1
  `, [suiteId]);

  return result.rows[0] || null;
}

/**
 * Get root test suites (no parent)
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Root test suites
 */
export async function getRootTestSuites(projectId) {
  const result = await query(`
    SELECT ts.*,
      (SELECT COUNT(*) FROM test_cases WHERE suite_id = ts.id) as test_count,
      (SELECT COUNT(*) FROM test_suites WHERE parent_id = ts.id) as child_count
    FROM test_suites ts
    WHERE ts.project_id = $1 AND ts.parent_id IS NULL
    ORDER BY ts.name
  `, [projectId]);

  return result.rows;
}

/**
 * Get child test suites
 * @param {number} parentId - Parent suite ID
 * @returns {Promise<Array>} Child test suites
 */
export async function getChildTestSuites(parentId) {
  const result = await query(`
    SELECT ts.*,
      (SELECT COUNT(*) FROM test_cases WHERE suite_id = ts.id) as test_count,
      (SELECT COUNT(*) FROM test_suites WHERE parent_id = ts.id) as child_count
    FROM test_suites ts
    WHERE ts.parent_id = $1
    ORDER BY ts.name
  `, [parentId]);

  return result.rows;
}

/**
 * Create a new test suite
 * @param {Object} suiteData - Test suite data
 * @returns {Promise<Object>} Created test suite
 */
export async function createTestSuite(suiteData) {
  const {
    project_id,
    parent_id,
    name,
    description,
    created_by
  } = suiteData;

  // Calculate folder_path
  let folder_path = '/';
  if (parent_id) {
    const parent = await getTestSuiteById(parent_id);
    if (parent) {
      folder_path = `${parent.folder_path}${parent.name}/`;
    }
  }

  const result = await query(`
    INSERT INTO test_suites (
      project_id, parent_id, name, description, folder_path, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [project_id, parent_id, name, description, folder_path, created_by]);

  return result.rows[0];
}

/**
 * Update test suite
 * @param {number} suiteId - Test suite ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated test suite or null
 */
export async function updateTestSuite(suiteId, updates) {
  const { name, description, parent_id } = updates;

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
  if (parent_id !== undefined) {
    fields.push(`parent_id = $${paramIndex++}`);
    values.push(parent_id);

    // Update folder_path if parent changes
    let folder_path = '/';
    if (parent_id) {
      const parent = await getTestSuiteById(parent_id);
      if (parent) {
        folder_path = `${parent.folder_path}${parent.name}/`;
      }
    }
    fields.push(`folder_path = $${paramIndex++}`);
    values.push(folder_path);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(suiteId);

  const result = await query(`
    UPDATE test_suites
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  // Update folder_path for all descendants
  if (parent_id !== undefined || name !== undefined) {
    await updateDescendantPaths(suiteId);
  }

  return result.rows[0] || null;
}

/**
 * Update folder paths for all descendant suites
 * @param {number} suiteId - Parent suite ID
 */
async function updateDescendantPaths(suiteId) {
  const suite = await getTestSuiteById(suiteId);
  if (!suite) return;

  const children = await getChildTestSuites(suiteId);

  for (const child of children) {
    const newPath = `${suite.folder_path}${suite.name}/`;
    await query(`
      UPDATE test_suites
      SET folder_path = $1, updated_at = NOW()
      WHERE id = $2
    `, [newPath, child.id]);

    // Recursively update descendants
    await updateDescendantPaths(child.id);
  }
}

/**
 * Delete test suite
 * @param {number} suiteId - Test suite ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteTestSuite(suiteId) {
  // Check if suite has children
  const children = await getChildTestSuites(suiteId);
  if (children.length > 0) {
    throw new Error('Cannot delete suite with child suites. Delete children first.');
  }

  // Check if suite has test cases
  const result = await query(
    'SELECT COUNT(*) FROM test_cases WHERE suite_id = $1',
    [suiteId]
  );
  if (parseInt(result.rows[0].count) > 0) {
    throw new Error('Cannot delete suite with test cases. Move or delete test cases first.');
  }

  const deleteResult = await query(`
    DELETE FROM test_suites
    WHERE id = $1
    RETURNING id
  `, [suiteId]);

  return deleteResult.rows.length > 0;
}

/**
 * Get test suite hierarchy (tree structure)
 * @param {number} projectId - Project ID
 * @returns {Promise<Array>} Hierarchical tree of test suites
 */
export async function getTestSuiteTree(projectId) {
  const allSuites = await getTestSuitesByProject(projectId);

  // Build tree structure
  const suiteMap = new Map();
  const roots = [];

  // Create map of all suites
  allSuites.forEach(suite => {
    suiteMap.set(suite.id, { ...suite, children: [] });
  });

  // Build parent-child relationships
  allSuites.forEach(suite => {
    const node = suiteMap.get(suite.id);
    if (suite.parent_id) {
      const parent = suiteMap.get(suite.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Move test suite to new parent
 * @param {number} suiteId - Suite ID to move
 * @param {number|null} newParentId - New parent ID (null for root)
 * @returns {Promise<Object>} Updated suite
 */
export async function moveTestSuite(suiteId, newParentId) {
  // Prevent circular references
  if (newParentId) {
    const isDescendant = await isDescendantOf(newParentId, suiteId);
    if (isDescendant) {
      throw new Error('Cannot move suite to its own descendant');
    }
  }

  return updateTestSuite(suiteId, { parent_id: newParentId });
}

/**
 * Check if suiteA is a descendant of suiteB
 * @param {number} suiteA - Suite A ID
 * @param {number} suiteB - Suite B ID
 * @returns {Promise<boolean>} True if suiteA is descendant of suiteB
 */
async function isDescendantOf(suiteA, suiteB) {
  const suite = await getTestSuiteById(suiteA);
  if (!suite) return false;
  if (suite.parent_id === suiteB) return true;
  if (!suite.parent_id) return false;
  return isDescendantOf(suite.parent_id, suiteB);
}

/**
 * Get suite breadcrumb path
 * @param {number} suiteId - Suite ID
 * @returns {Promise<Array>} Array of parent suites leading to this suite
 */
export async function getSuiteBreadcrumb(suiteId) {
  const breadcrumb = [];
  let currentId = suiteId;

  while (currentId) {
    const suite = await getTestSuiteById(currentId);
    if (!suite) break;
    breadcrumb.unshift(suite);
    currentId = suite.parent_id;
  }

  return breadcrumb;
}

/**
 * Get test cases in suite (non-recursive)
 * @param {number} suiteId - Suite ID
 * @returns {Promise<Array>} Test cases in suite
 */
export async function getTestCasesInSuite(suiteId) {
  const result = await query(`
    SELECT tc.*
    FROM test_cases tc
    WHERE tc.suite_id = $1
    ORDER BY tc.key
  `, [suiteId]);

  return result.rows;
}

/**
 * Get all test cases in suite and descendants (recursive)
 * @param {number} suiteId - Suite ID
 * @returns {Promise<Array>} All test cases in suite tree
 */
export async function getAllTestCasesInSuiteTree(suiteId) {
  const result = await query(`
    WITH RECURSIVE suite_tree AS (
      SELECT id FROM test_suites WHERE id = $1
      UNION ALL
      SELECT ts.id FROM test_suites ts
      INNER JOIN suite_tree st ON ts.parent_id = st.id
    )
    SELECT tc.*
    FROM test_cases tc
    WHERE tc.suite_id IN (SELECT id FROM suite_tree)
    ORDER BY tc.key
  `, [suiteId]);

  return result.rows;
}
