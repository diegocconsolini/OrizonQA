# AI Assistant Full Site Integration Plan

## Overview

Transform the ORIZON Assistant into a fully interactive AI that can safely operate across ALL sections of the application with user-configurable permission levels.

## Design Principles

1. **Safety First**: Dangerous/destructive actions ALWAYS require user confirmation
2. **Configurable**: Users control what the AI can do via Settings
3. **Transparent**: AI explains what it's doing and asks before actions
4. **Reversible**: Prefer soft-deletes and undo capabilities
5. **Auditable**: All AI actions are logged for review

---

## Permission Levels

### Level 1: Read Only (Default)
- View data, list items, search
- No modifications allowed
- Safe for all users

### Level 2: Read + Suggest
- All Level 1 capabilities
- AI can suggest actions but user must approve
- Actions queued for user confirmation

### Level 3: Read + Write (Safe)
- All Level 2 capabilities
- AI can create new items
- AI can update non-critical fields
- Cannot delete or modify critical data

### Level 4: Full Access (Expert)
- All Level 3 capabilities
- AI can update all fields
- Soft-delete with confirmation
- Still requires confirmation for:
  - Hard deletes
  - Bulk operations (>5 items)
  - Account/billing changes
  - Integration disconnects

---

## Site Sections & Tools

### 1. Projects Section (`/projects`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_projects` | L1 | List all user projects | No |
| `get_project` | L1 | Get project details | No |
| `search_projects` | L1 | Search by name/key | No |
| `create_project` | L3 | Create new project | No |
| `update_project` | L3 | Update project metadata | No |
| `archive_project` | L4 | Soft-delete project | **Yes** |
| `delete_project` | L4 | Hard delete project | **YES - Confirm** |

### 2. Requirements Section (`/projects/[id]/requirements`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_requirements` | L1 | List project requirements | No |
| `get_requirement` | L1 | Get requirement details | No |
| `search_requirements` | L1 | Search requirements | No |
| `create_requirement` | L3 | Create new requirement | No |
| `update_requirement` | L3 | Update requirement | No |
| `link_requirement_to_test` | L3 | Create coverage link | No |
| `bulk_create_requirements` | L4 | Import multiple | **Yes - Confirm if >5** |
| `delete_requirement` | L4 | Delete requirement | **YES - Confirm** |

### 3. Test Cases Section (`/projects/[id]/tests`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_test_cases` | L1 | List project test cases | No |
| `get_test_case` | L1 | Get test case details | No |
| `search_test_cases` | L1 | Search test cases | No |
| `create_test_case` | L3 | Create new test case | No |
| `update_test_case` | L3 | Update test case | No |
| `duplicate_test_case` | L3 | Clone test case | No |
| `bulk_import_tests` | L4 | Import from analysis | **Yes - Confirm if >5** |
| `delete_test_case` | L4 | Delete test case | **YES - Confirm** |

### 4. Test Execution Section (`/execute`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_executions` | L1 | List past executions | No |
| `get_execution` | L1 | Get execution details | No |
| `get_execution_logs` | L1 | View execution logs | No |
| `start_execution` | L3 | Start new test run | No |
| `cancel_execution` | L3 | Cancel running execution | No |
| `delete_execution` | L4 | Delete execution record | **YES - Confirm** |

### 5. Analysis Section (`/analyze`, `/analyze-v2`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_available_files` | L1 | List repo files | No |
| `get_file_content` | L1 | Read file content | No |
| `get_analysis_status` | L1 | Check analysis progress | No |
| `get_analysis_results` | L1 | View results | No |
| `select_file` | L2 | Select single file | No |
| `select_files_by_pattern` | L2 | Select by glob | No |
| `select_all_code_files` | L2 | Select all code | No |
| `clear_file_selection` | L2 | Clear selection | No |
| `set_analysis_options` | L2 | Configure options | No |
| `set_output_format` | L2 | Set format | No |
| `set_test_framework` | L2 | Set framework | No |
| `start_analysis` | L3 | Start analysis | No |
| `cancel_analysis` | L3 | Cancel analysis | No |

