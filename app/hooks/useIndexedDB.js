/**
 * useIndexedDB Hook
 *
 * React hook for managing repository content in IndexedDB.
 *
 * PRIVACY GUARANTEE:
 * - All repository content is stored ONLY in your browser's IndexedDB
 * - NO code is ever uploaded to ORIZON servers
 * - NO cloud storage of your repository content
 * - Data stays on YOUR device, under YOUR control
 * - You can clear all cached data at any time
 */

import { useState, useEffect, useCallback } from 'react';
import {
  saveRepository,
  getRepository,
  getUserRepositories,
  saveFiles,
  getRepositoryFiles,
  saveBranches,
  getBranches,
  recordFetch,
  deleteRepository,
  clearAllCache,
  getStorageStats,
  cleanupOldData,
  isIndexedDBAvailable
} from '@/app/lib/indexedDB';

export default function useIndexedDB(userId = 'anonymous') {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cachedRepos, setCachedRepos] = useState([]);
  const [storageStats, setStorageStats] = useState(null);

  // Check IndexedDB availability on mount
  useEffect(() => {
    const available = isIndexedDBAvailable();
    setIsAvailable(available);
    setIsLoading(false);

    if (!available) {
      setError('IndexedDB is not available in this browser. Repository caching disabled.');
    }
  }, []);

  // Load cached repositories on mount
  useEffect(() => {
    if (isAvailable) {
      loadCachedRepos();
      loadStorageStats();
    }
  }, [isAvailable, userId]);

  /**
   * Load all cached repositories for the current user
   */
  const loadCachedRepos = useCallback(async () => {
    if (!isAvailable) return;

    try {
      const repos = await getUserRepositories(userId);
      setCachedRepos(repos);
    } catch (err) {
      console.error('Failed to load cached repos:', err);
      setError('Failed to load cached repositories');
    }
  }, [isAvailable, userId]);

  /**
   * Load storage statistics
   */
  const loadStorageStats = useCallback(async () => {
    if (!isAvailable) return;

    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    }
  }, [isAvailable]);

  /**
   * Cache a repository's files after fetching from GitHub
   */
  const cacheRepository = useCallback(async (repo, files, branch = 'main') => {
    if (!isAvailable) {
      console.warn('IndexedDB not available, skipping cache');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create repo ID
      const repoId = `${repo.owner}_${repo.name}`;

      // Save repository metadata
      const savedRepo = await saveRepository({
        ...repo,
        userId
      });

      // Save all files
      if (files && files.length > 0) {
        await saveFiles(repoId, files, branch);
      }

      // Record the fetch
      await recordFetch(repoId, branch, files?.length || 0);

      // Refresh cached repos list
      await loadCachedRepos();
      await loadStorageStats();

      return savedRepo;
    } catch (err) {
      console.error('Failed to cache repository:', err);
      setError('Failed to cache repository data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, userId, loadCachedRepos, loadStorageStats]);

  /**
   * Get cached files for a repository
   */
  const getCachedFiles = useCallback(async (owner, name) => {
    if (!isAvailable) return null;

    try {
      const repoId = `${owner}_${name}`;
      const files = await getRepositoryFiles(repoId);

      // Update last accessed time
      const repo = await getRepository(repoId);
      if (repo) {
        await saveRepository({
          ...repo,
          lastAccessed: new Date().toISOString()
        });
      }

      return files;
    } catch (err) {
      console.error('Failed to get cached files:', err);
      return null;
    }
  }, [isAvailable]);

  /**
   * Check if a repository is cached
   */
  const isRepoCached = useCallback(async (owner, name) => {
    if (!isAvailable) return false;

    try {
      const repoId = `${owner}_${name}`;
      const repo = await getRepository(repoId);
      return !!repo;
    } catch (err) {
      return false;
    }
  }, [isAvailable]);

  /**
   * Get cached repository metadata
   */
  const getCachedRepo = useCallback(async (owner, name) => {
    if (!isAvailable) return null;

    try {
      const repoId = `${owner}_${name}`;
      return await getRepository(repoId);
    } catch (err) {
      return null;
    }
  }, [isAvailable]);

  /**
   * Cache branch information
   */
  const cacheBranches = useCallback(async (owner, name, branches) => {
    if (!isAvailable) return;

    try {
      const repoId = `${owner}_${name}`;
      await saveBranches(repoId, branches);
    } catch (err) {
      console.error('Failed to cache branches:', err);
    }
  }, [isAvailable]);

  /**
   * Get cached branches
   */
  const getCachedBranches = useCallback(async (owner, name) => {
    if (!isAvailable) return [];

    try {
      const repoId = `${owner}_${name}`;
      return await getBranches(repoId);
    } catch (err) {
      return [];
    }
  }, [isAvailable]);

  /**
   * Get list of cached file paths for a repository
   */
  const getCachedFilePaths = useCallback(async (owner, name) => {
    if (!isAvailable) return [];

    try {
      const repoId = `${owner}_${name}`;
      const files = await getRepositoryFiles(repoId);
      return files ? files.map(f => f.path) : [];
    } catch (err) {
      return [];
    }
  }, [isAvailable]);

  /**
   * Get detailed cache manifest for all repos
   * Returns full info for cache browser
   */
  const getCacheManifest = useCallback(async () => {
    if (!isAvailable) return [];

    try {
      const repos = await getUserRepositories(userId);
      const manifest = await Promise.all(
        repos.map(async (repo) => {
          const repoId = `${repo.owner}_${repo.name}`;
          const files = await getRepositoryFiles(repoId);
          const branches = await getBranches(repoId);

          // Calculate total size
          const totalSize = files?.reduce((sum, f) => sum + (f.content?.length || 0), 0) || 0;

          return {
            ...repo,
            repoId,
            fileCount: files?.length || 0,
            totalSize,
            branches,
            files: files?.map(f => ({
              path: f.path,
              name: f.path.split('/').pop(),
              size: f.content?.length || 0,
              branch: f.branch,
              cachedAt: f.cachedAt
            })) || []
          };
        })
      );

      return manifest;
    } catch (err) {
      console.error('Failed to get cache manifest:', err);
      return [];
    }
  }, [isAvailable, userId]);

  /**
   * Remove a repository from cache
   */
  const removeFromCache = useCallback(async (owner, name) => {
    if (!isAvailable) return false;

    try {
      const repoId = `${owner}_${name}`;
      await deleteRepository(repoId);
      await loadCachedRepos();
      await loadStorageStats();
      return true;
    } catch (err) {
      console.error('Failed to remove from cache:', err);
      setError('Failed to remove repository from cache');
      return false;
    }
  }, [isAvailable, loadCachedRepos, loadStorageStats]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async () => {
    if (!isAvailable) return false;

    try {
      setIsLoading(true);
      await clearAllCache();
      setCachedRepos([]);
      setStorageStats(null);
      await loadStorageStats();
      return true;
    } catch (err) {
      console.error('Failed to clear cache:', err);
      setError('Failed to clear cache');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, loadStorageStats]);

  /**
   * Clean up old cached data
   */
  const cleanupCache = useCallback(async (daysOld = 30) => {
    if (!isAvailable) return null;

    try {
      setIsLoading(true);
      const result = await cleanupOldData(daysOld);
      await loadCachedRepos();
      await loadStorageStats();
      return result;
    } catch (err) {
      console.error('Failed to cleanup cache:', err);
      setError('Failed to cleanup old data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, loadCachedRepos, loadStorageStats]);

  /**
   * Format storage size for display
   */
  const formatStorageSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    // State
    isAvailable,
    isLoading,
    error,
    cachedRepos,
    storageStats,

    // Actions
    cacheRepository,
    getCachedFiles,
    getCachedRepo,
    isRepoCached,
    cacheBranches,
    getCachedBranches,
    getCachedFilePaths,
    getCacheManifest,
    removeFromCache,
    clearCache,
    cleanupCache,
    refreshCache: loadCachedRepos,

    // Utilities
    formatStorageSize,

    // Privacy info
    privacyNotice: {
      title: 'Your Code Stays Local',
      description: 'All repository content is stored in your browser\'s IndexedDB. No code is ever uploaded to ORIZON servers or stored in the cloud.',
      features: [
        'Data stored only on YOUR device',
        'No cloud upload of your code',
        'Clear cache anytime',
        'Offline access to cached repos'
      ]
    }
  };
}
