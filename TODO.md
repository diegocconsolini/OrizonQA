# ORIZON QA - TODO List & Action Items

**Last Updated**: 2025-11-30
**Current Status**: Phase 4 Complete, Ready for Phase 4.5

---

## 🔥 HIGH PRIORITY (Do First)

### 1. Link Analyses to User Accounts ⚠️ CRITICAL
**Estimated Time**: 1-2 hours
**Status**: NOT STARTED
**Blocking**: Analysis history, full user experience

**Why Critical**: Database has `user_id` column in `analyses` table but it's not being used. Users' analyses are not being saved or linked to their accounts.

#### Tasks:
- [ ] Modify `/api/analyze` route to:
  - Accept user session from Next-Auth
  - Extract user_id from session
  - Pass user_id to `saveAnalysis()` function
- [ ] Update `lib/db.js` `saveAnalysis()` to:
  - Accept user_id parameter
  - Insert user_id into analyses table
- [ ] Update dashboard analysis flow:
  - Pass session to analysis API call
  - Verify user_id is being saved
- [ ] Test:
  - Run analysis while logged in
  - Check database: `SELECT * FROM analyses WHERE user_id IS NOT NULL;`
  - Verify user_id matches logged-in user

**Files to Modify**:
- `app/api/analyze/route.js`
- `lib/db.js` (update saveAnalysis function)
- `app/hooks/useAnalysis.js` (if needed)

---

### 2. Create Analysis History Page
**Estimated Time**: 2-3 hours
**Status**: NOT STARTED
**Depends On**: #1 (Link Analyses to Users)

#### Tasks:
- [ ] Create `/app/history/page.js`:
  - Protected route (requires auth)
  - Fetch user's analyses from API
  - Display in list/card format
  - Show: date, input type, provider, token usage
  - Click to view full results
- [ ] Create `/api/user/analyses` route:
  - GET endpoint
  - Fetch analyses for logged-in user
  - Return list with pagination (10-20 per page)
  - Include filters (date range, input type)
- [ ] Add to navigation:
  - Link in dashboard navbar
  - Badge with analysis count
- [ ] Features:
  - [ ] View past results (modal or detail page)
  - [ ] Delete individual analysis
  - [ ] Re-run analysis with same config
  - [ ] Download results
  - [ ] Search/filter by date, type, model

**Files to Create**:
- `app/history/page.js`
- `app/api/user/analyses/route.js`

**Files to Modify**:
- `app/dashboard/page.js` (add history link)

---

### 3. Update Outdated Documentation
**Estimated Time**: 30 minutes
**Status**: NOT STARTED

#### Tasks:
- [ ] Update `CLAUDE.md`:
  - Change status from "Phase 2 complete" to "Phase 4 complete"
  - Update architecture section with auth pages
  - Add database schema section
  - Update file structure
  - Add Phase 4.5 to planned work
- [ ] Update or archive `NEXT_SESSION.md`:
  - Either update to reflect Phase 4.5
  - Or rename to `ARCHIVE_PHASE3_PLAN.md`
- [ ] Update `README.md`:
  - Add authentication features
  - Update tech stack (add Next-Auth, Resend, bcryptjs)
  - Update deployment instructions (env vars)

**Files to Modify**:
- `CLAUDE.md`
- `NEXT_SESSION.md` (update or archive)
- `README.md`

---

## 🆕 NEW FEATURE: UX-Focused QA Artifacts

### UX Testing & Accessibility Artifacts
**Estimated Time**: 4-6 hours
**Status**: PLANNED
**Feature Doc**: `docs/FEATURE_UX_QA_ARTIFACTS.md`

Extend ORIZON to generate UX-focused QA artifacts while staying within the testing domain:
- **UX Acceptance Criteria** (usability requirements, response times, interaction patterns)
- **Accessibility Test Cases** (WCAG compliance, screen reader, keyboard nav)
- **User Flow Test Scenarios** (journey-based testing, end-to-end paths)

