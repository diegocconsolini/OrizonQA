/**
 * IndexedDB Storage Layer for Repository Content
 *
 * PRIVACY NOTICE:
 * All repository content is stored LOCALLY in your browser's IndexedDB.
 * NO code or repository data is ever sent to ORIZON servers or stored in the cloud.
 * Your code stays on YOUR device.
 *
 * Features:
 * - Store fetched repository files locally
 * - Cache repository metadata
 * - Offline access to previously fetched repos
 * - Automatic cleanup of old data
 * - Storage quota management
 */

const DB_NAME = 'orizon_repository_cache';
const DB_VERSION = 1;

// Store names
const STORES = {
  REPOSITORIES: 'repositories',      // Repository metadata
  FILES: 'files',                    // File contents
  BRANCHES: 'branches',              // Branch information
  FETCH_HISTORY: 'fetch_history'     // When repos were last fetched
};

/**
 * Open/create the IndexedDB database
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB: ' + request.error?.message));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Repositories store - metadata about fetched repos
      if (!db.objectStoreNames.contains(STORES.REPOSITORIES)) {
        const repoStore = db.createObjectStore(STORES.REPOSITORIES, { keyPath: 'id' });
        repoStore.createIndex('fullName', 'fullName', { unique: true });
        repoStore.createIndex('userId', 'userId', { unique: false });
        repoStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      }

      // Files store - actual file contents
      if (!db.objectStoreNames.contains(STORES.FILES)) {
        const fileStore = db.createObjectStore(STORES.FILES, { keyPath: 'id' });
        fileStore.createIndex('repoId', 'repoId', { unique: false });
        fileStore.createIndex('path', 'path', { unique: false });
        fileStore.createIndex('repoPath', ['repoId', 'path'], { unique: true });
      }

      // Branches store - branch info per repo
      if (!db.objectStoreNames.contains(STORES.BRANCHES)) {
        const branchStore = db.createObjectStore(STORES.BRANCHES, { keyPath: 'id' });
        branchStore.createIndex('repoId', 'repoId', { unique: false });
      }

      // Fetch history - track when data was fetched
      if (!db.objectStoreNames.contains(STORES.FETCH_HISTORY)) {
        const historyStore = db.createObjectStore(STORES.FETCH_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('repoId', 'repoId', { unique: false });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save repository metadata to IndexedDB
 */
export async function saveRepository(repo) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REPOSITORIES], 'readwrite');
    const store = transaction.objectStore(STORES.REPOSITORIES);

    const repoData = {
      id: `${repo.owner}_${repo.name}`,
      fullName: repo.full_name || `${repo.owner}/${repo.name}`,
      owner: repo.owner,
      name: repo.name,
      private: repo.private || false,
      description: repo.description || '',
      defaultBranch: repo.default_branch || 'main',
      language: repo.language || 'Unknown',
      stars: repo.stars || 0,
      url: repo.url || repo.html_url,
      userId: repo.userId || 'anonymous',
      lastAccessed: new Date().toISOString(),
      createdAt: repo.createdAt || new Date().toISOString()
    };

    const request = store.put(repoData);
    request.onsuccess = () => resolve(repoData);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get repository metadata from IndexedDB
 */
export async function getRepository(repoId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REPOSITORIES], 'readonly');
    const store = transaction.objectStore(STORES.REPOSITORIES);
    const request = store.get(repoId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all cached repositories for a user
 */
export async function getUserRepositories(userId = 'anonymous') {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REPOSITORIES], 'readonly');
    const store = transaction.objectStore(STORES.REPOSITORIES);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      // Sort by lastAccessed descending
      const repos = request.result || [];
      repos.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
      resolve(repos);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save file content to IndexedDB
 */
export async function saveFile(repoId, file) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.FILES], 'readwrite');
    const store = transaction.objectStore(STORES.FILES);

    const fileData = {
      id: `${repoId}_${file.path}`,
      repoId: repoId,
      path: file.path,
      name: file.name || file.path.split('/').pop(),
      content: file.content,
      size: file.content?.length || 0,
      language: detectLanguage(file.path),
      sha: file.sha || null,
      branch: file.branch || 'main',
      fetchedAt: new Date().toISOString()
    };

    const request = store.put(fileData);
    request.onsuccess = () => resolve(fileData);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save multiple files at once (batch operation)
 */
export async function saveFiles(repoId, files, branch = 'main') {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.FILES], 'readwrite');
    const store = transaction.objectStore(STORES.FILES);
    const saved = [];

    files.forEach(file => {
      const fileData = {
        id: `${repoId}_${file.path || file.name}`,
        repoId: repoId,
        path: file.path || file.name,
        name: file.name || (file.path ? file.path.split('/').pop() : 'unknown'),
        content: file.content,
        size: file.content?.length || 0,
        language: detectLanguage(file.path || file.name),
        sha: file.sha || null,
        branch: branch,
        fetchedAt: new Date().toISOString()
      };
      store.put(fileData);
      saved.push(fileData);
    });

    transaction.oncomplete = () => resolve(saved);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Get file content from IndexedDB
 */
export async function getFile(repoId, filePath) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.FILES], 'readonly');
    const store = transaction.objectStore(STORES.FILES);
    const request = store.get(`${repoId}_${filePath}`);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all files for a repository
 */
