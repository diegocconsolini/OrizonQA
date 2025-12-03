/**
 * Migration: Add lmstudio_model column to users table
 *
 * Run with: node scripts/add-lmstudio-model-column.js
 */

import pg from 'pg';

const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5433/orizonqa';

async function migrate() {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'lmstudio_model'
    `);

    if (checkResult.rows.length > 0) {
      console.log('Column lmstudio_model already exists');
      return;
    }

    // Add the column
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS lmstudio_model VARCHAR(200)
    `);

    console.log('✓ Added lmstudio_model column to users table');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