#### Implementation Tasks:
- [ ] Create 3 new prompt templates (ux_acceptance_criteria.md, accessibility_test_cases.md, user_flow_scenarios.md)
- [ ] Update `lib/promptBuilder.js` to support new artifact types
- [ ] Add checkboxes to ConfigSection.jsx for new options
- [ ] Add new tabs to OutputSection.jsx (UX Criteria, Accessibility, User Flows)
- [ ] Update landing page copy to mention UX/accessibility testing
- [ ] Update CLAUDE.md and README.md with new capabilities

**Why Add This**:
- ✅ Stays within QA/testing domain (not full UI/UX design tool)
- ✅ Addresses real QA needs (accessibility compliance, usability testing)
- ✅ Complements existing artifacts
- ✅ Uses existing Claude AI capabilities
- ✅ No major architectural changes

**See Full Plan**: Read `docs/FEATURE_UX_QA_ARTIFACTS.md` for complete implementation details, examples, and success metrics.

---

## 🟡 MEDIUM PRIORITY (Do Soon)

### 4. Dashboard Improvements
**Estimated Time**: 1-2 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Recent Analyses Widget:
  - Show 3-5 most recent analyses
  - Quick view of results
  - Link to full history
- [ ] Usage Statistics:
  - Total analyses run
  - Total tokens used
  - Analyses by type (pie chart)
  - Weekly/monthly trends
- [ ] Quick Actions:
  - "Repeat Last Analysis" button
  - "View History" button
  - "Update Settings" button

**Files to Modify**:
- `app/dashboard/page.js`

---

### 5. Decide on API Key Strategy
**Estimated Time**: 1 hour (discussion + implementation)
**Status**: NOT STARTED
**Issue**: Two ways to provide API keys:
1. Save in settings (encrypted in database)
2. Enter per-request in dashboard

#### Decision Options:
**Option A**: Use saved key by default, allow override
- Dashboard loads saved key
- User can optionally override with different key
- Best for users who want convenience

**Option B**: Always require key in dashboard
- Ignore saved settings key
- More secure (user provides each time)
- Best for shared/public computers

**Option C**: User preference toggle
- Settings page: checkbox "Always use saved key"
- Dashboard respects preference
- Most flexible

#### Tasks After Decision:
- [ ] Update dashboard logic
- [ ] Update API key input component
- [ ] Add UI explanation
- [ ] Update documentation

**Files to Modify**:
- `app/dashboard/page.js`
- `app/components/config/ApiKeyInput.jsx`
- `app/settings/page.js` (if adding toggle)

---

### 6. Account Management Features
**Estimated Time**: 2-3 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Profile Page (`/profile`):
  - Display user info (email, join date)
  - Update password
  - Update email (requires re-verification)
  - Profile picture upload (optional)
- [ ] Account Deletion:
  - Confirmation flow
  - Delete user data
  - Delete analyses
  - Logout and redirect
- [ ] Security Settings:
  - View active sessions
  - Revoke sessions
  - Two-factor auth (future)

**Files to Create**:
- `app/profile/page.js`
- `app/api/user/profile/route.js`
- `app/api/user/delete/route.js`

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
  - Account deletion confirmation
- [ ] Use email template library:
  - React Email (recommended for Next.js)
  - Or custom HTML templates
