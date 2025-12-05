'use client';

import { useEffect } from 'react';
import { useAssistantStore } from '@/app/stores/assistantStore';

/**
 * Hook for pages to provide context to the global assistant
 *
 * @param {Object} context - Page context object
 * @param {string} context.page - Page identifier (e.g., 'analyze', 'projects', 'execute')
 * @param {string} context.title - Human-readable page title
 * @param {Object} context.data - Page-specific data (files, project info, etc.)
 * @param {Array} context.suggestedActions - Context-aware action suggestions
 *
 * @example
 * // In /analyze page:
 * usePageContext({
 *   page: 'analyze',
 *   title: 'Code Analysis',
 *   data: {
 *     hasSource: selectedFiles.length > 0,
 *     sourceType: 'github',
 *     repo: selectedRepo?.name,
 *     fileCount: selectedFiles.length,
 *   },
 *   suggestedActions: [
 *     { id: 'generate-tests', label: 'Generate tests for selected files' },
 *     { id: 'explain-code', label: 'Explain this codebase' },
 *   ]
 * });
 */
export function usePageContext(context) {
  const { setPageContext, clearPageContext } = useAssistantStore();

  useEffect(() => {
    if (context) {
      setPageContext(context);
    }

    // Clear context when leaving page
    return () => {
      clearPageContext();
    };
  }, [JSON.stringify(context)]); // Stringify for deep comparison
}

export default usePageContext;
