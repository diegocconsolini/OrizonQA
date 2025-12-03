/**
 * File Classification Engine
 * Classifies files into categories based on path patterns and file extensions
 */

import { minimatch } from 'minimatch';

// Category definitions with patterns, colors, and defaults
export const CATEGORIES = {
  frontend: {
    id: 'frontend',
    name: 'Frontend',
    icon: 'Monitor',
    color: 'blue',
    patterns: [
      '**/*.jsx', '**/*.tsx', '**/*.vue', '**/*.svelte',
      '**/components/**', '**/pages/**', '**/views/**',
      '**/src/app/**/*.js', '**/src/app/**/*.ts',
      '**/*.css', '**/*.scss', '**/*.less', '**/*.styled.*'
    ],
    excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
    defaultOutputs: {
      docs: ['userStories', 'acceptanceCriteria'],
      tests: ['testCases'],
      security: ['securityTests'],
      full: ['userStories', 'testCases', 'acceptanceCriteria']
    }
  },
  backend: {
    id: 'backend',
    name: 'Backend API',
    icon: 'Server',
    color: 'green',
    patterns: [
      '**/routes/**', '**/controllers/**', '**/handlers/**',
      '**/api/**/*.js', '**/api/**/*.ts', '**/api/**/*.py',
      '**/endpoints/**', '**/services/**',
      '**/middleware/**', '**/auth/**'
    ],
    excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
    defaultOutputs: {
      docs: ['userStories'],
      tests: ['testCases', 'edgeCases'],
      security: ['testCases', 'securityTests', 'edgeCases'],
      full: ['testCases', 'securityTests', 'edgeCases']
    }
  },
  database: {
    id: 'database',
    name: 'Database',
    icon: 'Database',
    color: 'purple',
    patterns: [
      '**/models/**', '**/schemas/**', '**/entities/**',
      '**/migrations/**', '**/seeds/**',
      '**/prisma/**', '**/drizzle/**',
      '**/*.model.*', '**/*.schema.*', '**/*.entity.*'
    ],
    excludePatterns: ['**/*.test.*', '**/*.spec.*'],
    defaultOutputs: {
      docs: ['acceptanceCriteria'],
      tests: ['testCases', 'edgeCases'],
      security: ['testCases', 'securityTests'],
      full: ['testCases', 'edgeCases', 'securityTests']
    }
  },
  tests: {
    id: 'tests',
    name: 'Existing Tests',
    icon: 'TestTube',
    color: 'yellow',
    patterns: [
      '**/*.test.*', '**/*.spec.*',
      '**/__tests__/**', '**/tests/**', '**/test/**',
      '**/*.cy.*', '**/cypress/**', '**/e2e/**'
    ],
    excludePatterns: [],
    defaultOutputs: {
      docs: [],
      tests: [],
      security: [],
      full: []
    },
    alwaysSkip: true
  },
  config: {
    id: 'config',
    name: 'Configuration',
    icon: 'Settings',
    color: 'gray',
    patterns: [
      '*.config.*', '**/config/**',
      '.env*', '.eslint*', '.prettier*',
      'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'tsconfig.*', 'jsconfig.*', 'next.config.*', 'vite.config.*',
      'webpack.config.*', 'rollup.config.*',
      'Dockerfile', 'docker-compose.*', '.docker*',
      'Makefile', 'Procfile', '*.yml', '*.yaml'
    ],
    excludePatterns: [],
    defaultOutputs: {
      docs: [],
      tests: [],
      security: ['securityTests'],
      full: []
    },
    alwaysSkip: true
  },
  utils: {
    id: 'utils',
    name: 'Utilities',
    icon: 'Wrench',
    color: 'orange',
    patterns: [
      '**/utils/**', '**/helpers/**', '**/lib/**',
      '**/common/**', '**/shared/**', '**/core/**',
      '**/constants/**', '**/types/**', '**/interfaces/**'
    ],
    excludePatterns: ['**/*.test.*', '**/*.spec.*'],
    defaultOutputs: {
      docs: [],
      tests: ['testCases'],
      security: [],
      full: ['testCases']
    }
  },
  other: {
    id: 'other',
    name: 'Other Files',
    icon: 'File',
    color: 'slate',
    patterns: ['**/*'],
    excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    defaultOutputs: {
      docs: ['userStories'],
      tests: ['testCases'],
      security: ['testCases'],
      full: ['testCases']
    }
  }
};

// Output type definitions
export const OUTPUT_TYPES = {
  userStories: { id: 'userStories', name: 'User Stories', icon: 'BookOpen', color: 'blue' },
  testCases: { id: 'testCases', name: 'Test Cases', icon: 'TestTube2', color: 'green' },
  acceptanceCriteria: { id: 'acceptanceCriteria', name: 'Acceptance Criteria', icon: 'CheckSquare', color: 'purple' },
  edgeCases: { id: 'edgeCases', name: 'Edge Cases', icon: 'AlertTriangle', color: 'amber' },
  securityTests: { id: 'securityTests', name: 'Security Tests', icon: 'Shield', color: 'red' },
  skip: { id: 'skip', name: 'Skip', icon: 'X', color: 'gray' }
};

