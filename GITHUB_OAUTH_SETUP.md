# GitHub OAuth Setup Guide

This guide explains how to set up GitHub OAuth for ORIZON QA, including both web-based OAuth and Device Flow for CLI tools.

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

## Device Flow for CLI Tools

The Device Flow allows CLI tools and headless environments to authenticate without a browser.

### How It Works

1. **CLI requests device code**
   ```
   POST /api/auth/device
   { "action": "initiate" }
   ```

2. **API returns user code and verification URL**
   ```json
   {
     "user_code": "ABCD-1234",
     "verification_uri": "https://github.com/login/device",
     "device_code": "...",
     "interval": 5
   }
   ```

3. **User visits URL and enters code**
   - User opens `verification_uri` in browser
   - Enters the `user_code`
   - Authorizes the app

4. **CLI polls for completion**
   ```
   POST /api/auth/device
   { "action": "poll", "device_code": "..." }
   ```

5. **API returns user session**
   ```json
   {
     "status": "success",
     "user": { "id": 1, "email": "...", "name": "..." }
   }
   ```

### Example CLI Implementation

See `examples/cli-device-flow.js` for a complete Node.js example:

```bash
node examples/cli-device-flow.js
```

This will:
- Request a device code
- Display the verification URL and user code
- Poll for completion
- Display user info when authenticated

### Using Device Flow in Your CLI

```javascript
const response = await fetch('https://orizon-qa.vercel.app/api/auth/device', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'initiate' }),
});

const { user_code, verification_uri, device_code, interval } = await response.json();

// Show user_code and verification_uri to user
console.log(`Visit ${verification_uri} and enter code: ${user_code}`);

// Poll every {interval} seconds
while (true) {
  await sleep(interval * 1000);

  const pollResponse = await fetch('https://orizon-qa.vercel.app/api/auth/device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'poll', device_code }),
  });

  const result = await pollResponse.json();

  if (result.status === 'success') {
    // User is authenticated
    const user = result.user;
    break;
  }
}
```

## Next Steps

- Add more OAuth providers (Google, Microsoft, etc.)
- Allow users to link multiple OAuth accounts
- Add "Connect GitHub" option in user settings
- Implement token refresh for long-lived CLI sessions
