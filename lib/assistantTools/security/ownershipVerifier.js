/**
 * Ownership Verifier - Layer 4: Resource Ownership Verification
 *
 * Ensures users can only access resources they own or have been granted access to.
 * Prevents unauthorized access to other users' data.
 *
 * Resource Types:
 * - Projects
 * - Requirements
 * - Test Cases
 * - Executions
 * - Analyses
 * - Todos
 * - Share Links
 */

// ============================================
// Resource Type Definitions
// ============================================

export const RESOURCE_TYPES = {
  PROJECT: 'project',
  REQUIREMENT: 'requirement',
  TEST_CASE: 'test_case',
  EXECUTION: 'execution',
  ANALYSIS: 'analysis',
  TODO: 'todo',
  SHARE: 'share',
  INTEGRATION: 'integration',
};

// ============================================
// Database Query Helpers
// ============================================

/**
 * SQL query builders for ownership verification.
 * These are used by the verification functions to check ownership.
 */
export const OWNERSHIP_QUERIES = {
  [RESOURCE_TYPES.PROJECT]: {
    query: 'SELECT user_id FROM projects WHERE id = $1',
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.REQUIREMENT]: {
    query: `
      SELECT p.user_id
      FROM requirements r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = $1
    `,
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.TEST_CASE]: {
    query: `
      SELECT p.user_id
      FROM test_cases tc
      JOIN projects p ON tc.project_id = p.id
      WHERE tc.id = $1
    `,
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.EXECUTION]: {
    query: 'SELECT user_id FROM test_executions WHERE id = $1',
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.ANALYSIS]: {
    query: 'SELECT user_id FROM analyses WHERE id = $1',
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.TODO]: {
    query: 'SELECT user_id FROM todos WHERE id = $1',
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.SHARE]: {
    query: 'SELECT user_id FROM share_links WHERE id = $1',
    ownerField: 'user_id',
  },
  [RESOURCE_TYPES.INTEGRATION]: {
    query: 'SELECT user_id FROM oauth_connections WHERE id = $1',
    ownerField: 'user_id',
  },
};

// ============================================
// Tool to Resource Type Mapping
// ============================================

/**
 * Maps tool names to the resource type they operate on.
 * Used to automatically determine which ownership check to perform.
 */
export const TOOL_RESOURCE_MAP = {
  // Project tools
  get_project: RESOURCE_TYPES.PROJECT,
  update_project: RESOURCE_TYPES.PROJECT,
  delete_project: RESOURCE_TYPES.PROJECT,
  get_project_stats: RESOURCE_TYPES.PROJECT,

  // Requirement tools
  get_requirement: RESOURCE_TYPES.REQUIREMENT,
  update_requirement: RESOURCE_TYPES.REQUIREMENT,
  delete_requirement: RESOURCE_TYPES.REQUIREMENT,
  get_requirement_tests: RESOURCE_TYPES.REQUIREMENT,

  // Test Case tools
  get_test_case: RESOURCE_TYPES.TEST_CASE,
  update_test_case: RESOURCE_TYPES.TEST_CASE,
  delete_test_case: RESOURCE_TYPES.TEST_CASE,
  get_test_history: RESOURCE_TYPES.TEST_CASE,

  // Execution tools
  get_execution: RESOURCE_TYPES.EXECUTION,
  delete_execution: RESOURCE_TYPES.EXECUTION,
  get_execution_logs: RESOURCE_TYPES.EXECUTION,
  retry_execution: RESOURCE_TYPES.EXECUTION,

  // Analysis tools
  get_analysis: RESOURCE_TYPES.ANALYSIS,
  delete_analysis: RESOURCE_TYPES.ANALYSIS,

  // Todo tools
  get_todo: RESOURCE_TYPES.TODO,
  update_todo: RESOURCE_TYPES.TODO,
  delete_todo: RESOURCE_TYPES.TODO,
  complete_todo: RESOURCE_TYPES.TODO,

  // Share tools
  revoke_share: RESOURCE_TYPES.SHARE,

  // Integration tools
  disconnect_integration: RESOURCE_TYPES.INTEGRATION,
};

// ============================================
// Ownership Verification Functions
// ============================================

/**
 * Verify that a user owns a specific resource.
 *
 * @param {string} resourceType - Type of resource (from RESOURCE_TYPES)
 * @param {string} resourceId - ID of the resource
 * @param {string} userId - ID of the user to verify
 * @param {object} db - Database client/pool
 * @returns {Promise<object>} - { isOwner: boolean, ownerId?: string, error?: string }
 */
export async function verifyOwnership(resourceType, resourceId, userId, db) {
  if (!resourceType || !resourceId || !userId) {
    return {
      isOwner: false,
      error: 'Missing required parameters for ownership verification',
    };
  }

  // Validate resource type
  const queryConfig = OWNERSHIP_QUERIES[resourceType];
  if (!queryConfig) {
    return {
      isOwner: false,
      error: `Unknown resource type: ${resourceType}`,
    };
  }

  try {
    // Execute ownership query
    const result = await db.query(queryConfig.query, [resourceId]);

    if (result.rows.length === 0) {
      return {
        isOwner: false,
        error: 'Resource not found',
        notFound: true,
      };
    }

    const ownerId = result.rows[0][queryConfig.ownerField];

    return {
      isOwner: ownerId === userId,
      ownerId,
      resourceType,
      resourceId,
    };
  } catch (error) {
    console.error('Ownership verification error:', error);
    return {
      isOwner: false,
      error: 'Failed to verify ownership',
      internalError: true,
    };
  }
}

