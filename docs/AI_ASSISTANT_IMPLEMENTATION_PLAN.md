# AI Assistant Implementation Plan

## Overview

Step-by-step implementation guide for the 74-tool AI Assistant system with security-first architecture, admin panel, and comprehensive testing.

**Total Estimated Work**: 8 phases, ~45-55 hours
**Priority Order**: Security → Infrastructure → Core Tools → Admin Panel → Testing

---

## Pre-Implementation Checklist

- [ ] Review full plan: `docs/AI_ASSISTANT_FULL_PLAN.md`
- [ ] Ensure PostgreSQL and Redis are running locally
- [ ] Backup current database
- [ ] Create feature branch: `git checkout -b feature/ai-assistant-tools`

---

## Phase 1: Security Foundation (6-8 hours)

**Goal**: Build the security layer FIRST before any tools exist.

### 1.1 Create Security Directory Structure

```bash
mkdir -p lib/assistantTools/security
mkdir -p lib/assistantTools/__tests__/security
```

### 1.2 Input Validator (`lib/assistantTools/security/inputValidator.js`)

```javascript
// Implementation checklist:
// - [ ] sanitizeString() - null bytes, injection patterns
// - [ ] validateFilePath() - path traversal prevention
// - [ ] validateGlobPattern() - ReDoS prevention
// - [ ] validateUUID() - format validation
// - [ ] validateEnum() - whitelist validation
// - [ ] sanitizeObject() - recursive sanitization
// - [ ] BLOCKED_PATTERNS constant
// - [ ] ValidationError class
```

**Tests**: `__tests__/security/inputValidator.test.js`
- [ ] SQL injection payloads (15+ test cases)
- [ ] NoSQL injection payloads (10+ test cases)
- [ ] Path traversal payloads (10+ test cases)
- [ ] XSS payloads (10+ test cases)
- [ ] Prototype pollution (5+ test cases)
- [ ] Null byte injection (3+ test cases)

### 1.3 Permission Checker (`lib/assistantTools/security/permissionChecker.js`)

```javascript
// Implementation checklist:
// - [ ] PERMISSION_LEVELS constant (1-4)
// - [ ] TOOL_PERMISSIONS map (all 74 tools)
// - [ ] getEffectivePermission(userId, section)
// - [ ] checkPermission(userId, toolName, toolInput)
// - [ ] PermissionDeniedError class
```

**Tests**: `__tests__/security/permissionChecker.test.js`
- [ ] All 4 levels tested
- [ ] Section overrides tested
- [ ] Edge cases (no settings, invalid level)

### 1.4 Ownership Verifier (`lib/assistantTools/security/ownershipVerifier.js`)

```javascript
// Implementation checklist:
// - [ ] verifyOwnership(userId, resourceType, resourceId)
// - [ ] verifyBatchOwnership(userId, resourceType, resourceIds)
// - [ ] OWNERSHIP_QUERIES constant (all resource types)
// - [ ] OwnershipError class
```

**Tests**: `__tests__/security/ownershipVerifier.test.js`
- [ ] Project ownership
- [ ] Nested resources (requirement → project)
- [ ] Cross-user access denial
- [ ] Batch verification

### 1.5 Rate Limiter Enhancement (`lib/assistantTools/security/rateLimiter.js`)

```javascript
// Enhance existing rateLimiter.js:
// - [ ] Add per-user global limits
// - [ ] Add IP-based limits
// - [ ] Add burst protection
// - [ ] Add abuse pattern detection
// - [ ] Add temporary blocking
// - [ ] Add getUserSecurityStatus()
```

**Tests**: `__tests__/security/rateLimiter.test.js`
- [ ] Per-tool limits
- [ ] Per-user global limits
- [ ] IP limits
- [ ] Burst protection
- [ ] Abuse pattern detection

### 1.6 Audit Logger (`lib/assistantTools/security/auditLogger.js`)

```javascript
// Implementation checklist:
// - [ ] logToolExecution(context)
// - [ ] sanitizeForLogging(data)
// - [ ] logSecurityEvent(userId, eventType, details)
// - [ ] alertSecurityTeam(logEntry)
// - [ ] SENSITIVE_FIELDS constant
```

