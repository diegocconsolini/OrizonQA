/**
 * Seed Analytics Data Script
 *
 * Inserts simulated usage data for dashboard testing.
 * Run with: node scripts/seed-analytics-data.js
 */

import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'orizonqa',
  user: 'postgres',
  password: 'postgres'
});

// Sample GitHub repos for realistic data
const sampleRepos = [
  'https://github.com/vercel/next.js',
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
  'https://github.com/tailwindlabs/tailwindcss',
  'https://github.com/anthropics/anthropic-sdk-python',
  'https://github.com/openai/openai-node',
  'https://github.com/prisma/prisma',
  'https://github.com/supabase/supabase'
];

const providers = ['claude', 'lmstudio'];
const inputTypes = ['github', 'paste', 'file'];
const models = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'llama-3.1-8b'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHash() {
  return crypto.randomBytes(32).toString('hex');
}

async function seedData() {
  const client = await pool.connect();

  try {
    // Get user ID 1
    const userId = 1;

    console.log(`Seeding analytics data for user ${userId}...`);

    // Generate data for the last 45 days
    const analyses = [];
    const now = new Date();

    for (let daysAgo = 0; daysAgo < 45; daysAgo++) {
      // Vary the number of analyses per day (0-6)
      const analysesPerDay = daysAgo < 7
        ? randomInt(2, 6)  // More recent = more activity
        : daysAgo < 14
          ? randomInt(1, 4)
          : randomInt(0, 3);

      for (let i = 0; i < analysesPerDay; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));

        const provider = randomChoice(providers);
        const inputType = randomChoice(inputTypes);
        const model = provider === 'claude'
          ? randomChoice(models.filter(m => m.startsWith('claude')))
          : 'llama-3.1-8b';

        const inputTokens = randomInt(500, 8000);
        const outputTokens = randomInt(1000, 12000);

        analyses.push({
          created_at: date.toISOString(),
          input_type: inputType,
          content_hash: generateHash(),
          provider,
          model,
          config: JSON.stringify({
            analysisOptions: ['userStories', 'testCases', 'acceptanceCriteria'],
            outputFormat: randomChoice(['markdown', 'json']),
            testFramework: randomChoice(['jest', 'pytest', 'junit', 'generic'])
          }),
          results: JSON.stringify({
            userStories: '## User Stories\n\n- As a user, I want to...',
            testCases: '## Test Cases\n\n```javascript\ntest("should work", () => {});```',
            acceptanceCriteria: '## Acceptance Criteria\n\n- Given... When... Then...'
          }),
          token_usage: JSON.stringify({
            input_tokens: inputTokens,
            output_tokens: outputTokens
          }),
          github_url: inputType === 'github' ? randomChoice(sampleRepos) : null,
          github_branch: inputType === 'github' ? 'main' : null,
          user_id: userId
        });
      }
    }

    console.log(`Inserting ${analyses.length} analyses...`);

    // Insert in batches
    for (const analysis of analyses) {
      await client.query(`
        INSERT INTO analyses (
          created_at, input_type, content_hash, provider, model,
          config, results, token_usage, github_url, github_branch, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        analysis.created_at,
        analysis.input_type,
        analysis.content_hash,
        analysis.provider,
        analysis.model,
        analysis.config,
        analysis.results,
        analysis.token_usage,
        analysis.github_url,
        analysis.github_branch,
        analysis.user_id
      ]);
    }

    console.log('Done! Verifying...');

    // Verify
    const result = await client.query(`
      SELECT
        COUNT(*) as total,
        SUM((token_usage->>'input_tokens')::int + (token_usage->>'output_tokens')::int) as total_tokens
      FROM analyses
      WHERE user_id = $1
    `, [userId]);

    console.log(`Total analyses: ${result.rows[0].total}`);
    console.log(`Total tokens: ${result.rows[0].total_tokens}`);

    // Summary by provider
    const byProvider = await client.query(`
      SELECT provider, COUNT(*) as count
      FROM analyses
      WHERE user_id = $1
      GROUP BY provider
    `, [userId]);
    console.log('By provider:', byProvider.rows);

    // Summary by input type
    const byInputType = await client.query(`
      SELECT input_type, COUNT(*) as count
      FROM analyses
      WHERE user_id = $1
      GROUP BY input_type
    `, [userId]);
    console.log('By input type:', byInputType.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

seedData().catch(console.error);
