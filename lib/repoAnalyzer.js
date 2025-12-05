/**
 * Repository Analyzer
 *
 * Analyzes repository structure and package.json to detect:
 * - Tech stack (React, Vue, Node, Python, etc.)
 * - Test framework (Jest, Vitest, Mocha, Pytest, etc.)
 * - File categories (components, API routes, utilities, etc.)
 * - Recommendations for what can be generated
 */

// Tech stack detection patterns
const TECH_PATTERNS = {
  react: {
    name: 'React',
    packages: ['react', 'react-dom', 'next', 'gatsby', 'create-react-app'],
    filePatterns: [/\.jsx$/, /\.tsx$/]
  },
  vue: {
    name: 'Vue.js',
    packages: ['vue', 'nuxt', '@vue/cli'],
    filePatterns: [/\.vue$/]
  },
  angular: {
    name: 'Angular',
    packages: ['@angular/core', '@angular/cli'],
    filePatterns: [/\.component\.ts$/]
  },
  svelte: {
    name: 'Svelte',
    packages: ['svelte', '@sveltejs/kit'],
    filePatterns: [/\.svelte$/]
  },
  nodejs: {
    name: 'Node.js',
    packages: ['express', 'fastify', 'koa', 'hapi', 'nestjs'],
    filePatterns: [/server\.js$/, /app\.js$/, /index\.js$/]
  },
  typescript: {
    name: 'TypeScript',
    packages: ['typescript'],
    filePatterns: [/\.ts$/, /\.tsx$/]
  },
  python: {
    name: 'Python',
    packages: [], // Python uses requirements.txt, not package.json
    filePatterns: [/\.py$/]
  },
  java: {
    name: 'Java',
    packages: [],
    filePatterns: [/\.java$/]
  },
  go: {
    name: 'Go',
    packages: [],
    filePatterns: [/\.go$/]
  }
};

// Test framework detection
const TEST_FRAMEWORKS = {
  jest: {
    id: 'jest',
    name: 'Jest',
    packages: ['jest', '@jest/core', 'ts-jest'],
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'],
    executable: true
  },
  vitest: {
    id: 'vitest',
    name: 'Vitest',
    packages: ['vitest'],
    configFiles: ['vitest.config.js', 'vitest.config.ts'],
    executable: true
  },
  mocha: {
    id: 'mocha',
    name: 'Mocha',
    packages: ['mocha'],
    configFiles: ['.mocharc.js', '.mocharc.json', 'mocha.opts'],
    executable: true
  },
  pytest: {
    id: 'pytest',
    name: 'Pytest',
    packages: ['pytest'],
    configFiles: ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
    executable: true
  },
  junit: {
    id: 'junit',
    name: 'JUnit',
    packages: [],
    configFiles: [],
    executable: true
  },
  cypress: {
    id: 'cypress',
    name: 'Cypress',
    packages: ['cypress'],
    configFiles: ['cypress.config.js', 'cypress.config.ts', 'cypress.json'],
    executable: false // E2E, not unit tests
  },
  playwright: {
    id: 'playwright',
    name: 'Playwright',
    packages: ['@playwright/test', 'playwright'],
    configFiles: ['playwright.config.js', 'playwright.config.ts'],
    executable: false // E2E, not unit tests
  }
};

