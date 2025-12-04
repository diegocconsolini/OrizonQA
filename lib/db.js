/**
 * Database Connection Module
 *
 * Provides database connectivity for the ORIZON application.
 * Uses pg Pool for PostgreSQL connections with lazy initialization.
 */

import pg from 'pg';

let pool = null;

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5433/orizonqa',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }
  return pool;
}

/**
 * Execute a parameterized query
 */
export async function query(text, params = []) {
  const client = getPool();
  return client.query(text, params);
}

/**
 * Initialize database schema
 */
export async function initDB() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        full_name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        claude_api_key_encrypted TEXT,
        lmstudio_url TEXT,
        ai_provider VARCHAR(20) DEFAULT 'claude',
        claude_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
        lmstudio_model VARCHAR(200),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        verification_code VARCHAR(6),
        verification_code_expires TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        input_type VARCHAR(50) NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        provider VARCHAR(20) NOT NULL,
        model VARCHAR(100),
        config JSONB,
        results JSONB,
        token_usage JSONB,
        github_url TEXT,
        github_branch VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        share_token VARCHAR(64) UNIQUE,
        is_shared BOOLEAN DEFAULT FALSE
      );
    `);

    // Add share columns to existing table if they don't exist
    await query(`
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
    `).catch(() => { /* columns may already exist */ });

    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        success BOOLEAN DEFAULT TRUE,
        country VARCHAR(2),
        city VARCHAR(100)
      );
    `);

    console.log('✓ Database schema initialized');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Save analysis to database
 * @param {object} data - Analysis data
 * @param {string} data.inputType - Type of input (paste, github, file)
 * @param {string} data.contentHash - SHA-256 hash of content
 * @param {string} data.provider - AI provider (claude, lmstudio)
 * @param {string} data.model - Model used
 * @param {object} data.config - Analysis configuration
 * @param {object} data.results - Parsed analysis results
 * @param {object} data.tokenUsage - Token usage stats
 * @param {string} [data.githubUrl] - GitHub repo URL (optional)
 * @param {string} [data.githubBranch] - GitHub branch (optional)
 * @param {number} [data.userId] - User ID (null for guest analyses)
 * @returns {Promise<{id: number, created_at: Date}>}
 */
export async function saveAnalysis(data) {
  const {
    inputType,
    contentHash,
    provider,
    model,
    config,
    results,
    tokenUsage,
    githubUrl,
    githubBranch,
    userId = null  // Default to null for guest users
  } = data;

  const result = await query(`
    INSERT INTO analyses (
      input_type,
      content_hash,
      provider,
      model,
      config,
      results,
      token_usage,
      github_url,
      github_branch,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, created_at
  `, [
    inputType,
    contentHash,
    provider,
    model,
    JSON.stringify(config),
    JSON.stringify(results),
    JSON.stringify(tokenUsage),
    githubUrl,
    githubBranch,
    userId  // Can be null
  ]);

  return result.rows[0];
}

export async function getRecentAnalyses(limit = 10) {
  const result = await query(`SELECT id, created_at, input_type, provider, model, github_url, github_branch, token_usage FROM analyses ORDER BY created_at DESC LIMIT $1`, [limit]);
  return result.rows;
}

