import { auth } from '@/auth';
import { prepareContent, formatChunkContent } from '@/lib/contentPreparer';
import { buildPrompt, buildChunkPrompt, buildSynthesisPrompt, parseResponse } from '@/lib/promptBuilder';
import { saveAnalysis } from '@/lib/db';
import crypto from 'crypto';

/**
 * Streaming Multi-Pass Analysis API with SSE
 *
 * POST /api/analyze-stream
 *
 * Returns Server-Sent Events for real-time progress updates:
 * - plan: Analysis plan with chunks, files, strategy
 * - chunk-start: When a chunk begins processing
 * - api-call: When calling AI provider
 * - chunk-done: When a chunk completes
 * - chunk-error: If a chunk fails
 * - synthesis-start: When synthesis begins
 * - complete: Final results
 * - error: Fatal error
 */
export async function POST(request) {
  const encoder = new TextEncoder();

  // Parse request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return new Response(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Invalid JSON body' })}\n\n`),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );
  }

  const {
    files,
    config = {},
    apiKey,
    provider = 'claude',
    lmStudioUrl
  } = requestBody;

  // Validate inputs
  if (provider === 'claude' && !apiKey) {
    return new Response(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'API key is required for Claude' })}\n\n`),
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return new Response(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Files array is required' })}\n\n`),
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();

      // Helper to send SSE events
      const emit = (eventType, data) => {
        const eventData = {
          ...data,
          timestamp: Date.now(),
          elapsed: Date.now() - startTime
        };
        controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`));
      };

      try {
        const session = await auth();
        const userId = session?.user?.id || null;

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

        // Get correct model name based on provider
        const modelName = provider === 'lmstudio'
          ? (analysisConfig.model || 'Local LLM')
          : (analysisConfig.model || 'claude-sonnet-4-20250514');

        // Prepare content - determine if single or multi-pass needed
        const prepared = prepareContent(files, analysisConfig);

        // Calculate totals and estimates
        const totalSize = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);
        const estimatedTokens = Math.ceil(totalSize / 4);
        const estimatedCost = calculateCost(estimatedTokens, prepared.totalChunks);
        const totalPasses = prepared.strategy === 'single' ? 1 : prepared.totalChunks + 1;

        // Emit plan event
        emit('plan', {
          strategy: prepared.strategy,
          totalFiles: prepared.totalFiles,
          totalSize,
          totalSizeFormatted: formatBytes(totalSize),
          totalChunks: prepared.totalChunks,
          totalPasses,
          estimatedTokens,
          estimatedCost: `$${estimatedCost.toFixed(2)}`,
          chunks: prepared.chunkDetails || []
        });

        // Create content hash for the full analysis
        const contentHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(files.map(f => f.path + f.content)))
          .digest('hex');

        let result;
        let totalUsage = { input_tokens: 0, output_tokens: 0 };
        const chunkTimings = [];

        if (prepared.strategy === 'single') {
          // Single pass - all files fit in one API call
          emit('chunk-start', {
            index: 0,
            total: 1,
            files: prepared.chunks[0].map(f => f.path),
            fileCount: prepared.chunks[0].length,
            sizeBytes: totalSize,
            sizeFormatted: formatBytes(totalSize)
          });

          const content = formatChunkContent(prepared.chunks[0], 0, 1);
          const prompt = buildPrompt(content, analysisConfig);
          const promptTokens = Math.ceil(prompt.length / 4);

          emit('api-call', {
            provider,
            model: modelName,
            promptSize: prompt.length,
            promptTokens,
            status: 'sending'
          });

          const chunkStart = Date.now();
          const response = await callAI(prompt, analysisConfig, apiKey, provider, lmStudioUrl);
          const chunkDuration = Date.now() - chunkStart;

          result = response.text;
          totalUsage = response.usage || totalUsage;

          emit('chunk-done', {
            index: 0,
            total: 1,
            inputTokens: totalUsage.input_tokens,
            outputTokens: totalUsage.output_tokens,
            durationMs: chunkDuration,
            responseSize: response.text.length
          });

        } else {
          // Multi-pass - analyze all chunks then synthesize
          const chunkResults = [];

          for (let i = 0; i < prepared.chunks.length; i++) {
            const chunk = prepared.chunks[i];
            const chunkDetail = prepared.chunkDetails[i];
            const chunkSize = chunk.reduce((sum, f) => sum + (f.content?.length || 0), 0);

            emit('chunk-start', {
              index: i,
              total: prepared.totalChunks,
              files: chunk.map(f => f.path),
              fileCount: chunk.length,
              sizeBytes: chunkSize,
              sizeFormatted: formatBytes(chunkSize),
              summary: chunkDetail.summary
            });

            const content = formatChunkContent(chunk, i, prepared.totalChunks);
            const chunkPrompt = buildChunkPrompt(content, analysisConfig, i, prepared.totalChunks, chunkDetail);
            const promptTokens = Math.ceil(chunkPrompt.length / 4);

            emit('api-call', {
              provider,
              model: modelName,
              promptSize: chunkPrompt.length,
              promptTokens,
              chunkIndex: i,
              status: 'sending'
            });

            const chunkStart = Date.now();

            try {
              const response = await callAI(chunkPrompt, analysisConfig, apiKey, provider, lmStudioUrl);
              const chunkDuration = Date.now() - chunkStart;

              chunkResults.push({
                index: i,
                result: response.text,
                files: chunk.map(f => f.path),
                summary: chunkDetail.summary,
                tokens: response.usage
              });

              totalUsage.input_tokens += response.usage?.input_tokens || 0;
              totalUsage.output_tokens += response.usage?.output_tokens || 0;

              chunkTimings.push({
                index: i,
                duration: chunkDuration,
                inputTokens: response.usage?.input_tokens || 0,
                outputTokens: response.usage?.output_tokens || 0
              });

              emit('chunk-done', {
                index: i,
                total: prepared.totalChunks,
                inputTokens: response.usage?.input_tokens || 0,
                outputTokens: response.usage?.output_tokens || 0,
                durationMs: chunkDuration,
                responseSize: response.text.length,
                // Preview of what was found
                preview: extractPreview(response.text)
              });

            } catch (error) {
              emit('chunk-error', {
                index: i,
                total: prepared.totalChunks,
                error: error.message,
                files: chunk.map(f => f.path),
                recoverable: true
              });

              chunkResults.push({
                index: i,
                error: error.message,
                files: chunk.map(f => f.path),
                summary: chunkDetail.summary
              });
            }
          }

          // Synthesis pass
          const successfulChunks = chunkResults.filter(c => !c.error);

          if (successfulChunks.length === 0) {
            emit('error', {
              error: 'All analysis chunks failed',
              chunkErrors: chunkResults.map(c => ({ chunk: c.index, error: c.error }))
            });
            controller.close();
            return;
          }

          if (successfulChunks.length === 1) {
            result = successfulChunks[0].result;
          } else {
            emit('synthesis-start', {
              chunkCount: successfulChunks.length,
              totalInputTokens: totalUsage.input_tokens,
              totalOutputTokens: totalUsage.output_tokens
            });

            const synthesisPrompt = buildSynthesisPrompt(successfulChunks, analysisConfig);
            const synthPromptTokens = Math.ceil(synthesisPrompt.length / 4);

            emit('api-call', {
              provider,
              model: modelName,
              promptSize: synthesisPrompt.length,
              promptTokens: synthPromptTokens,
              phase: 'synthesis',
              status: 'sending'
            });

            const synthStart = Date.now();
            const synthesisResponse = await callAI(synthesisPrompt, analysisConfig, apiKey, provider, lmStudioUrl);
            const synthDuration = Date.now() - synthStart;

            result = synthesisResponse.text;
            totalUsage.input_tokens += synthesisResponse.usage?.input_tokens || 0;
            totalUsage.output_tokens += synthesisResponse.usage?.output_tokens || 0;

            emit('synthesis-done', {
              inputTokens: synthesisResponse.usage?.input_tokens || 0,
              outputTokens: synthesisResponse.usage?.output_tokens || 0,
              durationMs: synthDuration
            });
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
        } catch (dbError) {
          console.error('Failed to save analysis:', dbError);
        }

        // Calculate actual cost
        const actualCost = calculateActualCost(totalUsage);

        // Emit complete event
        emit('complete', {
          results: parsed,
          usage: totalUsage,
          analysisId: analysisRecord?.id || null,
          savedAt: analysisRecord?.created_at || null,
          coverage: '100%',
          strategy: prepared.strategy,
          totalChunks: prepared.totalChunks,
          filesAnalyzed: prepared.totalFiles,
          totalDurationMs: Date.now() - startTime,
          actualCost: `$${actualCost.toFixed(4)}`,
          chunkTimings
        });

      } catch (error) {
        emit('error', {
          error: error.message || 'Internal server error',
          phase: 'unknown',
          recoverable: false
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  });
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
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Estimate cost before analysis
 */
function calculateCost(estimatedTokens, chunks) {
  // Claude Sonnet pricing: $3/1M input, $15/1M output
  const inputTokens = estimatedTokens;
  const outputTokens = chunks * 4000; // Estimate ~4K output per chunk
  return (inputTokens / 1000000) * 3.00 + (outputTokens / 1000000) * 15.00;
}

/**
 * Calculate actual cost from token usage
 */
function calculateActualCost(usage) {
  // Claude Sonnet pricing: $3/1M input, $15/1M output
  return ((usage.input_tokens || 0) / 1000000) * 3.00 +
         ((usage.output_tokens || 0) / 1000000) * 15.00;
}

/**
 * Extract a preview of what was found in analysis
 */
function extractPreview(text) {
  const preview = {
    userStories: 0,
    testCases: 0,
    acceptanceCriteria: 0
  };

  // Count user stories (look for patterns like "## User Story" or "### US-")
  const storyMatches = text.match(/user stor(y|ies)/gi);
  preview.userStories = storyMatches ? Math.ceil(storyMatches.length / 2) : 0;

  // Count test cases
  const testMatches = text.match(/test case|it\(|test\(|describe\(/gi);
  preview.testCases = testMatches ? Math.ceil(testMatches.length / 2) : 0;

  // Count acceptance criteria
  const criteriaMatches = text.match(/acceptance|criteria|\[ \]|\[x\]/gi);
  preview.acceptanceCriteria = criteriaMatches ? Math.ceil(criteriaMatches.length / 3) : 0;

  return preview;
}

// CORS support
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