// File category patterns
const FILE_CATEGORIES = {
  components: {
    name: 'UI Components',
    patterns: [
      /components?\/.*\.(jsx|tsx|vue|svelte)$/i,
      /src\/.*\.(jsx|tsx)$/i,
      /app\/.*\/.*\.(jsx|tsx)$/i
    ],
    excludePatterns: [/\.test\.|\.spec\.|__tests__/i]
  },
  api: {
    name: 'API Routes',
    patterns: [
      /api\/.*\.(js|ts)$/i,
      /routes?\/.*\.(js|ts)$/i,
      /controllers?\/.*\.(js|ts)$/i,
      /endpoints?\/.*\.(js|ts)$/i
    ],
    excludePatterns: [/\.test\.|\.spec\.|__tests__/i]
  },
  hooks: {
    name: 'React Hooks',
    patterns: [
      /hooks?\/.*\.(js|ts|jsx|tsx)$/i,
      /use[A-Z].*\.(js|ts|jsx|tsx)$/i
    ],
    excludePatterns: [/\.test\.|\.spec\.|__tests__/i]
  },
  utilities: {
    name: 'Utilities',
    patterns: [
      /utils?\/.*\.(js|ts)$/i,
      /lib\/.*\.(js|ts)$/i,
      /helpers?\/.*\.(js|ts)$/i,
      /services?\/.*\.(js|ts)$/i
    ],
    excludePatterns: [/\.test\.|\.spec\.|__tests__/i]
  },
  models: {
    name: 'Data Models',
    patterns: [
      /models?\/.*\.(js|ts)$/i,
      /schemas?\/.*\.(js|ts)$/i,
      /entities?\/.*\.(js|ts)$/i,
      /types?\/.*\.(ts)$/i
    ],
    excludePatterns: [/\.test\.|\.spec\.|__tests__/i]
  },
  tests: {
    name: 'Existing Tests',
    patterns: [
      /\.test\.(js|ts|jsx|tsx)$/i,
      /\.spec\.(js|ts|jsx|tsx)$/i,
      /__tests__\/.*\.(js|ts|jsx|tsx)$/i,
      /test_.*\.py$/i,
      /.*_test\.py$/i,
      /.*Test\.java$/i
    ],
    excludePatterns: []
  },
  config: {
    name: 'Configuration',
    patterns: [
      /\.config\.(js|ts|mjs|cjs)$/i,
      /\.rc$/i,
      /\.json$/i,
      /\.ya?ml$/i,
      /\.env/i
    ],
    excludePatterns: [/package\.json$/, /package-lock\.json$/, /node_modules/i]
  }
};

/**
 * Detect tech stack from package.json
 * @param {object} packageJson - Parsed package.json content
 * @returns {string[]} Array of detected tech stack names
 */
export function detectTechStack(packageJson) {
  if (!packageJson) return [];

  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageJson.peerDependencies || {})
  };

  const depNames = Object.keys(allDeps).map(d => d.toLowerCase());
  const detected = [];

  for (const [key, tech] of Object.entries(TECH_PATTERNS)) {
    const hasPackage = tech.packages.some(pkg =>
      depNames.includes(pkg.toLowerCase())
    );
    if (hasPackage) {
      detected.push({
        id: key,
        name: tech.name,
        confidence: 'high'
      });
    }
  }

  return detected;
}

/**
 * Detect tech stack from file extensions
 * @param {string[]} filePaths - Array of file paths
 * @returns {string[]} Array of detected tech stack names
 */
export function detectTechStackFromFiles(filePaths) {
  if (!filePaths || filePaths.length === 0) return [];

  const detected = [];

  for (const [key, tech] of Object.entries(TECH_PATTERNS)) {
    const hasFiles = filePaths.some(path =>
      tech.filePatterns.some(pattern => pattern.test(path))
    );
    if (hasFiles) {
      detected.push({
        id: key,
        name: tech.name,
        confidence: 'medium'
      });
    }
  }

  return detected;
}

/**
 * Detect test framework from package.json
 * @param {object} packageJson - Parsed package.json content
 * @param {string[]} filePaths - Array of file paths (for config detection)
 * @returns {object|null} Detected test framework info
 */
export function detectTestFramework(packageJson, filePaths = []) {
  if (!packageJson) return null;

  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };

  const depNames = Object.keys(allDeps).map(d => d.toLowerCase());

  // Check each framework
  for (const [key, framework] of Object.entries(TEST_FRAMEWORKS)) {
    const hasPackage = framework.packages.some(pkg =>
      depNames.includes(pkg.toLowerCase())
    );

    const hasConfig = framework.configFiles.some(cfg =>
      filePaths.some(path => path.toLowerCase().endsWith(cfg.toLowerCase()))
    );

    if (hasPackage || hasConfig) {
      return {
        id: framework.id,
        name: framework.name,
        detected: true,
        executable: framework.executable,
        source: hasPackage ? 'package.json' : 'config file'
      };
    }
  }

  return null;
}

/**
 * Categorize files by type
 * @param {string[]} filePaths - Array of file paths
 * @returns {object} Categories with file arrays
 */
export function categorizeFiles(filePaths) {
  if (!filePaths || filePaths.length === 0) return {};

  const categories = {};

  for (const [catId, category] of Object.entries(FILE_CATEGORIES)) {
    const matchingFiles = filePaths.filter(path => {
      // Check if matches any pattern
      const matchesPattern = category.patterns.some(pattern => pattern.test(path));
      // Check if excluded
      const isExcluded = category.excludePatterns.some(pattern => pattern.test(path));
      return matchesPattern && !isExcluded;
    });

    if (matchingFiles.length > 0) {
      categories[catId] = {
        name: category.name,
        count: matchingFiles.length,
        files: matchingFiles
      };
    }
  }

  return categories;
}

