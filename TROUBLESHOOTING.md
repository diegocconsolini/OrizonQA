# ORIZON QA - Troubleshooting Guide

## Critical Issues Resolved (2025-11-30)

### Issue #1: Authentication Working but Login Shows "Please verify your email first"

**Symptoms:**
- User successfully signs up
- Email verification code sent successfully
- Database shows `email_verified = true`
- Login attempt fails with "Please verify your email first"
- Auth error in logs: `Error: Please verify your email first` at `auth.js:63`

**Root Cause:**
The application was connecting to the WRONG database. The `.env.local` file had:
```
POSTGRES_URL=postgresql://postgres:postgres@localhost:5433/orizonqa
```

But the actual PostgreSQL Docker container was running on port **5432**, NOT 5433.

**How This Happened:**
1. Docker container `orizonqa-postgres` was started manually (not via docker-compose)
2. Manual start exposed port 5432 directly to host
3. `.env.local` was configured for port 5433 (docker-compose configuration)
4. Application connected to non-existent database on port 5433
5. Database changes (email verification) went to the WRONG database
6. Auth queries read from a different database that had `email_verified = false`

**Diagnosis Steps:**
```bash
# Check running PostgreSQL containers
docker ps | grep postgres

# Output showed:
# orizonqa-postgres    0.0.0.0:5432->5432/tcp    ← ACTUAL PORT
# But .env.local had port 5433

# Verify database contents on correct port
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa \
  -c "SELECT email, email_verified FROM users WHERE email = 'user@example.com';"
```

**Solution:**
1. Updated `.env.local` to use the CORRECT port:
   ```
   POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/orizonqa
   ```

2. Restarted the development server:
   ```bash
   # Kill existing server
   fuser -k 3033/tcp

   # Start with correct configuration
   PORT=3033 npm run dev
   ```

**Prevention:**
- Always verify Docker container port mappings: `docker ps`
- Ensure `.env.local` matches actual running containers
- Use `docker-compose up -d` to start containers (ensures consistent port mapping)
- Document which database ports are in use

---

### Issue #2: Next.js Cache Preventing Code Changes from Taking Effect

**Symptoms:**
- Code changes don't appear in the running application
- Fixed bugs reappear after restart
- Event handlers (like `onSubmit`) not working despite correct code
- Authentication logic uses old code even after updates

**Root Cause:**
Next.js 16 with Turbopack aggressively caches compiled code in the `.next` directory. Even with hot module replacement (HMR), some changes (especially in authentication, middleware, or server components) require a full rebuild.

**When This Happens:**
- After upgrading packages (Next.js, NextAuth, React)
- After modifying authentication logic (`auth.js`, `authOptions.js`)
- After changing middleware configuration
- After modifying environment variables

**Solution:**
```bash
# Stop the development server
fuser -k 3033/tcp

# Delete the entire .next cache directory
rm -rf .next

# Restart the server
PORT=3033 npm run dev
```

**Prevention:**
- After package upgrades: ALWAYS delete `.next` and rebuild
- After auth changes: Restart server with clean cache
- After `.env.local` changes: Restart server
- When in doubt: Clean rebuild

---

### Issue #3: Verify-Email Page Auto-Submit Bug (Investigated but NOT the root cause)

**Initial Symptom:**
User types one character in email input → page immediately navigates with incomplete email.

