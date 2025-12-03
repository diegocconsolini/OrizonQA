/**
 * Content Preparer for Large Repository Analysis
 *
 * CORE PRINCIPLE: 100% FILE COVERAGE
 * All selected files MUST be analyzed. No sampling. No truncation.
 * If content exceeds single API call limit, split into multiple chunks.
 */

// Maximum characters per chunk (~80K chars ≈ 20K tokens)
const CHUNK_SIZE = 80000;

// Token estimation (rough: 1 token ≈ 4 chars for code)
const CHARS_PER_TOKEN = 4;

// Claude model pricing (per 1M tokens) - Sonnet 4
const PRICING = {
  input: 3.00,   // $3 per 1M input tokens
  output: 15.00  // $15 per 1M output tokens
};

/**
 * Priority weights for file ordering within chunks.
 * Higher priority files are analyzed first, ensuring key files
 * get full context even in multi-pass analysis.
 */
const PRIORITY_WEIGHTS = {
  // Entry points (highest priority)
  'package.json': 100,
  'README.md': 95,
  'index.js': 90,
  'index.ts': 90,
  'main.js': 90,
  'main.ts': 90,
  'app.js': 88,
  'app.ts': 88,

  // Configuration
  'tsconfig.json': 80,
  'next.config.js': 78,
  'next.config.mjs': 78,
  '.env.example': 75,

  // Core paths
  '/src/': 70,
  '/lib/': 70,
  '/app/': 70,
  '/pages/': 68,

  // API routes
  '/api/': 65,

  // Components
  '/components/': 60,

  // Hooks and utilities
  '/hooks/': 55,
  '/utils/': 55,
  '/helpers/': 55,

  // Tests (lower priority for QA generation - we're generating tests, not analyzing them)
  '/test/': 30,
  '/__tests__/': 30,
  '/tests/': 30,
  '.test.': 25,
  '.spec.': 25,

  // Config/build (lowest)
  '/config/': 20,
  '.config.': 15,
  '/scripts/': 15,
};

/**
 * Calculate priority score for a file based on its path
 */
function calculatePriority(filePath) {
  let score = 50; // Default priority

  for (const [pattern, weight] of Object.entries(PRIORITY_WEIGHTS)) {
    if (filePath.includes(pattern) || filePath.endsWith(pattern)) {
      score = Math.max(score, weight);
    }
  }

  return score;
}

/**
 * Prioritize files by importance for analysis
 */
