/**
 * OAuth Connections Database Migration
 *
 * Creates the oauth_connections table for storing encrypted OAuth tokens
 * from multiple providers (GitHub, GitLab, Bitbucket, etc.)
 *
 * Features:
 * - Supports multiple OAuth providers per user
 * - Multiple accounts per provider (work + personal)
 * - Encrypted token storage (AES-256-GCM)
 * - Token expiration tracking
 * - Audit trail with last_used_at
 * - Flexible metadata storage (JSONB)
 *
 * Usage:
 *   node scripts/migrate-oauth-connections.js
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/orizonqa',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting OAuth connections migration...\n');

    // Create oauth_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Provider info
        provider VARCHAR(50) NOT NULL,  -- 'github', 'gitlab', 'bitbucket'
        provider_user_id VARCHAR(255),
        provider_username VARCHAR(255),

        -- Encrypted tokens (AES-256-GCM format: iv:authTag:encrypted)
        access_token_encrypted TEXT NOT NULL,
        refresh_token_encrypted TEXT,
        token_expires_at TIMESTAMP,

        -- Permissions granted by user
        scopes JSONB,  -- ['repo', 'read:user', 'user:email']

        -- Provider-specific metadata
        metadata JSONB,  -- { avatar_url, email, repos_count, etc. }

        -- Connection status
        status VARCHAR(20) DEFAULT 'active',  -- 'active', 'expired', 'revoked', 'error'
        last_used_at TIMESTAMP,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- Allow multiple accounts per provider (work + personal)
        UNIQUE(user_id, provider, provider_user_id)
      );
    `);
    console.log('✅ Created oauth_connections table');

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_user
      ON oauth_connections(user_id);
    `);
    console.log('✅ Created index on user_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_provider
      ON oauth_connections(user_id, provider);
    `);
    console.log('✅ Created index on user_id + provider');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_connections_status
      ON oauth_connections(status)
      WHERE status = 'active';
    `);
    console.log('✅ Created partial index on status (active only)');

    // Create function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_oauth_connections_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created trigger function for updated_at');

    await client.query(`
      DROP TRIGGER IF EXISTS oauth_connections_updated_at ON oauth_connections;
      CREATE TRIGGER oauth_connections_updated_at
      BEFORE UPDATE ON oauth_connections
      FOR EACH ROW
      EXECUTE FUNCTION update_oauth_connections_updated_at();
    `);
    console.log('✅ Created trigger for automatic updated_at');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nTable structure:');
    console.log('  - id: Serial primary key');
    console.log('  - user_id: Foreign key to users table');
    console.log('  - provider: OAuth provider name (github, gitlab, etc.)');
    console.log('  - provider_user_id: User ID from provider');
    console.log('  - provider_username: Username from provider');
    console.log('  - access_token_encrypted: AES-256-GCM encrypted token');
    console.log('  - refresh_token_encrypted: Optional refresh token');
    console.log('  - token_expires_at: Token expiration timestamp');
    console.log('  - scopes: JSONB array of granted permissions');
    console.log('  - metadata: JSONB object for provider-specific data');
    console.log('  - status: Connection status (active/expired/revoked/error)');
    console.log('  - last_used_at: Last API call timestamp');
    console.log('  - created_at/updated_at: Audit timestamps');
    console.log('\nConstraints:');
    console.log('  - UNIQUE(user_id, provider, provider_user_id): Multiple accounts per provider');
    console.log('  - CASCADE DELETE: Remove connections when user is deleted');
    console.log('\nIndexes:');
    console.log('  - user_id: Fast lookups by user');
    console.log('  - (user_id, provider): Fast lookups by user + provider');
    console.log('  - status (partial): Fast active connection queries');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
