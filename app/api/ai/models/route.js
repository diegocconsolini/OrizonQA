import { NextResponse } from 'next/server';

/**
 * GET /api/ai/models
 *
 * Fetches available models from AI providers.
 * Supports: anthropic, lmstudio, ollama
 *
 * Query params:
 * - provider: 'anthropic' | 'lmstudio' | 'ollama'
 * - baseUrl: Custom endpoint URL (optional)
 *
 * Headers:
 * - X-Claude-Api-Key: API key for Anthropic (required for anthropic provider)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const baseUrl = searchParams.get('baseUrl');

    // Get API key from header for security (not query params)
    const apiKey = request.headers.get('X-Claude-Api-Key');

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    let models = [];

    switch (provider) {
      case 'anthropic':
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key is required for Anthropic' },
            { status: 400 }
          );
        }
        models = await fetchAnthropicModels(apiKey);
        break;
      case 'lmstudio':
        models = await fetchLmStudioModels(baseUrl || 'http://localhost:1234');
        break;
      case 'ollama':
        models = await fetchOllamaModels(baseUrl || 'http://localhost:11434');
        break;
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

/**
 * Fetch Anthropic models via the Models API
 * https://docs.anthropic.com/en/api/models-list
 */
async function fetchAnthropicModels(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error(errorData.error?.message || `Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    // Filter to only chat models (exclude embedding, etc.) and sort by created_at desc
    const chatModels = models
      .filter(model => model.type === 'model' && model.id.includes('claude'))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(model => ({
        id: model.id,
        name: model.display_name || model.id,
        description: formatModelDescription(model),
      }));

    return chatModels;
  } catch (error) {
    console.error('Failed to fetch Anthropic models:', error);
    throw new Error(error.message || 'Failed to validate API key with Anthropic');
  }
}

/**
 * Format model description from model metadata
 */
function formatModelDescription(model) {
  if (model.id.includes('opus')) return 'Most capable model';
  if (model.id.includes('sonnet-4-5')) return 'Latest Sonnet with enhanced capabilities';
  if (model.id.includes('sonnet-4')) return 'High performance, balanced';
  if (model.id.includes('3-7-sonnet')) return 'Extended thinking model';
  if (model.id.includes('3-5-sonnet')) return 'Previous generation Sonnet';
  if (model.id.includes('haiku')) return 'Fastest, most efficient';
  return 'Claude model';
}

/**
 * Fetch LM Studio models via OpenAI-compatible API
 */
async function fetchLmStudioModels(baseUrl) {
  try {
    // LM Studio uses /v1/models endpoint (OpenAI compatible)
    const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`LM Studio returned ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models.map(model => ({
      id: model.id,
      name: model.id,
      description: model.owned_by || 'Local model'
    }));
  } catch (error) {
    console.error('Failed to fetch LM Studio models:', error);
    throw new Error(`Cannot connect to LM Studio at ${baseUrl}. Make sure LM Studio is running.`);
  }
}

/**
 * Fetch Ollama models
 */
async function fetchOllamaModels(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const models = data.models || [];

    return models.map(model => ({
      id: model.name,
      name: model.name,
      description: `${(model.size / 1e9).toFixed(1)}GB` || 'Local model'
    }));
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    throw new Error(`Cannot connect to Ollama at ${baseUrl}. Make sure Ollama is running.`);
  }
}
