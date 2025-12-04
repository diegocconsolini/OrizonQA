# Database & Caching Setup

OrizonQA uses **Vercel Postgres** for persistent storage and **Vercel KV (Redis)** for caching.

## Architecture

### Production (Vercel)
- **Database**: Vercel Postgres (auto-configured)
- **Cache**: Vercel KV (auto-configured)
- No manual configuration needed

### Local Development
- **Database**: PostgreSQL via Docker
- **Cache**: Redis via Docker
- Requires Docker and manual setup

---

## Local Development Setup

### 1. Install Docker

Make sure Docker and Docker Compose are installed:
```bash
docker --version
docker-compose --version
```

### 2. Start Local Databases

Start PostgreSQL and Redis containers:
```bash
docker-compose up -d
```

Check that containers are running:
```bash
docker-compose ps
```

You should see:
- `orizonqa-postgres` on port 5432
- `orizonqa-redis` on port 6379

### 3. Configure Environment Variables

Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

The default values work with Docker Compose:
```env
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/orizonqa
REDIS_URL=redis://localhost:6379
```

### 4. Initialize Database Schema

Start the dev server:
```bash
npm run dev
```

Initialize the database tables by visiting:
```
http://localhost:3000/api/db/init
```

You should see:
```json
{
  "message": "Database initialized successfully",
  "success": true
}
```

### 5. Verify Setup

Check database connection:
```bash
docker exec -it orizonqa-postgres psql -U postgres -d orizonqa -c "\dt"
```

You should see the `analyses` table.

Check Redis connection:
```bash
docker exec -it orizonqa-redis redis-cli ping
```

You should see `PONG`.

---

## Database Schema

### Core Tables

#### `users` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `email` | VARCHAR(255) | User email (unique) |
| `email_verified` | BOOLEAN | Email verification status |
| `password_hash` | VARCHAR(255) | Hashed password (bcrypt) |
| `claude_api_key_encrypted` | TEXT | AES-256-GCM encrypted API key |
| `ai_provider` | VARCHAR(20) | Default AI provider |
| `created_at` | TIMESTAMP | Account creation time |

#### `analyses` table
Stores all analysis results for history and caching.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | FK to users (nullable) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `input_type` | VARCHAR(50) | Input method (paste/github/upload) |
| `content_hash` | VARCHAR(64) | SHA-256 hash of content |
| `provider` | VARCHAR(20) | AI provider (claude/lmstudio) |
| `model` | VARCHAR(100) | Model name |
| `config` | JSONB | Analysis configuration |
| `results` | JSONB | Generated QA artifacts |
| `token_usage` | JSONB | Token usage stats |
| `github_url` | TEXT | GitHub repo URL (if applicable) |
| `github_branch` | VARCHAR(255) | GitHub branch (if applicable) |

#### `todos` table
Persistent todo list with subtasks support.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | FK to users |
| `title` | VARCHAR(500) | Todo title (required) |
| `description` | TEXT | Optional description |
| `status` | VARCHAR(20) | pending/in_progress/completed |
| `priority` | VARCHAR(10) | low/medium/high |
| `due_date` | TIMESTAMP | Optional due date |
| `tags` | TEXT[] | Array of tags |
| `parent_id` | INTEGER | FK to todos (for subtasks) |
| `position` | INTEGER | Order position |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `completed_at` | TIMESTAMP | Completion time (nullable) |

**Indexes:**
- `idx_todos_user` - Filter by user
- `idx_todos_status` - Filter by status
- `idx_todos_parent` - Find subtasks
- `idx_todos_priority` - Filter by priority

### Additional Tables

#### `audit_logs` table
Security event logging.

#### `test_executions` table
Browser-based test execution records.

#### `test_results` table
Individual test results from executions.

### Migration Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/db/init` | Initialize core tables (users, analyses, audit_logs) |
| `/api/db/migrate-test-execution` | Create test execution tables |
| `/api/db/migrate-todos` | Create todos table |

**Indexes:**
- `idx_analyses_created_at` - Fast recent queries
- `idx_analyses_content_hash` - Fast duplicate detection

---

## Caching Strategy

### Redis Keys

