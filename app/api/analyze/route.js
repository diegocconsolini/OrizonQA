import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildPrompt, parseResponse } from '../../../lib/promptBuilder.js';
import { saveAnalysis } from '../../../lib/db.js';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Get user session (if authenticated) - NextAuth v5
    const session = await auth();
    const userId = session?.user?.id || null;

    const { apiKey, content, config = {}, provider = 'claude', lmStudioUrl } = await request.json();

    // Validate API key for Claude, optional for LM Studio
    if (provider === 'claude' && !apiKey) {
      return NextResponse.json({ error: 'API key is required for Claude' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Code content is required' }, { status: 400 });
    }

    // Ensure config has defaults
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

    // Determine input type
    const inputType = config.inputType || 'paste';  // paste, github, file

    // Create content hash for deduplication/caching
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Build prompt from content and config using our prompt builder
    const prompt = buildPrompt(content, analysisConfig);

    let response;
    let responseText;
    let usage = null;

    if (provider === 'lmstudio') {
      // LM Studio uses OpenAI-compatible API
      const lmUrl = lmStudioUrl || 'http://localhost:1234';

      response = await fetch(`${lmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: analysisConfig.model || 'local-model',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 16000  // Increased for comprehensive QA artifacts
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error?.message || `LM Studio error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      responseText = data.choices[0].message.content;
      usage = data.usage ? {
        input_tokens: data.usage.prompt_tokens || 0,
        output_tokens: data.usage.completion_tokens || 0
      } : null;

    } else {
      // Claude API
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: analysisConfig.model || 'claude-sonnet-4-20250514',
          max_tokens: 16000,  // Increased for comprehensive QA artifacts
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          return NextResponse.json({ error: 'Rate limited. Please wait and try again.' }, { status: 429 });
        }

        if (response.status === 401) {
          return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

        return NextResponse.json(
          { error: errorData.error?.message || `API error: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      responseText = data.content[0].text;
      usage = data.usage;
    }

    // Parse response into sections
    const parsed = parseResponse(responseText, config.outputFormat);

    // 🆕 SAVE ANALYSIS TO DATABASE
    let analysisRecord = null;
    try {
      analysisRecord = await saveAnalysis({
        inputType,
        contentHash,
        provider,
        model: analysisConfig.model || (provider === 'claude' ? 'claude-sonnet-4-20250514' : 'local-model'),
        config: analysisConfig,
        results: parsed,
        tokenUsage: usage,
        githubUrl: config.githubUrl || null,
        githubBranch: config.githubBranch || null,
        userId  // Can be null for guest users
      });

      console.log(`✓ Analysis saved: ID ${analysisRecord.id}, User: ${userId || 'guest'}`);
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Failed to save analysis to database:', dbError);
      // Analysis still returns to user even if DB save fails
    }

    const result = NextResponse.json({
      ...parsed,
      usage,
      analysisId: analysisRecord?.id || null,  // Return analysis ID if saved
      savedAt: analysisRecord?.created_at || null
    });

    // Add CORS headers
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return result;

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add CORS headers for local development
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