export async function getRepositoryFiles(repoId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.FILES], 'readonly');
    const store = transaction.objectStore(STORES.FILES);
    const index = store.index('repoId');
    const request = index.getAll(repoId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save branch information
 */
export async function saveBranches(repoId, branches) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BRANCHES], 'readwrite');
    const store = transaction.objectStore(STORES.BRANCHES);

    const branchData = {
      id: `${repoId}_branches`,
      repoId: repoId,
      branches: branches,
      fetchedAt: new Date().toISOString()
    };

    const request = store.put(branchData);
    request.onsuccess = () => resolve(branchData);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get branches for a repository
 */
export async function getBranches(repoId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BRANCHES], 'readonly');
    const store = transaction.objectStore(STORES.BRANCHES);
    const request = store.get(`${repoId}_branches`);

    request.onsuccess = () => resolve(request.result?.branches || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Record a fetch operation
 */
export async function recordFetch(repoId, branch, fileCount) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.FETCH_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORES.FETCH_HISTORY);

    const historyEntry = {
      id: `${repoId}_${Date.now()}`,
      repoId: repoId,
      branch: branch,
      fileCount: fileCount,
      timestamp: new Date().toISOString()
    };

    const request = store.put(historyEntry);
    request.onsuccess = () => resolve(historyEntry);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete repository and all its files from cache
 */
export async function deleteRepository(repoId) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.REPOSITORIES, STORES.FILES, STORES.BRANCHES, STORES.FETCH_HISTORY],
      'readwrite'
    );

    // Delete repository
    transaction.objectStore(STORES.REPOSITORIES).delete(repoId);

    // Delete all files for this repo
    const fileStore = transaction.objectStore(STORES.FILES);
    const fileIndex = fileStore.index('repoId');
    const fileRequest = fileIndex.openCursor(IDBKeyRange.only(repoId));

    fileRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete branches
    transaction.objectStore(STORES.BRANCHES).delete(`${repoId}_branches`);

    // Delete fetch history
    const historyStore = transaction.objectStore(STORES.FETCH_HISTORY);
    const historyIndex = historyStore.index('repoId');
    const historyRequest = historyIndex.openCursor(IDBKeyRange.only(repoId));

    historyRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Clear all cached data
 */
export async function clearAllCache() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.REPOSITORIES, STORES.FILES, STORES.BRANCHES, STORES.FETCH_HISTORY],
      'readwrite'
    );

    transaction.objectStore(STORES.REPOSITORIES).clear();
    transaction.objectStore(STORES.FILES).clear();
    transaction.objectStore(STORES.BRANCHES).clear();
    transaction.objectStore(STORES.FETCH_HISTORY).clear();

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats() {
  const db = await openDatabase();

  const stats = {
    repositories: 0,
    files: 0,
    totalSize: 0,
    oldestFetch: null,
    newestFetch: null
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.REPOSITORIES, STORES.FILES, STORES.FETCH_HISTORY],
      'readonly'
    );

    // Count repositories
    const repoRequest = transaction.objectStore(STORES.REPOSITORIES).count();
    repoRequest.onsuccess = () => {
      stats.repositories = repoRequest.result;
    };

    // Count and measure files
    const fileStore = transaction.objectStore(STORES.FILES);
    const fileRequest = fileStore.openCursor();

    fileRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        stats.files++;
        stats.totalSize += cursor.value.size || 0;
        cursor.continue();
      }
    };

    // Get fetch history range
    const historyStore = transaction.objectStore(STORES.FETCH_HISTORY);
    const historyIndex = historyStore.index('timestamp');

    const oldestRequest = historyIndex.openCursor(null, 'next');
    oldestRequest.onsuccess = (event) => {
      if (event.target.result) {
        stats.oldestFetch = event.target.result.value.timestamp;
      }
    };

    const newestRequest = historyIndex.openCursor(null, 'prev');
    newestRequest.onsuccess = (event) => {
      if (event.target.result) {
        stats.newestFetch = event.target.result.value.timestamp;
      }
    };

    transaction.oncomplete = () => resolve(stats);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Clean up old cached data (older than specified days)
 */
export async function cleanupOldData(daysOld = 30) {
  const db = await openDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffISO = cutoffDate.toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.REPOSITORIES], 'readwrite');
    const store = transaction.objectStore(STORES.REPOSITORIES);
    const index = store.index('lastAccessed');

    const range = IDBKeyRange.upperBound(cutoffISO);
    const request = index.openCursor(range);

    const deletedRepos = [];

    request.onsuccess = async (event) => {
      const cursor = event.target.result;
      if (cursor) {
        deletedRepos.push(cursor.value.id);
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = async () => {
      // Delete files for deleted repos
      for (const repoId of deletedRepos) {
        await deleteRepository(repoId);
      }
      resolve({ deleted: deletedRepos.length, repos: deletedRepos });
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Detect programming language from file extension
 */
function detectLanguage(filePath) {
  if (!filePath) return 'plaintext';

  const ext = filePath.split('.').pop()?.toLowerCase();

  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    makefile: 'makefile'
  };

  return languageMap[ext] || 'plaintext';
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable() {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

export default {
  openDatabase,
  saveRepository,
  getRepository,
  getUserRepositories,
  saveFile,
  saveFiles,
  getFile,
  getRepositoryFiles,
  saveBranches,
  getBranches,
  recordFetch,
  deleteRepository,
  clearAllCache,
  getStorageStats,
  cleanupOldData,
  isIndexedDBAvailable
};
