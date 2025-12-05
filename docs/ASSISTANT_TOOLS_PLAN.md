# ORIZON Assistant Tools Plan

## Overview

Transform the ORIZON Assistant from a "chat-only" observer into an interactive agent that can execute actions within the application while maintaining strict security boundaries.

## Current Issues

1. **Floating Assistant**: Missing API key, no page context
2. **Traditional V2 Assistant**: Can see context but cannot execute actions
3. **Both**: No tool/action system to interact with UI

---

## Security Principles

### 1. Principle of Least Privilege
- Tools can only perform actions the user could do manually
- No direct database access from tools
- No file system access outside designated areas
- No execution of arbitrary code

### 2. Input Validation
- All tool inputs validated against strict schemas
- Path traversal prevention for file operations
- Whitelist-based validation for enums (actions, configs)
- Length limits on all string inputs

### 3. Authorization
- All tool calls require valid session
- Tools respect existing permission model
- API key never exposed to client or logs
- Rate limiting per user/session

### 4. Scope Limitation
- Tools operate only on current session state
- Cannot affect other users' data
- Cannot modify system configuration
- Cannot access sensitive user settings (passwords, tokens)

---

## Tool Definitions

### Category 1: File Selection Tools

```javascript
const fileSelectionTools = [
  {
    name: "list_available_files",
    description: "List all files available in the current repository/upload",
    input_schema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Optional file extension filter (e.g., '.js', '.py')",
          maxLength: 10,
          pattern: "^\\.[a-z0-9]+$"
        },
        directory: {
          type: "string",
          description: "Optional directory path to list (relative to root)",
          maxLength: 200
        }
      },
      required: []
    },
    // SECURITY: Read-only, returns only files from already-loaded tree
    // No filesystem access - operates on in-memory fileTree state
  },

  {
    name: "select_file",
    description: "Select a specific file for analysis",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path to select (must exist in file tree)",
          maxLength: 500,
          // No .. or absolute paths allowed
          pattern: "^[^/][a-zA-Z0-9._/-]+$"
        }
      },
      required: ["path"]
    },
    // SECURITY: Validates path exists in fileTree before selection
    // Cannot select files outside loaded repository
  },

  {
    name: "select_files_by_pattern",
    description: "Select multiple files matching a pattern",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Glob pattern (e.g., 'src/**/*.js', '*.test.ts')",
          maxLength: 100,
          // Safe glob patterns only
          pattern: "^[a-zA-Z0-9.*/_-]+$"
        },
        maxFiles: {
          type: "integer",
          description: "Maximum files to select (default 50)",
          minimum: 1,
          maximum: 100
        }
      },
      required: ["pattern"]
    },
    // SECURITY: Pattern matched against in-memory tree only
    // maxFiles prevents selecting entire codebase
  },

  {
    name: "select_all_code_files",
    description: "Select all code files (respects default exclusions)",
    input_schema: {
      type: "object",
      properties: {
        maxFiles: {
          type: "integer",
          description: "Maximum files to select (default 50)",
          minimum: 1,
          maximum: 100
        }
      },
      required: []
    },
    // SECURITY: Uses existing selectAllCodeFiles() which excludes:
    // - node_modules, .git, dist, build, etc.
    // - Has built-in file limit
  },

  {
    name: "clear_file_selection",
    description: "Clear all selected files",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Safe operation, no inputs
  },

  {
    name: "get_file_content",
    description: "Get content of a selected file (for context)",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path (must be in selected files)",
          maxLength: 500
        },
        maxLines: {
          type: "integer",
          description: "Maximum lines to return (default 100)",
          minimum: 1,
          maximum: 500
        }
      },
      required: ["path"]
    },
    // SECURITY: Only returns content of already-selected files
    // Cannot read arbitrary files
    // Line limit prevents memory exhaustion
  }
];
```

### Category 2: Configuration Tools