/**
 * Generate recommendations based on analysis
 * @param {object} techStack - Detected tech stack
 * @param {object} testFramework - Detected test framework
 * @param {object} categories - File categories
 * @returns {object[]} Array of recommendations
 */
export function generateRecommendations(techStack, testFramework, categories) {
  const recommendations = [];

  // Component tests recommendation
  if (categories.components && categories.components.count > 0) {
    const framework = testFramework?.id || 'jest';
    recommendations.push({
      id: 'component-tests',
      title: 'Component Tests',
      description: `Generate ${testFramework?.name || 'Jest'} tests for ${categories.components.count} UI components`,
      fileCount: categories.components.count,
      files: categories.components.files,
      executable: testFramework?.executable ?? true,
      priority: 'high',
      outputs: ['testCases']
    });
  }

  // API tests recommendation
  if (categories.api && categories.api.count > 0) {
    recommendations.push({
      id: 'api-tests',
      title: 'API Tests',
      description: `Generate integration tests for ${categories.api.count} API routes`,
      fileCount: categories.api.count,
      files: categories.api.files,
      executable: testFramework?.executable ?? true,
      priority: 'high',
      outputs: ['testCases']
    });
  }

  // Hooks tests recommendation
  if (categories.hooks && categories.hooks.count > 0) {
    recommendations.push({
      id: 'hooks-tests',
      title: 'Hook Tests',
      description: `Generate unit tests for ${categories.hooks.count} React hooks`,
      fileCount: categories.hooks.count,
      files: categories.hooks.files,
      executable: testFramework?.executable ?? true,
      priority: 'medium',
      outputs: ['testCases']
    });
  }

  // Utility tests recommendation
  if (categories.utilities && categories.utilities.count > 0) {
    recommendations.push({
      id: 'utility-tests',
      title: 'Utility Tests',
      description: `Generate unit tests for ${categories.utilities.count} utility functions`,
      fileCount: categories.utilities.count,
      files: categories.utilities.files,
      executable: testFramework?.executable ?? true,
      priority: 'medium',
      outputs: ['testCases']
    });
  }

  // User stories recommendation (always available if there are code files)
  const codeCategories = ['components', 'api', 'hooks', 'utilities', 'models'];
  const totalCodeFiles = codeCategories.reduce((sum, cat) =>
    sum + (categories[cat]?.count || 0), 0
  );

  if (totalCodeFiles > 0) {
    recommendations.push({
      id: 'user-stories',
      title: 'User Stories',
      description: `Generate user stories describing ${totalCodeFiles} code files`,
      fileCount: totalCodeFiles,
      files: codeCategories.flatMap(cat => categories[cat]?.files || []),
      executable: false,
      priority: 'low',
      outputs: ['userStories', 'acceptanceCriteria']
    });
  }

  return recommendations;
}

/**
 * Main analysis function - combines all detection and categorization
 * @param {string[]} filePaths - Array of file paths
 * @param {object} packageJson - Parsed package.json (optional)
 * @returns {object} Complete analysis result
 */
export async function analyzeRepository(filePaths, packageJson = null) {
  // Detect tech stack
  let techStack = [];
  if (packageJson) {
    techStack = detectTechStack(packageJson);
  }
  // Also detect from file extensions
  const fileBasedTech = detectTechStackFromFiles(filePaths);
  // Merge, prioritizing package.json detection
  const techIds = new Set(techStack.map(t => t.id));
  for (const tech of fileBasedTech) {
    if (!techIds.has(tech.id)) {
      techStack.push(tech);
    }
  }

  // Detect test framework
  const testFramework = detectTestFramework(packageJson, filePaths);

  // Categorize files
  const categories = categorizeFiles(filePaths);

  // Generate recommendations
  const recommendations = generateRecommendations(techStack, testFramework, categories);

  return {
    techStack,
    testFramework,
    categories,
    recommendations,
    summary: {
      totalFiles: filePaths.length,
      hasExistingTests: (categories.tests?.count || 0) > 0,
      existingTestCount: categories.tests?.count || 0,
      canGenerateExecutableTests: testFramework?.executable ?? false,
      primaryTech: techStack[0]?.name || 'Unknown'
    }
  };
}

export default {
  analyzeRepository,
  detectTechStack,
  detectTechStackFromFiles,
  detectTestFramework,
  categorizeFiles,
  generateRecommendations,
  TECH_PATTERNS,
  TEST_FRAMEWORKS,
  FILE_CATEGORIES
};
