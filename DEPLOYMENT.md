# OrizonQA - Deployment Guide

Complete guide for deploying OrizonQA to Vercel with databases.

---

## Prerequisites

- GitHub account with OrizonQA repository
- Vercel account (free tier works)
- Docker installed (for local development)

---

## Part 1: Vercel Deployment

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Add database and caching infrastructure"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `diegocconsolini/OrizonQA`
4. Click **"Deploy"**

Vercel will automatically:
- Detect Next.js framework
- Install dependencies
- Build the application
- Deploy to production

**Deployment URL**: `https://orizon-qa.vercel.app` (or your custom domain)

---

## Part 2: Set Up Vercel Postgres

### 1. Create Database

1. In your Vercel project dashboard, go to **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Configure database:
   - **Name**: `orizonqa-db` (or your preference)
   - **Region**: Choose closest to your users (e.g., `us-east-1` for USA)
   - **Plan**: Start with **"Hobby"** (free)
5. Click **"Create"**

### 2. Connect to Project

1. After creation, click **"Connect Project"**
2. Select your `OrizonQA` project
3. Choose **"All"** environments or just **"Production"**
4. Click **"Connect"**

Vercel automatically adds these environment variables:
- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - Prisma-optimized URL
- `POSTGRES_URL_NON_POOLING` - Direct connection URL
- `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

### 3. Initialize Database Schema

1. Trigger a new deployment (or wait for auto-deploy from git push)
2. After deployment completes, visit:
   ```
   https://orizon-qa.vercel.app/api/db/init
   ```
3. You should see:
   ```json
   {
     "message": "Database initialized successfully",
     "success": true
   }
   ```

This creates the `analyses` table with all indexes.

### 4. Verify Database (Optional)

In Vercel dashboard:
1. Go to **Storage** → Your Postgres database
2. Click **"Data"** tab
3. You should see the `analyses` table

---

## Part 3: Set Up Vercel KV (Redis)

### 1. Create KV Store

1. In your Vercel project dashboard, go to **"Storage"** tab
2. Click **"Create Database"**
3. Select **"KV"** (Redis)
4. Configure KV store:
   - **Name**: `orizonqa-cache` (or your preference)
   - **Region**: Same as Postgres for best performance
   - **Plan**: Start with **"Hobby"** (free, 256MB storage)
5. Click **"Create"**

### 2. Connect to Project

1. After creation, click **"Connect Project"**
2. Select your `OrizonQA` project
3. Choose **"All"** environments or just **"Production"**
4. Click **"Connect"**

Vercel automatically adds these environment variables:
- `KV_URL` - Connection URL
- `KV_REST_API_URL` - REST API endpoint
- `KV_REST_API_TOKEN` - Authentication token
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token

### 3. Test Caching (Automatic)

The cache is automatically used for:
- GitHub repository fetches (1 hour TTL)
- Analysis results (2 hour TTL)

No manual testing needed - it works transparently!

---

## Part 4: Verify Deployment

### 1. Test the Application

Visit your deployment: `https://orizon-qa.vercel.app`

### 2. Test Database Storage

1. Run an analysis (paste code or fetch from GitHub)
2. The analysis is automatically saved to Postgres
3. Check Vercel dashboard → Storage → Postgres → Data tab
4. You should see a new row in `analyses` table

### 3. Test Caching

**GitHub Fetch Caching:**
1. Fetch a GitHub repository (e.g., `https://github.com/vercel/next.js`)
2. First fetch: Makes API calls to GitHub
3. Second fetch (within 1 hour): Instant response from cache

**Analysis Caching:**
1. Analyze the same code twice
2. Second analysis: Instant response from cache (if within 2 hours)

### 4. Monitor Logs

In Vercel dashboard:
1. Go to **"Deployments"** tab
2. Click on latest deployment
3. View **"Functions"** logs
4. Look for cache hit/miss messages:
   ```
   ✓ Cache hit: github:vercel/next.js:main
   ✓ Cached analysis: 3a4b5c6d...
   ```

---

## Part 5: Local Development Workflow

### 1. Clone Repository

```bash
git clone https://github.com/diegocconsolini/OrizonQA.git
cd OrizonQA
npm install
```

### 2. Start Local Databases

```bash
# Start PostgreSQL and Redis in Docker
docker-compose up -d

# Verify containers are running
docker-compose ps
```

You should see:
- `orizonqa-postgres` (healthy)
- `orizonqa-redis` (healthy)

### 3. Configure Environment

```bash
# Create local environment file
cp .env.local.example .env.local
```

Default `.env.local` contents:
```env
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/orizonqa
REDIS_URL=redis://localhost:6379
```

### 4. Initialize Local Database

```bash
# Start dev server
npm run dev

# In browser, visit:
http://localhost:3000/api/db/init
```

You should see: `{"message":"Database initialized successfully","success":true}`

### 5. Develop Locally

```bash
# Run dev server (already running from step 4)
npm run dev
```

