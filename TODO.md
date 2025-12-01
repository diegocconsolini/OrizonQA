# ORIZON QA - TODO List & Action Items

**Last Updated**: 2025-12-01
**Current Status**: Sidebar Navigation & History Page Complete

---

## ✅ RECENTLY COMPLETED (2025-12-01)

### Sidebar Navigation System
- ✅ Created proper left sidebar navigation (matches design mockups)
- ✅ Added navigation items: Dashboard, History, Settings
- ✅ Implemented collapsible sidebar (264px ↔ 80px)
- ✅ Mobile responsive with overlay drawer
- ✅ Connected Quick Stats to real user data (analyses count, tokens used)
- ✅ User profile section with sign out
- ✅ Active navigation state highlighting

### Dashboard Reorganization
- ✅ Removed confusing history sidebar from Dashboard
- ✅ Simplified Dashboard to focus on analysis workflow
- ✅ Clean, intuitive layout with single navigation sidebar

### History Page (New!)
- ✅ Created `/app/history/page.js` - dedicated page for all analyses
- ✅ Stats overview cards (total analyses, tokens, last analysis)
- ✅ Search functionality
- ✅ Filter by provider (Claude, LM Studio)
- ✅ Filter by input type (paste, GitHub, file upload)
- ✅ Clean list view with analysis details
- ✅ Empty states with actions

**Files Created**:
- `app/components/layout/Sidebar.jsx`
- `app/components/layout/AppLayout.jsx`
- `app/history/page.js`

**Files Modified**:
- `app/dashboard/page.js` (simplified, removed history sidebar)
- `app/settings/page.js` (integrated with AppLayout)
- `app/components/ui/Tabs.jsx` (fixed export pattern)

---

## 🔥 HIGH PRIORITY (Do Next)

### 1. Link Analyses to User Accounts ⚠️ CRITICAL
**Estimated Time**: 1-2 hours
**Status**: NOT STARTED
**Blocking**: Full user experience, analysis persistence

**Why Critical**: Database has `user_id` column in `analyses` table but it's not being used. Users' analyses are not being saved or linked to their accounts. The History page exists but won't show any user-specific data until this is implemented.

#### Tasks:
- [ ] Modify `/api/analyze/route.js`:
  - Accept user session from Next-Auth
  - Extract user_id from session
  - Pass user_id to `saveAnalysis()` function
- [ ] Update `lib/db.js` `saveAnalysis()`:
  - Accept user_id parameter
  - Insert user_id into analyses table
- [ ] Update `app/hooks/useAnalysis.js`:
  - Pass session to analysis API call
  - Verify user_id is being saved
- [ ] Test:
  - Run analysis while logged in
  - Check database: `SELECT * FROM analyses WHERE user_id IS NOT NULL;`
  - Verify user_id matches logged-in user
  - Verify History page shows analyses
  - Verify Sidebar Quick Stats update

**Files to Modify**:
- `app/api/analyze/route.js`
- `lib/db.js` (update saveAnalysis function)
- `app/hooks/useAnalysis.js`

---

### 2. Analysis Detail View
**Estimated Time**: 2-3 hours
**Status**: NOT STARTED
**Depends On**: #1 (Link Analyses to Users)

Currently, History page shows list of analyses but clicking them does nothing. Need to implement detail view.

#### Tasks:
- [ ] Create `/app/history/[id]/page.js`:
  - Protected route
  - Fetch single analysis from API
  - Display full results (user stories, tests, criteria)
  - Download button
  - Delete button
  - "Run Again" button (copy config to Dashboard)
- [ ] Create `/api/user/analyses/[id]/route.js`:
  - GET: Fetch single analysis with full results
  - DELETE: Delete analysis (with confirmation)
- [ ] Make history cards clickable:
  - Link to detail page
  - Show chevron icon on hover

**Files to Create**:
- `app/history/[id]/page.js`
- `app/api/user/analyses/[id]/route.js`

**Files to Modify**:
- `app/history/page.js` (add links to cards)

---

### 3. Update Documentation
**Estimated Time**: 30-45 minutes
**Status**: NOT STARTED

Documentation is outdated and doesn't reflect recent changes.

#### Tasks:
- [ ] Update `CLAUDE.md`:
  - Change status to "Sidebar & History Complete"
  - Update architecture section with new layout system
  - Add AppLayout, Sidebar, History page to file structure
  - Document new navigation pattern
- [ ] Update `README.md`:
  - Add History page to features
  - Update screenshots (if any)
  - Update tech stack if needed

**Files to Modify**:
- `CLAUDE.md`
- `README.md`

---

## 🟡 MEDIUM PRIORITY (Do Soon)

### 4. Decide on API Key Strategy
**Estimated Time**: 1 hour
**Status**: NOT STARTED
**Issue**: Two ways to provide API keys confuse users

Current situation:
1. Save key in Settings (encrypted in database)
2. Enter key in Dashboard for each request

#### Recommended Solution (Option A):
**Use saved key by default, allow override**
- Dashboard auto-loads saved key from settings
- User can optionally override with different key
- Show indicator: "Using saved key" vs "Custom key"
- Best user experience

#### Tasks:
- [ ] Update Dashboard to load saved key on mount
- [ ] Add "Use Saved Key" toggle/button
- [ ] Show clear indicator of which key is being used
- [ ] Update UI to explain behavior
- [ ] Update documentation

