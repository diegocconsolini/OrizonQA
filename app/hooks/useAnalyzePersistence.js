'use client';

/**
 * useAnalyzePersistence Hook
 *
 * Persists Analyze page state to sessionStorage so work is not lost
 * when navigating to other sections.
 *
 * Persisted state:
 * - Selected repository
 * - Selected branch
 * - Selected files
 * - Configuration settings
 * - Per-card file selections
 * - Active tab
 * - Code input (paste mode)
 * - Uploaded files metadata
 *
 * Uses sessionStorage (cleared on tab close) to avoid stale data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'orizon_analyze_state';
const STORAGE_VERSION = 1;

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Default state values
 */
const defaultState = {
  // Repository
  selectedRepoId: null,
  selectedBranch: 'main',
  selectedFiles: [],

  // Configuration
  config: {
    userStories: true,
    testCases: true,
    acceptanceCriteria: true,
    edgeCases: false,
    securityTests: false,
    outputFormat: 'markdown',
    testFramework: 'generic',
    additionalContext: ''
  },

  // Per-card files
  cardFiles: {
    userStories: [],
    testCases: [],
    acceptanceCriteria: [],
    useSharedFiles: true
  },

  // UI state
  activeTab: 'input',

  // Input modes
  codeInput: '',
  uploadedFilesInfo: [], // Just metadata, not content

  // Timestamp for staleness check
  savedAt: null
};

export default function useAnalyzePersistence() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [persistedState, setPersistedState] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const saveTimeoutRef = useRef(null);

  /**
   * Load state from sessionStorage
   */
  const loadState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoaded(true);
        return null;
      }

      const parsed = JSON.parse(stored);

      // Version check
      if (parsed.version !== STORAGE_VERSION) {
        console.log('Analyze state version mismatch, clearing...');
        sessionStorage.removeItem(STORAGE_KEY);
        setIsLoaded(true);
        return null;
      }

      // Staleness check (clear if older than 24 hours)
      const savedAt = parsed.state?.savedAt;
      if (savedAt && Date.now() - savedAt > 24 * 60 * 60 * 1000) {
        console.log('Analyze state is stale, clearing...');
        sessionStorage.removeItem(STORAGE_KEY);
        setIsLoaded(true);
        return null;
      }

      setPersistedState(parsed.state);
      setIsLoaded(true);
      setLoadError(null);
      return parsed.state;
    } catch (error) {
      console.error('Failed to load analyze state:', error);
      setLoadError('Failed to restore your previous session. Starting fresh.');
      setIsLoaded(true);
      // Clear corrupted data
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // Ignore
      }
      return null;
    }
  }, []);

  /**
   * Save state to sessionStorage (debounced)
   */
  const saveState = useCallback((state) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves to avoid excessive writes
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const toSave = {
          version: STORAGE_VERSION,
          state: {
            ...state,
            savedAt: Date.now()
          }
        };

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        setPersistedState(state);
        setSaveError(null);
      } catch (error) {
        console.error('Failed to save analyze state:', error);

        // Check if it's a quota error
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          setSaveError('Storage is full. Your work may not be saved when navigating away.');
          // Try to clear old data and save minimal state
          try {
            const minimalState = {
              version: STORAGE_VERSION,
              state: {
                selectedRepoId: state.selectedRepoId,
                selectedBranch: state.selectedBranch,
                selectedFiles: state.selectedFiles?.slice(0, 100), // Limit files
                config: state.config,
                activeTab: state.activeTab,
                savedAt: Date.now()
              }
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
            setSaveError('Storage limited. Some data may not persist.');
          } catch (e) {
            // Give up
          }
        } else {
          setSaveError('Failed to save your progress. Your work may be lost when navigating away.');
        }
      }
    }, 500); // 500ms debounce
  }, []);

  /**
   * Clear persisted state
   */
  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setPersistedState(null);
      setSaveError(null);
    } catch (error) {
      console.error('Failed to clear analyze state:', error);
    }
  }, []);

  /**
   * Update specific fields in persisted state
   */
  const updateState = useCallback((updates) => {
    setPersistedState(prev => {
      const newState = { ...prev, ...updates };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  /**
   * Get a specific value with fallback
   */
  const getValue = useCallback((key, fallback) => {
    if (!persistedState) return fallback;
    return persistedState[key] ?? fallback;
  }, [persistedState]);

  // Load state on mount
  useEffect(() => {
    loadState();

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadState]);

  // Dismiss errors after 5 seconds
  useEffect(() => {
    if (saveError || loadError) {
      const timer = setTimeout(() => {
        setSaveError(null);
        setLoadError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveError, loadError]);

  return {
    // State
    isLoaded,
    persistedState,
    defaultState,

    // Actions
    saveState,
    loadState,
    clearState,
    updateState,
    getValue,

    // Errors
    saveError,
    loadError,
    dismissErrors: () => {
      setSaveError(null);
      setLoadError(null);
    }
  };
}

/**
 * Helper to create state snapshot for saving
 */
export function createAnalyzeSnapshot({
  selectedRepo,
  selectedBranch,
  selectedFiles,
  config,
  cardFiles,
  activeTab,
  codeInput,
  uploadedFiles
}) {
  return {
    selectedRepoId: selectedRepo?.id || null,
    selectedRepoData: selectedRepo ? {
      id: selectedRepo.id,
      name: selectedRepo.name,
      full_name: selectedRepo.full_name,
      owner: selectedRepo.owner,
      private: selectedRepo.private
    } : null,
    selectedBranch,
    selectedFiles,
    config,
    cardFiles,
    activeTab,
    codeInput: codeInput?.substring(0, 50000) || '', // Limit to 50KB
    uploadedFilesInfo: uploadedFiles?.map(f => ({
      name: f.name,
      size: f.size || f.content?.length || 0
    })) || []
  };
}