App is now available at: `http://localhost:3000`

**Local databases are ready:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 6. Stop Local Databases

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## Environment Variable Summary

### Production (Vercel) - Auto-configured

| Variable | Source | Purpose |
|----------|--------|---------|
| `POSTGRES_URL` | Vercel Postgres | Database connection |
| `KV_REST_API_URL` | Vercel KV | Cache endpoint |
| `KV_REST_API_TOKEN` | Vercel KV | Cache auth token |

### Local Development - Manual setup

| Variable | Value | Purpose |
|----------|-------|---------|
| `POSTGRES_URL` | `postgresql://postgres:postgres@localhost:5432/orizonqa` | Local PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Local Redis |

---

## Database Schema

### `analyses` Table

Stores all analysis history:

```sql
CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  input_type VARCHAR(50) NOT NULL,      -- 'paste', 'github', 'upload'
  content_hash VARCHAR(64) NOT NULL,    -- SHA-256 hash for deduplication
  provider VARCHAR(20) NOT NULL,         -- 'claude', 'lmstudio'
  model VARCHAR(100),                    -- Model name
  config JSONB,                          -- Analysis configuration
  results JSONB,                         -- Generated QA artifacts
  token_usage JSONB,                     -- Token usage stats
  github_url TEXT,                       -- GitHub repo URL (if applicable)
  github_branch VARCHAR(255)             -- GitHub branch (if applicable)
);

CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_content_hash ON analyses(content_hash);
```

---

## Caching Strategy

### Redis Keys

**GitHub Repository Cache:**
- Key: `github:{owner}/{repo}:{branch}`
- TTL: 3600 seconds (1 hour)
- Purpose: Avoid re-fetching same repo

**Analysis Results Cache:**
- Key: `analysis:{content_hash}`
- TTL: 7200 seconds (2 hours)
- Purpose: Return cached results for identical code

---

## Troubleshooting

### "Database initialization failed"

**Problem**: Cannot connect to database

**Solutions**:

**Local Dev:**
```bash
# Check if Docker containers are running
docker-compose ps

# If not running, start them
docker-compose up -d

# Check logs
docker-compose logs postgres
```

**Production:**
1. Verify Postgres is connected in Vercel dashboard
2. Check Environment Variables tab for `POSTGRES_URL`
3. Redeploy if needed

### "Cache not working"

**Problem**: Redis connection errors

**Solutions**:

**Local Dev:**
```bash
# Check Redis container
docker exec -it orizonqa-redis redis-cli ping
# Should return: PONG
```

**Production:**
1. Verify KV store is connected in Vercel dashboard
2. Check Environment Variables for `KV_REST_API_URL` and `KV_REST_API_TOKEN`

**Note**: If Redis is unavailable, the app gracefully falls back to in-memory caching.

### Build Errors on Vercel

**Problem**: Deployment fails during build

**Solutions**:
1. Check Vercel deployment logs for specific error
2. Ensure `package.json` dependencies are correct
3. Try clearing build cache: Settings → General → Clear Build Cache
4. Redeploy

---

## Cost Considerations

### Free Tier Limits (Vercel Hobby Plan)

**Postgres:**
- 256 MB storage
- 60 hours compute time/month
- 3 GB data transfer/month

**KV (Redis):**
- 256 MB storage
- 3,000 commands/day
- 200 MB bandwidth/day

**Next.js Deployment:**
- 100 GB bandwidth/month
- Serverless function executions: 100,000/month
- Build execution: 100 hours/month

### Monitoring Usage

1. Vercel Dashboard → Your Project → Settings → Usage
2. Check database size: Storage → Postgres → Overview
3. Check KV usage: Storage → KV → Analytics

---

## Next Steps

After successful deployment:

1. **Configure Custom Domain** (optional)
   - Vercel Dashboard → Settings → Domains
   - Add your domain and configure DNS

2. **Set Up Analytics** (optional)
   - Enable Vercel Analytics in project settings
   - Monitor page views and performance

3. **Enable Monitoring**
   - Use Vercel deployment logs
   - Set up error tracking (Sentry, etc.)

4. **Implement Features**
   - Analysis history UI (using saved analyses)
   - User authentication (to save per-user history)
   - Export functionality (download analysis results)

---

## Quick Reference

### Local Development Commands

```bash
# Start local databases
docker-compose up -d

# Start dev server
npm run dev

# Initialize database
curl http://localhost:3000/api/db/init

# Stop databases
docker-compose down

# Reset databases (delete all data)
docker-compose down -v
```

### Useful Links

- **Production App**: https://orizon-qa.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/diegocconsolini/OrizonQA
- **Database Docs**: See `DATABASE.md`

---

## Support

For issues or questions:
1. Check `DATABASE.md` for detailed database info
2. Review Vercel logs for deployment errors
3. Check Docker logs for local database issues

**Success!** You now have OrizonQA deployed to Vercel with full database and caching support! 🎉