/**
 * Verify ownership for a tool call.
 * Automatically determines the resource type from the tool name.
 *
 * @param {string} toolName - Name of the tool being called
 * @param {object} input - Tool input parameters
 * @param {string} userId - ID of the user
 * @param {object} db - Database client/pool
 * @returns {Promise<object>} - Verification result
 */
export async function verifyToolOwnership(toolName, input, userId, db) {
  // Get resource type for this tool
  const resourceType = TOOL_RESOURCE_MAP[toolName];

  // If tool doesn't require ownership verification, allow
  if (!resourceType) {
    return {
      isOwner: true,
      noVerificationRequired: true,
    };
  }

  // Get resource ID from input
  const resourceId = extractResourceId(toolName, input);
  if (!resourceId) {
    return {
      isOwner: false,
      error: 'Resource ID not found in tool input',
    };
  }

  // Verify ownership
  return verifyOwnership(resourceType, resourceId, userId, db);
}

/**
 * Extract resource ID from tool input based on tool name.
 */
function extractResourceId(toolName, input) {
  // Common parameter names for resource IDs
  const idParams = ['id', 'projectId', 'requirementId', 'testCaseId', 'executionId', 'analysisId', 'todoId', 'shareId'];

  for (const param of idParams) {
    if (input[param]) {
      return input[param];
    }
  }

  return null;
}

// ============================================
// Batch Ownership Verification
// ============================================

/**
 * Verify ownership for multiple resources at once.
 *
 * @param {Array} resources - Array of { type, id } objects
 * @param {string} userId - User ID
 * @param {object} db - Database client/pool
 * @returns {Promise<object>} - Map of resourceId -> verification result
 */
export async function verifyOwnershipBatch(resources, userId, db) {
  const results = {};

  // Group by resource type for efficient querying
  const grouped = {};
  for (const { type, id } of resources) {
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(id);
  }

  // Verify each group
  for (const [type, ids] of Object.entries(grouped)) {
    const queryConfig = OWNERSHIP_QUERIES[type];
    if (!queryConfig) continue;

    try {
      // Build batch query
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
      const batchQuery = queryConfig.query.replace('= $1', `IN (${placeholders})`);

      const result = await db.query(batchQuery, ids);

      // Map results
      const ownerMap = new Map();
      for (const row of result.rows) {
        ownerMap.set(row.id, row[queryConfig.ownerField]);
      }

      // Check each ID
      for (const id of ids) {
        const ownerId = ownerMap.get(id);
        results[`${type}:${id}`] = {
          isOwner: ownerId === userId,
          ownerId,
          resourceType: type,
          resourceId: id,
          notFound: !ownerId,
        };
      }
    } catch (error) {
      // Mark all as failed for this type
      for (const id of ids) {
        results[`${type}:${id}`] = {
          isOwner: false,
          error: 'Verification failed',
          internalError: true,
        };
      }
    }
  }

  return results;
}

// ============================================
// Access Control Helpers
// ============================================

/**
 * Check if a user has access to a shared resource.
 *
 * @param {string} shareToken - The share token
 * @param {object} db - Database client/pool
 * @returns {Promise<object>} - { hasAccess: boolean, resourceType?: string, resourceId?: string }
 */
export async function checkSharedAccess(shareToken, db) {
  if (!shareToken) {
    return { hasAccess: false, error: 'No share token provided' };
  }

  try {
    const result = await db.query(
      `SELECT resource_type, resource_id, expires_at, is_active
       FROM share_links
       WHERE token = $1`,
      [shareToken]
    );

    if (result.rows.length === 0) {
      return { hasAccess: false, error: 'Share link not found' };
    }

    const share = result.rows[0];

    // Check if share is active
    if (!share.is_active) {
      return { hasAccess: false, error: 'Share link has been revoked' };
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { hasAccess: false, error: 'Share link has expired' };
    }

    return {
      hasAccess: true,
      resourceType: share.resource_type,
      resourceId: share.resource_id,
    };
  } catch (error) {
    console.error('Share access check error:', error);
    return { hasAccess: false, error: 'Failed to verify share access' };
  }
}

/**
 * Check if a user has team/organization access to a resource.
 * (For future team features)
 */
export async function checkTeamAccess(resourceType, resourceId, userId, db) {
  // Placeholder for future team/organization feature
  // For now, only owner access is supported
  return { hasAccess: false, reason: 'Team access not yet implemented' };
}

// ============================================
// Error Class
// ============================================

export class OwnershipError extends Error {
  constructor(message, resourceType, resourceId, userId) {
    super(message);
    this.name = 'OwnershipError';
    this.isOwnershipError = true;
    this.statusCode = 403;
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.userId = userId;
  }
}

// ============================================
// Export
// ============================================

export default {
  RESOURCE_TYPES,
  TOOL_RESOURCE_MAP,
  verifyOwnership,
  verifyToolOwnership,
  verifyOwnershipBatch,
  checkSharedAccess,
  checkTeamAccess,
  OwnershipError,
};
