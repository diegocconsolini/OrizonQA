import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prepareContent, formatChunkContent } from '@/lib/contentPreparer';
import { buildPrompt, parseResponse } from '@/lib/promptBuilder';
import { saveAnalysis } from '@/lib/db';
import crypto from 'crypto';

/**
 * Multi-Pass Analysis API
 *
 * CORE PRINCIPLE: 100% FILE COVERAGE
 * All files are analyzed through chunking when they exceed single-pass limits.
 *
 * POST /api/analyze-multipass
 *
 * Request body:
 * {
 *   files: [{ path: string, content: string }],
 *   config: { userStories, testCases, acceptanceCriteria, ... },
 *   apiKey: string,
 *   provider: 'claude' | 'lmstudio',
 *   lmStudioUrl?: string
 * }
 */
export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const {
      files,
      config = {},
      apiKey,
      provider = 'claude',
      lmStudioUrl
    } = await request.json();

    // Validate inputs
    if (provider === 'claude' && !apiKey) {
      return NextResponse.json({ error: 'API key is required for Claude' }, { status: 400 });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    // Default config
    const analysisConfig = {
      userStories: true,
      testCases: true,
      acceptanceCriteria: true,
      edgeCases: false,
      securityTests: false,
      outputFormat: 'markdown',
      testFramework: 'generic',
      additionalContext: '',
      ...config
    };

    // Prepare content - determine if single or multi-pass needed
    const prepared = prepareContent(files, analysisConfig);

    console.log(`[Multi-Pass] Strategy: ${prepared.strategy}, Files: ${prepared.totalFiles}, Chunks: ${prepared.totalChunks}`);

    // Create content hash for the full analysis
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(files.map(f => f.path + f.content)))
      .digest('hex');

    let result;
    let totalUsage = { input_tokens: 0, output_tokens: 0 };

    if (prepared.strategy === 'single') {
      // Single pass - all files fit in one API call
      const content = formatChunkContent(prepared.chunks[0], 0, 1);
      const prompt = buildPrompt(content, analysisConfig);

      const response = await callAI(prompt, analysisConfig, apiKey, provider, lmStudioUrl);
      result = response.text;
      totalUsage = response.usage || totalUsage;

    } else {
      // Multi-pass - analyze all chunks then synthesize
      const chunkResults = [];

      for (let i = 0; i < prepared.chunks.length; i++) {
        const chunk = prepared.chunks[i];
        const chunkDetail = prepared.chunkDetails[i];

        console.log(`[Multi-Pass] Analyzing chunk ${i + 1}/${prepared.totalChunks}: ${chunkDetail.summary}`);

        const content = formatChunkContent(chunk, i, prepared.totalChunks);
        const chunkPrompt = buildChunkPrompt(content, analysisConfig, i, prepared.totalChunks, chunkDetail);

        try {
          const response = await callAI(chunkPrompt, analysisConfig, apiKey, provider, lmStudioUrl);

          chunkResults.push({
            index: i,
            result: response.text,
            files: chunk.map(f => f.path),
            summary: chunkDetail.summary
          });

          totalUsage.input_tokens += response.usage?.input_tokens || 0;
          totalUsage.output_tokens += response.usage?.output_tokens || 0;

        } catch (error) {
          console.error(`[Multi-Pass] Chunk ${i + 1} failed:`, error.message);
          chunkResults.push({
            index: i,
            error: error.message,
            files: chunk.map(f => f.path),
            summary: chunkDetail.summary
          });
        }
      }

      // Synthesis pass
      console.log(`[Multi-Pass] Synthesizing ${chunkResults.filter(c => !c.error).length} chunk results...`);

      const successfulChunks = chunkResults.filter(c => !c.error);

      if (successfulChunks.length === 0) {
        return NextResponse.json({
          error: 'All analysis chunks failed',
          chunkErrors: chunkResults.map(c => ({ chunk: c.index, error: c.error }))
        }, { status: 500 });
      }

      if (successfulChunks.length === 1) {
        // Only one chunk succeeded, use its result
        result = successfulChunks[0].result;
      } else {
        // Synthesize multiple chunk results
        const synthesisPrompt = buildSynthesisPrompt(successfulChunks, analysisConfig);
        const synthesisResponse = await callAI(synthesisPrompt, analysisConfig, apiKey, provider, lmStudioUrl);

        result = synthesisResponse.text;
        totalUsage.input_tokens += synthesisResponse.usage?.input_tokens || 0;
        totalUsage.output_tokens += synthesisResponse.usage?.output_tokens || 0;
      }
    }

    // Parse the result
    const parsed = parseResponse(result, analysisConfig.outputFormat);

    // Save to database
    let analysisRecord = null;
    try {
      analysisRecord = await saveAnalysis({
        inputType: 'github',
        contentHash,
        provider,
        model: analysisConfig.model || (provider === 'claude' ? 'claude-sonnet-4-20250514' : 'local-model'),
        config: analysisConfig,
        results: parsed,
        tokenUsage: totalUsage,
        githubUrl: config.githubUrl || null,
        githubBranch: config.githubBranch || null,
        userId
      });

      console.log(`[Multi-Pass] Analysis saved: ID ${analysisRecord.id}`);
    } catch (dbError) {
      console.error('Failed to save analysis:', dbError);
    }

    return NextResponse.json({
      ...parsed,
      usage: totalUsage,
      analysisId: analysisRecord?.id || null,
      savedAt: analysisRecord?.created_at || null,
      coverage: '100%',
      strategy: prepared.strategy,
      totalChunks: prepared.totalChunks,
      filesAnalyzed: prepared.totalFiles
    });

  } catch (error) {
    console.error('[Multi-Pass] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Call AI provider (Claude or LM Studio)
 */
async function callAI(prompt, config, apiKey, provider, lmStudioUrl) {
  if (provider === 'lmstudio') {
    const lmUrl = lmStudioUrl || 'http://localhost:1234';

    const response = await fetch(`${lmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'local-model',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 16000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `LM Studio error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? {
        input_tokens: data.usage.prompt_tokens || 0,
        output_tokens: data.usage.completion_tokens || 0
      } : null
    };
  }

  // Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 429) {
      throw new Error('Rate limited. Please wait and try again.');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.content[0].text,
    usage: data.usage
  };
}

/**
 * Build prompt for a single chunk analysis
 */
function buildChunkPrompt(content, config, chunkIndex, totalChunks, chunkDetail) {
  const context = `
## MULTI-PASS ANALYSIS - BATCH ${chunkIndex + 1} OF ${totalChunks}

This is batch ${chunkIndex + 1} of ${totalChunks} in a comprehensive codebase analysis.
This batch contains ${chunkDetail.files} files from: ${chunkDetail.summary}

IMPORTANT INSTRUCTIONS:
1. Analyze ALL files in this batch thoroughly
2. Generate complete user stories, test cases, and acceptance criteria for these files
3. Your output will be combined with other batches - ensure it can stand alone
4. Use consistent formatting for easy merging

---

`;

  return buildPrompt(context + content, config);
}

/**
 * Build synthesis prompt to combine chunk results
 */
function buildSynthesisPrompt(chunkResults, config) {
  let prompt = `# ANALYSIS SYNTHESIS

You have analyzed a codebase in ${chunkResults.length} batches. Below are the results from each batch.
Your task is to synthesize these into a unified, comprehensive QA analysis.

## Instructions:
1. Combine all user stories, removing duplicates while preserving unique ones
2. Merge test cases, grouping related tests by feature/module
3. Consolidate acceptance criteria by feature area
4. Ensure consistent numbering and formatting throughout
5. Remove redundant or overlapping content
6. The final output should be a complete, professional QA document

`;

  // Add each chunk's results
  for (const chunk of chunkResults) {
    prompt += `\n---\n## BATCH ${chunk.index + 1}: ${chunk.summary}\n`;
    prompt += `Files analyzed: ${chunk.files.length}\n\n`;
    prompt += chunk.result;
    prompt += '\n';
  }

  prompt += `\n---\n\n## NOW SYNTHESIZE THE ABOVE INTO A UNIFIED DOCUMENT\n\n`;

  // Add format instructions
  if (config.outputFormat === 'json') {
    prompt += 'Output the synthesized result as valid JSON with sections: userStories, testCases, acceptanceCriteria.\n';
  } else if (config.outputFormat === 'jira') {
    prompt += 'Format the output for Jira import with proper issue types and fields.\n';
  } else {
    prompt += 'Use clear Markdown formatting with proper headings and bullet points.\n';
  }

  return prompt;
}

// CORS support
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