```javascript
const configurationTools = [
  {
    name: "get_current_config",
    description: "Get current analysis configuration",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Read-only, returns sanitized config
    // Does NOT include apiKey or sensitive settings
  },

  {
    name: "set_analysis_options",
    description: "Configure what to generate in analysis",
    input_schema: {
      type: "object",
      properties: {
        userStories: {
          type: "boolean",
          description: "Generate user stories"
        },
        testCases: {
          type: "boolean",
          description: "Generate test cases"
        },
        acceptanceCriteria: {
          type: "boolean",
          description: "Generate acceptance criteria"
        },
        edgeCases: {
          type: "boolean",
          description: "Include edge case analysis"
        },
        securityTests: {
          type: "boolean",
          description: "Include security test cases"
        }
      },
      required: []
    },
    // SECURITY: Boolean-only, no code injection possible
    // Whitelist validation on property names
  },

  {
    name: "set_output_format",
    description: "Set the output format for generated content",
    input_schema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          description: "Output format",
          enum: ["markdown", "json", "yaml", "gherkin", "jira", "testrail", "azure"]
        }
      },
      required: ["format"]
    },
    // SECURITY: Strict enum validation, no arbitrary values
  },

  {
    name: "set_test_framework",
    description: "Set the test framework style",
    input_schema: {
      type: "object",
      properties: {
        framework: {
          type: "string",
          description: "Test framework",
          enum: ["generic", "jest", "pytest", "junit", "mocha", "vitest"]
        }
      },
      required: ["framework"]
    },
    // SECURITY: Strict enum validation
  },

  {
    name: "set_additional_context",
    description: "Add context or instructions for the analysis",
    input_schema: {
      type: "object",
      properties: {
        context: {
          type: "string",
          description: "Additional context for the AI",
          maxLength: 2000
        }
      },
      required: ["context"]
    },
    // SECURITY: Length limited
    // Content is used in prompt, but cannot execute code
    // Sanitized before use (no template injection)
  }
];
```

### Category 3: Analysis Actions

```javascript
const analysisTools = [
  {
    name: "start_analysis",
    description: "Begin code analysis with current configuration",
    input_schema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          description: "User must confirm to start (prevents accidental triggers)"
        }
      },
      required: ["confirm"]
    },
    // SECURITY: Requires explicit confirm=true
    // Respects existing canAnalyze checks
    // Uses user's API key (not exposed)
    // Rate limited by API cost/tokens
  },

  {
    name: "cancel_analysis",
    description: "Cancel ongoing analysis",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Can only cancel own analysis
    // Session-scoped
  },

  {
    name: "get_analysis_status",
    description: "Get current analysis progress and status",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Read-only, own session only
  },

  {
    name: "get_analysis_results",
    description: "Get results from completed analysis",
    input_schema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          description: "Which section to get",
          enum: ["all", "testCases", "userStories", "acceptanceCriteria"]
        },
        maxLength: {
          type: "integer",
          description: "Maximum characters to return",
          minimum: 100,
          maximum: 10000
        }
      },
      required: []
    },
    // SECURITY: Read-only, length limited
  }
];
```

### Category 4: Navigation Tools

```javascript
const navigationTools = [
  {
    name: "get_current_page",
    description: "Get information about current page/section",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Read-only
  },

  {
    name: "suggest_navigation",
    description: "Suggest user navigate to a different page",
    input_schema: {
      type: "object",
      properties: {
        page: {
          type: "string",
          description: "Page to suggest",
          enum: [
            "/analyze",
            "/analyze-v2",
            "/execute",
            "/reports",
            "/projects",
            "/settings",
            "/history"
          ]
        },
        reason: {
          type: "string",
          description: "Why this page is suggested",
          maxLength: 200
        }
      },
      required: ["page"]
    },
    // SECURITY: Does NOT auto-navigate
    // Returns suggestion for user to click
    // Whitelist of valid pages only
  }
];
```

### Category 5: Quick Actions

