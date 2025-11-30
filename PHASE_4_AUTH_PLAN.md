# Phase 4: Authentication System - Implementation Plan

**Priority:** IMMEDIATE (Before Database Integration)
**Duration:** 2 weeks
**Status:** Ready to start

---

## Why Auth First?

✅ **Better architecture:** User-owned data from the start
✅ **Security:** Analyses tied to user accounts, not anonymous
✅ **API keys:** Store user's Claude API keys securely (encrypted)
✅ **Monetization ready:** Can add billing/limits later
✅ **Professional:** Proper user management from day 1

---

## Authentication Strategy

### Option 1: Next-Auth (Recommended)
- ✅ Built for Next.js
- ✅ Supports email/password + OAuth
- ✅ Session management included
- ✅ Easy database integration
- ✅ Well documented

### Option 2: Clerk
- More features but overkill
- Paid service

### Option 3: Custom (Supabase Auth)
- More control but more work

**Decision: Use Next-Auth with Credentials provider**

---

## Pages to Build

### 1. Landing Page (`/` - Public)
**Purpose:** Marketing page, redirect authenticated users to `/dashboard`

**Sections:**
- Hero with "Try Demo" + "Sign Up" CTAs
- Features showcase (3-4 key benefits)
- How it works (3 steps)
- Pricing (if applicable) or "Free to start"
- Footer with links

**Components needed:**
- Hero section
- Feature cards
- CTA buttons
- Footer

---

### 2. Login Page (`/login` - Public)
**Layout:** Split-screen (45% left content, 55% right form)

**Left side:**
- ORIZON logo + wordmark
- "Welcome back" headline
- Feature highlights (3 bullets):
  - ✓ AI-powered QA analysis
  - ✓ GitHub integration
  - ✓ Multiple output formats
- Floating cards (decorative)
- Trust indicators (optional)

**Right side (Auth Card):**
- "Log in to your account" title
- Email input
- Password input with show/hide toggle
- "Forgot password?" link
- "Log in" button (primary)
- Divider: "Or continue with"
- Google OAuth button (optional)
- GitHub OAuth button (optional)
- Footer: "Don't have an account? Sign up"

**Components:**
- `app/login/page.js`
- `app/components/auth/AuthLayout.jsx` (split-screen)
- `app/components/auth/LoginForm.jsx`

---

### 3. Signup Page (`/signup` - Public)
**Layout:** Same split-screen as login

**Left side:**
- Same as login but different headline: "Join thousands of developers"
- Different feature highlights:
  - ✓ Free to start
  - ✓ No credit card required
  - ✓ Instant setup

**Right side (Auth Card):**
- "Create your account" title
- Full name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- Checkbox: "I agree to Terms and Privacy Policy"
- "Create account" button (primary)
- Footer: "Already have an account? Log in"

**Components:**
- `app/signup/page.js`
- `app/components/auth/SignupForm.jsx`

---

### 4. Forgot Password (`/forgot-password` - Public)
**Layout:** Centered card (600px max width)

**Content:**
- "Reset your password" title
- Subtitle: "Enter your email and we'll send you a reset link"
- Email input
- "Send reset link" button
- Back to login link

**Components:**
- `app/forgot-password/page.js`
- `app/components/auth/ForgotPasswordForm.jsx`

---

### 5. Reset Password (`/reset-password?token=XXX` - Public)
**Layout:** Centered card

**Content:**
- "Create new password" title
- New password input (with strength)
- Confirm password input
- "Reset password" button
- Link expires in X minutes warning

---

### 6. Verify Email (`/verify-email` - Protected)
**Layout:** Centered card

**Two states:**

**State 1: Waiting for verification**
- "Check your email" title
- "We sent a verification code to user@example.com"
- 6-digit code input (auto-focus, auto-advance)
- "Verify" button
- "Didn't receive? Resend code" link

**State 2: Verified**
- Success checkmark animation
- "Email verified!" title
- "Redirecting to dashboard..." message
- Auto-redirect after 2 seconds

**Components:**
- `app/verify-email/page.js`
- `app/components/auth/VerificationCodeInput.jsx` (6 digits)
- `app/components/auth/VerificationSuccess.jsx`

