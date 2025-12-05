/**
 * useAssistantActions Hook
 *
 * Bridge between AI assistant responses and UI state changes.
 * Executes actions returned by the chat-assistant API.
 */

import { useCallback } from 'react';

/**
 * Hook to execute assistant actions
 *
 * @param {object} pageActions - Object containing action handlers from the page
 * @returns {object} - Functions to execute actions and build context
 */
export function useAssistantActions(pageActions) {
  /**
   * Execute an array of actions from the assistant
   */
  const executeActions = useCallback(
    async (actions) => {
      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        return { executed: 0, results: [] };
      }

      const results = [];

      for (const action of actions) {
        try {
          const result = await executeAction(action, pageActions);
          results.push({ action: action.type, success: true, ...result });
        } catch (error) {
          console.error(`Failed to execute action ${action.type}:`, error);
          results.push({ action: action.type, success: false, error: error.message });
        }
      }

      return {
        executed: results.filter((r) => r.success).length,
        results,
      };
    },
    [pageActions]
  );

  /**
   * Build context object for the assistant
   */
  const buildContext = useCallback(
    (additionalContext = {}) => {
      if (!pageActions) {
        return { currentPage: '/analyze-v2', ...additionalContext };
      }

      const {
        selectedRepo,
        selectedBranch,
        selectedFiles,
        fileTree,
        config,
        isAnalyzing,
        isComplete,
        progress,
        results,
        hasApiKey,
        canAnalyze,
      } = pageActions.getState?.() || {};

      return {
        currentPage: '/analyze-v2',
        selectedRepo,
        selectedBranch,
        selectedFiles: selectedFiles || [],
        fileTree: fileTree || [],
        config: config || {},
        isAnalyzing: isAnalyzing || false,
        isComplete: isComplete || false,
        progress: progress || {},
        hasResults: !!results,
        hasApiKey: hasApiKey || false,
        canAnalyze: canAnalyze || false,
        ...additionalContext,
      };
    },
    [pageActions]
  );

  return {
    executeActions,
    buildContext,
  };
}

/**
 * Execute a single action
 */
async function executeAction(action, pageActions) {
  if (!pageActions) {
    throw new Error('Page actions not available');
  }

  const { type, payload } = action;

  switch (type) {
    // ================================
    // File Selection Actions
    // ================================

    case 'SELECT_FILE':
      if (pageActions.toggleFileSelection) {
        pageActions.toggleFileSelection(payload.path);
        return { message: `Selected file: ${payload.path}` };
      }
      throw new Error('toggleFileSelection not available');

    case 'SELECT_FILES_BATCH':
      if (pageActions.batchToggleFiles) {
        await pageActions.batchToggleFiles(payload.paths, true);
        return { message: `Selected ${payload.paths.length} files` };
      }
      throw new Error('batchToggleFiles not available');

    case 'CLEAR_SELECTION':
      if (pageActions.clearSelection) {
        pageActions.clearSelection();
        return { message: 'Cleared file selection' };
      }
      throw new Error('clearSelection not available');

    // ================================
    // Configuration Actions
    // ================================

    case 'UPDATE_CONFIG':
      if (pageActions.setConfig) {
        pageActions.setConfig((prev) => ({ ...prev, ...payload }));
        return { message: `Updated config: ${Object.keys(payload).join(', ')}` };
      }
      throw new Error('setConfig not available');

    case 'SELECT_QUICK_ACTION':
      if (pageActions.setConfig) {
        pageActions.setConfig((prev) => ({ ...prev, ...payload.config }));
        return { message: `Selected quick action: ${payload.action}` };
      }
      throw new Error('setConfig not available');

    // ================================
    // Analysis Actions
    // ================================

    case 'START_ANALYSIS':
      if (pageActions.onAnalyze) {
        await pageActions.onAnalyze();
        return { message: 'Started analysis' };
      }
      throw new Error('onAnalyze not available');

    case 'CANCEL_ANALYSIS':
      if (pageActions.onCancel) {
        pageActions.onCancel();
        return { message: 'Cancelled analysis' };
      }
      throw new Error('onCancel not available');

    // ================================
    // Unknown Action
    // ================================

    default:
      console.warn(`Unknown action type: ${type}`);
      return { message: `Unknown action: ${type}`, skipped: true };
  }
}

export default useAssistantActions;
