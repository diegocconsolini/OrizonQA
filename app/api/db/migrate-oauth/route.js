/**
 * OAuth Connections Migration API
 *
 * POST /api/db/migrate-oauth
 *
 * Creates the oauth_connections table for storing encrypted OAuth tokens.
 * This is a one-time migration endpoint.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    console.log('🚀 Starting OAuth connections migration...');

    // Create oauth_connections table
    await query(`
      CREATE TABLE IF NOT EXISTS oauth_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Provider info
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255),
        provider_username VARCHAR(255),

        -- Encrypted tokens (AES-256-GCM format: iv:authTag:encrypted)
        access_token_encrypted TEXT NOT NULL,
        refresh_token_encrypted TEXT,
        token_expires_at TIMESTAMP,

        -- Permissions granted by user
        scopes JSONB,

        -- Provider-specific metadata
        metadata JSONB,

        -- Connection status
        status VARCHAR(20) DEFAULT 'active',
        last_used_at TIMESTAMP,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- Allow multiple accounts per provider (work + personal)
        UNIQUE(user_id, provider, provider_user_id)
      );
    `);
    console.log('✅ Created oauth_connections table');

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_user
      ON oauth_connections(user_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_provider
      ON oauth_connections(user_id, provider);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_status
      ON oauth_connections(status)
      WHERE status = 'active';
    `);
    console.log('✅ Created indexes');

    // Create trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_oauth_connections_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DROP TRIGGER IF EXISTS oauth_connections_updated_at ON oauth_connections;
      CREATE TRIGGER oauth_connections_updated_at
      BEFORE UPDATE ON oauth_connections
      FOR EACH ROW
      EXECUTE FUNCTION update_oauth_connections_updated_at();
    `);
    console.log('✅ Created trigger');

    return NextResponse.json({
      success: true,
      message: 'OAuth connections table created successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run the oauth_connections migration'
  });
}
