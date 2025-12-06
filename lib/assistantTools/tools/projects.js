/**
 * Project Tools Handler
 *
 * Handles project, requirement, and test case management tools.
 * All operations go through the database layer.
 */

import {
  getProjects,
  getProject,
  createProject as dbCreateProject,
  updateProject as dbUpdateProject,
  deleteProject as dbDeleteProject,
  getProjectStats as dbGetProjectStats,
} from '@/lib/db-projects.js';

import {
  getRequirements,
  getRequirement,
  createRequirement as dbCreateRequirement,
  updateRequirement as dbUpdateRequirement,
  deleteRequirement as dbDeleteRequirement,
} from '@/lib/db-requirements.js';

import {
  getTestCases,
  getTestCase,
  createTestCase as dbCreateTestCase,
  updateTestCase as dbUpdateTestCase,
  deleteTestCase as dbDeleteTestCase,
} from '@/lib/db-test-cases.js';

/**
 * Execute a project-related tool
 *
 * @param {string} toolName - Name of the tool
 * @param {object} input - Validated input parameters
 * @param {object} context - Execution context
 * @returns {Promise<object>} - Tool result
 */
export async function executeProjectTool(toolName, input, context) {
  const { userId, db } = context;

  try {
    switch (toolName) {
      // ===== Project Tools =====
      case 'list_projects':
        return await listProjects(input, userId);

      case 'get_project':
        return await getProjectDetails(input.id, userId);

      case 'create_project':
        return await createProject(input, userId);

      case 'update_project':
        return await updateProject(input.id, input.updates, userId);

      case 'delete_project':
        return await deleteProject(input.id, userId);

      case 'get_project_stats':
        return await getProjectStats(input.id, userId);

      // ===== Requirement Tools =====
      case 'list_requirements':
        return await listRequirements(input.projectId, input, userId);

      case 'get_requirement':
        return await getRequirementDetails(input.id, userId);

      case 'create_requirement':
        return await createRequirement(input, userId);

      case 'update_requirement':
        return await updateRequirement(input.id, input.updates, userId);

      case 'delete_requirement':
        return await deleteRequirement(input.id, userId);

      // ===== Test Case Tools =====
      case 'list_test_cases':
        return await listTestCases(input.projectId, input, userId);

      case 'get_test_case':
        return await getTestCaseDetails(input.id, userId);

      case 'create_test_case':
        return await createTestCase(input, userId);

      case 'update_test_case':
        return await updateTestCase(input.id, input.updates, userId);

      case 'delete_test_case':
        return await deleteTestCase(input.id, userId);

      default:
        return {
          success: false,
          error: `Unknown project tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`Project tool error (${toolName}):`, error);
    return {
      success: false,
      error: error.message || 'Project operation failed',
    };
  }
}

// ===== Project Implementations =====

async function listProjects(input, userId) {
  const { page = 1, limit = 20, search, status } = input;

  const result = await getProjects(userId, {
    page,
    limit,
    search,
    status,
  });

  return {
    success: true,
    data: {
      projects: result.projects.map(formatProject),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    },
  };
}

async function getProjectDetails(projectId, userId) {
  const project = await getProject(projectId, userId);

  if (!project) {
    return {
      success: false,
      error: 'Project not found',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      project: formatProject(project),
    },
  };
}

async function createProject(input, userId) {
  const { name, description, repoUrl, status = 'active' } = input;

  const project = await dbCreateProject({
    userId,
    name,
    description,
    repoUrl,
    status,
  });

  return {
    success: true,
    data: {
      message: 'Project created successfully',
      project: formatProject(project),
    },
    action: {
      type: 'PROJECT_CREATED',
      payload: { projectId: project.id },
    },
  };
}

async function updateProject(projectId, updates, userId) {
  const project = await dbUpdateProject(projectId, updates, userId);

  if (!project) {
    return {
      success: false,
      error: 'Project not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Project updated successfully',
      project: formatProject(project),
    },
    action: {
      type: 'PROJECT_UPDATED',
      payload: { projectId: project.id },
    },
  };
}

async function deleteProject(projectId, userId) {
  const success = await dbDeleteProject(projectId, userId);

  if (!success) {
    return {
      success: false,
      error: 'Project not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Project deleted successfully',
      projectId,
    },
    action: {
      type: 'PROJECT_DELETED',
      payload: { projectId },
    },
  };
}

async function getProjectStats(projectId, userId) {
  const stats = await dbGetProjectStats(projectId, userId);

  if (!stats) {
    return {
      success: false,
      error: 'Project not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      projectId,
      stats: {
        requirementsCount: stats.requirements_count,
        testCasesCount: stats.test_cases_count,
        coveragePercentage: stats.coverage_percentage,
        passedTests: stats.passed_tests,
        failedTests: stats.failed_tests,
        pendingTests: stats.pending_tests,
      },
    },
  };
}

// ===== Requirement Implementations =====

async function listRequirements(projectId, input, userId) {
  const { page = 1, limit = 50, status, priority, search } = input;

  const result = await getRequirements(projectId, userId, {
    page,
    limit,
    status,
    priority,
    search,
  });

  return {
    success: true,
    data: {
      requirements: result.requirements.map(formatRequirement),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    },
  };
}

async function getRequirementDetails(requirementId, userId) {
  const requirement = await getRequirement(requirementId, userId);

  if (!requirement) {
    return {
      success: false,
      error: 'Requirement not found',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      requirement: formatRequirement(requirement),
    },
  };
}

async function createRequirement(input, userId) {
  const {
    projectId,
    title,
    description,
    type = 'functional',
    priority = 'medium',
    status = 'draft',
  } = input;

  const requirement = await dbCreateRequirement({
    projectId,
    userId,
    title,
    description,
    type,
    priority,
    status,
  });

  return {
    success: true,
    data: {
      message: 'Requirement created successfully',
      requirement: formatRequirement(requirement),
    },
    action: {
      type: 'REQUIREMENT_CREATED',
      payload: { requirementId: requirement.id, projectId },
    },
  };
}

async function updateRequirement(requirementId, updates, userId) {
  const requirement = await dbUpdateRequirement(requirementId, updates, userId);

  if (!requirement) {
    return {
      success: false,
      error: 'Requirement not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Requirement updated successfully',
      requirement: formatRequirement(requirement),
    },
    action: {
      type: 'REQUIREMENT_UPDATED',
      payload: { requirementId: requirement.id },
    },
  };
}

async function deleteRequirement(requirementId, userId) {
  const success = await dbDeleteRequirement(requirementId, userId);

  if (!success) {
    return {
      success: false,
      error: 'Requirement not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Requirement deleted successfully',
      requirementId,
    },
    action: {
      type: 'REQUIREMENT_DELETED',
      payload: { requirementId },
    },
  };
}

// ===== Test Case Implementations =====

async function listTestCases(projectId, input, userId) {
  const { page = 1, limit = 50, status, priority, requirementId, search } = input;

  const result = await getTestCases(projectId, userId, {
    page,
    limit,
    status,
    priority,
    requirementId,
    search,
  });

  return {
    success: true,
    data: {
      testCases: result.testCases.map(formatTestCase),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    },
  };
}

async function getTestCaseDetails(testCaseId, userId) {
  const testCase = await getTestCase(testCaseId, userId);

  if (!testCase) {
    return {
      success: false,
      error: 'Test case not found',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      testCase: formatTestCase(testCase),
    },
  };
}

async function createTestCase(input, userId) {
  const {
    projectId,
    requirementId,
    title,
    description,
    steps,
    expectedResult,
    priority = 'medium',
    status = 'draft',
    testType = 'functional',
  } = input;

  const testCase = await dbCreateTestCase({
    projectId,
    requirementId,
    userId,
    title,
    description,
    steps,
    expectedResult,
    priority,
    status,
    testType,
  });

  return {
    success: true,
    data: {
      message: 'Test case created successfully',
      testCase: formatTestCase(testCase),
    },
    action: {
      type: 'TEST_CASE_CREATED',
      payload: { testCaseId: testCase.id, projectId },
    },
  };
}

async function updateTestCase(testCaseId, updates, userId) {
  const testCase = await dbUpdateTestCase(testCaseId, updates, userId);

  if (!testCase) {
    return {
      success: false,
      error: 'Test case not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Test case updated successfully',
      testCase: formatTestCase(testCase),
    },
    action: {
      type: 'TEST_CASE_UPDATED',
      payload: { testCaseId: testCase.id },
    },
  };
}

async function deleteTestCase(testCaseId, userId) {
  const success = await dbDeleteTestCase(testCaseId, userId);

  if (!success) {
    return {
      success: false,
      error: 'Test case not found or access denied',
      statusCode: 404,
    };
  }

  return {
    success: true,
    data: {
      message: 'Test case deleted successfully',
      testCaseId,
    },
    action: {
      type: 'TEST_CASE_DELETED',
      payload: { testCaseId },
    },
  };
}

// ===== Formatters =====

function formatProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    repoUrl: project.repo_url,
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function formatRequirement(requirement) {
  return {
    id: requirement.id,
    projectId: requirement.project_id,
    title: requirement.title,
    description: requirement.description,
    type: requirement.type,
    priority: requirement.priority,
    status: requirement.status,
    createdAt: requirement.created_at,
    updatedAt: requirement.updated_at,
  };
}

function formatTestCase(testCase) {
  return {
    id: testCase.id,
    projectId: testCase.project_id,
    requirementId: testCase.requirement_id,
    title: testCase.title,
    description: testCase.description,
    steps: testCase.steps,
    expectedResult: testCase.expected_result,
    priority: testCase.priority,
    status: testCase.status,
    testType: testCase.test_type,
    createdAt: testCase.created_at,
    updatedAt: testCase.updated_at,
  };
}

export default {
  executeProjectTool,
};