```javascript
const quickActionTools = [
  {
    name: "select_quick_action",
    description: "Select a predefined analysis action",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Quick action to select",
          enum: ["api-tests", "user-stories", "full-suite", "security"]
        }
      },
      required: ["action"]
    },
    // SECURITY: Strict enum, maps to predefined configs
  },

  {
    name: "list_quick_actions",
    description: "List available quick actions and their descriptions",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    },
    // SECURITY: Read-only
  }
];
```

---

## Security Implementation

### 1. Tool Executor (Server-Side Validation)

```javascript
// lib/assistantTools/executor.js

const ALLOWED_TOOLS = new Set([
  'list_available_files',
  'select_file',
  'select_files_by_pattern',
  'select_all_code_files',
  'clear_file_selection',
  'get_file_content',
  'get_current_config',
  'set_analysis_options',
  'set_output_format',
  'set_test_framework',
  'set_additional_context',
  'start_analysis',
  'cancel_analysis',
  'get_analysis_status',
  'get_analysis_results',
  'get_current_page',
  'suggest_navigation',
  'select_quick_action',
  'list_quick_actions'
]);

export function validateToolCall(toolName, input) {
  // 1. Check tool exists
  if (!ALLOWED_TOOLS.has(toolName)) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // 2. Validate input against schema
  const schema = getToolSchema(toolName);
  const errors = validateAgainstSchema(input, schema);
  if (errors.length > 0) {
    throw new Error(`Invalid input: ${errors.join(', ')}`);
  }

  // 3. Additional security checks
  if (toolName === 'select_file' || toolName === 'get_file_content') {
    validateFilePath(input.path);
  }

  if (toolName === 'select_files_by_pattern') {
    validateGlobPattern(input.pattern);
  }

  return true;
}

function validateFilePath(path) {
  // No path traversal
  if (path.includes('..')) {
    throw new Error('Path traversal not allowed');
  }
  // No absolute paths
  if (path.startsWith('/')) {
    throw new Error('Absolute paths not allowed');
  }
  // No special characters that could cause issues
  if (/[<>:"|?*]/.test(path)) {
    throw new Error('Invalid characters in path');
  }
}

function validateGlobPattern(pattern) {
  // Only allow safe glob characters
  if (!/^[a-zA-Z0-9.*/_\-]+$/.test(pattern)) {
    throw new Error('Invalid glob pattern');
  }
  // Prevent excessive wildcards
  if ((pattern.match(/\*/g) || []).length > 3) {
    throw new Error('Too many wildcards in pattern');
  }
}
```

### 2. Client-Side Action Bridge

```javascript
// app/hooks/useAssistantActions.js

export function useAssistantActions() {
  // Get state setters from V2 page context
  const pageActions = usePageActions();

  const executeAction = useCallback(async (toolName, input, sessionState) => {
    // Validate session
    if (!sessionState.isAuthenticated) {
      return { error: 'Not authenticated' };
    }

    // Rate limit check (client-side preliminary)
    if (isRateLimited(toolName)) {
      return { error: 'Rate limited, please wait' };
    }

    switch (toolName) {
      case 'select_file':
        // Verify file exists in tree
        if (!sessionState.fileTree.has(input.path)) {
          return { error: `File not found: ${input.path}` };
        }
        pageActions.toggleFileSelection(input.path);
        return { success: true, message: `Selected: ${input.path}` };

      case 'select_all_code_files':
        const count = pageActions.selectAllCodeFiles(input.maxFiles || 50);
        return { success: true, message: `Selected ${count} files` };

      case 'start_analysis':
        if (!input.confirm) {
          return { error: 'Analysis requires confirm=true' };
        }
        if (!sessionState.canAnalyze) {
          return { error: 'Cannot analyze: missing requirements' };
        }
        await pageActions.startAnalysis();
        return { success: true, message: 'Analysis started' };

      // ... other cases

      default:
        return { error: `Unknown action: ${toolName}` };
    }
  }, [pageActions]);

  return { executeAction };
}
```

### 3. Rate Limiting