**Tests**: `__tests__/security/auditLogger.test.js`
- [ ] All fields logged correctly
- [ ] Sensitive data redacted
- [ ] Security events trigger alerts

### 1.7 Confirmation Manager (`lib/assistantTools/security/confirmationManager.js`)

```javascript
// Implementation checklist:
// - [ ] CONFIRMATION_CONFIG constant
// - [ ] MANDATORY_CONFIRMATION list
// - [ ] createConfirmation(userId, toolName, toolInput, context)
// - [ ] processConfirmation(confirmationId, userId, sessionId, confirmed)
// - [ ] expireOldConfirmations()
// - [ ] generateConfirmationMessage(toolName, toolInput)
// - [ ] getAffectedItems(toolName, toolInput)
```

**Tests**: `__tests__/security/confirmationManager.test.js`
- [ ] Creation flow
- [ ] Session validation
- [ ] Expiration handling
- [ ] Bypass prevention

### Phase 1 Deliverables

| File | Status |
|------|--------|
| `lib/assistantTools/security/inputValidator.js` | [ ] |
| `lib/assistantTools/security/permissionChecker.js` | [ ] |
| `lib/assistantTools/security/ownershipVerifier.js` | [ ] |
| `lib/assistantTools/security/rateLimiter.js` | [ ] |
| `lib/assistantTools/security/auditLogger.js` | [ ] |
| `lib/assistantTools/security/confirmationManager.js` | [ ] |
| `lib/assistantTools/security/index.js` | [ ] |
| Tests for all above | [ ] |

---

## Phase 2: Database & API Infrastructure (4-5 hours)

**Goal**: Create database tables and core APIs for AI settings.

### 2.1 Database Migrations

#### Migration: `ai_settings` table

```sql
-- app/api/db/migrate-ai-settings/route.js

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  global_permission_level VARCHAR(20) DEFAULT 'read_only',

  projects_permission VARCHAR(20),
  requirements_permission VARCHAR(20),
  test_cases_permission VARCHAR(20),
  executions_permission VARCHAR(20),
  analysis_permission VARCHAR(20),
  history_permission VARCHAR(20),
  todos_permission VARCHAR(20),
  settings_permission VARCHAR(20),

  confirm_deletes BOOLEAN DEFAULT TRUE,
  confirm_bulk_operations BOOLEAN DEFAULT TRUE,
  confirm_integration_changes BOOLEAN DEFAULT TRUE,
  require_password_destructive BOOLEAN DEFAULT FALSE,
  bulk_threshold INTEGER DEFAULT 5,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_ai_settings_user ON ai_settings(user_id);
```

#### Migration: `ai_action_log` table

```sql
-- app/api/db/migrate-ai-action-log/route.js

CREATE TABLE IF NOT EXISTS ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  tool_name VARCHAR(100) NOT NULL,
  tool_category VARCHAR(50) NOT NULL,
  permission_level INTEGER NOT NULL,

  tool_input JSONB NOT NULL DEFAULT '{}',
  tool_result JSONB,
  error_message TEXT,

  page_path VARCHAR(255),
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,

  status VARCHAR(20) NOT NULL,
  required_confirmation BOOLEAN DEFAULT FALSE,
  user_confirmed BOOLEAN,
  confirmation_shown_at TIMESTAMP WITH TIME ZONE,
  confirmation_responded_at TIMESTAMP WITH TIME ZONE,

  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_log_user ON ai_action_log(user_id);
CREATE INDEX idx_ai_log_created ON ai_action_log(created_at DESC);
CREATE INDEX idx_ai_log_tool ON ai_action_log(tool_name);
CREATE INDEX idx_ai_log_status ON ai_action_log(status);
```

#### Migration: `ai_pending_confirmations` table

```sql
-- app/api/db/migrate-ai-confirmations/route.js

CREATE TABLE IF NOT EXISTS ai_pending_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  tool_name VARCHAR(100) NOT NULL,
  tool_input JSONB NOT NULL,
  confirmation_message TEXT NOT NULL,

  affected_items JSONB,
  affected_count INTEGER,

  session_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',

  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pending_conf_user ON ai_pending_confirmations(user_id, status);
CREATE INDEX idx_pending_conf_expires ON ai_pending_confirmations(expires_at)
  WHERE status = 'pending';
```

