/**
 * Analysis Goals
 *
 * Predefined goals that auto-configure file selection and output settings.
 * Each goal represents a common use case for code analysis.
 */

export const ANALYSIS_GOALS = {
  componentTests: {
    id: 'componentTests',
    name: 'Component Tests',
    shortName: 'Components',
    description: 'Generate unit tests for UI components',
    icon: 'Layers',
    color: 'blue',
    fileCategories: ['components', 'hooks'],
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: false
    },
    outputs: ['testCases'],
    executable: true,
    priority: 1
  },

  apiTests: {
    id: 'apiTests',
    name: 'API Tests',
    shortName: 'API',
    description: 'Generate integration tests for API endpoints',
    icon: 'Server',
    color: 'green',
    fileCategories: ['api'],
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: true
    },
    outputs: ['testCases'],
    executable: true,
    priority: 2
  },

  utilityTests: {
    id: 'utilityTests',
    name: 'Utility Tests',
    shortName: 'Utils',
    description: 'Generate unit tests for utility functions',
    icon: 'Wrench',
    color: 'purple',
    fileCategories: ['utilities', 'models'],
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: false
    },
    outputs: ['testCases'],
    executable: true,
    priority: 3
  },

  fullTestSuite: {
    id: 'fullTestSuite',
    name: 'Full Test Suite',
    shortName: 'All Tests',
    description: 'Generate tests for all code files',
    icon: 'TestTube',
    color: 'amber',
    fileCategories: ['components', 'hooks', 'api', 'utilities', 'models'],
    config: {
      userStories: false,
      testCases: true,
      acceptanceCriteria: false,
      edgeCases: true,
      securityTests: true
    },
    outputs: ['testCases'],
    executable: true,
    priority: 4
  },

  userStories: {
    id: 'userStories',
    name: 'User Stories',
    shortName: 'Stories',
    description: 'Generate user stories and acceptance criteria',
    icon: 'FileText',
    color: 'cyan',
    fileCategories: ['components', 'api', 'utilities'],
    config: {
      userStories: true,
      testCases: false,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false
    },
    outputs: ['userStories', 'acceptanceCriteria'],
    executable: false,
    priority: 5
  },

  qaDocumentation: {
    id: 'qaDocumentation',
    name: 'QA Documentation',
    shortName: 'QA Docs',
    description: 'Generate complete QA documentation',
    icon: 'ClipboardList',
    color: 'rose',
    fileCategories: ['components', 'hooks', 'api', 'utilities', 'models'],
    config: {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: true,
      securityTests: true
    },
    outputs: ['userStories', 'testCases', 'acceptanceCriteria'],
    executable: true,
    priority: 6
  },

  custom: {
    id: 'custom',
    name: 'Custom Selection',
    shortName: 'Custom',
    description: 'Manually select files and configure options',
    icon: 'Settings',
    color: 'gray',
    fileCategories: [],
    config: null, // Don't override config
    outputs: [],
    executable: null, // Depends on user config
    priority: 99
  }
};

/**
 * Get goal by ID
 */
export function getGoal(goalId) {
  return ANALYSIS_GOALS[goalId] || null;
}

/**
 * Get all goals as array, sorted by priority
 */
export function getAllGoals() {
  return Object.values(ANALYSIS_GOALS).sort((a, b) => a.priority - b.priority);
}

/**
 * Get available goals based on repo analysis
 * @param {object} repoAnalysis - Result from analyzeRepository
 * @returns {object[]} Array of available goals with file counts
 */
export function getAvailableGoals(repoAnalysis) {
  if (!repoAnalysis || !repoAnalysis.categories) {
    return [ANALYSIS_GOALS.custom];
  }

  const { categories, testFramework } = repoAnalysis;
  const availableGoals = [];

  for (const goal of getAllGoals()) {
    if (goal.id === 'custom') {
      // Custom is always available
      availableGoals.push({
        ...goal,
        available: true,
        fileCount: 0,
        files: []
      });
      continue;
    }

    // Calculate files matching this goal's categories
    const matchingFiles = [];
    for (const catId of goal.fileCategories) {
      if (categories[catId]) {
        matchingFiles.push(...categories[catId].files);
      }
    }

    // Only include if there are matching files
    if (matchingFiles.length > 0) {
      availableGoals.push({
        ...goal,
        available: true,
        fileCount: matchingFiles.length,
        files: matchingFiles,
        // Override executable based on detected test framework
        executable: goal.executable && (testFramework?.executable ?? true)
      });
    }
  }

  return availableGoals;
}

/**
 * Apply goal configuration
 * @param {object} goal - Goal object
 * @param {object} currentConfig - Current config state
 * @returns {object} Updated config
 */
export function applyGoalConfig(goal, currentConfig) {
  if (!goal || !goal.config) {
    return currentConfig;
  }

  return {
    ...currentConfig,
    ...goal.config
  };
}

/**
 * Get files for a goal based on repo analysis
 * @param {object} goal - Goal object
 * @param {object} repoAnalysis - Result from analyzeRepository
 * @returns {string[]} Array of file paths
 */
export function getGoalFiles(goal, repoAnalysis) {
  if (!goal || !repoAnalysis || !repoAnalysis.categories) {
    return [];
  }

  if (goal.id === 'custom') {
    return []; // Custom goal doesn't auto-select files
  }

  const files = [];
  for (const catId of goal.fileCategories) {
    if (repoAnalysis.categories[catId]) {
      files.push(...repoAnalysis.categories[catId].files);
    }
  }

  return files;
}

export default {
  ANALYSIS_GOALS,
  getGoal,
  getAllGoals,
  getAvailableGoals,
  applyGoalConfig,
  getGoalFiles
};