---

## Component Specifications

### VerificationCodeInput.jsx

**Requirements:**
- 6 individual inputs (one digit each)
- Auto-focus on first input
- Auto-advance to next on digit entry
- Auto-submit when all 6 filled
- Backspace goes to previous
- Paste support (paste "123456" fills all)
- Keyboard navigation (arrow keys)

**Dimensions:**
- Each input: 56px × 56px
- Gap: 12px
- Font: 24px, weight 600
- Border: 2px solid
- Border radius: 8px

**States:**
- Empty: border-white/10
- Focus: border-primary, ring
- Filled: border-primary/50
- Error: border-red-500

---

### Password Strength Indicator

**Requirements:**
- Show strength as user types
- Levels: Weak, Fair, Good, Strong
- Visual bar (red → yellow → green)
- Criteria checklist:
  - ✓ At least 8 characters
  - ✓ Contains uppercase
  - ✓ Contains lowercase
  - ✓ Contains number
  - ✓ Contains special character

---

## Database Schema (Users)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Identity
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  full_name VARCHAR(255),

  -- Authentication
  password_hash VARCHAR(255) NOT NULL,

  -- API Keys (encrypted)
  claude_api_key_encrypted TEXT,
  lmstudio_url TEXT,

  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,

  -- Verification
  verification_code VARCHAR(6),
  verification_code_expires TIMESTAMP,

  -- Password reset
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_code ON users(verification_code);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Sessions (for Next-Auth)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);

-- Update analyses table to include user_id
ALTER TABLE analyses ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_analyses_user_id ON analyses(user_id);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Who
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255), -- Store email in case user is deleted

  -- What
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50), -- e.g., 'user', 'session', 'analysis'
  resource_id VARCHAR(255),

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Details
  metadata JSONB, -- Additional context (e.g., failed login reason)
  success BOOLEAN DEFAULT TRUE,

  -- Location (optional)
  country VARCHAR(2),
  city VARCHAR(100)
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Common audit log actions:
-- 'user.signup', 'user.login', 'user.logout', 'user.login_failed'
-- 'email.verify', 'email.verify_failed', 'email.resend_code'
-- 'password.reset_request', 'password.reset_complete', 'password.change'
-- 'session.create', 'session.refresh', 'session.expire'
-- 'api_key.create', 'api_key.update', 'api_key.delete'
-- 'account.delete', 'account.suspend', 'account.reactivate'
```

---

## Audit Logging Utility

### `lib/auditLog.js`

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function logAudit({
  userId = null,
  userEmail = null,
  action,
  resourceType = null,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {},
  success = true,
  country = null,
  city = null,
}) {
  try {
    const query = `
      INSERT INTO audit_logs
      (user_id, user_email, action, resource_type, resource_id,
       ip_address, user_agent, metadata, success, country, city)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      JSON.stringify(metadata),
      success,
      country,
      city,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging should never break the app
  }
}

// Helper to get IP and User-Agent from request
export function getRequestContext(request) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