### 2.2 AI Settings API

#### `app/api/user/ai-settings/route.js`

```javascript
// Implementation checklist:
// - [ ] GET - Fetch user's AI settings (create default if none)
// - [ ] POST - Update AI settings
// - [ ] Validate permission level values
// - [ ] Require authentication
```

### 2.3 AI Action Log API

#### `app/api/user/ai-action-log/route.js`

```javascript
// Implementation checklist:
// - [ ] GET - List user's action log with pagination
// - [ ] Query params: limit, offset, tool, status, from_date, to_date
// - [ ] Require authentication
```

### 2.4 Confirmation API

#### `app/api/ai/confirm/[id]/route.js`

```javascript
// Implementation checklist:
// - [ ] POST - Process confirmation (confirm or cancel)
// - [ ] Validate session match
// - [ ] Check expiration
// - [ ] Execute tool if confirmed
// - [ ] Log result
```

### 2.5 Database Helper Functions

#### `lib/db-ai.js`

```javascript
// Implementation checklist:
// - [ ] getAISettings(userId)
// - [ ] updateAISettings(userId, settings)
// - [ ] createAISettings(userId)
// - [ ] logAIAction(context)
// - [ ] getAIActionLog(userId, filters)
// - [ ] createPendingConfirmation(data)
// - [ ] getPendingConfirmation(id)
// - [ ] updateConfirmationStatus(id, status)
// - [ ] expireOldConfirmations()
```

### Phase 2 Deliverables

| File | Status |
|------|--------|
| `app/api/db/migrate-ai-settings/route.js` | [ ] |
| `app/api/db/migrate-ai-action-log/route.js` | [ ] |
| `app/api/db/migrate-ai-confirmations/route.js` | [ ] |
| `app/api/user/ai-settings/route.js` | [ ] |
| `app/api/user/ai-action-log/route.js` | [ ] |
| `app/api/ai/confirm/[id]/route.js` | [ ] |
| `lib/db-ai.js` | [ ] |

---

## Phase 3: Core Tool Executor (4-5 hours)

**Goal**: Build the secure tool execution pipeline.

### 3.1 Tool Definitions (`lib/assistantTools/definitions.js`)

```javascript
// Expand existing file with ALL 74 tools:
// Each tool needs:
// - name
// - description
// - permission_level (1-4)
// - category
// - dangerous (boolean)
// - requires_confirmation (boolean)
// - requires_confirmation_if (optional expression)
// - confirmation_message (optional)
// - input_schema (JSON Schema)
```

**Implementation order by section**:
1. [ ] Navigation tools (6) - simplest, good for testing
2. [ ] Dashboard tools (4) - read-only
3. [ ] Analysis tools (14) - expand existing
4. [ ] Projects tools (7)
5. [ ] Requirements tools (9)
6. [ ] Test Cases tools (8)
7. [ ] Executions tools (6)
8. [ ] History tools (6)
9. [ ] Todos tools (8)
10. [ ] Settings tools (6)

### 3.2 Secure Executor (`lib/assistantTools/executor.js`)

