/**
 * Chat Assistant API
 *
 * Uses Claude Haiku for fast, cheap conversational interactions.
 * This is separate from the main analysis which uses Sonnet.
 *
 * Cost comparison:
 * - Haiku: $0.25/1M input, $1.25/1M output (~$0.001 per message)
 * - Sonnet: $3/1M input, $15/1M output (~$0.05 per analysis)
 */

import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    const { message, context, model, apiKey } = await request.json();

    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build system prompt for the assistant
    const systemPrompt = `You are ORIZON Assistant, a helpful AI that guides users through code analysis for QA test generation.

Your role:
- Help users understand what they can do with ORIZON
- Answer questions about code analysis, test generation, and QA
- Suggest which analysis type to use based on their needs
- Explain the output formats and options available

Current context:
${context.hasSource ? `- User has selected: ${context.sourceName} (${context.fileCount} files)` : '- No code source selected yet'}
${context.selectedAction ? `- Selected action: ${context.selectedAction}` : ''}
${context.currentConfig ? `- Config: Tests=${context.currentConfig.testCases}, Stories=${context.currentConfig.userStories}, Criteria=${context.currentConfig.acceptanceCriteria}` : ''}

Available actions you can suggest:
- api-tests: Generate API/integration tests
- user-stories: Generate user stories from code
- full-suite: Generate complete QA suite (tests + stories + criteria)
- security: Generate security-focused tests

Keep responses concise (2-4 sentences max). Be helpful and friendly.

If the user's question suggests they want to:
- Generate tests → suggest "api-tests" or "full-suite"
- Understand the code → suggest "user-stories"
- Check security → suggest "security"

Include a JSON block at the end of your response if you want to suggest an action:
\`\`\`json
{"suggestedAction": "action-id"}
\`\`\``;

    const response = await anthropic.messages.create({
      model: model || 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    });

    // Extract response text
    let responseText = response.content[0]?.text || '';

    // Parse any suggested action from the response
    let suggestedAction = null;
    let suggestedConfig = null;

    const jsonMatch = responseText.match(/```json\s*({[^}]+})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        suggestedAction = parsed.suggestedAction;
        suggestedConfig = parsed.suggestedConfig;
        // Remove the JSON block from the response
        responseText = responseText.replace(/```json\s*{[^}]+}\s*```/, '').trim();
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return Response.json({
      response: responseText,
      suggestedAction,
      suggestedConfig,
      usage: response.usage,
      model: response.model
    });

  } catch (error) {
    console.error('Chat assistant error:', error);

    if (error.status === 401) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return Response.json(
      { error: error.message || 'Chat request failed' },
      { status: 500 }
    );
  }
}
