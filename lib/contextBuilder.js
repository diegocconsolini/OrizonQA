/**
 * Context Builder - Structured context for AI analysis
 */

export const CONTEXT_PRESETS = {
  startup: {
    id: 'startup',
    name: 'Startup/MVP',
    description: 'Fast iteration, core functionality focus',
    icon: 'Rocket',
    values: {
      projectType: 'webapp',
      priority: ['core-features', 'happy-path'],
      coverageTarget: 70,
      testStyle: 'pragmatic',
      mockStrategy: 'minimal'
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'High coverage, security focus',
    icon: 'Building',
    values: {
      projectType: 'enterprise',
      priority: ['security', 'validation', 'edge-cases'],
      coverageTarget: 90,
      testStyle: 'comprehensive',
      mockStrategy: 'full'
    }
  },
  api: {
    id: 'api',
    name: 'API/Backend',
    description: 'Contract testing, integration focus',
    icon: 'Server',
    values: {
      projectType: 'api',
      priority: ['endpoints', 'validation', 'error-handling'],
      coverageTarget: 85,
      testStyle: 'contract',
      mockStrategy: 'integration'
    }
  },
  opensource: {
    id: 'opensource',
    name: 'Open Source',
    description: 'Documentation, contributor-friendly',
    icon: 'Github',
    values: {
      projectType: 'library',
      priority: ['public-api', 'documentation', 'examples'],
      coverageTarget: 80,
      testStyle: 'bdd',
      mockStrategy: 'minimal'
    }
  }
};

export const PROJECT_TYPES = [
  { id: 'webapp', label: 'Web Application' },
  { id: 'api', label: 'API/Backend Service' },
  { id: 'mobile', label: 'Mobile App' },
  { id: 'library', label: 'Library/Package' },
  { id: 'cli', label: 'CLI Tool' },
  { id: 'enterprise', label: 'Enterprise System' },
  { id: 'microservice', label: 'Microservice' }
];

export const PRIORITY_AREAS = [
  { id: 'core-features', label: 'Core Features', icon: 'Star' },
  { id: 'authentication', label: 'Authentication', icon: 'Lock' },
  { id: 'authorization', label: 'Authorization', icon: 'Shield' },
  { id: 'validation', label: 'Data Validation', icon: 'CheckCircle' },
  { id: 'endpoints', label: 'API Endpoints', icon: 'Globe' },
  { id: 'database', label: 'Database Operations', icon: 'Database' },
  { id: 'ui-components', label: 'UI Components', icon: 'Layout' },
  { id: 'forms', label: 'Form Handling', icon: 'FileInput' },
  { id: 'error-handling', label: 'Error Handling', icon: 'AlertCircle' },
  { id: 'edge-cases', label: 'Edge Cases', icon: 'AlertTriangle' },
  { id: 'security', label: 'Security', icon: 'ShieldCheck' },
  { id: 'performance', label: 'Performance', icon: 'Zap' },
  { id: 'happy-path', label: 'Happy Path Only', icon: 'Smile' }
];

export const EXCLUDE_AREAS = [
  { id: 'config', label: 'Config Files' },
  { id: 'generated', label: 'Generated Code' },
  { id: 'migrations', label: 'Migrations' },
  { id: 'tests', label: 'Existing Tests' },
  { id: 'types', label: 'Type Definitions' },
  { id: 'mocks', label: 'Mock Data' },
  { id: 'docs', label: 'Documentation' }
];

export const TEST_STYLES = [
  { id: 'tdd', label: 'TDD Style', description: 'Red-Green-Refactor focus' },
  { id: 'bdd', label: 'BDD Style', description: 'Given-When-Then scenarios' },
  { id: 'contract', label: 'Contract Testing', description: 'API contract verification' },
  { id: 'pragmatic', label: 'Pragmatic', description: 'Balanced coverage approach' },
  { id: 'comprehensive', label: 'Comprehensive', description: 'Maximum coverage' }
];

export const MOCK_STRATEGIES = [
  { id: 'minimal', label: 'Minimal Mocking', description: 'Only external services' },
  { id: 'integration', label: 'Integration Preferred', description: 'Real dependencies when possible' },
  { id: 'full', label: 'Full Mocking', description: 'Mock all dependencies' },
  { id: 'none', label: 'No Mocks', description: 'Integration tests only' }
];

export const TECH_STACK_SUGGESTIONS = [
  'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt',
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Hono',
  'Python', 'Django', 'FastAPI', 'Flask',
  'Java', 'Spring Boot', 'Quarkus',
  'Go', 'Gin', 'Echo',
  'Ruby', 'Rails', 'Sinatra',
  'PHP', 'Laravel', 'Symfony',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'GraphQL', 'REST', 'gRPC', 'WebSocket',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure'
];

/**
 * Build context prompt section from structured context
 */
export function buildContextPrompt(context) {
  const sections = [];

  if (context.projectName) {
    sections.push(`Project: ${context.projectName}`);
  }

  if (context.projectType) {
    const type = PROJECT_TYPES.find(t => t.id === context.projectType);
    sections.push(`Type: ${type?.label || context.projectType}`);
  }

  if (context.techStack?.length > 0) {
    sections.push(`Tech Stack: ${context.techStack.join(', ')}`);
  }

  if (context.priority?.length > 0) {
    const priorities = context.priority.map(p => {
      const area = PRIORITY_AREAS.find(a => a.id === p);
      return area?.label || p;
    });
    sections.push(`Focus Areas: ${priorities.join(', ')}`);
  }

  if (context.exclude?.length > 0) {
    const excludes = context.exclude.map(e => {
      const area = EXCLUDE_AREAS.find(a => a.id === e);
      return area?.label || e;
    });
    sections.push(`Skip: ${excludes.join(', ')}`);
  }

  if (context.coverageTarget) {
    sections.push(`Target Coverage: ${context.coverageTarget}%`);
  }

  if (context.testStyle) {
    const style = TEST_STYLES.find(s => s.id === context.testStyle);
    sections.push(`Test Style: ${style?.label || context.testStyle}`);
  }

  if (context.mockStrategy) {
    const strategy = MOCK_STRATEGIES.find(s => s.id === context.mockStrategy);
    sections.push(`Mocking: ${strategy?.label || context.mockStrategy}`);
  }

  if (context.instructions) {
    sections.push(`\nAdditional Instructions:\n${context.instructions}`);
  }

  return sections.length > 0
    ? `\n## Analysis Context\n${sections.join('\n')}`
    : '';
}

/**
 * Get default context
 */
export function getDefaultContext() {
  return {
    projectName: '',
    projectType: 'webapp',
    techStack: [],
    priority: ['core-features'],
    exclude: ['config', 'generated'],
    coverageTarget: 80,
    testStyle: 'pragmatic',
    mockStrategy: 'minimal',
    instructions: ''
  };
}

/**
 * Apply preset to context
 */
export function applyPreset(presetId, currentContext) {
  const preset = CONTEXT_PRESETS[presetId];
  if (!preset) return currentContext;

  return {
    ...currentContext,
    ...preset.values
  };
}