```javascript
// Rewrite executor with security pipeline:

async function executeTool(toolName, toolInput, context) {
  const startedAt = Date.now();

  try {
    // 1. Get tool definition
    const tool = getToolByName(toolName);
    if (!tool) throw new Error(`Unknown tool: ${toolName}`);

    // 2. Validate input against schema
    validateInput(toolName, toolInput);

    // 3. Sanitize all string inputs
    const sanitizedInput = sanitizeInputs(toolInput);

    // 4. Check permission level
    const permResult = await checkPermission(context.userId, toolName, sanitizedInput);
    if (!permResult.allowed) {
      await logAIAction({ ...context, status: 'denied', error: permResult.reason });
      throw new PermissionDeniedError(permResult.reason);
    }

    // 5. Verify ownership of resources
    await verifyResourceOwnership(context.userId, toolName, sanitizedInput);

    // 6. Check rate limits
    const rateResult = checkRateLimit(context.userId, toolName);
    if (!rateResult.allowed) {
      await logAIAction({ ...context, status: 'rate_limited' });
      throw new RateLimitError(rateResult.message);
    }

    // 7. Check if confirmation required
    if (requiresConfirmation(tool, sanitizedInput, context)) {
      const confirmation = await createConfirmation(
        context.userId, toolName, sanitizedInput, context
      );
      return {
        requiresConfirmation: true,
        confirmationId: confirmation.id,
        message: confirmation.confirmation_message,
        affectedItems: confirmation.affected_items,
        expiresAt: confirmation.expires_at,
      };
    }

    // 8. Execute the tool
    const result = await executeToolImplementation(toolName, sanitizedInput, context);

    // 9. Log success
    await logAIAction({
      ...context,
      toolName,
      toolInput: sanitizedInput,
      result,
      status: 'success',
      startedAt,
    });

    return { success: true, data: result };

  } catch (error) {
    // Log failure
    await logAIAction({
      ...context,
      toolName,
      toolInput,
      status: 'failed',
      error: error.message,
      startedAt,
    });

    throw error;
  }
}
```

### 3.3 Tool Implementations Directory

Create implementation files for each section:

```
lib/assistantTools/tools/
├── navigation.js      # 6 tools
├── dashboard.js       # 4 tools
├── analysis.js        # 14 tools (expand existing)
├── projects.js        # 7 tools
├── requirements.js    # 9 tools
├── testCases.js       # 8 tools
├── executions.js      # 6 tools
├── history.js         # 6 tools
├── todos.js           # 8 tools
├── settings.js        # 6 tools
└── index.js           # Barrel export
```

### 3.4 Validator Enhancement (`lib/assistantTools/validator.js`)

```javascript
// Enhance existing validator:
// - [ ] Add JSON Schema validation using ajv
// - [ ] Add custom format validators (uuid, date-time, uri)
// - [ ] Integrate with inputValidator security checks
// - [ ] Better error messages
```

### Phase 3 Deliverables

| File | Status |
|------|--------|
| `lib/assistantTools/definitions.js` (74 tools) | [ ] |
| `lib/assistantTools/executor.js` (secure rewrite) | [ ] |
| `lib/assistantTools/validator.js` (enhanced) | [ ] |
| `lib/assistantTools/tools/navigation.js` | [ ] |
| `lib/assistantTools/tools/dashboard.js` | [ ] |
| `lib/assistantTools/tools/analysis.js` | [ ] |
| `lib/assistantTools/tools/projects.js` | [ ] |
| `lib/assistantTools/tools/requirements.js` | [ ] |
| `lib/assistantTools/tools/testCases.js` | [ ] |
| `lib/assistantTools/tools/executions.js` | [ ] |
| `lib/assistantTools/tools/history.js` | [ ] |
| `lib/assistantTools/tools/todos.js` | [ ] |
| `lib/assistantTools/tools/settings.js` | [ ] |
| `lib/assistantTools/tools/index.js` | [ ] |

---

## Phase 4: Tool Implementations - Read Operations (6-8 hours)

**Goal**: Implement all 35 read-only tools.

### 4.1 Navigation Tools (6 tools)

| Tool | Implementation |
|------|----------------|
| `get_current_page` | Return context.pagePath |
| `suggest_navigation` | Return destination with reason |
| `search_global` | Query multiple tables with UNION |
| `get_help` | Return static help content |
| `list_quick_actions` | Return context-aware actions |
| `select_quick_action` | Return action to execute |

### 4.2 Dashboard Tools (4 tools)

| Tool | Implementation |
|------|----------------|
| `get_dashboard_stats` | Aggregate queries for KPIs |
| `get_usage_chart_data` | Time-series query |
| `get_activity_heatmap` | Daily counts for year |
| `get_recent_activity` | Join multiple tables |

### 4.3 Analysis Tools - Read (5 tools)

| Tool | Implementation |
|------|----------------|
| `list_available_files` | Return from context.fileTree |
| `get_file_content` | Return from context.files |
| `get_analysis_status` | Return context.analysisStatus |
| `get_analysis_results` | Return context.results |
| `get_current_config` | Return context.config |

