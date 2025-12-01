#!/usr/bin/env node

/**
 * Professional QA System Database Migration
 *
 * This script adds 11 new tables to support comprehensive QA management:
 * 1. projects - Project management
 * 2. requirements - User stories/features (Xray-style)
 * 3. test_suites - Folder organization
 * 4. test_cases - Enhanced with AI metadata
 * 5. test_coverage - Traceability links
 * 6. test_plans - TestRail-style
 * 7. test_runs - Execution instances
 * 8. test_run_cases - Run-case links
 * 9. test_results - Execution details
 * 10. defects - Bug tracking
 * 11. ai_prompt_templates - 60+ template library
 * 12. project_members - Team collaboration
 *
 * Reference: ORIZON_PROFESSIONAL_QA_DESIGN.md Part 2
 */

import { query } from '../lib/db.js';

async function migrate() {
  console.log('🚀 Starting Professional QA System migration...\n');

  try {
    // Table 1: projects
    console.log('📦 Creating table: projects');
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        key VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        settings JSONB DEFAULT '{}'
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_projects_key ON projects(key);`);
    console.log('✅ projects table created\n');

    // Table 2: requirements
    console.log('📋 Creating table: requirements');
    await query(`
      CREATE TABLE IF NOT EXISTS requirements (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        key VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'Story',
        status VARCHAR(50) DEFAULT 'Open',
        priority VARCHAR(20) DEFAULT 'Medium',
        version VARCHAR(100),
        external_id VARCHAR(255),
        external_url TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_requirements_key ON requirements(key);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_requirements_version ON requirements(version);`);
    console.log('✅ requirements table created\n');

    // Table 3: test_suites
    console.log('📁 Creating table: test_suites');
    await query(`
      CREATE TABLE IF NOT EXISTS test_suites (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES test_suites(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        folder_path VARCHAR(500) DEFAULT '/',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_suites_project ON test_suites(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_suites_parent ON test_suites(parent_id);`);
    console.log('✅ test_suites table created\n');

    // Table 4: test_cases
    console.log('🧪 Creating table: test_cases');
    await query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        suite_id INTEGER REFERENCES test_suites(id),
        key VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        preconditions TEXT,
        steps JSONB,
        expected_result TEXT,
        postconditions TEXT,
        priority VARCHAR(20) DEFAULT 'Medium',
        type VARCHAR(50) DEFAULT 'Functional',
        status VARCHAR(20) DEFAULT 'Draft',
        automated BOOLEAN DEFAULT FALSE,
        automation_script TEXT,
        tags JSONB DEFAULT '[]',
        custom_fields JSONB DEFAULT '{}',
        estimated_time INTEGER,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        version INTEGER DEFAULT 1,
        ai_generated BOOLEAN DEFAULT FALSE,
        ai_model VARCHAR(100),
        ai_prompt_template VARCHAR(255),
        analysis_id INTEGER REFERENCES analyses(id)
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_project ON test_cases(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_suite ON test_cases(suite_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_key ON test_cases(key);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_cases_automated ON test_cases(automated);`);
    console.log('✅ test_cases table created\n');

    // Table 5: test_coverage
    console.log('🔗 Creating table: test_coverage');
    await query(`
      CREATE TABLE IF NOT EXISTS test_coverage (
        id SERIAL PRIMARY KEY,
        requirement_id INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
        test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
        coverage_type VARCHAR(50) DEFAULT 'Covers',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(requirement_id, test_case_id)
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_coverage_requirement ON test_coverage(requirement_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_coverage_test_case ON test_coverage(test_case_id);`);
    console.log('✅ test_coverage table created\n');

    // Table 6: test_plans
    console.log('📅 Creating table: test_plans');
    await query(`
      CREATE TABLE IF NOT EXISTS test_plans (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        milestone VARCHAR(100),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_plans_project ON test_plans(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_plans_milestone ON test_plans(milestone);`);
    console.log('✅ test_plans table created\n');

    // Table 7: test_runs
    console.log('▶️  Creating table: test_runs');
    await query(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES test_plans(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        environment VARCHAR(100),
        build_version VARCHAR(100),
        assigned_to INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Open',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_runs_project ON test_runs(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_runs_plan ON test_runs(plan_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_runs_assigned ON test_runs(assigned_to);`);
    console.log('✅ test_runs table created\n');

    // Table 8: test_run_cases
    console.log('🔗 Creating table: test_run_cases');
    await query(`
      CREATE TABLE IF NOT EXISTS test_run_cases (
        id SERIAL PRIMARY KEY,
        run_id INTEGER REFERENCES test_runs(id) ON DELETE CASCADE,
        test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Untested',
        executed_at TIMESTAMP,
        execution_time INTEGER,
        UNIQUE(run_id, test_case_id)
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_run_cases_run ON test_run_cases(run_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_run_cases_test_case ON test_run_cases(test_case_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_run_cases_status ON test_run_cases(status);`);
    console.log('✅ test_run_cases table created\n');

    // Table 9: test_results
    console.log('📊 Creating table: test_results');
    await query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        run_case_id INTEGER REFERENCES test_run_cases(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        comment TEXT,
        actual_result TEXT,
        steps_results JSONB,
        attachments JSONB DEFAULT '[]',
        defects JSONB DEFAULT '[]',
        executed_by INTEGER REFERENCES users(id),
        executed_at TIMESTAMP DEFAULT NOW(),
        execution_time INTEGER
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_results_run_case ON test_results(run_case_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_test_results_executed_by ON test_results(executed_by);`);
    console.log('✅ test_results table created\n');

    // Table 10: defects
    console.log('🐛 Creating table: defects');
    await query(`
      CREATE TABLE IF NOT EXISTS defects (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        key VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        severity VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Open',
        external_id VARCHAR(255),
        external_url TEXT,
        found_in_version VARCHAR(100),
        fixed_in_version VARCHAR(100),
        reported_by INTEGER REFERENCES users(id),
        assigned_to INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_defects_key ON defects(key);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);`);
    console.log('✅ defects table created\n');

    // Table 11: ai_prompt_templates
    console.log('🤖 Creating table: ai_prompt_templates');
    await query(`
      CREATE TABLE IF NOT EXISTS ai_prompt_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        prompt_text TEXT NOT NULL,
        is_system BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category ON ai_prompt_templates(category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_created_by ON ai_prompt_templates(created_by);`);
    console.log('✅ ai_prompt_templates table created\n');

    // Table 12: project_members
    console.log('👥 Creating table: project_members');
    await query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'Tester',
        added_at TIMESTAMP DEFAULT NOW(),
        added_by INTEGER REFERENCES users(id),
        UNIQUE(project_id, user_id)
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);`);
    console.log('✅ project_members table created\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 12 tables created');
    console.log('   - 24 indexes created');
    console.log('   - Full traceability support');
    console.log('   - AI integration ready');
    console.log('   - TestRail + Xray features enabled\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
