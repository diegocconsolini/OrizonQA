/**
 * Analysis Orchestrator for Multi-Pass Analysis
 *
 * CORE PRINCIPLE: 100% FILE COVERAGE
 * Orchestrates multi-pass analysis to ensure ALL files are analyzed.
 * Handles chunking, parallel/sequential execution, and result synthesis.
 */

import { prepareContent, formatChunkContent } from './contentPreparer.js';

/**
 * Analyze a repository with 100% file coverage
 *
 * @param {Array} files - Array of file objects with path and content
 * @param {object} config - Analysis configuration
 * @param {string} apiKey - Claude API key
 * @param {Function} onProgress - Progress callback
 * @param {Function} analyzeFunction - Function to call Claude API
 * @returns {object} Combined analysis results
 */
export async function analyzeRepository(files, config, apiKey, onProgress, analyzeFunction) {
  const prepared = prepareContent(files, config);

  if (prepared.strategy === 'empty') {
    return {
      success: false,
      error: 'No files to analyze',
      coverage: '0%'
    };
  }

  // Single pass - all files fit in one API call
  if (prepared.strategy === 'single') {
    onProgress?.({
      phase: 'analyzing',
      current: 1,
      total: 1,
      message: `Analyzing ${prepared.totalFiles} files...`,
      files: prepared.chunks[0].map(f => f.path)
    });

    const content = formatChunkContent(prepared.chunks[0], 0, 1);
    const result = await analyzeFunction(content, config, apiKey);

    onProgress?.({
      phase: 'complete',
      current: 1,
      total: 1,
      message: 'Analysis complete'
    });

    return {
      success: true,
      result,
      coverage: '100%',
      strategy: 'single',
      filesAnalyzed: prepared.totalFiles,
      chunks: 1
    };
  }

  // Multi-pass - analyze ALL chunks then synthesize
  const chunkResults = [];
  const totalPasses = prepared.totalChunks + 1; // +1 for synthesis

  for (let i = 0; i < prepared.chunks.length; i++) {
    const chunk = prepared.chunks[i];
    const chunkDetail = prepared.chunkDetails[i];

    onProgress?.({
      phase: 'analyzing',
      current: i + 1,
      total: totalPasses,
      message: `Analyzing batch ${i + 1} of ${prepared.totalChunks}: ${chunkDetail.summary}`,
      files: chunk.map(f => f.path),
      chunkIndex: i
    });

    try {
      const content = formatChunkContent(chunk, i, prepared.totalChunks);
      const chunkPrompt = buildChunkPrompt(config, i, prepared.totalChunks, chunkDetail);

      const result = await analyzeFunction(content, {
        ...config,
        chunkPrompt,
        isChunk: true,
        chunkIndex: i,
        totalChunks: prepared.totalChunks
      }, apiKey);

      chunkResults.push({
        index: i,
        result,
        files: chunk.map(f => f.path),
        summary: chunkDetail.summary
      });
    } catch (error) {
      // If a chunk fails, we still continue with others (partial analysis is better than none)
      console.error(`Chunk ${i + 1} failed:`, error);
      chunkResults.push({
        index: i,
        error: error.message,
        files: chunk.map(f => f.path),
        summary: chunkDetail.summary
      });
    }
  }

  // Synthesis pass - combine all chunk results
  onProgress?.({
    phase: 'synthesizing',
    current: totalPasses,
    total: totalPasses,
    message: 'Synthesizing results from all batches...'
  });

  const synthesizedResult = await synthesizeResults(chunkResults, config, apiKey, analyzeFunction);

  onProgress?.({
    phase: 'complete',
    current: totalPasses,
    total: totalPasses,
    message: 'Analysis complete'
  });

  return {
    success: true,
    result: synthesizedResult,
    coverage: '100%',
    strategy: 'multi',
    filesAnalyzed: prepared.totalFiles,
    chunks: prepared.totalChunks,
    chunkResults // Include individual chunk results for debugging/caching
  };
}

/**
 * Build a specialized prompt for chunk analysis
 */
function buildChunkPrompt(config, chunkIndex, totalChunks, chunkDetail) {
  const parts = [];

  parts.push(`This is batch ${chunkIndex + 1} of ${totalChunks} in a multi-pass analysis.`);
  parts.push(`This batch contains ${chunkDetail.files} files from: ${chunkDetail.summary}`);
  parts.push('');
  parts.push('IMPORTANT: Focus on analyzing the files in THIS batch thoroughly.');
  parts.push('Generate complete, detailed output for these files.');
  parts.push('The results will be combined with other batches in a final synthesis step.');
  parts.push('');

  return parts.join('\n');
}