### 6. History Section (`/history`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_analyses` | L1 | List past analyses | No |
| `get_analysis` | L1 | Get analysis details | No |
| `search_analyses` | L1 | Search by content | No |
| `share_analysis` | L3 | Create share link | No |
| `unshare_analysis` | L3 | Remove share link | No |
| `delete_analysis` | L4 | Delete analysis | **YES - Confirm** |

### 7. Dashboard Section (`/dashboard`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `get_dashboard_stats` | L1 | Get KPIs | No |
| `get_usage_chart` | L1 | Get usage data | No |
| `get_activity_heatmap` | L1 | Get activity data | No |
| `get_recent_analyses` | L1 | Recent analyses | No |

### 8. Todos Section (`/todos`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `list_todos` | L1 | List all todos | No |
| `get_todo` | L1 | Get todo details | No |
| `create_todo` | L3 | Create new todo | No |
| `update_todo` | L3 | Update todo | No |
| `complete_todo` | L3 | Mark as complete | No |
| `bulk_complete_todos` | L4 | Complete multiple | **Yes - Confirm if >5** |
| `delete_todo` | L4 | Delete todo | **YES - Confirm** |

### 9. Settings Section (`/settings`)

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `get_settings` | L1 | Get current settings | No |
| `get_ai_permissions` | L1 | Get AI permission level | No |
| `update_ai_permissions` | L4 | Change AI permissions | **YES - Confirm** |
| `update_profile` | L4 | Update profile | **Yes - Confirm** |
| `update_api_key` | L4 | Update API key | **YES - Confirm** |
| `disconnect_integration` | L4 | Disconnect GitHub/etc | **YES - Confirm** |

### 10. Navigation & General

| Tool | Permission Level | Description | Dangerous? |
|------|-----------------|-------------|------------|
| `get_current_page` | L1 | Get current page | No |
| `suggest_navigation` | L2 | Suggest page to visit | No |
| `navigate_to` | L2 | Navigate user (with prompt) | No |
| `search_global` | L1 | Search across all data | No |
| `get_help` | L1 | Get help for feature | No |

---

## Dangerous Actions Flow

```
User: "Delete all my test cases"
       ↓
AI recognizes DANGEROUS action
       ↓
AI: "I can help delete test cases. This is a destructive action that cannot be undone.

     You have 47 test cases in project 'Banking App'.

     To proceed, please click the confirmation button below:"
       ↓
[Confirm Delete 47 Test Cases] [Cancel]
       ↓
User clicks Confirm
       ↓
AI executes with audit log
       ↓
AI: "Deleted 47 test cases. This action has been logged."
```

---

## Settings UI Design

### Location: `/settings` → "AI Assistant" tab

```
┌─────────────────────────────────────────────────────────────┐
│ AI Assistant Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Permission Level                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ Read Only (Default)                                    │ │
│ │   AI can view and search, but cannot make changes       │ │
│ │                                                          │ │
│ │ ○ Read + Suggest                                         │ │
│ │   AI suggests actions, you approve each one             │ │
│ │                                                          │ │
│ │ ● Read + Write (Safe)                              ←     │ │
│ │   AI can create and update items, but not delete        │ │
│ │                                                          │ │
│ │ ○ Full Access (Expert)                                   │ │
│ │   AI has full control, confirms only dangerous actions  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Section-Specific Overrides (Optional)                        │
│                                                              │
│ Projects        [Use Global ▼]                              │
│ Requirements    [Use Global ▼]                              │
│ Test Cases      [Full Access ▼]  ← Override for this section│
│ Test Execution  [Use Global ▼]                              │
│ Analysis        [Use Global ▼]                              │
│ Todos           [Read + Write ▼]                            │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Dangerous Action Confirmations                               │
│                                                              │
│ [✓] Always confirm before deleting                          │
│ [✓] Always confirm bulk operations (>5 items)               │
│ [✓] Always confirm integration changes                      │
│ [ ] Require password for destructive actions                │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ AI Action History                                            │
│ [View AI Action Log →]                                       │
│                                                              │
│                               [Save Settings]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Table: `ai_settings`
```sql
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Global permission level
  global_permission_level VARCHAR(20) DEFAULT 'read_only',
  -- Values: 'read_only', 'read_suggest', 'read_write', 'full_access'

  -- Section overrides (NULL = use global)
  projects_permission VARCHAR(20),
  requirements_permission VARCHAR(20),
  test_cases_permission VARCHAR(20),
  executions_permission VARCHAR(20),
  analysis_permission VARCHAR(20),
  todos_permission VARCHAR(20),

  -- Confirmation settings
  confirm_deletes BOOLEAN DEFAULT TRUE,
  confirm_bulk_operations BOOLEAN DEFAULT TRUE,
  confirm_integration_changes BOOLEAN DEFAULT TRUE,
  require_password_destructive BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);
