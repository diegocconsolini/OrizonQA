/**
 * Tool Handlers Barrel Export
 *
 * Exports all tool handler functions from a single entry point.
 */

export { executeAnalysisTool } from './analysis.js';
export { executeProjectTool } from './projects.js';
export { executeTodoTool } from './todos.js';
export { executeDashboardTool } from './dashboard.js';
export { executeNavigationTool } from './navigation.js';
export { executeSettingsTool } from './settings.js';

export default {
  executeAnalysisTool: () => import('./analysis.js').then(m => m.executeAnalysisTool),
  executeProjectTool: () => import('./projects.js').then(m => m.executeProjectTool),
  executeTodoTool: () => import('./todos.js').then(m => m.executeTodoTool),
  executeDashboardTool: () => import('./dashboard.js').then(m => m.executeDashboardTool),
  executeNavigationTool: () => import('./navigation.js').then(m => m.executeNavigationTool),
  executeSettingsTool: () => import('./settings.js').then(m => m.executeSettingsTool),
};
