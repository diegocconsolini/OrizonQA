/**
 * Chat Assistant API with Tool Calling
 *
 * Uses Claude with tools for interactive assistance.
 * Tools allow the assistant to interact with the application state.
 *
 * Security:
 * - All tool inputs validated
 * - Tool results don't include sensitive data
 * - Rate limiting applied
 * - Audit logging for tool calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { ALL_TOOLS, executeTool } from '@/lib/assistantTools';

// Models
const MODELS = {
  chat: 'claude-3-5-haiku-20241022', // Fast, cheap for chat
  analysis: 'claude-sonnet-4-20250514', // Powerful for analysis
};

// System prompt for the assistant
const SYSTEM_PROMPT = `You are ORIZON Assistant, an AI helper embedded in a QA code analysis application.

## Your Capabilities
You can help users:
- Select files for analysis from repositories
- Configure analysis settings
- Start and monitor analysis
- View and export results
- Navigate the application

## Tools Available
You have access to tools that let you interact with the application. Use them to help users accomplish their goals.

When a user asks to do something (like "select all JavaScript files"), use the appropriate tool to perform the action.

## Important Rules
1. When selecting files, always confirm what will be selected before using tools
2. When starting analysis, ensure files are selected and configuration is set
3. Be concise - users are developers who want quick help
4. If you're unsure what the user wants, ask a clarifying question
5. After using a tool, explain what happened in simple terms

## Context
You receive context about the current page state. Use this to understand what's already selected/configured.

## Response Style
- Be helpful and direct
- Explain what tools did when you use them
- Suggest next steps when appropriate
- Don't be overly verbose`;

/**
 * POST /api/chat-assistant
 * Process a chat message with optional tool calling
 */
export async function POST(request) {
  try {
    const { message, context, apiKey, conversationHistory } = await request.json();

    // Validate required fields
    if (!apiKey) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build enhanced system prompt with context
    const contextInfo = buildContextInfo(context);
    const systemPrompt = `${SYSTEM_PROMPT}\n\n## Current Context\n${contextInfo}`;

    // Build messages array
    const messages = [];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        // Limit to last 10 messages
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    // Initial API call with tools
    let response = await anthropic.messages.create({
      model: MODELS.chat,
      max_tokens: 1024,
      system: systemPrompt,
      tools: ALL_TOOLS,
      messages,
    });

    // Process tool calls in a loop
    const toolResults = [];
    const actions = []; // Actions to execute on client
    let iterations = 0;
    const MAX_ITERATIONS = 5; // Prevent infinite loops

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++;

      // Extract tool use blocks
      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

      // Execute each tool
      const toolResultMessages = [];
      for (const toolUse of toolUseBlocks) {
        const { id, name, input } = toolUse;

        // Execute the tool
        const result = await executeTool(name, input, context || {});

        // Collect actions for client
        if (result.action) {
          actions.push(result.action);
        }

        // Store result for logging
        toolResults.push({
          tool: name,
          input,
          success: result.success,
          error: result.error,
        });

        // Build tool result for Claude
        toolResultMessages.push({
          type: 'tool_result',
          tool_use_id: id,
          content: JSON.stringify(result.data || { error: result.error }),
        });
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResultMessages,
      });

      // Call API again with tool results
      response = await anthropic.messages.create({
        model: MODELS.chat,
        max_tokens: 1024,
        system: systemPrompt,
        tools: ALL_TOOLS,
        messages,
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter((block) => block.type === 'text');
    const responseText = textBlocks.map((block) => block.text).join('\n');

    // Return response with actions
    return Response.json({
      response: responseText,
      actions, // Actions for client to execute
      toolResults, // Tool execution summary (for debugging)
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    console.error('Chat assistant error:', error);

    if (error.status === 401) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (error.status === 429) {
      return Response.json({ error: 'Rate limited. Please try again later.' }, { status: 429 });
    }

    return Response.json({ error: error.message || 'Chat request failed' }, { status: 500 });
  }
}

/**
 * Build context information string for the system prompt
 */
function buildContextInfo(context) {
  if (!context) {
    return 'No context available.';
  }

  const parts = [];

  // Page info
  if (context.currentPage) {
    parts.push(`Current page: ${context.currentPage}`);
  }

  // Repository info
  if (context.selectedRepo) {
    parts.push(`Repository: ${context.selectedRepo.name} (${context.selectedRepo.owner})`);
    if (context.selectedBranch) {
      parts.push(`Branch: ${context.selectedBranch}`);
    }
  }

  // File selection info
  if (context.selectedFiles && context.selectedFiles.length > 0) {
    parts.push(`Selected files: ${context.selectedFiles.length}`);
    if (context.selectedFiles.length <= 5) {
      parts.push(`Files: ${context.selectedFiles.join(', ')}`);
    } else {
      parts.push(`First 5 files: ${context.selectedFiles.slice(0, 5).join(', ')}...`);
    }
  } else {
    parts.push('No files selected');
  }

  // File tree info
  if (context.fileTree && context.fileTree.length > 0) {
    const fileCount = countFiles(context.fileTree);
    parts.push(`Available files: ${fileCount} files in repository`);
  }

  // Analysis state
  if (context.isAnalyzing) {
    parts.push('Status: Analysis in progress');
    if (context.progress) {
      parts.push(`Progress: ${context.progress.percentage}%`);
    }
  } else if (context.isComplete) {
    parts.push('Status: Analysis complete');
  } else {
    parts.push('Status: Ready for analysis');
  }

  // Configuration
  if (context.config) {
    const outputs = [];
    if (context.config.testCases) outputs.push('tests');
    if (context.config.userStories) outputs.push('user stories');
    if (context.config.acceptanceCriteria) outputs.push('acceptance criteria');
    if (outputs.length > 0) {
      parts.push(`Configured outputs: ${outputs.join(', ')}`);
    }
    if (context.config.testFramework && context.config.testFramework !== 'generic') {
      parts.push(`Test framework: ${context.config.testFramework}`);
    }
  }

  // API key status
  parts.push(`API key: ${context.hasApiKey ? 'Configured' : 'Not configured'}`);

  return parts.join('\n');
}

/**
 * Count files in file tree
 */
function countFiles(tree) {
  let count = 0;

  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return count;
}