```

### New Table: `ai_action_log`
```sql
CREATE TABLE ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action details
  tool_name VARCHAR(100) NOT NULL,
  tool_input JSONB,
  tool_result JSONB,

  -- Context
  page_path VARCHAR(255),
  session_id VARCHAR(100),

  -- Outcome
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'cancelled', 'confirmed'
  required_confirmation BOOLEAN DEFAULT FALSE,
  user_confirmed BOOLEAN,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_ai_log_user (user_id),
  INDEX idx_ai_log_created (created_at)
);
```

---

## Implementation Phases

### Phase 1: Settings Infrastructure (3-4 hours)
- [ ] Create `ai_settings` table migration
- [ ] Create `ai_action_log` table migration
- [ ] Create API: `GET/POST /api/user/ai-settings`
- [ ] Create API: `GET /api/user/ai-action-log`
- [ ] Add AI Settings tab to `/settings` page

### Phase 2: Permission System (4-5 hours)
- [ ] Create `lib/aiPermissions.js` - permission checker
- [ ] Update `lib/assistantTools/executor.js` - check permissions
- [ ] Create `lib/assistantTools/confirmationQueue.js` - pending confirmations
- [ ] Add confirmation UI component to FloatingAssistant

### Phase 3: Expand Tools - Read Operations (3-4 hours)
- [ ] Add Project tools (list, get, search)
- [ ] Add Requirement tools (list, get, search)
- [ ] Add Test Case tools (list, get, search)
- [ ] Add Execution tools (list, get, logs)
- [ ] Add Dashboard tools (stats, charts)
- [ ] Add Todo tools (list, get)
- [ ] Add History tools (list, get, search)

### Phase 4: Expand Tools - Write Operations (4-5 hours)
- [ ] Add Project tools (create, update)
- [ ] Add Requirement tools (create, update, link)
- [ ] Add Test Case tools (create, update, duplicate)
- [ ] Add Todo tools (create, update, complete)
- [ ] Add Analysis tools (already done)

### Phase 5: Dangerous Actions (3-4 hours)
- [ ] Add delete tools with confirmation flow
- [ ] Add bulk operation tools with confirmation
- [ ] Create confirmation modal component
- [ ] Add audit logging for all actions

### Phase 6: Polish & Testing (2-3 hours)
- [ ] Test all permission levels
- [ ] Test confirmation flows
- [ ] Test audit logging
- [ ] Add help text and examples to AI
- [ ] Documentation update

---

## Total Tools Count

| Category | Read | Write | Delete | Total |
|----------|------|-------|--------|-------|
| Projects | 3 | 2 | 2 | 7 |
| Requirements | 3 | 4 | 1 | 8 |
| Test Cases | 3 | 4 | 1 | 8 |
| Executions | 3 | 2 | 1 | 6 |
| Analysis | 5 | 8 | 0 | 13 |
| History | 3 | 2 | 1 | 6 |
| Dashboard | 4 | 0 | 0 | 4 |
| Todos | 2 | 4 | 1 | 7 |
| Settings | 2 | 3 | 0 | 5 |
| Navigation | 5 | 0 | 0 | 5 |
| **Total** | **33** | **29** | **7** | **69** |

---

## Security Measures

1. **Permission Validation**: Every tool call checks user's permission level
2. **Rate Limiting**: Per-tool limits (already implemented)
3. **Input Validation**: Sanitize all inputs (already implemented)
4. **Audit Logging**: All actions logged with user ID, tool, input, result
5. **Confirmation Queue**: Dangerous actions require explicit user approval
6. **Session Binding**: Tools only work on current user's data
7. **Soft Deletes**: Where possible, archive instead of hard delete

---

## Example Interactions

### Example 1: Create Project (L3)
```
User: "Create a new project for my mobile app"
AI: "I'll create a new project for you. What would you like to name it?"
User: "Mobile Banking v2"
AI: [Uses create_project tool]
    "Created project 'Mobile Banking v2' with key 'MOBBANK'.
     Would you like me to add any requirements to it?"