// Helper to query audit logs
export async function getAuditLogs({
  userId = null,
  action = null,
  limit = 50,
  offset = 0,
}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const values = [];
  let paramCount = 1;

  if (userId) {
    query += ` AND user_id = $${paramCount}`;
    values.push(userId);
    paramCount++;
  }

  if (action) {
    query += ` AND action = $${paramCount}`;
    values.push(action);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
}

// Helper to detect suspicious activity
export async function getFailedLoginAttempts(email, minutes = 15) {
  const query = `
    SELECT COUNT(*) as count
    FROM audit_logs
    WHERE user_email = $1
      AND action = 'user.login_failed'
      AND created_at > NOW() - INTERVAL '${minutes} minutes'
  `;

  const result = await pool.query(query, [email]);
  return parseInt(result.rows[0].count);
}
```

---

## API Routes

### `/api/auth/signup`
**Method:** POST
**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Logic:**
1. Validate input (email format, password strength)
2. Check if email exists
3. Hash password (bcrypt)
4. Generate 6-digit verification code
5. Create user (email_verified = false)
6. Send verification email
7. **Log audit:** `user.signup`
8. Return success

**Response:**
```json
{
  "success": true,
  "message": "Account created. Check your email for verification code.",
  "userId": 123
}
```

**Audit Log Example:**
```javascript
import { logAudit, getRequestContext } from '@/lib/auditLog';

export async function POST(request) {
  const { ipAddress, userAgent } = getRequestContext(request);
  const { fullName, email, password } = await request.json();

  try {
    // ... validation and user creation ...

    // Log successful signup
    await logAudit({
      userId: newUser.id,
      userEmail: email,
      action: 'user.signup',
      resourceType: 'user',
      resourceId: newUser.id.toString(),
      ipAddress,
      userAgent,
      metadata: { fullName },
      success: true,
    });

    return NextResponse.json({ success: true, userId: newUser.id });
  } catch (error) {
    // Log failed signup
    await logAudit({
      userEmail: email,
      action: 'user.signup',
      ipAddress,
      userAgent,
      metadata: { error: error.message, fullName },
      success: false,
    });

    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

### `/api/auth/verify-email`
**Method:** POST
**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Logic:**
1. Find user by email
2. Check code matches and not expired
3. Mark email_verified = true
4. Clear verification code
5. Create session
6. Return session token

---

### `/api/auth/login`
**Method:** POST
**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Logic:**
1. **Check rate limit:** Max 5 failed attempts in 15 minutes
2. Find user by email
3. Check email verified
4. Verify password hash
5. Update last_login
6. **Log audit:** `user.login` (success or failed)
7. Create session
8. Return session token

**Rate Limiting Example:**
```javascript
import { logAudit, getFailedLoginAttempts, getRequestContext } from '@/lib/auditLog';

export async function POST(request) {
  const { ipAddress, userAgent } = getRequestContext(request);
  const { email, password } = await request.json();

  // Check for too many failed attempts
  const failedAttempts = await getFailedLoginAttempts(email, 15);
  if (failedAttempts >= 5) {
    await logAudit({
      userEmail: email,
      action: 'user.login_blocked',
      ipAddress,
      userAgent,
      metadata: { reason: 'too_many_failed_attempts', count: failedAttempts },
      success: false,
    });

    return NextResponse.json(
      { error: 'Too many failed login attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  try {
    // ... authentication logic ...

    // Log successful login
    await logAudit({
      userId: user.id,
      userEmail: email,
      action: 'user.login',
      resourceType: 'session',
      resourceId: session.id.toString(),
      ipAddress,
      userAgent,
      metadata: { loginMethod: 'credentials' },
      success: true,
    });

    return NextResponse.json({ success: true, sessionToken });
  } catch (error) {
    // Log failed login
    await logAudit({
      userEmail: email,
      action: 'user.login_failed',
      ipAddress,
      userAgent,
      metadata: { reason: error.message },
      success: false,
    });

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
```

---

### `/api/auth/forgot-password`
**Method:** POST
**Body:**
```json
{
  "email": "john@example.com"
}
```

**Logic:**
1. Find user by email
2. Generate reset token (UUID)
3. Set expiry (1 hour)
4. Send reset email with link
5. Return success (even if email not found - security)

---

### `/api/auth/reset-password`
**Method:** POST
**Body:**
```json
{
  "token": "uuid-token-here",
  "newPassword": "NewSecurePass123!"
}
```

**Logic:**
1. Find user by reset token
2. Check token not expired
3. Hash new password
4. Update password_hash
5. Clear reset token
6. Invalidate all sessions
7. Return success

---

## Next-Auth Configuration

### `app/api/auth/[...nextauth]/route.js`

```javascript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        // Find user
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        const user = result.rows[0];

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.email_verified) {
          throw new Error('Please verify your email first');
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await pool.query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [user.id]
        );

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Protected Routes Middleware

### `middleware.js` (root)

```javascript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/analyze/:path*',
    '/api/history/:path*',
  ],
};
```

---

## Email Service

### Option 1: Resend (Recommended)
- Modern, developer-friendly
- Free tier: 100 emails/day
- React email templates
- Simple API

### Option 2: SendGrid
- Enterprise-grade
- More complex setup

### Option 3: AWS SES
- Cheapest for scale
- More configuration

**Decision: Start with Resend**

### Email Templates

**Verification Email:**
```
Subject: Verify your ORIZON account

Hi [Name],

Welcome to ORIZON! Your verification code is:

[123456]

This code expires in 10 minutes.

Or click here to verify: https://orizon-qa.vercel.app/verify-email?code=123456

---
ORIZON - AI-Powered QA Analysis
```

**Password Reset Email:**
```
Subject: Reset your ORIZON password

Hi [Name],

Click the link below to reset your password:

https://orizon-qa.vercel.app/reset-password?token=xxx

This link expires in 1 hour.

If you didn't request this, ignore this email.

---
ORIZON - AI-Powered QA Analysis
```

---

## Environment Variables

Add to `.env.local`:

```env
# Next-Auth
NEXTAUTH_URL=http://localhost:3033
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# Email (Resend)
RESEND_API_KEY=re_xxx

# Encryption (for API keys)
ENCRYPTION_KEY=your-32-char-encryption-key
```

Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 16
```

---

## Dependencies to Install

```bash
npm install next-auth bcryptjs
npm install resend
npm install crypto-js  # For API key encryption
```

---

## Implementation Order (2 weeks)

### Week 1: Core Auth Flow

**Day 1-2: Database & Next-Auth Setup**
- [ ] Add user table to schema
- [ ] Install dependencies
- [ ] Configure Next-Auth
- [ ] Create `/api/auth/[...nextauth]/route.js`

**Day 3-4: Signup Flow**
- [ ] Create `SignupForm` component
- [ ] Create `/api/auth/signup` route
- [ ] Password validation
- [ ] Email verification code generation
- [ ] Integrate Resend for emails

**Day 5: Login Flow**
- [ ] Create `LoginForm` component
- [ ] Test Next-Auth credentials provider
- [ ] Session management
- [ ] Redirect after login

**Day 6-7: Email Verification**
- [ ] Create `VerificationCodeInput` component
- [ ] Create `/api/auth/verify-email` route
- [ ] Resend code functionality
- [ ] Success state + redirect

---

### Week 2: Password Reset + Polish

**Day 8-9: Password Reset**
- [ ] Create `ForgotPasswordForm`
- [ ] Create `/api/auth/forgot-password`
- [ ] Create `ResetPasswordForm`
- [ ] Create `/api/auth/reset-password`
- [ ] Token expiry logic

**Day 10: Protected Routes**
- [ ] Add middleware.js
- [ ] Test protected routes redirect
- [ ] Add session checks to API routes

**Day 11: Landing Page**
- [ ] Create landing page (`/`)
- [ ] Hero section
- [ ] Features showcase
- [ ] CTAs to signup/login

**Day 12: Dashboard Redirect**
- [ ] Create basic `/dashboard` page
- [ ] Redirect authenticated users from `/` to `/dashboard`
- [ ] Show user info in dashboard

**Day 13-14: Testing & Polish**
- [ ] Test full signup → verify → login flow
- [ ] Test password reset flow
- [ ] Test protected routes
- [ ] Polish UI transitions
- [ ] Error handling
- [ ] Loading states

---

## Success Criteria

### Must Have
- [x] User can sign up with email/password
- [x] Email verification with 6-digit code works
- [x] User can log in after verification
- [x] Password reset flow works
- [x] Protected routes redirect to login
- [x] Sessions persist (30 days)
- [x] Secure password hashing

### Nice to Have
- [ ] OAuth (Google/GitHub)
- [ ] Profile page
- [ ] Account settings
- [ ] Delete account

---

## After Phase 4 Complete

**Next:** Phase 3 - Database Integration
- User-owned analyses
- History tied to user account
- API key storage (encrypted per user)
- Usage tracking per user

---

## Questions?

1. **Do we need OAuth (Google/GitHub) in Phase 4?**
   - Recommendation: No, add in Phase 6 (nice-to-have)

2. **Should users be able to use the app without account?**
   - Recommendation: No, require account for tracking + limits

3. **Free tier limits?**
   - Recommendation: Unlimited for now, add limits in Phase 6

**Ready to start Phase 4?**