export async function getAnalysisById(id) {
  const result = await query(`SELECT * FROM analyses WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

/**
 * Get analyses for a specific user
 * @param {number} userId - User ID
 * @param {number} [limit=10] - Number of results
 * @param {number} [offset=0] - Offset for pagination
 * @returns {Promise<Array>}
 */
export async function getAnalysesByUser(userId, limit = 10, offset = 0) {
  const result = await query(`
    SELECT
      id,
      created_at,
      input_type,
      provider,
      model,
      github_url,
      github_branch,
      token_usage,
      config
    FROM analyses
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    OFFSET $3
  `, [userId, limit, offset]);

  return result.rows;
}

/**
 * Get analysis count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>}
 */
export async function getAnalysisCountByUser(userId) {
  const result = await query(`
    SELECT COUNT(*) as count
    FROM analyses
    WHERE user_id = $1
  `, [userId]);

  return parseInt(result.rows[0].count, 10);
}

/**
 * Get full analysis by ID (only if owned by user)
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<object|null>}
 */
export async function getAnalysisByIdForUser(id, userId) {
  const result = await query(`
    SELECT *
    FROM analyses
    WHERE id = $1 AND user_id = $2
  `, [id, userId]);

  return result.rows[0] || null;
}

/**
 * Delete analysis (only if owned by user)
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<boolean>}
 */
export async function deleteAnalysis(id, userId) {
  const result = await query(`
    DELETE FROM analyses
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `, [id, userId]);

  return result.rows.length > 0;
}

/**
 * Toggle sharing for an analysis (enable or disable)
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @param {boolean} enable - Whether to enable or disable sharing
 * @returns {Promise<{shareToken: string|null, isShared: boolean}|null>}
 */
export async function toggleAnalysisSharing(id, userId, enable) {
  if (enable) {
    // Generate a new share token
    const shareToken = require('crypto').randomBytes(32).toString('hex');
    const result = await query(`
      UPDATE analyses
      SET share_token = $3, is_shared = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING share_token, is_shared
    `, [id, userId, shareToken]);

    if (result.rows.length === 0) return null;
    return {
      shareToken: result.rows[0].share_token,
      isShared: result.rows[0].is_shared
    };
  } else {
    // Disable sharing (but keep the token for potential re-enabling)
    const result = await query(`
      UPDATE analyses
      SET is_shared = FALSE
      WHERE id = $1 AND user_id = $2
      RETURNING share_token, is_shared
    `, [id, userId]);

    if (result.rows.length === 0) return null;
    return {
      shareToken: result.rows[0].share_token,
      isShared: result.rows[0].is_shared
    };
  }
}

/**
 * Get analysis by share token (public access)
 * @param {string} shareToken - The share token
 * @returns {Promise<object|null>}
 */
export async function getAnalysisByShareToken(shareToken) {
  const result = await query(`
    SELECT
      a.id,
      a.created_at,
      a.input_type,
      a.provider,
      a.model,
      a.config,
      a.results,
      a.token_usage,
      a.github_url,
      a.github_branch,
      u.name as author_name
    FROM analyses a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.share_token = $1 AND a.is_shared = TRUE
  `, [shareToken]);

  return result.rows[0] || null;
}

/**
 * Get sharing status for an analysis
 * @param {number} id - Analysis ID
 * @param {number} userId - User ID (for permission check)
 * @returns {Promise<{shareToken: string|null, isShared: boolean}|null>}
 */
export async function getAnalysisSharingStatus(id, userId) {
  const result = await query(`
    SELECT share_token, is_shared
    FROM analyses
    WHERE id = $1 AND user_id = $2
  `, [id, userId]);

  if (result.rows.length === 0) return null;
  return {
    shareToken: result.rows[0].share_token,
    isShared: result.rows[0].is_shared
  };
}

// ============================================
// TEST EXECUTION TABLES & FUNCTIONS
// ============================================

/**
 * Initialize test execution tables
 */
export async function initTestExecutionTables() {
  try {
    // Targets table - flexible scope concept
    await query(`
      CREATE TABLE IF NOT EXISTS targets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200),
        scope_type VARCHAR(20),
        github_repo VARCHAR(255),
        github_branch VARCHAR(100),
        file_paths TEXT[],
        code_hash VARCHAR(64),
        description TEXT,
        tags TEXT[],
        default_framework VARCHAR(50),
        default_strategy VARCHAR(20),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_analyzed_at TIMESTAMP
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_targets_user ON targets(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_targets_scope ON targets(scope_type);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_targets_hash ON targets(code_hash);`);

    // Test executions table
    await query(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
        target_id INTEGER REFERENCES targets(id) ON DELETE SET NULL,
        framework VARCHAR(50) NOT NULL,
        strategy VARCHAR(20) NOT NULL,
        environment JSONB DEFAULT '{}',
        test_code TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        total_tests INTEGER,
        passed_tests INTEGER,
        failed_tests INTEGER,
        skipped_tests INTEGER,
        duration_ms INTEGER,
        console_output TEXT,
        allure_report_url VARCHAR(500),
        raw_results JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_executions_user ON test_executions(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_executions_analysis ON test_executions(analysis_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_executions_status ON test_executions(status);`);

    // Test results table - individual test results
    await query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER REFERENCES test_executions(id) ON DELETE CASCADE,
        test_name VARCHAR(500) NOT NULL,
        test_file VARCHAR(500),
        test_suite VARCHAR(500),
        status VARCHAR(20) NOT NULL,
        duration_ms INTEGER,
        error_message TEXT,
        error_type VARCHAR(100),
        stack_trace TEXT,
        ai_fix_suggestion TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_results_execution ON test_results(execution_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_results_status ON test_results(status);`);

    // Execution credits table - for future billing
    await query(`
      CREATE TABLE IF NOT EXISTS execution_credits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        credits_remaining INTEGER DEFAULT 100,
        credits_used INTEGER DEFAULT 0,
        plan VARCHAR(20) DEFAULT 'free',
        reset_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_credits_user ON execution_credits(user_id);`);

    // Add execution columns to analyses table
    await query(`
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS target_id INTEGER REFERENCES targets(id);
    `).catch(() => {});
    await query(`
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS execution_status VARCHAR(20);
    `).catch(() => {});
    await query(`
      ALTER TABLE analyses ADD COLUMN IF NOT EXISTS last_execution_id INTEGER;
    `).catch(() => {});

    console.log('✓ Test execution tables initialized');
    return true;
  } catch (error) {
    console.error('Test execution tables initialization error:', error);
    return false;
  }
}

/**
 * Save test execution record
 */
export async function saveTestExecution(data) {
  const result = await query(`
    INSERT INTO test_executions (
      user_id, analysis_id, target_id, framework, strategy,
      environment, test_code, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `, [
    data.userId,
    data.analysisId,
    data.targetId,
    data.framework,
    data.strategy,
    JSON.stringify(data.environment || {}),
    data.testCode,
    'pending'
  ]);
  return result.rows[0];
}

/**
 * Update execution status
 */
export async function updateExecutionStatus(id, updates) {
  const setClauses = [];
  const values = [id];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = $${paramIndex}`);
    values.push(
      key.includes('results') || key === 'environment'
        ? JSON.stringify(value)
        : value
    );
    paramIndex++;
  }

  setClauses.push(`updated_at = NOW()`);

  await query(`
    UPDATE test_executions
    SET ${setClauses.join(', ')}
    WHERE id = $1
  `, values);
}