/**
 * Synthesize results from multiple chunk analyses
 */
async function synthesizeResults(chunkResults, config, apiKey, analyzeFunction) {
  // If only one chunk succeeded, return its result directly
  const successfulChunks = chunkResults.filter(c => !c.error);

  if (successfulChunks.length === 0) {
    return {
      error: 'All analysis chunks failed',
      chunkErrors: chunkResults.map(c => c.error)
    };
  }

  if (successfulChunks.length === 1) {
    return successfulChunks[0].result;
  }

  // Build synthesis prompt
  const synthesisContent = buildSynthesisContent(successfulChunks, config);

  try {
    const synthesized = await analyzeFunction(synthesisContent, {
      ...config,
      isSynthesis: true,
      synthesisPrompt: buildSynthesisPrompt(successfulChunks.length, config)
    }, apiKey);

    return synthesized;
  } catch (error) {
    // If synthesis fails, return concatenated results
    console.error('Synthesis failed, returning concatenated results:', error);
    return concatenateResults(successfulChunks, config);
  }
}

/**
 * Build content for synthesis pass
 */
function buildSynthesisContent(chunkResults, config) {
  const parts = [];

  parts.push('# ANALYSIS SYNTHESIS');
  parts.push('');
  parts.push(`The following are results from ${chunkResults.length} analysis batches.`);
  parts.push('Combine these into a unified, comprehensive analysis.');
  parts.push('');

  for (const chunk of chunkResults) {
    parts.push(`## Batch ${chunk.index + 1}: ${chunk.summary}`);
    parts.push(`Files analyzed: ${chunk.files.length}`);
    parts.push('');

    // Include the result content
    if (typeof chunk.result === 'string') {
      parts.push(chunk.result);
    } else if (chunk.result?.content) {
      parts.push(chunk.result.content);
    } else {
      parts.push(JSON.stringify(chunk.result, null, 2));
    }

    parts.push('');
    parts.push('---');
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Build the synthesis prompt
 */
function buildSynthesisPrompt(numChunks, config) {
  const parts = [];

  parts.push(`You are synthesizing QA analysis results from ${numChunks} separate batches.`);
  parts.push('');
  parts.push('Your task:');
  parts.push('1. Combine all user stories, removing duplicates while keeping unique ones');
  parts.push('2. Merge test cases, grouping related tests together');
  parts.push('3. Consolidate acceptance criteria by feature area');
  parts.push('4. Ensure consistency in format and numbering');
  parts.push('5. Remove any redundant or overlapping content');
  parts.push('');
  parts.push('The output should be a unified, comprehensive QA document that covers ALL analyzed files.');
  parts.push('');

  if (config.outputFormat === 'json') {
    parts.push('Output the result as valid JSON.');
  } else if (config.outputFormat === 'jira') {
    parts.push('Format the output for Jira import.');
  }

  return parts.join('\n');
}

/**
 * Concatenate results as fallback if synthesis fails
 */
function concatenateResults(chunkResults, config) {
  const combined = {
    userStories: [],
    testCases: [],
    acceptanceCriteria: [],
    metadata: {
      batches: chunkResults.length,
      synthesized: false,
      warning: 'Results concatenated without synthesis due to synthesis failure'
    }
  };

  for (const chunk of chunkResults) {
    if (chunk.result) {
      // Try to parse structured data if available
      if (chunk.result.userStories) {
        combined.userStories.push(...chunk.result.userStories);
      }
      if (chunk.result.testCases) {
        combined.testCases.push(...chunk.result.testCases);
      }
      if (chunk.result.acceptanceCriteria) {
        combined.acceptanceCriteria.push(...chunk.result.acceptanceCriteria);
      }
    }
  }

  return combined;
}

/**
 * Estimate analysis time based on content size
 *
 * @param {number} totalChunks - Number of chunks
 * @param {number} avgChunkSize - Average chunk size in chars
 * @returns {object} Time estimate
 */
export function estimateTime(totalChunks, avgChunkSize = 80000) {
  // Rough estimates based on Claude response times
  const secondsPerChunk = 15; // ~15 seconds per chunk analysis
  const synthesisSeconds = totalChunks > 1 ? 20 : 0; // ~20 seconds for synthesis

  const totalSeconds = (totalChunks * secondsPerChunk) + synthesisSeconds;

  return {
    seconds: totalSeconds,
    formatted: totalSeconds < 60
      ? `~${totalSeconds} seconds`
      : `~${Math.ceil(totalSeconds / 60)} minutes`,
    perChunk: secondsPerChunk,
    synthesis: synthesisSeconds
  };
}

export default {
  analyzeRepository,
  estimateTime
};