**Files to Modify**:
- `app/dashboard/page.js`
- `app/components/config/ApiKeyInput.jsx`

---

### 5. Analysis Actions
**Estimated Time**: 2 hours
**Status**: NOT STARTED

Add helpful actions for analyses.

#### Tasks:
- [ ] "Run Again" functionality:
  - Load analysis config into Dashboard
  - Pre-fill input, config, model
  - Navigate to Dashboard
- [ ] Delete analysis:
  - Confirmation modal
  - Remove from database
  - Refresh history list
- [ ] Share analysis:
  - Generate shareable link (public UUID)
  - View-only page for shared analyses
  - Optional: password protection

**Files to Modify**:
- `app/history/[id]/page.js`
- `app/history/page.js`
- `app/dashboard/page.js` (for "run again")

---

### 6. Account Management Features
**Estimated Time**: 2-3 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Profile Page (`/profile` or in Settings):
  - Display user info (email, join date)
  - Update password
  - Update email (requires re-verification)
- [ ] Account Deletion (in Settings):
  - Confirmation flow with password
  - Delete user data
  - Delete all analyses
  - Logout and redirect

**Files to Create**:
- `app/api/user/profile/route.js`
- `app/api/user/delete/route.js`

**Files to Modify**:
- `app/settings/page.js` (implement delete account button)

---

### 7. Email Template Improvements
**Estimated Time**: 2 hours
**Status**: NOT STARTED
**Current**: Plain text emails

#### Tasks:
- [ ] Create HTML email templates:
  - Verification code email (with ORIZON branding)
  - Password reset email
  - Welcome email (after verification)
- [ ] Use React Email or custom HTML
- [ ] Update `lib/email.js`:
  - Support both text and HTML
  - Add ORIZON branding (#00D4FF, #6A00FF)

**Files to Create**:
- `emails/verification-code.jsx`
- `emails/password-reset.jsx`
- `emails/welcome.jsx`

**Files to Modify**:
- `lib/email.js`

---

## 🆕 NEW FEATURE IDEAS

### UX-Focused QA Artifacts
**Estimated Time**: 4-6 hours
**Status**: PLANNED
**Feature Doc**: `docs/FEATURE_UX_QA_ARTIFACTS.md`

Extend ORIZON to generate UX-focused QA artifacts:
- **UX Acceptance Criteria** (usability requirements, response times)
- **Accessibility Test Cases** (WCAG compliance, screen reader)
- **User Flow Test Scenarios** (journey-based testing)

This stays within the QA/testing domain while adding valuable accessibility and usability testing capabilities.

---

## 🟢 LOW PRIORITY (Nice to Have)

### 8. Export Enhancements
- [ ] Export to Jira (create issues from user stories)
- [ ] Export as PDF (styled output)
- [ ] Batch export (multiple analyses as ZIP)

### 9. Advanced Auth Features
- [ ] Multi-Factor Authentication (TOTP)
- [ ] Social Auth (GitHub, Google OAuth)
- [ ] Session Management (view/revoke sessions)

### 10. Usage Analytics & Limits
- [ ] Track usage (analyses per day/week/month)
- [ ] Rate limiting (max analyses per day)
- [ ] Cost estimation
- [ ] Upgrade prompts

---

## 📋 BACKLOG

### Team & Collaboration
- [ ] Team accounts
- [ ] Share analyses with team
- [ ] Role-based permissions

### CLI Tool
- [ ] npx command for local analysis
- [ ] CLI authentication
- [ ] Direct API usage

### Integrations
- [ ] GitHub Actions integration
- [ ] CI/CD webhooks
- [ ] Slack/Discord notifications

### Billing
- [ ] Free tier limits
- [ ] Paid plans (Stripe)
- [ ] Usage-based billing

---

## 🐛 KNOWN ISSUES

### Minor
1. **Email Templates**: Plain text only (not branded)
2. **No Account Recovery**: If user loses email access, account is unrecoverable
3. **Analysis Detail View**: History cards not clickable yet (needs Task #2)
4. **API Key Confusion**: Two input methods confuse users (needs Task #4)

### Technical Debt
1. **Error Handling**: Some API routes need better error messages
2. **Loading States**: Some pages lack proper loading indicators
3. **Middleware Performance**: Could be optimized

---

## 🎯 Quick Start for Next Session

**Priority Order**:
1. **Task #1**: Link analyses to user accounts (CRITICAL - blocks everything else)
2. **Task #2**: Create analysis detail view (makes History page functional)
3. **Task #3**: Update documentation (keep docs current)
4. **Task #4**: Fix API key strategy (improves UX)

**Quick Commands**:
```bash
cd /home/diegocc/OrizonQA
npm run dev              # Start dev server (port 3033)
psql $POSTGRES_URL       # Access database
npm run build            # Test production build
```

**Critical Files**:
- `app/api/analyze/route.js` - Where analyses are created
- `lib/db.js` - Database functions (saveAnalysis, getAnalysisByUser)
- `app/dashboard/page.js` - Main analysis interface
- `app/history/page.js` - Analysis history view
- `app/components/layout/Sidebar.jsx` - Navigation sidebar

---

**END OF TODO**