/**
 * Save individual test result
 */
export async function saveTestResult(executionId, result) {
  await query(`
    INSERT INTO test_results (
      execution_id, test_name, test_file, test_suite,
      status, duration_ms, error_message, error_type, stack_trace
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    executionId,
    result.testName,
    result.testFile,
    result.testSuite,
    result.status,
    result.durationMs,
    result.errorMessage,
    result.errorType,
    result.stackTrace
  ]);
}

/**
 * Get execution by ID with results
 */
export async function getExecutionById(id) {
  const result = await query(`
    SELECT e.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', r.id,
                 'test_name', r.test_name,
                 'test_file', r.test_file,
                 'test_suite', r.test_suite,
                 'status', r.status,
                 'duration_ms', r.duration_ms,
                 'error_message', r.error_message
               )
             ) FILTER (WHERE r.id IS NOT NULL),
             '[]'
           ) as results
    FROM test_executions e
    LEFT JOIN test_results r ON r.execution_id = e.id
    WHERE e.id = $1
    GROUP BY e.id
  `, [id]);
  return result.rows[0];
}

/**
 * Get executions for user
 */
export async function getExecutionsByUser(userId, limit = 20, offset = 0) {
  const result = await query(`
    SELECT e.*, a.github_url, a.github_branch
    FROM test_executions e
    LEFT JOIN analyses a ON e.analysis_id = a.id
    WHERE e.user_id = $1
    ORDER BY e.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);
  return result.rows;
}

/**
 * Get execution count for user
 */
export async function getExecutionCountByUser(userId) {
  const result = await query(`
    SELECT COUNT(*) as count
    FROM test_executions
    WHERE user_id = $1
  `, [userId]);
  return parseInt(result.rows[0].count, 10);
}
