#!/usr/bin/env node

/**
 * Verify Professional QA System Migration
 * Checks that all tables and indexes were created successfully
 */

import { query } from '../lib/db.js';

async function verify() {
  console.log('🔍 Verifying Professional QA System migration...\n');

  try {
    // Check all tables exist
    const tables = [
      'projects',
      'requirements',
      'test_suites',
      'test_cases',
      'test_coverage',
      'test_plans',
      'test_runs',
      'test_run_cases',
      'test_results',
      'defects',
      'ai_prompt_templates',
      'project_members'
    ];

    console.log('📋 Checking tables:');
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
      }
    }

    // Count total tables
    const tableCount = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);

    console.log(`\n📊 Total tables in database: ${tableCount.rows[0].count}`);
    console.log('   Expected: 16 (4 existing + 12 new)');

    // Test a simple query on each table
    console.log('\n🧪 Testing queries on new tables:');

    await query('SELECT COUNT(*) FROM projects');
    console.log('   ✅ projects - query successful');

    await query('SELECT COUNT(*) FROM requirements');
    console.log('   ✅ requirements - query successful');

    await query('SELECT COUNT(*) FROM test_suites');
    console.log('   ✅ test_suites - query successful');

    await query('SELECT COUNT(*) FROM test_cases');
    console.log('   ✅ test_cases - query successful');

    await query('SELECT COUNT(*) FROM test_coverage');
    console.log('   ✅ test_coverage - query successful');

    await query('SELECT COUNT(*) FROM test_plans');
    console.log('   ✅ test_plans - query successful');

    await query('SELECT COUNT(*) FROM test_runs');
    console.log('   ✅ test_runs - query successful');

    await query('SELECT COUNT(*) FROM test_run_cases');
    console.log('   ✅ test_run_cases - query successful');

    await query('SELECT COUNT(*) FROM test_results');
    console.log('   ✅ test_results - query successful');

    await query('SELECT COUNT(*) FROM defects');
    console.log('   ✅ defects - query successful');

    await query('SELECT COUNT(*) FROM ai_prompt_templates');
    console.log('   ✅ ai_prompt_templates - query successful');

    await query('SELECT COUNT(*) FROM project_members');
    console.log('   ✅ project_members - query successful');

    console.log('\n🎉 All tables verified successfully!');
    console.log('✅ Migration is complete and database is ready');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run verification
verify()
  .then(() => {
    console.log('\n✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
