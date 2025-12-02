import pg from 'pg';

const sql = `
-- project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    added_by INTEGER REFERENCES users(id),
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- test_runs table
CREATE TABLE IF NOT EXISTS test_runs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT NOW()
);

-- defects table
CREATE TABLE IF NOT EXISTS defects (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT NOW()
);
`;

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL
});

async function createTables() {
  try {
    await pool.query(sql);
    console.log('✓ Tables created successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    await pool.end();
    process.exit(1);
  }
}

createTables();