### 4.4 Projects Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `list_projects` | Query projects table |
| `get_project` | Query with counts |
| `search_projects` | Full-text search |

### 4.5 Requirements Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `list_requirements` | Query with filters |
| `get_requirement` | Include linked tests |
| `search_requirements` | Full-text search |

### 4.6 Test Cases Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `list_test_cases` | Query with filters |
| `get_test_case` | Include steps, history |
| `search_test_cases` | Full-text search |

### 4.7 Executions Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `list_executions` | Query with filters |
| `get_execution` | Include test results |
| `get_execution_logs` | Return logs |

### 4.8 History Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `list_analyses` | Query analyses table |
| `get_analysis_detail` | Full analysis data |
| `search_analyses` | Full-text search |

### 4.9 Todos Tools - Read (2 tools)

| Tool | Implementation |
|------|----------------|
| `list_todos` | Query with filters |
| `get_todo` | Include subtasks |

### 4.10 Settings Tools - Read (3 tools)

| Tool | Implementation |
|------|----------------|
| `get_user_settings` | Return non-sensitive settings |
| `get_ai_permissions` | Return AI settings |
| `get_integrations` | List connected integrations |

### Phase 4 Deliverables

| Section | Tools | Status |
|---------|-------|--------|
| Navigation | 6 | [ ] |
| Dashboard | 4 | [ ] |
| Analysis | 5 | [ ] |
| Projects | 3 | [ ] |
| Requirements | 3 | [ ] |
| Test Cases | 3 | [ ] |
| Executions | 3 | [ ] |
| History | 3 | [ ] |
| Todos | 2 | [ ] |
| Settings | 3 | [ ] |
| **Total** | **35** | |

---

## Phase 5: Tool Implementations - Write Operations (6-8 hours)

**Goal**: Implement all 27 write tools (non-dangerous).

### 5.1 Analysis Tools - Write (9 tools)

| Tool | Implementation |
|------|----------------|
| `select_file` | Add to context.selectedFiles |
| `deselect_file` | Remove from context.selectedFiles |
| `select_files_by_pattern` | Glob match and select |
| `select_all_code_files` | Filter and select |
| `clear_file_selection` | Clear context.selectedFiles |
| `set_analysis_options` | Update context.config |
| `set_output_format` | Update context.config.format |
| `set_test_framework` | Update context.config.framework |
| `set_additional_context` | Update context.config.context |

### 5.2 Analysis Tools - Actions (2 tools)

| Tool | Implementation |
|------|----------------|
| `start_analysis` | Trigger analysis flow |
| `cancel_analysis` | Abort current analysis |

### 5.3 Projects Tools - Write (2 tools)

| Tool | Implementation |
|------|----------------|
| `create_project` | INSERT into projects |
| `update_project` | UPDATE projects |

### 5.4 Requirements Tools - Write (4 tools)

| Tool | Implementation |
|------|----------------|
| `create_requirement` | INSERT into requirements |
| `update_requirement` | UPDATE requirements |
| `link_requirement_to_test` | INSERT into test_coverage |
| `unlink_requirement_from_test` | DELETE from test_coverage |

### 5.5 Test Cases Tools - Write (3 tools)

| Tool | Implementation |
|------|----------------|
| `create_test_case` | INSERT into test_cases |
| `update_test_case` | UPDATE test_cases |
| `duplicate_test_case` | Copy with new ID |

### 5.6 Executions Tools - Write (2 tools)

| Tool | Implementation |
|------|----------------|
| `start_execution` | Trigger WebContainer |
| `cancel_execution` | Abort execution |

### 5.7 History Tools - Write (2 tools)

| Tool | Implementation |
|------|----------------|
| `create_share_link` | Generate share token |
| `revoke_share_link` | Remove share token |

### 5.8 Todos Tools - Write (4 tools)

| Tool | Implementation |
|------|----------------|
| `create_todo` | INSERT into todos |
| `update_todo` | UPDATE todos |
| `complete_todo` | Set status = 'completed' |
| `reopen_todo` | Set status = 'pending' |

### 5.9 Settings Tools - Write (1 tool)

