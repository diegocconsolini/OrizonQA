/**
 * AI Assistant Database Migration
 *
 * Creates tables for AI Assistant tools:
 * - ai_settings: Per-user settings
 * - ai_action_log: Audit trail
 * - ai_tool_config: Tool configurations
 * - ai_pending_confirmations: Confirmation tokens
 */

import { NextResponse } from 'next/server';
import { initAIAssistantTables, seedToolConfigs } from '@/lib/db-ai-assistant';

export async function GET() {
  try {
    // Initialize tables
    await initAIAssistantTables();

    // Seed default tool configurations
    const toolCount = await seedToolConfigs();

    return NextResponse.json({
      success: true,
      message: 'AI Assistant tables initialized successfully',
      details: {
        tables: [
          'ai_settings',
          'ai_action_log',
          'ai_tool_config',
          'ai_pending_confirmations',
        ],
        toolsSeeded: toolCount,
      },
    });
  } catch (error) {
    console.error('AI Assistant migration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
