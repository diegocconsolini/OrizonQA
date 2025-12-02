# GitHub OAuth Setup Guide

This guide explains how to set up GitHub OAuth for ORIZON QA.

## Step 1: Create a GitHub OAuth App

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**
   - Direct link: https://github.com/settings/developers

2. Click **"New OAuth App"**

3. Fill in the application details:
   - **Application name**: `ORIZON QA` (or your preferred name)
   - **Homepage URL**:
     - Production: `https://orizon-qa.vercel.app`
     - Local dev: `http://localhost:3033`
   - **Application description**: `QA management platform for modern teams`
   - **Authorization callback URL**:
     - Production: `https://orizon-qa.vercel.app/api/auth/callback/github`
     - Local dev: `http://localhost:3033/api/auth/callback/github`

4. Click **"Register application"**

5. After registration, you'll see:
   - **Client ID** (visible immediately)
   - **Client Secret** (click "Generate a new client secret")

6. **IMPORTANT**: Copy both values - you'll need them for environment variables.

## Step 2: Add Environment Variables

### Local Development (`.env.local`)

Add these to your `.env.local` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:

```
GITHUB_CLIENT_ID = your_client_id_here
GITHUB_CLIENT_SECRET = your_client_secret_here
```

4. Make sure they're enabled for **Production**, **Preview**, and **Development** environments

## Step 3: Verify Setup

1. Restart your development server (if running locally)
2. Visit the login page
3. You should see a "Sign in with GitHub" button
4. Click it to test the OAuth flow

## How It Works

1. **User clicks "Sign in with GitHub"**
   - NextAuth redirects to GitHub OAuth

2. **User authorizes the app on GitHub**
   - GitHub redirects back to `/api/auth/callback/github`

3. **NextAuth receives the callback**
   - Calls the `signIn` callback in `auth.js`
   - Checks if user exists in database

4. **User creation/login**
   - If user doesn't exist: Creates new user with `email_verified=true`
   - If user exists: Updates `last_login` timestamp
   - Logs audit event

5. **Session created**
   - User is redirected to `/dashboard`
   - Session stored in JWT (30-day expiration)

## Security Notes

- GitHub OAuth users have `email_verified=true` by default (GitHub verifies emails)
- No password is stored for OAuth users
- OAuth users can still set a password later if they want to use email/password login
- All GitHub sign-ins are logged in `audit_logs` table

## Troubleshooting

### "Sign in with GitHub" button not showing
- Check that environment variables are set correctly
- Restart your dev server after adding env vars

### OAuth callback fails
- Verify the callback URL matches exactly: `https://your-domain.com/api/auth/callback/github`
- Check that your GitHub OAuth app is configured correctly

### User creation fails
- Check database connection
- Verify `users` table exists with correct schema
- Check server logs for detailed error messages

## Multiple Environments

If you want separate OAuth apps for dev/staging/production:

1. Create 3 separate OAuth apps on GitHub:
   - `ORIZON QA (Development)`
   - `ORIZON QA (Staging)`
   - `ORIZON QA (Production)`

2. Use different environment variables for each:
   - Vercel: Set different values per environment
   - Local: Use `.env.local` for development

## Database Schema

GitHub OAuth users are stored in the same `users` table:

```sql
-- OAuth users have these characteristics:
-- - email_verified = true (GitHub verifies emails)
-- - password_hash = NULL (no password)
-- - full_name = from GitHub profile
-- - created via GitHub OAuth (logged in audit_logs)
```

## Next Steps

- Add more OAuth providers (Google, Microsoft, etc.)
- Allow users to link multiple OAuth accounts
- Add "Connect GitHub" option in user settings