| Tool | Implementation |
|------|----------------|
| `update_profile` | UPDATE users (with confirmation) |

### Phase 5 Deliverables

| Section | Tools | Status |
|---------|-------|--------|
| Analysis | 11 | [ ] |
| Projects | 2 | [ ] |
| Requirements | 4 | [ ] |
| Test Cases | 3 | [ ] |
| Executions | 2 | [ ] |
| History | 2 | [ ] |
| Todos | 4 | [ ] |
| Settings | 1 | [ ] |
| **Total** | **27** | |

---

## Phase 6: Dangerous Actions & Confirmations (4-5 hours)

**Goal**: Implement all 12 dangerous tools with confirmation flows.

### 6.1 Projects - Dangerous (2 tools)

| Tool | Confirmation Message |
|------|---------------------|
| `archive_project` | "Archive project '{name}'? It can be restored later." |
| `delete_project` | "PERMANENTLY delete '{name}' and all {count} items? Cannot be undone." |

### 6.2 Requirements - Dangerous (2 tools)

| Tool | Confirmation Message |
|------|---------------------|
| `bulk_create_requirements` | "Create {count} requirements in '{project}'?" |
| `delete_requirement` | "Delete requirement '{title}'? Linked tests will be unlinked." |

### 6.3 Test Cases - Dangerous (2 tools)

| Tool | Confirmation Message |
|------|---------------------|
| `bulk_import_tests` | "Import {count} test cases into '{project}'?" |
| `delete_test_case` | "Delete test case '{title}'?" |

### 6.4 Executions - Dangerous (1 tool)

| Tool | Confirmation Message |
|------|---------------------|
| `delete_execution` | "Delete execution record and all results?" |

### 6.5 History - Dangerous (1 tool)

| Tool | Confirmation Message |
|------|---------------------|
| `delete_analysis` | "Delete analysis from {date}? Share links will stop working." |

### 6.6 Todos - Dangerous (2 tools)

| Tool | Confirmation Message |
|------|---------------------|
| `bulk_complete_todos` | "Mark {count} todos as completed?" |
| `delete_todo` | "Delete '{title}' and {subtask_count} subtasks?" |

### 6.7 Settings - Dangerous (2 tools)

| Tool | Confirmation Message |
|------|---------------------|
| `update_ai_permissions` | "Change AI permissions to '{level}'?" |
| `disconnect_integration` | "Disconnect {type}? Repository access will be revoked." |

### 6.8 Confirmation UI Component

#### `app/components/assistant/ConfirmationCard.jsx`

```jsx
// Implementation checklist:
// - [ ] Display confirmation message
// - [ ] Show affected items list
// - [ ] Countdown timer
// - [ ] Confirm button (danger style)
// - [ ] Cancel button
// - [ ] Loading state
// - [ ] Expired state
```

### Phase 6 Deliverables

| Section | Tools | Status |
|---------|-------|--------|
| Projects | 2 | [ ] |
| Requirements | 2 | [ ] |
| Test Cases | 2 | [ ] |
| Executions | 1 | [ ] |
| History | 1 | [ ] |
| Todos | 2 | [ ] |
| Settings | 2 | [ ] |
| **Total Dangerous** | **12** | |
| ConfirmationCard.jsx | 1 | [ ] |

---

## Phase 7: Settings UI & Admin Panel (6-8 hours)

**Goal**: Build user settings and admin panel interfaces.

### 7.1 AI Settings Tab

#### `app/components/settings/AISettingsTab.jsx`

```jsx
// Implementation checklist:
// - [ ] Global permission level selector (radio buttons)
// - [ ] Section overrides (dropdowns)
// - [ ] Confirmation checkboxes
// - [ ] Bulk threshold input
// - [ ] Save button with loading state
// - [ ] Success/error toast
```

#### Update `app/settings/page.js`

```jsx
// Add AI Settings tab to existing tabs
```

### 7.2 AI Action Log Page

#### `app/settings/ai-history/page.js`

```jsx
// Implementation checklist:
// - [ ] Table with columns: Time, Tool, Status, Duration
// - [ ] Filters: Date range, Tool, Status
// - [ ] Expandable rows for details
// - [ ] Pagination
// - [ ] Export CSV button
```