export function prioritizeFiles(files) {
  return files
    .map(file => ({
      ...file,
      priority: calculatePriority(file.path)
    }))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Split files into chunks while keeping related files together.
 * Groups files by directory first, then splits by size.
 *
 * @param {Array} files - Array of file objects with path and content
 * @param {number} maxSize - Maximum characters per chunk
 * @returns {Array} Array of file arrays (chunks)
 */
function splitIntoChunks(files, maxSize = CHUNK_SIZE) {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  // Sort by path to keep related files together
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const fileSize = file.content?.length || 0;

    // If this file alone exceeds max size, it still gets its own chunk
    // (we never skip files - 100% coverage)
    if (fileSize > maxSize) {
      // Save current chunk if not empty
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      // Large file gets its own chunk
      chunks.push([file]);
      continue;
    }

    // If adding this file would exceed limit, start a new chunk
    if (currentSize + fileSize > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(file);
    currentSize += fileSize;
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Estimate token count from character count
 */
function estimateTokens(chars) {
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

/**
 * Estimate cost for analysis
 *
 * @param {number} inputTokens - Estimated input tokens
 * @param {number} outputTokensPerChunk - Estimated output tokens per chunk (default ~4K)
 * @param {number} numChunks - Number of chunks
 * @returns {object} Cost breakdown
 */
function estimateCost(inputTokens, outputTokensPerChunk = 4000, numChunks = 1) {
  // Synthesis pass adds ~50% more input (chunk results) and same output
  const synthesisInputTokens = numChunks > 1 ? outputTokensPerChunk * numChunks * 0.5 : 0;
  const synthesisOutputTokens = numChunks > 1 ? outputTokensPerChunk : 0;

  const totalInputTokens = inputTokens + synthesisInputTokens;
  const totalOutputTokens = (outputTokensPerChunk * numChunks) + synthesisOutputTokens;

  const inputCost = (totalInputTokens / 1000000) * PRICING.input;
  const outputCost = (totalOutputTokens / 1000000) * PRICING.output;

  return {
    inputTokens: Math.round(totalInputTokens),
    outputTokens: Math.round(totalOutputTokens),
    totalTokens: Math.round(totalInputTokens + totalOutputTokens),
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: (inputCost + outputCost).toFixed(4),
    formattedCost: `$${(inputCost + outputCost).toFixed(2)}`
  };
}

/**
 * Get directory summary for a chunk
 */
function getChunkSummary(files) {
  const dirs = new Map();

  for (const file of files) {
    const parts = file.path.split('/');
    const topDir = parts.length > 1 ? parts[0] : '(root)';
    dirs.set(topDir, (dirs.get(topDir) || 0) + 1);
  }

  // Get top 3 directories
  const sorted = [...dirs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([dir, count]) => `${dir}/ (${count})`).join(', ');
}

/**
 * Calculate total size of files
 */
function calculateTotalSize(files) {
  return files.reduce((sum, f) => sum + (f.content?.length || 0), 0);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Main function: Prepare content for analysis with 100% coverage
 *
 * @param {Array} files - Array of file objects with path and content
 * @param {object} config - Analysis configuration
 * @returns {object} Prepared content with strategy and chunks
 */
export function prepareContent(files, config = {}) {
  if (!files || files.length === 0) {
    return {
      strategy: 'empty',
      chunks: [],
      totalChunks: 0,
      totalFiles: 0,
      totalSize: 0,
      coverage: '0%',
      estimatedTokens: 0,
      estimatedCost: estimateCost(0, 0, 0)
    };
  }

  // Prioritize files
  const prioritizedFiles = prioritizeFiles(files);

  // Calculate total size
  const totalSize = calculateTotalSize(prioritizedFiles);
  const totalTokens = estimateTokens(totalSize);

  // Single pass if all files fit
  if (totalSize < CHUNK_SIZE) {
    return {
      strategy: 'single',
      chunks: [prioritizedFiles],
      totalChunks: 1,
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      coverage: '100%',
      estimatedTokens: totalTokens,
      estimatedCost: estimateCost(totalTokens, 4000, 1),
      chunkDetails: [{
        index: 0,
        files: prioritizedFiles.length,
        size: totalSize,
        sizeFormatted: formatBytes(totalSize),
        summary: getChunkSummary(prioritizedFiles)
      }]
    };
  }

  // Multi-pass: split ALL files into chunks (100% coverage)
  const chunks = splitIntoChunks(prioritizedFiles, CHUNK_SIZE);

  // Generate chunk details
  const chunkDetails = chunks.map((chunk, index) => {
    const chunkSize = calculateTotalSize(chunk);
    return {
      index,
      files: chunk.length,
      size: chunkSize,
      sizeFormatted: formatBytes(chunkSize),
      summary: getChunkSummary(chunk),
      filePaths: chunk.map(f => f.path)
    };
  });

  return {
    strategy: 'multi',
    chunks,
    totalChunks: chunks.length,
    totalFiles: files.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    coverage: '100%', // ALL files will be analyzed
    estimatedTokens: totalTokens,
    estimatedCost: estimateCost(totalTokens, 4000, chunks.length),
    chunkDetails,
    // +1 for synthesis pass
    totalPasses: chunks.length + 1
  };
}

/**
 * Format content for a single chunk for the AI prompt
 *
 * @param {Array} files - Array of file objects in this chunk
 * @param {number} chunkIndex - Index of this chunk (0-based)
 * @param {number} totalChunks - Total number of chunks
 * @returns {string} Formatted content string
 */
export function formatChunkContent(files, chunkIndex = 0, totalChunks = 1) {
  const lines = [];

  if (totalChunks > 1) {
    lines.push(`[Analysis Batch ${chunkIndex + 1} of ${totalChunks}]`);
    lines.push(`Files in this batch: ${files.length}`);
    lines.push('');
  }

  for (const file of files) {
    lines.push(`=== FILE: ${file.path} ===`);
    lines.push(file.content || '(empty file)');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get analysis plan summary for UI display
 */
export function getAnalysisPlan(files, config = {}) {
  const prepared = prepareContent(files, config);

  return {
    totalFiles: prepared.totalFiles,
    totalSize: prepared.totalSizeFormatted,
    coverage: prepared.coverage,
    strategy: prepared.strategy,
    passes: prepared.strategy === 'single' ? 1 : prepared.totalPasses,
    chunks: prepared.chunkDetails || [],
    estimatedTokens: prepared.estimatedTokens,
    estimatedCost: prepared.estimatedCost.formattedCost,
    costBreakdown: prepared.estimatedCost
  };
}

export default {
  prepareContent,
  prioritizeFiles,
  formatChunkContent,
  getAnalysisPlan,
  CHUNK_SIZE,
  PRICING
};
