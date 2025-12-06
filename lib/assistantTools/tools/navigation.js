/**
 * Navigation Tools Handler
 *
 * Handles page navigation and context-aware suggestions.
 */

const PAGE_INFO = {
  '/': { name: 'Home', description: 'Landing page' },
  '/analyze': { name: 'Analyze', description: 'Code analysis page' },
  '/analyze-v2': { name: 'Analyze V2', description: 'New analysis experience' },
  '/projects': { name: 'Projects', description: 'Project management' },
  '/dashboard': { name: 'Dashboard', description: 'Analytics and metrics' },
  '/history': { name: 'History', description: 'Analysis history' },
  '/todos': { name: 'Todos', description: 'Todo list' },
  '/execute': { name: 'Execute', description: 'Test execution' },
  '/reports': { name: 'Reports', description: 'Test reports' },
  '/settings': { name: 'Settings', description: 'User settings' },
  '/profile': { name: 'Profile', description: 'User profile' },
};

/**
 * Execute a navigation tool
 */
export async function executeNavigationTool(toolName, input, context) {
  const { pageState = {} } = context;

  switch (toolName) {
    case 'get_current_page':
      return getCurrentPage(pageState);
    case 'suggest_navigation':
      return suggestNavigation(input, pageState);
    default:
      return { success: false, error: `Unknown navigation tool: ${toolName}` };
  }
}

function getCurrentPage(pageState) {
  const currentPath = pageState.currentPage || '/';
  const pageInfo = PAGE_INFO[currentPath] || { name: 'Unknown', description: 'Unknown page' };

  return {
    success: true,
    data: {
      path: currentPath,
      name: pageInfo.name,
      description: pageInfo.description,
      availableActions: getAvailableActions(currentPath),
    },
  };
}

function suggestNavigation(input, pageState) {
  const { goal } = input;
  const suggestions = [];

  const goalLower = goal.toLowerCase();

  if (goalLower.includes('analyz') || goalLower.includes('test') || goalLower.includes('generat')) {
    suggestions.push({ path: '/analyze-v2', reason: 'Generate tests and analyze code' });
  }
  if (goalLower.includes('project') || goalLower.includes('manage')) {
    suggestions.push({ path: '/projects', reason: 'Manage projects and requirements' });
  }
  if (goalLower.includes('execut') || goalLower.includes('run')) {
    suggestions.push({ path: '/execute', reason: 'Execute tests in browser' });
  }
  if (goalLower.includes('report') || goalLower.includes('result')) {
    suggestions.push({ path: '/reports', reason: 'View test reports' });
  }
  if (goalLower.includes('dashboard') || goalLower.includes('stats') || goalLower.includes('metric')) {
    suggestions.push({ path: '/dashboard', reason: 'View analytics and metrics' });
  }
  if (goalLower.includes('history') || goalLower.includes('previous')) {
    suggestions.push({ path: '/history', reason: 'View analysis history' });
  }
  if (goalLower.includes('todo') || goalLower.includes('task')) {
    suggestions.push({ path: '/todos', reason: 'Manage your todo list' });
  }
  if (goalLower.includes('setting') || goalLower.includes('config') || goalLower.includes('api key')) {
    suggestions.push({ path: '/settings', reason: 'Configure settings and API keys' });
  }

  if (suggestions.length === 0) {
    suggestions.push({ path: '/analyze-v2', reason: 'Start with code analysis' });
  }

  return {
    success: true,
    data: {
      goal,
      suggestions: suggestions.slice(0, 3),
      currentPage: pageState.currentPage,
    },
  };
}

function getAvailableActions(path) {
  const actions = {
    '/analyze': ['select files', 'configure analysis', 'start analysis'],
    '/analyze-v2': ['connect repo', 'select files', 'choose goal', 'run analysis'],
    '/projects': ['create project', 'view projects', 'manage requirements'],
    '/dashboard': ['view stats', 'see recent analyses', 'check metrics'],
    '/execute': ['select tests', 'configure environment', 'run tests'],
    '/reports': ['view reports', 'export results', 'analyze failures'],
    '/todos': ['create todo', 'complete todos', 'filter by status'],
    '/settings': ['update API key', 'manage integrations', 'clear cache'],
  };

  return actions[path] || ['navigate to other pages'];
}

export default { executeNavigationTool };
