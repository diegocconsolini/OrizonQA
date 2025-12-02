/**
 * Migration Script: Add Integration Fields
 *
 * Phase 2.5.1: Database Schema Updates
 * - Add integration fields to projects, requirements, test_runs
 * - Create webhook_events and git_commits tables
 */

import { query } from '../lib/db.js';

async function migrateIntegrations() {
  console.log('Starting integration schema migration...\n');

  try {
    // 1. Add Integration Fields to Projects
    console.log('[1/6] Adding integration fields to projects table...');

    await query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'idle'
    `);

    console.log('      Projects table updated\n');

    // 2. Add Integration Fields to Requirements
    console.log('[2/6] Adding integration fields to requirements table...');

    await query(`
      ALTER TABLE requirements
      ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'idle',
      ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sync_error TEXT
    `);

    console.log('      Requirements table updated\n');

    // 3. Add Integration Fields to Test Runs
    console.log('[3/6] Adding integration fields to test_runs table...');

    await query(`
      ALTER TABLE test_runs
      ADD COLUMN IF NOT EXISTS triggered_by VARCHAR(50) DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS external_run_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS build_info JSONB,
      ADD COLUMN IF NOT EXISTS webhook_payload JSONB
    `);

    console.log('      Test runs table updated\n');

    // 4. Create Webhook Events Table
    console.log('[4/6] Creating webhook_events table...');

    await query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        source VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP,
        error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_project
      ON webhook_events(project_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
      ON webhook_events(processed, created_at)
    `);

    console.log('      Webhook events table created\n');

    // 5. Create Git Commits Table
    console.log('[5/6] Creating git_commits table...');

    await query(`
      CREATE TABLE IF NOT EXISTS git_commits (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        commit_sha VARCHAR(40) NOT NULL,
        branch VARCHAR(255),
        author VARCHAR(255),
        author_email VARCHAR(255),
        message TEXT,
        committed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, commit_sha)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_git_commits_project
      ON git_commits(project_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_git_commits_sha
      ON git_commits(commit_sha)
    `);

    console.log('      Git commits table created\n');

    // 6. Create Commit Links Table
    console.log('[6/6] Creating commit_links table...');

    await query(`
      CREATE TABLE IF NOT EXISTS commit_links (
        id SERIAL PRIMARY KEY,
        commit_id INTEGER REFERENCES git_commits(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(commit_id, entity_type, entity_id)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_commit_links_commit
      ON commit_links(commit_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_commit_links_entity
      ON commit_links(entity_type, entity_id)
    `);

    console.log('      Commit links table created\n');

    // Summary
    console.log('=========================================');
    console.log('Integration schema migration completed!');
    console.log('=========================================\n');

    console.log('Summary:');
    console.log('  * Projects: +5 fields');
    console.log('  * Requirements: +3 fields');
    console.log('  * Test Runs: +4 fields');
    console.log('  * New Tables: 3 (webhook_events, git_commits, commit_links)');
    console.log('  * Total Indexes: 6\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateIntegrations();