```

### Example 2: Delete Test Cases (L4 + Confirm)
```
User: "Delete all the failed test cases"
AI: "I found 12 failed test cases in project 'Banking App'.

     This is a permanent action. The following test cases will be deleted:
     - TC-001: Login validation
     - TC-005: Payment processing
     ... and 10 more

     [Delete 12 Test Cases] [Cancel]"

User: [Clicks Delete]
AI: "Deleted 12 test cases. This action has been logged."
```

### Example 3: Permission Denied
```
User: "Delete my project" (User has L2 permissions)
AI: "I don't have permission to delete projects. Your current AI permission
     level is 'Read + Suggest'.

     To enable deletion, go to Settings → AI Assistant and change your
     permission level to 'Full Access'.

     Would you like me to take you there?"
```

---

## Files to Create/Modify

### New Files
```
lib/aiPermissions.js                    # Permission checking logic
lib/assistantTools/projectTools.js      # Project CRUD tools
lib/assistantTools/requirementTools.js  # Requirement CRUD tools
lib/assistantTools/testCaseTools.js     # Test case CRUD tools
lib/assistantTools/executionTools.js    # Execution tools
lib/assistantTools/todoTools.js         # Todo CRUD tools
lib/assistantTools/dashboardTools.js    # Dashboard read tools
lib/assistantTools/historyTools.js      # History tools
lib/assistantTools/settingsTools.js     # Settings tools
lib/assistantTools/navigationTools.js   # Navigation tools
lib/assistantTools/confirmationQueue.js # Pending confirmations

app/api/user/ai-settings/route.js       # AI settings API
app/api/user/ai-action-log/route.js     # Action log API
app/api/db/migrate-ai-settings/route.js # Database migration

app/components/assistant/ConfirmationModal.jsx  # Confirmation UI
app/components/settings/AISettingsTab.jsx       # Settings UI
```

### Modified Files
```
lib/assistantTools/index.js             # Export all tools
lib/assistantTools/executor.js          # Add permission checks
lib/assistantTools/definitions.js       # Add new tool definitions

app/api/chat-assistant/route.js         # Handle confirmations
app/settings/page.js                    # Add AI tab
app/stores/assistantStore.js            # Add confirmation state
app/components/assistant/FloatingAssistant.jsx # Confirmation UI
```

---

## Timeline Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Settings Infrastructure | 3-4h | High |
| Phase 2: Permission System | 4-5h | High |
| Phase 3: Read Operations | 3-4h | High |
| Phase 4: Write Operations | 4-5h | Medium |
| Phase 5: Dangerous Actions | 3-4h | Medium |
| Phase 6: Polish & Testing | 2-3h | Medium |
| **Total** | **19-25h** | - |

---

## Success Criteria

1. User can set AI permission level in Settings
2. AI respects permission levels for all operations
3. Dangerous actions show confirmation modal
4. All AI actions are logged in action log
5. User can view their AI action history
6. Permission denied messages are helpful
7. No security vulnerabilities in tool execution
