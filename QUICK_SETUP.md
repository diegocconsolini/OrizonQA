# Quick Vercel Setup (5 minutes)

## Current Status

✅ Code deployed to Vercel
✅ Local dev environment ready
⏳ Postgres database - needs creation
⏳ KV store - needs creation

---

## Setup Steps

### Step 1: Create Postgres Database (2 min)

1. Open: https://vercel.com/diegocconsolinis-projects/orizon-qa/stores
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Settings:
   - Name: `orizonqa-db`
   - Region: `Washington, D.C., USA (iad1)` or closest to you
   - Plan: **Hobby** (free)
5. Click **"Create"**
6. After creation, click **"Connect"** →Select **"orizon-qa"** project
7. Environment: Select **"Production"**
8. Click **"Connect"**

✅ This automatically adds `POSTGRES_URL` env var

---

### Step 2: Create KV Store (2 min)

1. Same page: https://vercel.com/diegocconsolinis-projects/orizon-qa/stores
2. Click **"Create Database"** again
3. Select **"KV"**
4. Settings:
   - Name: `orizonqa-cache`
   - Region: Same as Postgres (e.g., `iad1`)
   - Plan: **Hobby** (free, 256MB)
5. Click **"Create"**
6. After creation, click **"Connect"** → Select **"orizon-qa"** project
7. Environment: Select **"Production"**
8. Click **"Connect"**

✅ This automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars

---

### Step 3: Pull Environment Variables (CLI)

```bash
# Pull production env vars to local
vercel env pull .env.production

# Check what was pulled
cat .env.production | grep -E "POSTGRES_URL|KV_REST_API"
```

You should see:
- `POSTGRES_URL=postgres://...`
- `KV_REST_API_URL=https://...`
- `KV_REST_API_TOKEN=...`

---

### Step 4: Redeploy with New Env Vars

```bash
# Trigger production deployment
vercel --prod
```

Wait for deployment to complete (~1-2 minutes).

---

### Step 5: Initialize Production Database

```bash
# Wait a bit for deployment
sleep 30

# Initialize database schema
curl https://orizon-qa.vercel.app/api/db/init
```

Expected response:
```json
{
  "message": "Database initialized successfully",
  "success": true
}
```

---

## Verification

### Check Deployment
```bash
vercel ls
```

### Test Production App
Visit: https://orizon-qa.vercel.app

Try:
1. Paste some code and analyze
2. Fetch a GitHub repo
3. Check that results are cached (second fetch is instant)

### Check Database
https://vercel.com/diegocconsolinis-projects/orizon-qa/stores

You should see:
- `orizonqa-db` (Postgres) - Connected
- `orizonqa-cache` (KV) - Connected

---

## Troubleshooting

### "Database not found" error

1. Make sure databases are **connected** to project
2. Check env vars: `vercel env ls`
3. Redeploy: `vercel --prod`

### Initialization fails

Wait 30 seconds after deployment, then retry:
```bash
curl https://orizon-qa.vercel.app/api/db/init
```

### Need to see logs

```bash
vercel logs https://orizon-qa.vercel.app --since=10m
```

---

## Alternative: Automated Script

Run the interactive setup script:
```bash
./VERCEL_SETUP.sh
```

This script will:
1. Open correct URLs in browser
2. Wait for you to create databases
3. Pull env vars
4. Trigger deployment
5. Initialize database
6. Verify everything

---

## Summary

Once complete, you'll have:

**Production**: https://orizon-qa.vercel.app
- ✅ Postgres database for storing analyses
- ✅ Redis/KV cache for GitHub fetches
- ✅ Full codebase analysis functionality

**Local Dev**: http://localhost:3033
- ✅ Docker PostgreSQL (already running)
- ✅ Docker Redis (already running)
- ✅ Same functionality as production

**Total setup time**: ~5 minutes

---

## Next Steps

1. Test production app
2. Try GitHub repository caching
3. Check database in Vercel dashboard
4. Monitor usage in Storage tab

For detailed info, see `DEPLOYMENT.md`.