**Investigated Solutions (that weren't the actual problem):**
- ✅ Tried React 19 form handling changes
- ✅ Tried removing Suspense boundaries
- ✅ Tried native `<button>` instead of custom Button component
- ✅ Tried `useRef` with manual `addEventListener`
- ✅ Tried preventing form submission with multiple methods

**ACTUAL Root Cause:**
Next.js `.next` cache was serving old JavaScript where the `onSubmit` handler was NOT properly attached during React hydration. The form HTML was rendered without the event handler.

**How to Verify:**
```bash
# Check if onSubmit handler exists in served HTML
curl -s http://localhost:3033/verify-email | grep -o '<form[^>]*>'

# If output is just "<form>" with NO onSubmit attribute, cache is stale
```

**Solution:**
```bash
# Clean rebuild
rm -rf .next
PORT=3033 npm run dev
```

**The Correct Code (that was there all along):**
```javascript
<form onSubmit={(e) => {
  e.preventDefault();
  if (email.trim()) {
    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  }
}}>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="you@example.com"
    autoFocus
  />
  <Button type="submit" disabled={!email.trim()}>
    Continue
  </Button>
</form>
```

**Key Lesson:**
When React event handlers don't work in Next.js 16, suspect cache issues FIRST before rewriting code.

---

## Environment Configuration Reference

### Correct Local Development Setup

**.env.local:**
```bash
# Database (verify port with: docker ps | grep postgres)
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/orizonqa

# Redis (verify port with: docker ps | grep redis)
REDIS_URL=redis://localhost:6380

# NextAuth
NEXTAUTH_URL=http://localhost:3033
NEXTAUTH_SECRET=VgP7pvQVZYkoA9kNlOZtu4ydYxot4l5Pf4G0g5pfowk=

# Email (Resend)
RESEND_API_KEY=re_ckZTfwEH_FpsWtnqwDYRRWS9NhmvjH3Wd

# Encryption
ENCRYPTION_KEY=443d8520487233d0e14c894a5c8fd0ae
```

### Verify Docker Services

```bash
# Check all running containers
docker ps

# Should see:
# - orizonqa-postgres on port 5432
# - orizonqa-redis on port 6380 (or 6379)

# Test database connection
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa -c "SELECT version();"

# Test Redis connection
docker exec -i orizonqa-redis redis-cli PING
# Should return: PONG
```

---

## NextAuth v5 + Next.js 16 + React 19 Setup

### Authentication Stack

**Versions:**
- Next.js: 16.0.6
- React: 19.2.0
- NextAuth: 5.0.0-beta.30

**Key Files:**
1. `/auth.config.js` - Edge-compatible base config (no database/crypto)
2. `/auth.js` - Full config with Credentials provider (extends auth.config.js)
3. `/app/api/auth/[...nextauth]/route.js` - API route handlers
4. `/middleware.js` - Route protection using edge-compatible auth
5. `/lib/auth.js` - Auth utilities

### Why Split Configuration?

Next.js 16 middleware runs in **Edge Runtime** which doesn't support:
- Node.js crypto module
- Database connections
- Heavy npm packages like bcryptjs

**Solution:**
- `auth.config.js` = Edge-compatible (used in middleware)
- `auth.js` = Full config with database (used in API routes and server components)

### Middleware Pattern

```javascript
// middleware.js
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Create edge-compatible auth instance
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  // Route protection logic...
});
```

---

## Common Errors and Solutions

### "The edge runtime does not support Node.js 'crypto' module"

**Cause:** Importing full auth config in middleware

**Fix:** Import `auth.config.js` instead of `auth.js` in middleware

### "CallbackRouteError: Please verify your email first" (but email IS verified)

**Causes:**
1. Wrong database connection (check port in `.env.local`)
2. Stale `.next` cache
3. Multiple PostgreSQL containers running

**Fix:**
```bash
# Verify database port
docker ps | grep postgres

# Update .env.local to match actual port
# Delete cache and restart
rm -rf .next && PORT=3033 npm run dev
```

### "CredentialsProvider is not a function"

**Cause:** Webpack/Turbopack module resolution issue in Next.js 16

**Fix:** Use NextAuth v5 import pattern:
```javascript
import Credentials from 'next-auth/providers/credentials';
// NOT: import CredentialsProvider from 'next-auth/providers/credentials';
```

---

## Clean Restart Procedure

When things aren't working and you've made changes:

```bash
# 1. Stop all running processes
fuser -k 3033/tcp

# 2. Clean all caches
rm -rf .next
rm -rf node_modules/.cache

# 3. Verify Docker services are running
docker ps

# 4. Verify .env.local has correct ports
cat .env.local | grep URL

# 5. Test database connection
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa -c "SELECT 1;"

# 6. Start fresh
PORT=3033 npm run dev
```

---

## Development Server Ports

- **App:** http://localhost:3033
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6380

**IMPORTANT:** Always verify actual running ports with `docker ps` before updating `.env.local`

---

## Verification Checklist

After fixing critical issues, verify the system is working:

```bash
# 1. Check Docker services are running on correct ports
docker ps | grep -E '(postgres|redis)'
# Should show:
# - orizonqa-postgres on 0.0.0.0:5432->5432/tcp
# - orizonqa-redis on 0.0.0.0:6380->6379/tcp (or 6379)

# 2. Verify database connection from .env.local
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa -c "SELECT 1;"
# Should return: 1

# 3. Check user account status
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa -c \
  "SELECT email, email_verified, is_active, last_login FROM users WHERE email = 'your@email.com';"
# Should show: email_verified = t, is_active = t

# 4. Test development server is running
curl -s http://localhost:3033/api/auth/providers | head -5
# Should return JSON with credentials provider

# 5. Test login flow manually
# - Navigate to http://localhost:3033/login
# - Enter email and password
# - Should redirect to /dashboard after successful login
```

**Authentication Flow Status:**
- ✅ User registration working
- ✅ Email sending working (Resend with diegocon.nl)
- ⚠️ Email verification auto-submit bug (postponed - manual activation workaround)
- ✅ Login working after database port fix
- ✅ Session management working
- ✅ Protected route access working

---

## Issue #4: Analysis Persistence After NextAuth v5 Upgrade

**Symptoms:**
- Analysis persistence code exists but uses NextAuth v4 pattern
- `/api/analyze/route.js` imports undefined `authOptions`
- Database missing `user_id` column despite code expecting it

**Root Cause:**
1. NextAuth v4 → v5 upgrade changed auth import pattern
2. Database schema not updated with `user_id` column
3. `lib/db.js` has correct code, but database migration never ran

**Solution:**
1. Update `/app/api/analyze/route.js` to use NextAuth v5:
   ```javascript
   // Before (v4 - broken)
   import { getServerSession } from 'next-auth';
   import { authOptions } from '../auth/[...nextauth]/route.js';
   const session = await getServerSession(authOptions);

   // After (v5 - correct)
   import { auth } from '@/auth';
   const session = await auth();
   ```

2. Add missing `user_id` column to database:
   ```sql
   ALTER TABLE analyses
   ADD COLUMN IF NOT EXISTS user_id INTEGER
   REFERENCES users(id) ON DELETE CASCADE;
   ```

**Verification:**
```bash
# Check column exists
docker exec -i orizonqa-postgres psql -U postgres -d orizonqa -c "\d analyses"

# Test analysis with logged-in user
# Should see: "✓ Analysis saved: ID X, User: Y" in console
```

---

*Last Updated: 2025-11-30*
*Author: Diego Consolini (with Claude Code assistance)*
