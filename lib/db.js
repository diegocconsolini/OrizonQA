import { sql } from '@vercel/postgres';
import pg from 'pg';

const { Pool } = pg;

/**
 * Database connection strategy:
 * - Production (Vercel): Uses @vercel/postgres (automatically configured)
 * - Local dev: Uses pg Pool with local PostgreSQL
 *
 * Environment variables:
 * - POSTGRES_URL: Full connection string (Vercel auto-populates this)
 * - NODE_ENV: Set to 'development' for local, 'production' for Vercel
 */

let pool = null;

// Initialize database connection based on environment
function getDB() {
  // On Vercel, use @vercel/postgres (no setup needed, env vars auto-configured)
  if (process.env.VERCEL) {
    return sql;
  }

  // Local development: use pg Pool
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/orizonqa',
      // Local dev settings
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  // Wrap pg Pool to match @vercel/postgres sql interface
  return {
    query: async (strings, ...values) => {
      const text = typeof strings === 'string' ? strings : strings.join('?');
      const result = await pool.query(text, values);
      return result;
    }
  };
}

export const db = getDB();

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
export async function initDB() {
  try {
    await db.query(`
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
        github_branch VARCHAR(255)
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_content_hash ON analyses(content_hash);
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
    githubBranch
  } = data;

  try {
    const result = await db.query(`
      INSERT INTO analyses
      (input_type, content_hash, provider, model, config, results, token_usage, github_url, github_branch)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `, [
      inputType,
      contentHash,
      provider,
      model,
      JSON.stringify(config),
      JSON.stringify(results),
      JSON.stringify(tokenUsage),
      githubUrl || null,
      githubBranch || null
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
}

/**
 * Get recent analyses
 */
export async function getRecentAnalyses(limit = 10) {
  try {
    const result = await db.query(`
      SELECT
        id,
        created_at,
        input_type,
        provider,
        model,
        github_url,
        github_branch,
        token_usage
      FROM analyses
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return [];
  }
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(id) {
  try {
    const result = await db.query(`
      SELECT * FROM analyses WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}
