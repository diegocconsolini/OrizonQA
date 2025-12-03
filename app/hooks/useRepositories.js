/**
 * useRepositories Hook
 *
 * React hook for managing GitHub repositories via OAuth connection.
 * Integrates with IndexedDB for local caching.
 *
 * PRIVACY NOTICE:
 * - Repository metadata is fetched via GitHub OAuth
 * - File contents are stored LOCALLY in IndexedDB only
 * - NO code is ever uploaded to ORIZON servers
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import useIndexedDB from './useIndexedDB';

export default function useRepositories() {
  const { data: session } = useSession();
  const userId = session?.user?.id || 'anonymous';

  // State
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [fileTree, setFileTree] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // IndexedDB integration
  const {
    cacheRepository,
    getCachedFiles,
    getCachedBranches,
    cacheBranches,
    cachedRepos,
    isRepoCached,
    privacyNotice
  } = useIndexedDB(userId);

  /**
   * Check for GitHub OAuth connection
   */
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/oauth/connections');
      if (response.ok) {
        const data = await response.json();
        const githubConnection = data.connections?.find(c => c.provider === 'github');
        if (githubConnection) {
          setConnection(githubConnection);
          setIsConnected(true);
          return githubConnection;
        }
      }
      setIsConnected(false);
      return null;
    } catch (err) {
      console.error('Failed to check GitHub connection:', err);
      setIsConnected(false);
      return null;
    }
  }, []);

  /**
   * Fetch repositories from GitHub via OAuth
   */
  const fetchRepositories = useCallback(async (options = {}) => {
    if (!connection) {
      setError('Please connect your GitHub account first');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        connectionId: connection.id.toString(),
        page: (options.page || 1).toString(),
        perPage: (options.perPage || 50).toString(),
        sort: options.sort || 'updated',
        visibility: options.visibility || 'all'
      });

      const response = await fetch(`/api/oauth/github/repositories?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      const repos = data.repositories || [];

      // Mark which repos are cached
      const reposWithCacheStatus = await Promise.all(
        repos.map(async (repo) => ({
          ...repo,
          isCached: await isRepoCached(repo.owner, repo.name)
        }))
      );

      setRepositories(reposWithCacheStatus);
      return reposWithCacheStatus;
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [connection, isRepoCached]);

  /**
   * Fetch branches for a repository
   */
  const fetchBranches = useCallback(async (owner, name) => {
    if (!connection) return [];

    try {
      // Check cache first
      const cachedBranches = await getCachedBranches(owner, name);
      if (cachedBranches.length > 0) {
        setBranches(cachedBranches);
        // Set default branch
        const defaultBranch = cachedBranches.find(b => b === 'main' || b === 'master') || cachedBranches[0];
        setSelectedBranch(defaultBranch);
        return cachedBranches;
      }

      // Fetch from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${name}/branches`,
        {
          headers: {
            'Accept': 'application/vnd.github+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const data = await response.json();
      const branchNames = data.map(b => b.name);

      // Cache branches
      await cacheBranches(owner, name, branchNames);

      setBranches(branchNames);

      // Set default branch
      const defaultBranch = branchNames.find(b => b === 'main' || b === 'master') || branchNames[0];
      setSelectedBranch(defaultBranch);

      return branchNames;
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError(err.message);
      return [];
    }
  }, [connection, getCachedBranches, cacheBranches]);

  /**
   * Fetch file tree for a repository
   * Uses OAuth connection for private repos, public API for public repos
   */
  const fetchFileTree = useCallback(async (owner, name, branch = 'main') => {
    try {
      setLoadingFiles(true);
      setError(null);

      let response;

      // Try to use authenticated API via our backend if we have a connection
      if (connection?.id) {
        response = await fetch(
          `/api/oauth/github/tree?connectionId=${connection.id}&owner=${owner}&repo=${name}&branch=${branch}`
        );
      } else {
        // Fallback to public GitHub API (only works for public repos)
        response = await fetch(
          `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
          {
            headers: {
              'Accept': 'application/vnd.github+json'
            }
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch repository file tree');
      }

      const data = await response.json();

      // Filter and transform tree
      const tree = data.tree
        .filter(item => {
          // Exclude common non-code directories
          const excludedPaths = [
            'node_modules/', '.git/', '__pycache__/', '.next/',
            'dist/', 'build/', 'coverage/', '.cache/',
            'vendor/', '.idea/', '.vscode/'
          ];
          return !excludedPaths.some(excluded => item.path.includes(excluded));
        })
        .map(item => ({
          path: item.path,
          name: item.path.split('/').pop(),
          type: item.type, // 'blob' = file, 'tree' = directory
          sha: item.sha,
          size: item.size || 0
        }));

      // Build hierarchical tree structure
      const hierarchicalTree = buildFileTree(tree);
      setFileTree(hierarchicalTree);

      return hierarchicalTree;
    } catch (err) {
      console.error('Failed to fetch file tree:', err);
      setError(err.message);
      return [];
    } finally {
      setLoadingFiles(false);
    }
  }, [connection]);

  /**
   * Fetch file contents for selected files
   * Uses authenticated API endpoint for private repos, falls back to raw.githubusercontent.com for public
   */
  const fetchFileContents = useCallback(async (owner, name, branch, filePaths) => {
    try {
      setLoadingFiles(true);
      setError(null);

      const acceptedTypes = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb',
        '.php', '.cs', '.cpp', '.c', '.h', '.rs', '.swift', '.kt',
        '.scala', '.sql', '.html', '.css', '.scss', '.json', '.yaml',
        '.yml', '.xml', '.md', '.sh', '.bash', '.zsh'
      ];

      // Filter to only code files
      const codeFiles = filePaths.filter(path =>
        acceptedTypes.some(ext => path.toLowerCase().endsWith(ext)) ||
        path.includes('Dockerfile') ||
        path.includes('Makefile')
      );

      if (codeFiles.length === 0) {
        return [];
      }

      let validContents = [];
      const BATCH_SIZE = 50; // API limit per request

      // Use authenticated API if we have a connection (required for private repos)
      if (connection?.id) {
        try {
          // Batch files into chunks of BATCH_SIZE
          const batches = [];
          for (let i = 0; i < codeFiles.length; i += BATCH_SIZE) {
            batches.push(codeFiles.slice(i, i + BATCH_SIZE));
          }

          // Fetch all batches in parallel
          const batchResults = await Promise.all(
            batches.map(async (batch) => {
              const response = await fetch('/api/oauth/github/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  connectionId: connection.id,
                  owner,
                  repo: name,
                  branch,
                  paths: batch
                })
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch file contents');
              }

              return response.json();
            })
          );

          // Combine results from all batches
          const allFiles = [];
          const allFailed = [];

          for (const data of batchResults) {
            if (data.files) allFiles.push(...data.files);
            if (data.failed) allFailed.push(...data.failed);
          }

          // Transform response to expected format
          validContents = allFiles
            .filter(file => file.content && file.content.length <= 500000) // Skip >500KB
            .map(file => ({
              path: file.path,
              name: file.path.split('/').pop(),
              content: file.content,
              size: file.size || file.content.length,
              branch
            }));

          // Log any failed files
          if (allFailed.length > 0) {
            console.warn('Some files failed to fetch:', allFailed);
          }
        } catch (err) {
          console.error('Authenticated fetch failed, trying public API:', err);
          // Fall through to public API for public repos
        }
      }

      // Fallback to public raw.githubusercontent.com (only works for public repos)
      if (validContents.length === 0) {
        const contents = await Promise.all(
          codeFiles.map(async (filePath) => {
            try {
              const response = await fetch(
                `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${filePath}`
              );

              if (!response.ok) return null;

              const content = await response.text();

              // Skip files that are too large (>500KB)
              if (content.length > 500000) return null;

              return {
                path: filePath,
                name: filePath.split('/').pop(),
                content,
                size: content.length,
                branch
              };
            } catch (err) {
              console.error(`Failed to fetch ${filePath}:`, err);
              return null;
            }
          })
        );

        validContents = contents.filter(Boolean);
      }

      // Cache to IndexedDB
      if (validContents.length > 0) {
        await cacheRepository(
          { owner, name, full_name: `${owner}/${name}` },
          validContents,
          branch
        );
      }

      return validContents;
    } catch (err) {
      console.error('Failed to fetch file contents:', err);
      setError(err.message);
      return [];
    } finally {
      setLoadingFiles(false);
    }
  }, [connection, cacheRepository]);

  /**
   * Select a repository
   */
  const selectRepository = useCallback(async (repo) => {
    setSelectedRepo(repo);
    setSelectedFiles([]);
    setFileTree([]);

    if (repo) {
      // Fetch branches first
      await fetchBranches(repo.owner, repo.name);
      // Then fetch file tree
      await fetchFileTree(repo.owner, repo.name, repo.default_branch || 'main');
    }
  }, [fetchBranches, fetchFileTree]);

  /**
   * Change selected branch
   */
  const changeBranch = useCallback(async (branch) => {
    setSelectedBranch(branch);
    setSelectedFiles([]);

    if (selectedRepo) {
      await fetchFileTree(selectedRepo.owner, selectedRepo.name, branch);
    }
  }, [selectedRepo, fetchFileTree]);

  /**
   * Toggle file selection
   */
  const toggleFileSelection = useCallback((filePath) => {
    setSelectedFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  }, []);

  /**
   * Select all code files
   */
  const selectAllCodeFiles = useCallback(() => {
    const acceptedTypes = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb',
      '.php', '.cs', '.cpp', '.c', '.rs', '.swift', '.kt', '.scala'
    ];

    const codeFiles = flattenTree(fileTree)
      .filter(item => item.type === 'blob')
      .filter(item => acceptedTypes.some(ext => item.path.endsWith(ext)))
      .map(item => item.path);

    setSelectedFiles(codeFiles);
  }, [fileTree]);

  /**
   * Select files by pattern (glob-like)
   */
  const selectByPattern = useCallback((pattern) => {
    // Simple pattern matching (e.g., "src/**/*.js")
    const regex = patternToRegex(pattern);

    const matchingFiles = flattenTree(fileTree)
      .filter(item => item.type === 'blob')
      .filter(item => regex.test(item.path))
      .map(item => item.path);

    setSelectedFiles(matchingFiles);
  }, [fileTree]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  /**
   * Get files ready for analysis
   */
  const getFilesForAnalysis = useCallback(async () => {
    if (!selectedRepo || selectedFiles.length === 0) {
      return [];
    }

    // Fetch content for selected files
    const files = await fetchFileContents(
      selectedRepo.owner,
      selectedRepo.name,
      selectedBranch,
      selectedFiles
    );

    return files;
  }, [selectedRepo, selectedBranch, selectedFiles, fetchFileContents]);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Fetch repos when connection is established
  useEffect(() => {
    if (isConnected && connection) {
      fetchRepositories();
    }
  }, [isConnected, connection, fetchRepositories]);

  return {
    // Connection state
    isConnected,
    connection,
    checkConnection,

    // Repository state
    repositories,
    selectedRepo,
    selectRepository,
    loading,
    error,

    // Branch state
    branches,
    selectedBranch,
    changeBranch,

    // File tree state
    fileTree,
    loadingFiles,

    // File selection
    selectedFiles,
    toggleFileSelection,
    selectAllCodeFiles,
    selectByPattern,
    clearSelection,

    // Actions
    fetchRepositories,
    getFilesForAnalysis,

    // Cache info
    cachedRepos,

    // Privacy
    privacyNotice
  };
}

/**
 * Build hierarchical tree from flat file list
 */
function buildFileTree(flatTree) {
  const root = { children: {} };

  flatTree.forEach(item => {
    const parts = item.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: index === parts.length - 1 ? item.type : 'tree',
          sha: index === parts.length - 1 ? item.sha : null,
          size: index === parts.length - 1 ? item.size : 0,
          children: {}
        };
      }
      current = current.children[part];
    });
  });

  // Convert to array format
  function toArray(node) {
    const children = Object.values(node.children).map(child => ({
      ...child,
      children: Object.keys(child.children).length > 0 ? toArray(child) : undefined
    }));

    // Sort: directories first, then files, alphabetically
    return children.sort((a, b) => {
      if (a.type === 'tree' && b.type !== 'tree') return -1;
      if (a.type !== 'tree' && b.type === 'tree') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return toArray(root);
}

/**
 * Flatten tree back to array
 */
function flattenTree(tree, result = []) {
  tree.forEach(item => {
    result.push(item);
    if (item.children) {
      flattenTree(item.children, result);
    }
  });
  return result;
}

/**
 * Convert glob pattern to regex
 */
function patternToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{GLOBSTAR}}/g, '.*');

  return new RegExp(`^${escaped}$`);
}