### 7.3 Admin Panel Layout

#### `app/admin/layout.js`

```jsx
// Implementation checklist:
// - [ ] Admin role check (redirect if not admin)
// - [ ] Admin navigation sidebar
// - [ ] Breadcrumbs
```

#### `middleware.js` update

```javascript
// Add admin routes protection
const adminRoutes = ['/admin', '/admin/ai-tools'];
```

### 7.4 Admin Tool Catalog

#### `app/admin/ai-tools/page.js`

```jsx
// Implementation checklist:
// - [ ] Tabs: Tool Catalog, Usage Stats, Audit Logs, Rate Limits
// - [ ] Tool list grouped by section
// - [ ] Enable/disable toggles
// - [ ] Configure modal trigger
// - [ ] Search/filter tools
```

#### `app/admin/ai-tools/components/ToolCatalog.jsx`

```jsx
// Implementation checklist:
// - [ ] Collapsible sections
// - [ ] Tool row with: name, level, type, danger badge, usage count
// - [ ] Configure button
```

#### `app/admin/ai-tools/components/ToolConfigModal.jsx`

```jsx
// Implementation checklist:
// - [ ] Enable/disable toggle
// - [ ] Rate limit inputs (per minute, hour, day)
// - [ ] Confirmation settings
// - [ ] Custom confirmation message textarea
// - [ ] Save button
```

### 7.5 Admin Usage Statistics

#### `app/admin/ai-tools/components/UsageStatistics.jsx`

```jsx
// Implementation checklist:
// - [ ] KPI cards (total calls, users, confirmations, failures)
// - [ ] Top tools chart
// - [ ] Usage by section pie chart
// - [ ] Dangerous actions table
// - [ ] Usage over time line chart
```

### 7.6 Admin Audit Log

#### `app/admin/ai-tools/components/AuditLogViewer.jsx`

```jsx
// Implementation checklist:
// - [ ] Filters: Date, User, Tool, Status
// - [ ] Table with expandable details
// - [ ] Pagination
// - [ ] Export CSV
// - [ ] Security event highlighting
```

### 7.7 Admin APIs

#### `app/api/admin/ai-tools/route.js`

```javascript
// GET - List all tools with config and usage stats
// POST - Batch update tool configs
```

#### `app/api/admin/ai-tools/[name]/route.js`

```javascript
// GET - Single tool details
// PATCH - Update tool config
```

#### `app/api/admin/ai-stats/route.js`

```javascript
// GET - Usage statistics with period filter
```

#### `app/api/admin/ai-audit-log/route.js`

```javascript
// GET - Audit log with filters (admin sees all users)
```

### Phase 7 Deliverables

| File | Status |
|------|--------|
| `app/components/settings/AISettingsTab.jsx` | [ ] |
| `app/settings/ai-history/page.js` | [ ] |
| `app/admin/layout.js` | [ ] |
| `app/admin/ai-tools/page.js` | [ ] |
| `app/admin/ai-tools/components/ToolCatalog.jsx` | [ ] |
| `app/admin/ai-tools/components/ToolConfigModal.jsx` | [ ] |
| `app/admin/ai-tools/components/UsageStatistics.jsx` | [ ] |
| `app/admin/ai-tools/components/AuditLogViewer.jsx` | [ ] |
| `app/api/admin/ai-tools/route.js` | [ ] |
| `app/api/admin/ai-tools/[name]/route.js` | [ ] |
| `app/api/admin/ai-stats/route.js` | [ ] |
| `app/api/admin/ai-audit-log/route.js` | [ ] |
| `middleware.js` update | [ ] |

---

## Phase 8: Integration & Testing (5-6 hours)

**Goal**: Connect everything, comprehensive testing, and polish.

### 8.1 Chat Assistant Integration

#### Update `app/api/chat-assistant/route.js`

```javascript
// Implementation checklist:
// - [ ] Load user's AI settings
// - [ ] Pass tools based on permission level
// - [ ] Handle tool calls through secure executor
// - [ ] Handle confirmation responses
// - [ ] Return action results to client
```

### 8.2 Action Bridge Enhancement

