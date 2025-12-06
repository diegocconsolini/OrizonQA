/**
 * AI Tools API
 *
 * Endpoints for AI assistant tool management.
 * GET: List available tools
 * POST: Execute a tool
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getToolConfigs } from '@/lib/db-ai-assistant';
import { executeTool } from '@/lib/assistantTools/executor';
import {
  validateInput,
  checkPermission,
  checkRateLimit,
  auditLogger,
  InputValidationError,
} from '@/lib/assistantTools/security';
import { ALL_TOOLS, getToolByName } from '@/lib/assistantTools/definitions';

/**
 * GET /api/ai/tools
 * List all available tools for the current user
 */
export async function GET(request) {
  try {
    const session = await auth();
    const user = session?.user || null;

    // Get tool configs from database (if available)
    let dbConfigs = [];
    try {
      dbConfigs = await getToolConfigs();
    } catch {
      // Database might not be initialized yet
    }

    // Build tool list with permissions
    const tools = ALL_TOOLS.map((tool) => {
      const dbConfig = dbConfigs.find((c) => c.tool_name === tool.name);
      const permCheck = checkPermission(tool.name, user);

      return {
        name: tool.name,
        description: tool.description,
        category: dbConfig?.category || 'general',
        permissionLevel: dbConfig?.permission_level || 3,
        isDangerous: dbConfig?.is_dangerous || false,
        isEnabled: dbConfig?.is_enabled ?? true,
        requiresConfirmation: dbConfig?.requires_confirmation || false,
        hasAccess: permCheck.allowed,
        accessReason: permCheck.allowed ? null : permCheck.reason,
        inputSchema: tool.input_schema,
      };
    });

    // Group by category
    const grouped = {};
    for (const tool of tools) {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    }

    return NextResponse.json({
      success: true,
      tools,
      grouped,
      totalCount: tools.length,
      accessibleCount: tools.filter((t) => t.hasAccess).length,
    });
  } catch (error) {
    console.error('Error listing tools:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/tools
 * Execute a tool
 *
 * Body: {
 *   tool: string,
 *   input: object,
 *   context: object,
 *   confirmationToken?: string
 * }
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    const session = await auth();
    const user = session?.user || null;
    const userId = user?.id || 'anonymous';

    // Parse request body
    const body = await request.json();
    const { tool: toolName, input = {}, context = {}, confirmationToken } = body;

    if (!toolName) {
      return NextResponse.json(
        { success: false, error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Get tool definition
    const tool = getToolByName(toolName);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Unknown tool: ${toolName}` },
        { status: 400 }
      );
    }

    // Get client info for logging
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = session?.sessionToken || null;

    // Log tool call attempt
    await auditLogger.logToolCall(toolName, input, userId, {
      sessionId,
      ipAddress,
      page: context.currentPage,
    });

    // ===== Layer 1: Input Validation =====
    let validatedInput = input;
    try {
      if (tool.input_schema) {
        validatedInput = validateInput(input, tool.input_schema, 'input');
      }
    } catch (error) {
      if (error instanceof InputValidationError) {
        await auditLogger.logValidationError(toolName, input, error, userId);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            errorType: 'validation',
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ===== Layer 2: Permission Check =====
    const permResult = checkPermission(toolName, user, { confirmed: !!confirmationToken });
    if (!permResult.allowed) {
      await auditLogger.logPermissionDenied(
        toolName,
        userId,
        permResult.requiredLevel,
        permResult.userLevel
      );
      return NextResponse.json(
        {
          success: false,
          error: permResult.reason,
          errorType: 'permission',
          requiredLevel: permResult.requiredLevel,
          userLevel: permResult.userLevel,
        },
        { status: 403 }
      );
    }

    // ===== Layer 3: Rate Limiting =====
    const rateResult = checkRateLimit(userId, toolName, { ipAddress });
    if (!rateResult.allowed) {
      await auditLogger.logRateLimited(toolName, userId, rateResult.retryAfter);
      return NextResponse.json(
        {
          success: false,
          error: rateResult.reason,
          errorType: 'rate_limit',
          retryAfter: rateResult.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter) } }
      );
    }

    // ===== Layer 6: Confirmation Check =====
    if (permResult.requiresConfirmation && !confirmationToken) {
      // Need to create confirmation request
      // This is handled by the client - just return the requirement
      await auditLogger.log('confirmation_required', {
        toolName,
        userId,
        metadata: { confirmationType: permResult.confirmationType },
      });

      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        confirmationType: permResult.confirmationType,
        confirmationMessage: permResult.confirmationMessage,
        errorType: 'confirmation_required',
      }, { status: 428 });
    }

    // ===== Execute Tool =====
    const result = await executeTool(toolName, validatedInput, {
      ...context,
      userId,
      sessionId,
      hasApiKey: !!user?.claude_api_key_encrypted,
    });

    const duration = Date.now() - startTime;

    if (result.success) {
      await auditLogger.logSuccess(toolName, validatedInput, result.data, userId, duration, {
        hasAction: !!result.action,
      });
    } else {
      await auditLogger.logError(toolName, validatedInput, { message: result.error }, userId);
    }

    return NextResponse.json({
      success: result.success,
      data: result.data,
      action: result.action, // Client should dispatch this action
      error: result.error,
      duration,
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Tool execution failed',
        errorType: 'internal',
        duration,
      },
      { status: 500 }
    );
  }
}
