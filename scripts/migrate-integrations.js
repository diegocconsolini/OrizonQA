/**
 * Migration Script: Add Integration Fields
 *
 * Phase 2.5.1: Database Schema Updates
 * - Add integration fields to projects, requirements, test_runs
 * - Create webhook_events and git_commits tables
 */

import { query } from '../lib/db.js';

async function migrateIntegrations() {
  console.log('=' Starting integration schema migration...\n');

  try {
    // ==========================================
    // 1. Add Integration Fields to Projects
    // ==========================================
    console.log('=Ê Adding integration fields to projects table...');

    await query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'idle'
    `);

    console.log(' Projects table updated');
    console.log('   - integration_type: azure_devops, github, gitlab, jira');
    console.log('   - integration_config: JSONB with encrypted credentials');
    console.log('   - webhook_secret: For validating webhooks');
    console.log('   - last_sync_at, sync_status: Sync monitoring\n');

    // ==========================================
    // 2. Add Integration Fields to Requirements
    // ==========================================
    console.log('=À Adding integration fields to requirements table...');

    await query(`
      ALTER TABLE requirements
      ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'idle',
      ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sync_error TEXT
    `);

    console.log(' Requirements table updated');
    console.log('   - sync_status: idle, syncing, synced, error');
    console.log('   - last_synced_at: Last sync timestamp');
    console.log('   - sync_error: Error message if sync fails\n');

    // ==========================================
    // 3. Add Integration Fields to Test Runs
    // ==========================================
    console.log('>Í Adding integration fields to test_runs table...');

    await query(`
      ALTER TABLE test_runs
      ADD COLUMN IF NOT EXISTS triggered_by VARCHAR(50) DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS external_run_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS build_info JSONB,
      ADD COLUMN IF NOT EXISTS webhook_payload JSONB
    `);

    console.log(' Test runs table updated');
    console.log('   - triggered_by: manual, ci_cd, webhook, scheduled');
    console.log('   - external_run_id: Azure DevOps/GitHub run ID');
    console.log('   - build_info: {commit_sha, branch, pr_number, build_id}');
    console.log('   - webhook_payload: Full webhook payload for debugging\n');

    // ==========================================
    // 4. Create Webhook Events Table
    // ==========================================
    console.log('>ù Creating webhook_events table...');

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

    console.log(' Webhook events table created');
    console.log('   - Audit log for all incoming webhooks');
    console.log('   - source: azure_devops, github, gitlab');
    console.log('   - event_type: push, pull_request, work_item_updated');
    console.log('   - Indexes: project_id, processed+created_at\n');

    // ==========================================
    // 5. Create Git Commits Table
    // ==========================================
    console.log('=› Creating git_commits table...');

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

    console.log(' Git commits table created');
    console.log('   - Stores commit information');
    console.log('   - Unique constraint on project_id + commit_sha');
    console.log('   - Indexes: project_id, commit_sha\n');

    // ==========================================
    // 6. Create Commit Links Table
    // ==========================================
    console.log('= Creating commit_links table...');

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

    console.log(' Commit links table created');
    console.log('   - Links commits to requirements/test_cases');
    console.log('   - entity_type: requirement, test_case');
    console.log('   - Indexes: commit_id, entity_type+entity_id\n');

    // ==========================================
    // 7. Summary
    // ==========================================
    console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP');
    console.log(' Integration schema migration completed!\n');

    console.log('=  Summary:');
    console.log('   " Projects: +5 fields (integration_type, config, webhook, sync)');
    console.log('   " Requirements: +3 fields (sync_status, last_synced_at, error)');
    console.log('   " Test Runs: +4 fields (triggered_by, external_id, build_info, payload)');
    console.log('   " New Tables: webhook_events, git_commits, commit_links');
    console.log('   " Total Indexes: 6\n');

    console.log('<Ø Next Steps:');
    console.log('   1. Implement Azure DevOps integration (lib/integrations/azure-devops.js)');
    console.log('   2. Implement GitHub integration (lib/integrations/github.js)');
    console.log('   3. Build integration settings UI');
    console.log('PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP\n');

    process.exit(0);
  } catch (error) {
    console.error('L Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateIntegrations();