- [ ] Update `lib/email.js`:
  - Support both text and HTML
  - Add email header/footer with branding
  - Include logo and colors (#00D4FF, #6A00FF)

**Files to Create**:
- `emails/verification-code.jsx` (if using React Email)
- `emails/password-reset.jsx`
- `emails/welcome.jsx`

**Files to Modify**:
- `lib/email.js`

---

## 🟢 LOW PRIORITY (Nice to Have)

### 8. Export Enhancements
**Estimated Time**: 2-3 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Export to Jira:
  - Jira Cloud API integration
  - Create issues from user stories
  - OAuth flow for Jira auth
- [ ] Export as PDF:
  - Use browser print API
  - Styled PDF output
  - Include all sections
- [ ] Batch Export:
  - Select multiple analyses from history
  - Export as ZIP file
  - Include metadata

**Files to Modify**:
- `app/components/output/OutputSection.jsx`
- Create `lib/jiraIntegration.js`

---

### 9. Advanced Auth Features
**Estimated Time**: 4-6 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Multi-Factor Authentication:
  - TOTP (Google Authenticator)
  - Backup codes
- [ ] Social Auth:
  - GitHub OAuth
  - Google OAuth
  - Link multiple auth methods
- [ ] Session Management:
  - View active sessions
  - Revoke specific sessions
  - Force logout all devices

---

### 10. Usage Analytics & Limits
**Estimated Time**: 3-4 hours
**Status**: NOT STARTED

#### Tasks:
- [ ] Track Usage:
  - Analyses per day/week/month
  - Tokens consumed
  - Cost estimation
- [ ] Rate Limiting:
  - Max analyses per day (free tier)
  - API key usage tracking
  - Upgrade prompts
- [ ] Admin Dashboard:
  - View all users
  - System statistics
  - Moderation tools

---

## 📋 BACKLOG (Future Considerations)

### 11. Team & Collaboration
- [ ] Team accounts
- [ ] Share analyses with team members
- [ ] Role-based permissions
- [ ] Commenting on analyses

### 12. CLI Tool (Original Phase 4)
- [ ] npx command for local analysis
- [ ] Authentication via CLI
- [ ] Direct API usage
- [ ] Output to files

### 13. Integrations
- [ ] GitHub Actions integration
- [ ] CI/CD webhooks
- [ ] Slack notifications
- [ ] Discord bot

### 14. Billing & Subscriptions
- [ ] Free tier limits
- [ ] Paid plans (Stripe)
- [ ] Usage-based billing
- [ ] Invoice generation

---

## 🐛 KNOWN BUGS & ISSUES

### Critical
- **None currently** ✅

### Minor
1. **Email Templates**: Plain text only (not branded)
2. **No Account Recovery**: If user loses email access, account is unrecoverable
3. **Session Storage Conflict**: Old session-based code may interfere
4. **Showcase Page**: Exists but not integrated into navigation

### Technical Debt
1. **API Key Duplication**: Settings storage + per-request input
2. **Middleware Performance**: Could be optimized
3. **Error Handling**: Some API routes could have better error messages
4. **Loading States**: Some pages lack proper loading indicators

---

## ✅ COMPLETED (For Reference)

### Phase 1 (Complete)
- ✅ Prompt construction system
- ✅ Claude API integration
- ✅ Multiple input methods
- ✅ Output formatting

### Phase 2 (Complete)
- ✅ Component extraction (9 components)
- ✅ Custom hooks (3 hooks)
- ✅ Code reduction (74%)

### Phase 4 (Complete)
- ✅ User authentication (signup, login, logout)
- ✅ Email verification
- ✅ Password reset
- ✅ User settings page
- ✅ API key encryption
- ✅ Protected routes
- ✅ Dashboard integration
- ✅ Landing page
- ✅ Audit logging
- ✅ Database schema

### Recent UI Fixes (Complete)
- ✅ Logo size adjustments (3 iterations)
- ✅ Navbar size reduction
- ✅ Fixed navbar covering content
- ✅ CSS 404 errors resolved

---

## 📊 Progress Tracking

### Phase 4.5 Progress (User Integration)
- [ ] 0/3 core tasks complete
  - [ ] Link analyses to users
  - [ ] Create history page
  - [ ] Update documentation

### Overall Feature Completion
- Authentication: ✅ 100%
- User Settings: ✅ 100%
- Analysis Features: ✅ 80% (missing persistence)
- History/Export: ❌ 0%
- Account Management: ❌ 0%
- Documentation: ⚠️ 50% (outdated)

---

## 🎯 Next Session Quick Start

**If you're starting a new session, DO THIS FIRST**:

1. Read `PROJECT_STATUS.md` for complete context
2. Read this `TODO.md` for action items
3. Start with HIGH PRIORITY task #1: "Link Analyses to User Accounts"
4. Don't skip tasks - they build on each other

**Quick Command Reference**:
```bash
cd /home/diegocc/OrizonQA
npm run dev              # Start dev server
psql $POSTGRES_URL       # Access database
npm run build            # Test production build
```

**Critical Files**:
- `app/api/analyze/route.js` - Where analyses are created
- `lib/db.js` - Database functions (saveAnalysis, getAnalysisByUser)
- `app/dashboard/page.js` - Main application interface
- `middleware.js` - Route protection

---

**END OF TODO DOCUMENT**
