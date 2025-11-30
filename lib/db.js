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
      connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/orizonqa',
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
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      );
    `);

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

export async function saveAnalysis(data) {
  const { inputType, contentHash, provider, model, config, results, tokenUsage, githubUrl, githubBranch } = data;
  const result = await query(`
    INSERT INTO analyses (input_type, content_hash, provider, model, config, results, token_usage, github_url, github_branch)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at
  `, [inputType, contentHash, provider, model, JSON.stringify(config), JSON.stringify(results), JSON.stringify(tokenUsage), githubUrl, githubBranch]);
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