```javascript
// lib/assistantTools/rateLimiter.js

const RATE_LIMITS = {
  // Analysis tools - expensive operations
  'start_analysis': { window: 60000, max: 3 },    // 3 per minute
  'get_file_content': { window: 10000, max: 10 }, // 10 per 10 seconds

  // Selection tools - medium frequency
  'select_file': { window: 1000, max: 20 },       // 20 per second
  'select_files_by_pattern': { window: 5000, max: 5 }, // 5 per 5 seconds

  // Read-only tools - high frequency allowed
  'list_available_files': { window: 1000, max: 10 },
  'get_current_config': { window: 1000, max: 20 },
};

const userCalls = new Map(); // userId -> toolName -> timestamps[]

export function checkRateLimit(userId, toolName) {
  const limit = RATE_LIMITS[toolName] || { window: 1000, max: 50 };
  const now = Date.now();
  const key = `${userId}:${toolName}`;

  const calls = userCalls.get(key) || [];
  const recentCalls = calls.filter(t => now - t < limit.window);

  if (recentCalls.length >= limit.max) {
    return false;
  }

  recentCalls.push(now);
  userCalls.set(key, recentCalls);
  return true;
}
```

### 4. Audit Logging

```javascript
// All tool executions logged for security audit
export async function logToolExecution(userId, toolName, input, result) {
  await db.query(`
    INSERT INTO assistant_tool_logs
    (user_id, tool_name, input_hash, success, error, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [
    userId,
    toolName,
    hashInput(input), // Don't log full input, just hash
    result.success || false,
    result.error || null
  ]);
}
```

---

## Implementation Phases

### Phase 1: Bug Fixes (~2h)
- [x] Identify floating assistant bug (missing apiKey)
- [ ] Fix ChatInput.jsx to pass apiKey
- [ ] Connect V2 page to usePageContext
- [ ] Test both assistants work independently

### Phase 2: Rich Context (~4h)
- [ ] Expand context passed to chat-assistant API
- [ ] Include file list (not just count)
- [ ] Include available actions
- [ ] Include current configuration details

### Phase 3: Tool Definitions (~4h)
- [ ] Create lib/assistantTools/definitions.js
- [ ] Define all tool schemas (above)
- [ ] Create validation functions
- [ ] Write unit tests for validation

### Phase 4: API Integration (~6h)
- [ ] Update /api/chat-assistant to use Claude tools
- [ ] Implement tool response handling
- [ ] Create tool execution loop
- [ ] Handle multi-turn tool conversations

### Phase 5: Action Bridge (~4h)
- [ ] Create useAssistantActions hook
- [ ] Connect to V2 page state setters
- [ ] Implement each tool executor
- [ ] Add rate limiting

### Phase 6: Security Hardening (~4h)
- [ ] Add audit logging
- [ ] Implement rate limiting (server-side)
- [ ] Add input sanitization
- [ ] Security testing / penetration testing

### Phase 7: Testing & Polish (~4h)
- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] UI feedback for tool execution
- [ ] Documentation

---

## Files to Create/Modify

### New Files
```
lib/assistantTools/
├── definitions.js      # Tool schemas
├── executor.js         # Server-side execution
├── validator.js        # Input validation
├── rateLimiter.js      # Rate limiting
└── audit.js            # Logging

app/hooks/
└── useAssistantActions.js  # Client-side bridge

app/api/chat-assistant/
└── route.js            # Update for tools
```

### Modified Files
```
app/components/assistant/ChatInput.jsx     # Pass apiKey
app/analyze-v2/page.js                     # Expose actions via context
app/stores/assistantStore.js               # Add action dispatchers
app/providers/AssistantProvider.jsx        # Connect page actions
```

---

## Security Checklist

- [ ] All tool inputs validated against strict schemas
- [ ] No path traversal possible in file operations
- [ ] No arbitrary code execution
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] API key never exposed
- [ ] Session validation on all operations
- [ ] No cross-user data access
- [ ] Input length limits enforced
- [ ] Enum values whitelist-validated

---

## Example Conversation Flow

```
User: "Select all JavaScript files in this project"