#### Update `app/hooks/useAssistantActions.js`

```javascript
// Implementation checklist:
// - [ ] Handle all 74 tool actions
// - [ ] Handle confirmation flow
// - [ ] Update UI state based on tool results
// - [ ] Error handling and toasts
```

### 8.3 Floating Assistant Enhancement

#### Update `app/components/assistant/FloatingAssistant.jsx`

```javascript
// Implementation checklist:
// - [ ] Render ConfirmationCard when needed
// - [ ] Handle confirmation button clicks
// - [ ] Show tool execution feedback
// - [ ] Error messages for denied operations
```

### 8.4 Integration Tests

```javascript
// __tests__/integration/

// toolExecution.test.js
// - [ ] Full CRUD flow for each section
// - [ ] Permission denial at each level
// - [ ] Rate limiting behavior
// - [ ] Confirmation flow end-to-end

// chatAssistant.test.js
// - [ ] Tool calls through chat API
// - [ ] Multi-turn conversations
// - [ ] Context passing

// adminPanel.test.js
// - [ ] Tool configuration
// - [ ] Statistics accuracy
// - [ ] Audit log completeness
```

### 8.5 Security Audit

```bash
# Run security test suite
npm run test:security

# Check for:
# - [ ] All injection tests pass
# - [ ] All permission tests pass
# - [ ] All rate limit tests pass
# - [ ] All ownership tests pass
# - [ ] All confirmation tests pass
```

### 8.6 Documentation

#### Update `CLAUDE.md`

```markdown
# Add sections for:
# - AI Assistant Tools overview
# - Permission levels explanation
# - Admin panel usage
# - Security measures
```

#### Update `docs/AI_ASSISTANT_FULL_PLAN.md`

```markdown
# Mark all completed items
# Add any learnings or changes
```

### Phase 8 Deliverables

| Task | Status |
|------|--------|
| Chat assistant integration | [ ] |
| Action bridge enhancement | [ ] |
| Floating assistant enhancement | [ ] |
| Integration tests | [ ] |
| Security audit | [ ] |
| Documentation | [ ] |
| Final QA | [ ] |

---

## Implementation Order Summary

```
Week 1:
├── Phase 1: Security Foundation (Day 1-2)
├── Phase 2: Database & API Infrastructure (Day 2-3)
└── Phase 3: Core Tool Executor (Day 3-4)

Week 2:
├── Phase 4: Read Operations (Day 1-2)
├── Phase 5: Write Operations (Day 2-3)
└── Phase 6: Dangerous Actions (Day 4)

Week 3:
├── Phase 7: Settings UI & Admin Panel (Day 1-3)
└── Phase 8: Integration & Testing (Day 3-5)
```

---

## Definition of Done

### Per Tool
- [ ] Implementation complete
- [ ] Input schema defined
- [ ] Permission level assigned
- [ ] Ownership verification added (if applicable)
- [ ] Unit test written
- [ ] Security test written (if applicable)
- [ ] Documented in definitions.js

### Per Phase
- [ ] All deliverables complete
- [ ] Tests passing
- [ ] No security vulnerabilities
- [ ] Code reviewed
- [ ] Merged to feature branch

### Final
- [ ] All 74 tools implemented
- [ ] All tests passing (>90% coverage)
- [ ] Security tests passing (100% critical paths)
- [ ] Admin panel functional
- [ ] Settings UI functional
- [ ] Documentation complete
- [ ] Production deployment ready

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Security vulnerability | Build security layer FIRST, test continuously |
| Breaking existing functionality | Feature branch, comprehensive tests |
| Performance issues | Rate limiting, efficient queries, caching |
| Scope creep | Strict adherence to 74 tools defined |
| Database migration failures | Backup before migrations, test locally first |

---

## Quick Start Commands

```bash
# Start development
git checkout -b feature/ai-assistant-tools
docker-compose up -d
PORT=3033 npm run dev

# Run tests during development
npm run test -- --watch

# Run security tests
npm run test:security

# Run specific phase tests
npm run test -- lib/assistantTools/__tests__/security/

# Check test coverage
npm run test:coverage

# Before merge
npm run lint
npm run build
npm run test
```
