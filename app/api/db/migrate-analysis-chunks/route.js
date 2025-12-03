/**
 * Analysis Chunks Migration API
 *
 * POST /api/db/migrate-analysis-chunks
 *
 * Creates tables for storing multi-pass analysis results:
 * - analysis_chunks: Per-chunk analysis results
 * - file_analysis_cache: Per-file cached results for incremental analysis
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    console.log('Starting analysis chunks migration...');

    // Create analysis_chunks table for multi-pass results
    await query(`
      CREATE TABLE IF NOT EXISTS analysis_chunks (
        id SERIAL PRIMARY KEY,
        analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,

        -- Chunk identification
        chunk_index INTEGER NOT NULL,
        chunk_type VARCHAR(50), -- 'source', 'lib', 'api', 'component', 'synthesis'

        -- Files in this chunk
        file_paths TEXT[], -- Array of file paths included
        file_count INTEGER,

        -- Content tracking
        content_hash VARCHAR(64), -- SHA-256 of chunk content

        -- Token usage for this chunk
        input_tokens INTEGER,
        output_tokens INTEGER,

        -- Analysis results (structured)
        result_json JSONB,

        -- Metadata
        processing_time_ms INTEGER,
        status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
        error_message TEXT,

        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(analysis_id, chunk_index)
      );
    `);
    console.log('Created analysis_chunks table');

    // Create file_analysis_cache for per-file incremental caching
    await query(`
      CREATE TABLE IF NOT EXISTS file_analysis_cache (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

        -- Repository identification
        repo_full_name VARCHAR(255) NOT NULL,
        branch VARCHAR(100),
        file_path VARCHAR(500) NOT NULL,

        -- Content tracking (for cache invalidation)
        content_hash VARCHAR(64) NOT NULL, -- SHA-256 of file content

        -- Analysis type and results
        analysis_type VARCHAR(50), -- 'user_stories', 'test_cases', 'acceptance_criteria', 'full'
        result_json JSONB NOT NULL,

        -- Token usage
        input_tokens INTEGER,
        output_tokens INTEGER,

        -- Cache management
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
        hit_count INTEGER DEFAULT 0,
        last_hit_at TIMESTAMP,

        UNIQUE(user_id, repo_full_name, branch, file_path, content_hash, analysis_type)
      );
    `);
    console.log('Created file_analysis_cache table');

    // Create indexes for analysis_chunks
    await query(`
      CREATE INDEX IF NOT EXISTS idx_analysis_chunks_analysis_id
      ON analysis_chunks(analysis_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_analysis_chunks_content_hash
      ON analysis_chunks(content_hash);
    `);
    console.log('Created analysis_chunks indexes');

    // Create indexes for file_analysis_cache
    await query(`
      CREATE INDEX IF NOT EXISTS idx_file_cache_lookup
      ON file_analysis_cache(user_id, repo_full_name, branch, content_hash);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_file_cache_user
      ON file_analysis_cache(user_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_file_cache_expiry
      ON file_analysis_cache(expires_at)
      WHERE expires_at IS NOT NULL;
    `);
    console.log('Created file_analysis_cache indexes');

    // Create function to update cache hit count
    await query(`
      CREATE OR REPLACE FUNCTION update_file_cache_hit()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.hit_count = COALESCE(OLD.hit_count, 0) + 1;
        NEW.last_hit_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created cache hit tracking function');

    return NextResponse.json({
      success: true,
      message: 'Analysis chunks tables created successfully',
      tables: ['analysis_chunks', 'file_analysis_cache']
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
    message: 'POST to this endpoint to run the analysis chunks migration',
    tables: ['analysis_chunks', 'file_analysis_cache'],
    description: 'Creates tables for multi-pass analysis caching and incremental analysis'
  });
}
