import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/db/migrate-llm-settings
 *
 * Migration to add LLM settings columns to users table if they don't exist.
 * This ensures the database has all necessary columns for AI provider settings.
 *
 * Columns added:
 * - ai_provider: 'claude' or 'lmstudio' (default: 'claude')
 * - claude_model: The Claude model to use (default: 'claude-sonnet-4-20250514')
 * - lmstudio_model: The LM Studio model name
 * - lmstudio_url: The LM Studio server URL
 * - claude_api_key_encrypted: Encrypted Claude API key
 *
 * Also makes password_hash nullable to support OAuth-only users.
 */
export async function GET() {
  const results = [];

  try {
    // Add ai_provider column
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(20) DEFAULT 'claude'
      `);
      results.push('Added ai_provider column');
    } catch (e) {
      results.push('ai_provider: ' + e.message);
    }

    // Add claude_model column
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS claude_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514'
      `);
      results.push('Added claude_model column');
    } catch (e) {
      results.push('claude_model: ' + e.message);
    }

    // Add lmstudio_model column
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS lmstudio_model VARCHAR(200)
      `);
      results.push('Added lmstudio_model column');
    } catch (e) {
      results.push('lmstudio_model: ' + e.message);
    }

    // Add lmstudio_url column
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS lmstudio_url TEXT
      `);
      results.push('Added lmstudio_url column');
    } catch (e) {
      results.push('lmstudio_url: ' + e.message);
    }

    // Add claude_api_key_encrypted column
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS claude_api_key_encrypted TEXT
      `);
      results.push('Added claude_api_key_encrypted column');
    } catch (e) {
      results.push('claude_api_key_encrypted: ' + e.message);
    }

    // Make password_hash nullable for OAuth users
    try {
      await query(`
        ALTER TABLE users
        ALTER COLUMN password_hash DROP NOT NULL
      `);
      results.push('Made password_hash nullable');
    } catch (e) {
      // Ignore if already nullable
      if (!e.message.includes('is not a not-null constraint')) {
        results.push('password_hash nullable: ' + e.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}