// Analysis goals with presets
export const ANALYSIS_GOALS = {
  docs: {
    id: 'docs',
    name: 'Documentation',
    description: 'Generate user stories and acceptance criteria',
    icon: 'FileText',
    color: 'blue'
  },
  tests: {
    id: 'tests',
    name: 'Test Generation',
    description: 'Generate comprehensive test cases',
    icon: 'TestTube',
    color: 'green'
  },
  security: {
    id: 'security',
    name: 'Security Audit',
    description: 'Security-focused analysis and tests',
    icon: 'Shield',
    color: 'red'
  },
  full: {
    id: 'full',
    name: 'Full Analysis',
    description: 'All artifacts per file type',
    icon: 'Layers',
    color: 'purple'
  }
};

/**
 * Classify files into categories
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Object} Categories with their files
 */
export function classifyFiles(filePaths) {
  const result = {};

  // Initialize all categories
  Object.keys(CATEGORIES).forEach(catId => {
    result[catId] = {
      ...CATEGORIES[catId],
      files: [],
      count: 0
    };
  });

  // Track which files have been categorized
  const categorized = new Set();

  // Process categories in order (except 'other' which is last)
  const categoryOrder = Object.keys(CATEGORIES).filter(k => k !== 'other');
  categoryOrder.push('other');

  for (const catId of categoryOrder) {
    const category = CATEGORIES[catId];

    for (const filePath of filePaths) {
      // Skip if already categorized (except for 'other' which catches all)
      if (categorized.has(filePath) && catId !== 'other') continue;

      // Check exclude patterns first
      const isExcluded = category.excludePatterns.some(pattern =>
        minimatch(filePath, pattern, { dot: true })
      );
      if (isExcluded) continue;

      // Check if matches any pattern
      const matches = category.patterns.some(pattern =>
        minimatch(filePath, pattern, { dot: true })
      );

      if (matches) {
        // For 'other', only add if not already categorized
        if (catId === 'other' && categorized.has(filePath)) continue;

        result[catId].files.push(filePath);
        result[catId].count++;
        categorized.add(filePath);
      }
    }
  }

  return result;
}

/**
 * Get recommended configuration based on goal
 * @param {Object} categories - Classified files
 * @param {string} goal - Analysis goal (docs, tests, security, full)
 * @returns {Object} Recommended configuration per category
 */
export function getRecommendedConfig(categories, goal) {
  const config = {};

  for (const [catId, category] of Object.entries(categories)) {
    const catDef = CATEGORIES[catId];
    const outputs = catDef.defaultOutputs[goal] || [];

    config[catId] = {
      enabled: !catDef.alwaysSkip && outputs.length > 0,
      outputTypes: catDef.alwaysSkip ? ['skip'] : (outputs.length > 0 ? outputs : ['skip']),
      files: category.files,
      count: category.count
    };
  }

  return config;
}

/**
 * Estimate token usage for configuration
 * @param {Object} config - Category configuration
 * @returns {Object} Token estimates
 */
export function estimateTokens(config) {
  const TOKENS_PER_OUTPUT = {
    userStories: 150,
    testCases: 200,
    acceptanceCriteria: 100,
    edgeCases: 100,
    securityTests: 150,
    skip: 0
  };

  const AVG_INPUT_TOKENS_PER_FILE = 300;

  let inputTokens = 0;
  let outputTokens = 0;
  let fileCount = 0;

  for (const [catId, catConfig] of Object.entries(config)) {
    if (!catConfig.enabled || catConfig.outputTypes.includes('skip')) continue;

    const files = catConfig.count || catConfig.files?.length || 0;
    fileCount += files;
    inputTokens += files * AVG_INPUT_TOKENS_PER_FILE;

    // Calculate output tokens based on selected outputs
    for (const output of catConfig.outputTypes) {
      outputTokens += files * (TOKENS_PER_OUTPUT[output] || 100);
    }
  }

  // Cost estimation (Claude Sonnet pricing)
  const inputCost = (inputTokens / 1000000) * 3;  // $3 per 1M input tokens
  const outputCost = (outputTokens / 1000000) * 15; // $15 per 1M output tokens

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    fileCount,
    estimatedCost: inputCost + outputCost,
    formattedCost: `$${(inputCost + outputCost).toFixed(4)}`
  };
}

/**
 * Build smart config from category settings
 * @param {Object} categoryConfig - Per-category configuration
 * @param {Object} globalSettings - Global output settings
 * @returns {Object} Smart config for analysis
 */
export function buildSmartConfig(categoryConfig, globalSettings) {
  return {
    categories: categoryConfig,
    outputFormat: globalSettings.outputFormat || 'markdown',
    testFramework: globalSettings.testFramework || 'generic',
    additionalContext: globalSettings.additionalContext || '',
    // Build aggregated flags for backward compatibility
    userStories: Object.values(categoryConfig).some(c =>
      c.enabled && c.outputTypes.includes('userStories')
    ),
    testCases: Object.values(categoryConfig).some(c =>
      c.enabled && c.outputTypes.includes('testCases')
    ),
    acceptanceCriteria: Object.values(categoryConfig).some(c =>
      c.enabled && c.outputTypes.includes('acceptanceCriteria')
    ),
    edgeCases: Object.values(categoryConfig).some(c =>
      c.enabled && c.outputTypes.includes('edgeCases')
    ),
    securityTests: Object.values(categoryConfig).some(c =>
      c.enabled && c.outputTypes.includes('securityTests')
    )
  };
}
