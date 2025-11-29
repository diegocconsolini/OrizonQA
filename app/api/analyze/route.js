import { NextResponse } from 'next/server';
import { buildPrompt, parseResponse } from '../../../lib/promptBuilder.js';

export async function POST(request) {
  try {
    const { apiKey, content, config } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Code content is required' }, { status: 400 });
    }

    // Build prompt from content and config using our prompt builder
    const prompt = buildPrompt(content, config);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
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
    const responseText = data.content[0].text;

    // Parse response into sections
    const parsed = parseResponse(responseText, config.outputFormat);

    return NextResponse.json({
      ...parsed,
      usage: data.usage
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
