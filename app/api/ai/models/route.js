import { NextResponse } from 'next/server';

/**
 * GET /api/ai/models
 *
 * Fetches available models from AI providers.
 * Supports: anthropic, lmstudio, ollama
 *
 * Query params:
 * - provider: 'anthropic' | 'lmstudio' | 'ollama'
 * - apiKey: API key for Anthropic (optional)
 * - baseUrl: Custom endpoint URL (optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const apiKey = searchParams.get('apiKey');
    const baseUrl = searchParams.get('baseUrl');

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    let models = [];

    switch (provider) {
      case 'anthropic':
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
 * Fetch Anthropic models
 * Returns static list since Anthropic doesn't have a models endpoint
 */
async function fetchAnthropicModels(apiKey) {
  // Anthropic models - updated list as of 2025
  return [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest Sonnet, best balance' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most capable model' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', description: 'Extended thinking' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous generation' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest model' },
  ];
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