1. **GitHub Repository Cache**
   - Key: `github:{owner}/{repo}:{branch}`
   - TTL: 1 hour (3600 seconds)
   - Purpose: Avoid re-fetching same repo multiple times

2. **Analysis Results Cache**
   - Key: `analysis:{content_hash}`
   - TTL: 2 hours (7200 seconds)
   - Purpose: Return cached results for identical content

### Cache Benefits

- **GitHub Fetching**: Reduces API calls to GitHub
- **Analysis Results**: Avoids re-analyzing identical code
- **Performance**: Instant responses for cached content

---

## Production Deployment (Vercel)

### 1. Create Vercel Postgres Database

In your Vercel project dashboard:
1. Go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a region close to your users
5. Click **Create**

Vercel automatically sets these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 2. Create Vercel KV Store

In your Vercel project dashboard:
1. Go to **Storage** tab
2. Click **Create Database**
3. Select **KV**
4. Choose a region close to your users
5. Click **Create**

Vercel automatically sets these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_URL`

### 3. Initialize Production Database

After deployment, visit:
```
https://your-app.vercel.app/api/db/init
```

This creates the necessary tables in your Vercel Postgres database.

---

## Database Operations

### Query Recent Analyses

```javascript
import { getRecentAnalyses } from '@/lib/db';

const analyses = await getRecentAnalyses(10);
```

### Save New Analysis

```javascript
import { saveAnalysis } from '@/lib/db';
import crypto from 'crypto';

const contentHash = crypto.createHash('sha256')
  .update(content)
  .digest('hex');

const saved = await saveAnalysis({
  inputType: 'paste',
  contentHash,
  provider: 'claude',
  model: 'claude-sonnet-4-20250514',
  config,
  results,
  tokenUsage
});
```

### Cache GitHub Repository

```javascript
import { cacheGitHubRepo, getCachedGitHubRepo } from '@/lib/cache';

// Check cache first
const cached = await getCachedGitHubRepo('owner', 'repo', 'main');
if (cached) {
  return cached;
}

// Fetch and cache
const data = await fetchFromGitHub();
await cacheGitHubRepo('owner', 'repo', 'main', data, 3600);
```

---

## Maintenance

### Stop Local Databases

```bash
docker-compose down
```

### Clear All Data (Reset)

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d    # Restart fresh
npm run dev             # Restart dev server
# Visit http://localhost:3000/api/db/init to recreate schema
```

### View Logs

PostgreSQL logs:
```bash
docker-compose logs postgres
```

Redis logs:
```bash
docker-compose logs redis
```

### Access Database Directly

PostgreSQL shell:
```bash
docker exec -it orizonqa-postgres psql -U postgres -d orizonqa
```

Redis CLI:
```bash
docker exec -it orizonqa-redis redis-cli
```

---

## Troubleshooting

### "Connection refused" errors

Check if Docker containers are running:
```bash
docker-compose ps
```

If not running, start them:
```bash
docker-compose up -d
```

### Database initialization fails

1. Check PostgreSQL is running:
   ```bash
   docker-compose logs postgres
   ```

2. Verify connection string in `.env.local`:
   ```env
   POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/orizonqa
   ```

3. Test connection manually:
   ```bash
   docker exec -it orizonqa-postgres pg_isready -U postgres
   ```

### Cache not working

If Redis is unavailable, the app falls back to in-memory caching. Check Redis status:
```bash
docker exec -it orizonqa-redis redis-cli ping
```

If you see connection errors, Redis will gracefully degrade to in-memory cache.

---

## Best Practices

1. **Always use caching** for expensive operations (GitHub fetching, AI analysis)
2. **Check cache first** before making external API calls
3. **Set appropriate TTLs** - shorter for frequently changing data, longer for stable data
4. **Monitor database size** - archive or delete old analyses periodically
5. **Use content hashing** to avoid storing duplicate analyses

---

## Future Enhancements

- [x] User authentication and ownership ✅
- [x] Analysis history UI ✅
- [x] Persistent todo list ✅
- [ ] Export analysis history to CSV/JSON
- [ ] Shared analysis links
- [ ] Rate limiting per user
- [ ] Analytics dashboard
