# AI Assistant Full Site Integration Plan

## Overview

Transform the ORIZON Assistant into a fully interactive AI that can safely operate across ALL sections of the application with:
- **69 tools** across 10 site sections
- **4 permission levels** with granular control
- **Admin panel** for complete tool management
- **Audit logging** for all operations
- **Confirmation flows** for dangerous actions

---

## Design Principles

1. **Safety First**: Dangerous/destructive actions ALWAYS require user confirmation
2. **Configurable**: Users control what the AI can do via Settings
3. **Transparent**: AI explains what it's doing and asks before actions
4. **Reversible**: Prefer soft-deletes and undo capabilities
5. **Auditable**: All AI actions are logged for review
6. **Admin Control**: Full visibility and control via admin panel

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

## Complete Tool Definitions

### Section 1: Projects (`/projects`)

#### Tool 1.1: `list_projects`
```json
{
  "name": "list_projects",
  "description": "List all projects belonging to the current user. Returns project ID, name, key, description, and metadata.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["active", "archived", "all"],
        "description": "Filter by project status"
      },
      "sort_by": {
        "type": "string",
        "enum": ["name", "created_at", "updated_at"],
        "description": "Sort field"
      },
      "sort_order": {
        "type": "string",
        "enum": ["asc", "desc"],
        "description": "Sort direction"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "description": "Maximum number of projects to return"
      },
      "offset": {
        "type": "integer",
        "minimum": 0,
        "description": "Number of projects to skip"
      }
    },
    "required": []
  }
}
```

#### Tool 1.2: `get_project`
```json
{
  "name": "get_project",
  "description": "Get detailed information about a specific project including requirements count, test cases count, and recent activity.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The unique identifier of the project"
      }
    },
    "required": ["project_id"]
  }
}
```

#### Tool 1.3: `search_projects`
```json
{
  "name": "search_projects",
  "description": "Search projects by name, key, or description. Supports partial matching.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "Search query string"
      },
      "search_in": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["name", "key", "description"]
        },
        "description": "Fields to search in"
      }
    },
    "required": ["query"]
  }
}
```

#### Tool 1.4: `create_project`
```json
{
  "name": "create_project",
  "description": "Create a new project with the specified name and optional details.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "Project name"
      },
      "key": {
        "type": "string",
        "pattern": "^[A-Z][A-Z0-9]{1,9}$",
        "description": "Project key (2-10 uppercase alphanumeric, starts with letter)"
      },
      "description": {
        "type": "string",
        "maxLength": 1000,
        "description": "Project description"
      },
      "repository_url": {
        "type": "string",
        "format": "uri",
        "description": "Git repository URL"
      }
    },
    "required": ["name"]
  }
}
```

#### Tool 1.5: `update_project`
```json
{
  "name": "update_project",
  "description": "Update an existing project's metadata.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The project to update"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "New project name"
      },
      "description": {
        "type": "string",
        "maxLength": 1000,
        "description": "New project description"
      },
      "repository_url": {
        "type": "string",
        "format": "uri",
        "description": "New repository URL"
      }
    },
    "required": ["project_id"]
  }
}
```

#### Tool 1.6: `archive_project`
```json
{
  "name": "archive_project",
  "description": "Soft-delete a project by archiving it. Can be restored later.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The project to archive"
      }
    },
    "required": ["project_id"]
  }
}
```

#### Tool 1.7: `delete_project`
```json
{
  "name": "delete_project",
  "description": "Permanently delete a project and all its data. THIS CANNOT BE UNDONE.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "confirmation_message": "This will permanently delete the project and ALL associated requirements, test cases, and executions. This action cannot be undone.",
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The project to delete"
      }
    },
    "required": ["project_id"]
  }
}
```

---

### Section 2: Requirements (`/projects/[id]/requirements`)

#### Tool 2.1: `list_requirements`
```json
{
  "name": "list_requirements",
  "description": "List all requirements for a project with optional filtering.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The project to list requirements from"
      },
      "status": {
        "type": "string",
        "enum": ["draft", "active", "approved", "deprecated"],
        "description": "Filter by status"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"],
        "description": "Filter by priority"
      },
      "has_tests": {
        "type": "boolean",
        "description": "Filter by whether requirement has linked tests"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100
      },
      "offset": {
        "type": "integer",
        "minimum": 0
      }
    },
    "required": ["project_id"]
  }
}
```

#### Tool 2.2: `get_requirement`
```json
{
  "name": "get_requirement",
  "description": "Get detailed information about a specific requirement including linked test cases.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "requirement_id": {
        "type": "string",
        "format": "uuid",
        "description": "The requirement ID"
      }
    },
    "required": ["requirement_id"]
  }
}
```

#### Tool 2.3: `search_requirements`
```json
{
  "name": "search_requirements",
  "description": "Search requirements by title, description, or acceptance criteria.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "Limit search to a specific project"
      },
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200,
        "description": "Search query"
      }
    },
    "required": ["query"]
  }
}
```

#### Tool 2.4: `create_requirement`
```json
{
  "name": "create_requirement",
  "description": "Create a new requirement (user story) in a project.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "The project to add the requirement to"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "Requirement title"
      },
      "description": {
        "type": "string",
        "maxLength": 5000,
        "description": "Detailed description or user story"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"],
        "description": "Priority level"
      },
      "status": {
        "type": "string",
        "enum": ["draft", "active", "approved"],
        "description": "Initial status"
      },
      "acceptance_criteria": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "List of acceptance criteria"
      }
    },
    "required": ["project_id", "title"]
  }
}
```

#### Tool 2.5: `update_requirement`
```json
{
  "name": "update_requirement",
  "description": "Update an existing requirement's details.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "requirement_id": {
        "type": "string",
        "format": "uuid",
        "description": "The requirement to update"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      },
      "description": {
        "type": "string",
        "maxLength": 5000
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "status": {
        "type": "string",
        "enum": ["draft", "active", "approved", "deprecated"]
      },
      "acceptance_criteria": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "required": ["requirement_id"]
  }
}
```

#### Tool 2.6: `link_requirement_to_test`
```json
{
  "name": "link_requirement_to_test",
  "description": "Create a traceability link between a requirement and a test case.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "requirement_id": {
        "type": "string",
        "format": "uuid",
        "description": "The requirement ID"
      },
      "test_case_id": {
        "type": "string",
        "format": "uuid",
        "description": "The test case ID to link"
      }
    },
    "required": ["requirement_id", "test_case_id"]
  }
}
```

#### Tool 2.7: `unlink_requirement_from_test`
```json
{
  "name": "unlink_requirement_from_test",
  "description": "Remove a traceability link between a requirement and a test case.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "requirement_id": {
        "type": "string",
        "format": "uuid"
      },
      "test_case_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["requirement_id", "test_case_id"]
  }
}
```

#### Tool 2.8: `bulk_create_requirements`
```json
{
  "name": "bulk_create_requirements",
  "description": "Create multiple requirements at once. Requires confirmation if more than 5 items.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation_if": "items.length > 5",
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "requirements": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string", "minLength": 1, "maxLength": 200 },
            "description": { "type": "string", "maxLength": 5000 },
            "priority": { "type": "string", "enum": ["low", "medium", "high", "critical"] }
          },
          "required": ["title"]
        },
        "minItems": 1,
        "maxItems": 50
      }
    },
    "required": ["project_id", "requirements"]
  }
}
```

#### Tool 2.9: `delete_requirement`
```json
{
  "name": "delete_requirement",
  "description": "Permanently delete a requirement and its test links.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "requirement_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["requirement_id"]
  }
}
```

---

### Section 3: Test Cases (`/projects/[id]/tests`)

#### Tool 3.1: `list_test_cases`
```json
{
  "name": "list_test_cases",
  "description": "List all test cases for a project with optional filtering.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "enum": ["draft", "active", "deprecated"]
      },
      "type": {
        "type": "string",
        "enum": ["unit", "integration", "e2e", "manual", "performance"]
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "requirement_id": {
        "type": "string",
        "format": "uuid",
        "description": "Filter by linked requirement"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100
      },
      "offset": {
        "type": "integer",
        "minimum": 0
      }
    },
    "required": ["project_id"]
  }
}
```

#### Tool 3.2: `get_test_case`
```json
{
  "name": "get_test_case",
  "description": "Get detailed information about a specific test case including steps and execution history.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "test_case_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["test_case_id"]
  }
}
```

#### Tool 3.3: `search_test_cases`
```json
{
  "name": "search_test_cases",
  "description": "Search test cases by title, description, or code content.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200
      }
    },
    "required": ["query"]
  }
}
```

#### Tool 3.4: `create_test_case`
```json
{
  "name": "create_test_case",
  "description": "Create a new test case in a project.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      },
      "description": {
        "type": "string",
        "maxLength": 5000
      },
      "type": {
        "type": "string",
        "enum": ["unit", "integration", "e2e", "manual", "performance"]
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"]
      },
      "preconditions": {
        "type": "string",
        "maxLength": 2000
      },
      "steps": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action": { "type": "string" },
            "expected_result": { "type": "string" }
          },
          "required": ["action"]
        }
      },
      "test_code": {
        "type": "string",
        "maxLength": 50000,
        "description": "Automated test code (Jest/Vitest/Mocha)"
      },
      "requirement_ids": {
        "type": "array",
        "items": { "type": "string", "format": "uuid" },
        "description": "Requirements to link to"
      }
    },
    "required": ["project_id", "title"]
  }
}
```

#### Tool 3.5: `update_test_case`
```json
{
  "name": "update_test_case",
  "description": "Update an existing test case.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "test_case_id": {
        "type": "string",
        "format": "uuid"
      },
      "title": { "type": "string", "minLength": 1, "maxLength": 200 },
      "description": { "type": "string", "maxLength": 5000 },
      "type": { "type": "string", "enum": ["unit", "integration", "e2e", "manual", "performance"] },
      "priority": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
      "status": { "type": "string", "enum": ["draft", "active", "deprecated"] },
      "preconditions": { "type": "string", "maxLength": 2000 },
      "steps": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action": { "type": "string" },
            "expected_result": { "type": "string" }
          }
        }
      },
      "test_code": { "type": "string", "maxLength": 50000 }
    },
    "required": ["test_case_id"]
  }
}
```

#### Tool 3.6: `duplicate_test_case`
```json
{
  "name": "duplicate_test_case",
  "description": "Create a copy of an existing test case.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "test_case_id": {
        "type": "string",
        "format": "uuid",
        "description": "The test case to duplicate"
      },
      "new_title": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "Title for the copy (defaults to 'Copy of [original]')"
      }
    },
    "required": ["test_case_id"]
  }
}
```

#### Tool 3.7: `bulk_import_tests`
```json
{
  "name": "bulk_import_tests",
  "description": "Import multiple test cases from analysis results. Requires confirmation if more than 5.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation_if": "test_cases.length > 5",
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "analysis_id": {
        "type": "string",
        "format": "uuid",
        "description": "Source analysis to import from"
      },
      "test_cases": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "description": { "type": "string" },
            "test_code": { "type": "string" },
            "type": { "type": "string" }
          },
          "required": ["title"]
        },
        "maxItems": 100
      },
      "link_to_requirement_id": {
        "type": "string",
        "format": "uuid",
        "description": "Optionally link all imported tests to a requirement"
      }
    },
    "required": ["project_id", "test_cases"]
  }
}
```

#### Tool 3.8: `delete_test_case`
```json
{
  "name": "delete_test_case",
  "description": "Permanently delete a test case.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "test_case_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["test_case_id"]
  }
}
```

---

### Section 4: Test Execution (`/execute`)

#### Tool 4.1: `list_executions`
```json
{
  "name": "list_executions",
  "description": "List test executions with optional filtering by status, date, or project.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "project_id": {
        "type": "string",
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "enum": ["pending", "running", "completed", "failed", "cancelled"]
      },
      "from_date": {
        "type": "string",
        "format": "date-time"
      },
      "to_date": {
        "type": "string",
        "format": "date-time"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100
      },
      "offset": {
        "type": "integer",
        "minimum": 0
      }
    },
    "required": []
  }
}
```

#### Tool 4.2: `get_execution`
```json
{
  "name": "get_execution",
  "description": "Get detailed information about a specific test execution including individual test results.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "execution_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["execution_id"]
  }
}
```

#### Tool 4.3: `get_execution_logs`
```json
{
  "name": "get_execution_logs",
  "description": "Get the console output logs from a test execution.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "execution_id": {
        "type": "string",
        "format": "uuid"
      },
      "log_type": {
        "type": "string",
        "enum": ["stdout", "stderr", "all"],
        "description": "Type of logs to retrieve"
      },
      "tail": {
        "type": "integer",
        "minimum": 1,
        "maximum": 1000,
        "description": "Return only the last N lines"
      }
    },
    "required": ["execution_id"]
  }
}
```

#### Tool 4.4: `start_execution`
```json
{
  "name": "start_execution",
  "description": "Start a new test execution run.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "test_case_ids": {
        "type": "array",
        "items": { "type": "string", "format": "uuid" },
        "minItems": 1,
        "maxItems": 100,
        "description": "Test cases to execute"
      },
      "project_id": {
        "type": "string",
        "format": "uuid",
        "description": "Execute all tests in a project"
      },
      "framework": {
        "type": "string",
        "enum": ["jest", "vitest", "mocha"],
        "description": "Test framework to use"
      },
      "environment": {
        "type": "object",
        "description": "Environment variables for the test run"
      },
      "parallel": {
        "type": "boolean",
        "description": "Run tests in parallel"
      }
    },
    "required": []
  }
}
```

#### Tool 4.5: `cancel_execution`
```json
{
  "name": "cancel_execution",
  "description": "Cancel a running test execution.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "execution_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["execution_id"]
  }
}
```

#### Tool 4.6: `delete_execution`
```json
{
  "name": "delete_execution",
  "description": "Delete an execution record and its results.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "execution_id": {
        "type": "string",
        "format": "uuid"
      }
    },
    "required": ["execution_id"]
  }
}
```

---

### Section 5: Analysis (`/analyze`, `/analyze-v2`)

#### Tool 5.1: `list_available_files`
```json
{
  "name": "list_available_files",
  "description": "List files available for analysis from the current repository or upload.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Filter to files under this path"
      },
      "extensions": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Filter by file extensions (e.g., ['.js', '.ts'])"
      },
      "include_hidden": {
        "type": "boolean",
        "description": "Include hidden files (starting with .)"
      }
    },
    "required": []
  }
}
```

#### Tool 5.2: `get_file_content`
```json
{
  "name": "get_file_content",
  "description": "Get the content of a specific file for analysis.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "Relative path to the file"
      },
      "max_lines": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10000,
        "description": "Maximum lines to return"
      }
    },
    "required": ["file_path"]
  }
}
```

#### Tool 5.3: `get_analysis_status`
```json
{
  "name": "get_analysis_status",
  "description": "Get the current status of an ongoing analysis.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 5.4: `get_analysis_results`
```json
{
  "name": "get_analysis_results",
  "description": "Get the results from a completed analysis.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "analysis_id": {
        "type": "string",
        "format": "uuid",
        "description": "Specific analysis ID (defaults to current)"
      },
      "section": {
        "type": "string",
        "enum": ["user_stories", "test_cases", "acceptance_criteria", "all"],
        "description": "Which section to return"
      }
    },
    "required": []
  }
}
```

#### Tool 5.5: `get_current_config`
```json
{
  "name": "get_current_config",
  "description": "Get the current analysis configuration.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 5.6: `select_file`
```json
{
  "name": "select_file",
  "description": "Add a file to the selection for analysis.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "Path to the file to select"
      }
    },
    "required": ["file_path"]
  }
}
```

#### Tool 5.7: `deselect_file`
```json
{
  "name": "deselect_file",
  "description": "Remove a file from the selection.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string"
      }
    },
    "required": ["file_path"]
  }
}
```

#### Tool 5.8: `select_files_by_pattern`
```json
{
  "name": "select_files_by_pattern",
  "description": "Select multiple files matching a glob pattern.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Glob pattern (e.g., 'src/**/*.js')"
      }
    },
    "required": ["pattern"]
  }
}
```

#### Tool 5.9: `select_all_code_files`
```json
{
  "name": "select_all_code_files",
  "description": "Select all code files (excludes config, docs, etc.).",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 5.10: `clear_file_selection`
```json
{
  "name": "clear_file_selection",
  "description": "Clear all selected files.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 5.11: `set_analysis_options`
```json
{
  "name": "set_analysis_options",
  "description": "Configure what the analysis should generate.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "generate_user_stories": { "type": "boolean" },
      "generate_test_cases": { "type": "boolean" },
      "generate_acceptance_criteria": { "type": "boolean" },
      "include_edge_cases": { "type": "boolean" },
      "include_security_tests": { "type": "boolean" }
    },
    "required": []
  }
}
```

#### Tool 5.12: `set_output_format`
```json
{
  "name": "set_output_format",
  "description": "Set the output format for analysis results.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "format": {
        "type": "string",
        "enum": ["markdown", "json", "html", "yaml", "csv", "jira", "testrail", "azure", "gherkin"]
      }
    },
    "required": ["format"]
  }
}
```

#### Tool 5.13: `set_test_framework`
```json
{
  "name": "set_test_framework",
  "description": "Set the test framework style for generated tests.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "framework": {
        "type": "string",
        "enum": ["jest", "vitest", "mocha", "pytest", "junit", "generic"]
      }
    },
    "required": ["framework"]
  }
}
```

#### Tool 5.14: `set_additional_context`
```json
{
  "name": "set_additional_context",
  "description": "Add custom context or instructions for the analysis.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "context": {
        "type": "string",
        "maxLength": 5000,
        "description": "Additional instructions or context"
      }
    },
    "required": ["context"]
  }
}
```

#### Tool 5.15: `start_analysis`
```json
{
  "name": "start_analysis",
  "description": "Start the code analysis with current configuration.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": ["basic", "streaming", "multipass"],
        "description": "Analysis mode"
      }
    },
    "required": []
  }
}
```

#### Tool 5.16: `cancel_analysis`
```json
{
  "name": "cancel_analysis",
  "description": "Cancel an ongoing analysis.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

---

### Section 6: History (`/history`)

#### Tool 6.1: `list_analyses`
```json
{
  "name": "list_analyses",
  "description": "List past analyses with optional filtering.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "from_date": { "type": "string", "format": "date-time" },
      "to_date": { "type": "string", "format": "date-time" },
      "repository": { "type": "string", "description": "Filter by repository name" },
      "has_share_link": { "type": "boolean" },
      "limit": { "type": "integer", "minimum": 1, "maximum": 100 },
      "offset": { "type": "integer", "minimum": 0 }
    },
    "required": []
  }
}
```

#### Tool 6.2: `get_analysis_detail`
```json
{
  "name": "get_analysis_detail",
  "description": "Get full details of a past analysis including results.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "analysis_id": { "type": "string", "format": "uuid" }
    },
    "required": ["analysis_id"]
  }
}
```

#### Tool 6.3: `search_analyses`
```json
{
  "name": "search_analyses",
  "description": "Search analyses by content, repository, or date.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "minLength": 2, "maxLength": 200 }
    },
    "required": ["query"]
  }
}
```

#### Tool 6.4: `create_share_link`
```json
{
  "name": "create_share_link",
  "description": "Create a public share link for an analysis.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "analysis_id": { "type": "string", "format": "uuid" },
      "expires_in_days": {
        "type": "integer",
        "minimum": 1,
        "maximum": 365,
        "description": "Number of days until link expires (default: never)"
      }
    },
    "required": ["analysis_id"]
  }
}
```

#### Tool 6.5: `revoke_share_link`
```json
{
  "name": "revoke_share_link",
  "description": "Revoke a share link for an analysis.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "analysis_id": { "type": "string", "format": "uuid" }
    },
    "required": ["analysis_id"]
  }
}
```

#### Tool 6.6: `delete_analysis`
```json
{
  "name": "delete_analysis",
  "description": "Permanently delete an analysis and its results.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "analysis_id": { "type": "string", "format": "uuid" }
    },
    "required": ["analysis_id"]
  }
}
```

---

### Section 7: Dashboard (`/dashboard`)

#### Tool 7.1: `get_dashboard_stats`
```json
{
  "name": "get_dashboard_stats",
  "description": "Get key performance indicators for the dashboard.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "period": {
        "type": "string",
        "enum": ["7d", "30d", "90d", "1y", "all"],
        "description": "Time period for stats"
      }
    },
    "required": []
  }
}
```

#### Tool 7.2: `get_usage_chart_data`
```json
{
  "name": "get_usage_chart_data",
  "description": "Get data for the usage chart visualization.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "metric": {
        "type": "string",
        "enum": ["analyses", "tokens", "tests_generated", "executions"]
      },
      "period": {
        "type": "string",
        "enum": ["7d", "30d", "90d", "1y"]
      },
      "granularity": {
        "type": "string",
        "enum": ["day", "week", "month"]
      }
    },
    "required": []
  }
}
```

#### Tool 7.3: `get_activity_heatmap`
```json
{
  "name": "get_activity_heatmap",
  "description": "Get activity heatmap data for the past year.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "year": {
        "type": "integer",
        "minimum": 2020,
        "maximum": 2030
      }
    },
    "required": []
  }
}
```

#### Tool 7.4: `get_recent_activity`
```json
{
  "name": "get_recent_activity",
  "description": "Get recent activity feed (analyses, executions, etc.).",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "limit": { "type": "integer", "minimum": 1, "maximum": 50 }
    },
    "required": []
  }
}
```

---

### Section 8: Todos (`/todos`)

#### Tool 8.1: `list_todos`
```json
{
  "name": "list_todos",
  "description": "List todos with optional filtering and sorting.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["pending", "in_progress", "completed", "all"]
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high"]
      },
      "tag": { "type": "string" },
      "due_before": { "type": "string", "format": "date" },
      "search": { "type": "string" },
      "sort_by": {
        "type": "string",
        "enum": ["created_at", "due_date", "priority", "position"]
      },
      "limit": { "type": "integer", "minimum": 1, "maximum": 100 },
      "offset": { "type": "integer", "minimum": 0 }
    },
    "required": []
  }
}
```

#### Tool 8.2: `get_todo`
```json
{
  "name": "get_todo",
  "description": "Get details of a specific todo including subtasks.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_id": { "type": "string", "format": "uuid" }
    },
    "required": ["todo_id"]
  }
}
```

#### Tool 8.3: `create_todo`
```json
{
  "name": "create_todo",
  "description": "Create a new todo item.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "minLength": 1, "maxLength": 200 },
      "description": { "type": "string", "maxLength": 2000 },
      "priority": { "type": "string", "enum": ["low", "medium", "high"] },
      "due_date": { "type": "string", "format": "date" },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 10
      },
      "parent_id": {
        "type": "string",
        "format": "uuid",
        "description": "Create as subtask of another todo"
      }
    },
    "required": ["title"]
  }
}
```

#### Tool 8.4: `update_todo`
```json
{
  "name": "update_todo",
  "description": "Update an existing todo.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_id": { "type": "string", "format": "uuid" },
      "title": { "type": "string", "minLength": 1, "maxLength": 200 },
      "description": { "type": "string", "maxLength": 2000 },
      "priority": { "type": "string", "enum": ["low", "medium", "high"] },
      "status": { "type": "string", "enum": ["pending", "in_progress", "completed"] },
      "due_date": { "type": "string", "format": "date" },
      "tags": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["todo_id"]
  }
}
```

#### Tool 8.5: `complete_todo`
```json
{
  "name": "complete_todo",
  "description": "Mark a todo as completed.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_id": { "type": "string", "format": "uuid" }
    },
    "required": ["todo_id"]
  }
}
```

#### Tool 8.6: `reopen_todo`
```json
{
  "name": "reopen_todo",
  "description": "Reopen a completed todo.",
  "permission_level": 3,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_id": { "type": "string", "format": "uuid" }
    },
    "required": ["todo_id"]
  }
}
```

#### Tool 8.7: `bulk_complete_todos`
```json
{
  "name": "bulk_complete_todos",
  "description": "Complete multiple todos at once. Requires confirmation if more than 5.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation_if": "todo_ids.length > 5",
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_ids": {
        "type": "array",
        "items": { "type": "string", "format": "uuid" },
        "minItems": 1,
        "maxItems": 100
      }
    },
    "required": ["todo_ids"]
  }
}
```

#### Tool 8.8: `delete_todo`
```json
{
  "name": "delete_todo",
  "description": "Permanently delete a todo and its subtasks.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "todo_id": { "type": "string", "format": "uuid" }
    },
    "required": ["todo_id"]
  }
}
```

---

### Section 9: Settings (`/settings`)

#### Tool 9.1: `get_user_settings`
```json
{
  "name": "get_user_settings",
  "description": "Get current user settings (excludes sensitive data like API keys).",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 9.2: `get_ai_permissions`
```json
{
  "name": "get_ai_permissions",
  "description": "Get the current AI permission configuration.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 9.3: `update_ai_permissions`
```json
{
  "name": "update_ai_permissions",
  "description": "Update AI permission level. Requires confirmation.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "confirmation_message": "Changing AI permissions affects what actions the AI assistant can perform on your behalf.",
  "input_schema": {
    "type": "object",
    "properties": {
      "global_level": {
        "type": "string",
        "enum": ["read_only", "read_suggest", "read_write", "full_access"]
      },
      "section_overrides": {
        "type": "object",
        "properties": {
          "projects": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] },
          "requirements": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] },
          "test_cases": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] },
          "executions": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] },
          "analysis": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] },
          "todos": { "type": "string", "enum": ["use_global", "read_only", "read_suggest", "read_write", "full_access"] }
        }
      }
    },
    "required": []
  }
}
```

#### Tool 9.4: `update_profile`
```json
{
  "name": "update_profile",
  "description": "Update user profile information. Requires confirmation.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "minLength": 1, "maxLength": 100 },
      "email": { "type": "string", "format": "email" }
    },
    "required": []
  }
}
```

#### Tool 9.5: `get_integrations`
```json
{
  "name": "get_integrations",
  "description": "Get list of connected integrations (GitHub, GitLab, Azure DevOps).",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 9.6: `disconnect_integration`
```json
{
  "name": "disconnect_integration",
  "description": "Disconnect an external integration. Requires confirmation.",
  "permission_level": 4,
  "dangerous": true,
  "requires_confirmation": true,
  "confirmation_message": "Disconnecting this integration will revoke access to your repositories and remove all synced data.",
  "input_schema": {
    "type": "object",
    "properties": {
      "integration_type": {
        "type": "string",
        "enum": ["github", "gitlab", "azure_devops"]
      }
    },
    "required": ["integration_type"]
  }
}
```

---

### Section 10: Navigation & Global

#### Tool 10.1: `get_current_page`
```json
{
  "name": "get_current_page",
  "description": "Get information about the current page the user is on.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 10.2: `suggest_navigation`
```json
{
  "name": "suggest_navigation",
  "description": "Suggest a page for the user to navigate to.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "destination": {
        "type": "string",
        "enum": [
          "/dashboard",
          "/projects",
          "/analyze",
          "/analyze-v2",
          "/execute",
          "/reports",
          "/history",
          "/todos",
          "/settings",
          "/profile"
        ]
      },
      "reason": {
        "type": "string",
        "description": "Why the AI is suggesting this navigation"
      }
    },
    "required": ["destination", "reason"]
  }
}
```

#### Tool 10.3: `search_global`
```json
{
  "name": "search_global",
  "description": "Search across all user data (projects, tests, analyses, todos).",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200
      },
      "types": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["projects", "requirements", "test_cases", "analyses", "todos"]
        },
        "description": "Limit search to specific types"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 50
      }
    },
    "required": ["query"]
  }
}
```

#### Tool 10.4: `get_help`
```json
{
  "name": "get_help",
  "description": "Get help documentation for a specific feature.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "enum": [
          "getting_started",
          "projects",
          "requirements",
          "test_cases",
          "analysis",
          "execution",
          "integrations",
          "ai_assistant",
          "keyboard_shortcuts"
        ]
      }
    },
    "required": ["topic"]
  }
}
```

#### Tool 10.5: `list_quick_actions`
```json
{
  "name": "list_quick_actions",
  "description": "List available quick actions for the current page context.",
  "permission_level": 1,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

#### Tool 10.6: `select_quick_action`
```json
{
  "name": "select_quick_action",
  "description": "Trigger a quick action by name.",
  "permission_level": 2,
  "dangerous": false,
  "input_schema": {
    "type": "object",
    "properties": {
      "action_name": {
        "type": "string",
        "description": "Name of the quick action to trigger"
      }
    },
    "required": ["action_name"]
  }
}
```

---

## Admin Panel Design

### Location: `/admin/ai-tools`

### Features

1. **Tool Catalog** - View all 69 tools with details
2. **Tool Enablement** - Enable/disable tools globally or per user
3. **Usage Statistics** - See tool usage metrics
4. **Audit Logs** - View all AI actions with filtering
5. **Rate Limit Config** - Adjust rate limits per tool
6. **Permission Templates** - Create preset permission configurations

### Admin Panel UI

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ AI Tools Administration                                            [Admin Only] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ [Tool Catalog] [Usage Stats] [Audit Logs] [Rate Limits] [Permissions]           │
│                                                                                  │
│ ═══════════════════════════════════════════════════════════════════════════════ │
│                                                                                  │
│ TOOL CATALOG                                                   Filter: [All ▼]  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│                                                                                  │
│ Section: Projects (7 tools)                                      [Expand All]   │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ ✓ list_projects        L1  Read     Safe      Usage: 1,234    [Configure] │   │
│ │ ✓ get_project          L1  Read     Safe      Usage: 892      [Configure] │   │
│ │ ✓ search_projects      L1  Read     Safe      Usage: 456      [Configure] │   │
│ │ ✓ create_project       L3  Write    Safe      Usage: 89       [Configure] │   │
│ │ ✓ update_project       L3  Write    Safe      Usage: 67       [Configure] │   │
│ │ ✓ archive_project      L4  Write    ⚠️ Dangerous Usage: 12    [Configure] │   │
│ │ ✓ delete_project       L4  Delete   🔴 DANGER  Usage: 3       [Configure] │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ Section: Requirements (9 tools)                                                  │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ ✓ list_requirements    L1  Read     Safe      Usage: 2,341    [Configure] │   │
│ │ ...                                                                        │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ Section: Test Cases (8 tools)                                                    │
│ Section: Test Execution (6 tools)                                                │
│ Section: Analysis (16 tools)                                                     │
│ Section: History (6 tools)                                                       │
│ Section: Dashboard (4 tools)                                                     │
│ Section: Todos (8 tools)                                                         │
│ Section: Settings (6 tools)                                                      │
│ Section: Navigation (6 tools)                                                    │
│                                                                                  │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ Total: 69 tools | Enabled: 69 | Disabled: 0 | Dangerous: 15                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tool Configuration Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Configure Tool: delete_project                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Status                                                           │
│ ● Enabled   ○ Disabled                                          │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Permission Level                                                 │
│ Current: Level 4 (Full Access)                                   │
│ [Cannot be changed - inherent to tool]                          │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Rate Limiting                                                    │
│ Calls per minute: [5____]                                        │
│ Calls per hour:   [20___]                                        │
│ Calls per day:    [100__]                                        │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Confirmation Settings                                            │
│ [✓] Always require user confirmation                            │
│ [✓] Log all invocations to audit log                            │
│ [ ] Require password/2FA for this action                        │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ Custom Confirmation Message                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ This will permanently delete the project and ALL associated │ │
│ │ requirements, test cases, and executions.                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                              [Cancel]  [Save Configuration]      │
└─────────────────────────────────────────────────────────────────┘
```

### Audit Log View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ AI Action Audit Log                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ Filters: [Date Range ▼] [User ▼] [Tool ▼] [Status ▼] [Search...]  [Export CSV]  │
│                                                                                  │
│ ═══════════════════════════════════════════════════════════════════════════════ │
│                                                                                  │
│ TIME          USER            TOOL                STATUS    DETAILS             │
│ ────────────────────────────────────────────────────────────────────────────── │
│ 2 min ago     john@email.com  delete_project      ✓ Confirmed  Project: "App"  │
│               └─ Confirmation: User clicked 'Delete' button                      │
│               └─ Input: { project_id: "abc-123" }                               │
│               └─ Result: { deleted: true, items_removed: 47 }                   │
│                                                                                  │
│ 5 min ago     john@email.com  create_test_case    ✓ Success    TC-042 created  │
│               └─ Input: { project_id: "xyz", title: "Login test" }              │
│                                                                                  │
│ 12 min ago    jane@email.com  bulk_import_tests   ✓ Confirmed  12 tests        │
│               └─ Confirmation: User approved bulk import                         │
│                                                                                  │
│ 15 min ago    john@email.com  delete_todo         ✗ Cancelled  User declined   │
│               └─ Confirmation shown but user clicked 'Cancel'                    │
│                                                                                  │
│ 1 hour ago    jane@email.com  list_projects       ✓ Success    4 projects      │
│               └─ Read-only operation, no confirmation needed                     │
│                                                                                  │
│ ────────────────────────────────────────────────────────────────────────────── │
│ Showing 1-50 of 1,234 actions                            [< Prev] [Next >]      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Usage Statistics View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ AI Tool Usage Statistics                                    Period: [Last 30d ▼] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ OVERVIEW                                                                         │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│ │ Total Calls     │  │ Unique Users    │  │ Confirmations   │  │ Failures     │ │
│ │     12,456      │  │       89        │  │      234        │  │     12       │ │
│ │   ▲ +23% MTD    │  │   ▲ +15% MTD    │  │   ▼ -5% MTD     │  │ ▼ -50% MTD   │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                                                  │
│ TOP TOOLS BY USAGE                         USAGE BY SECTION                      │
│ ┌────────────────────────────────────┐    ┌────────────────────────────────────┐ │
│ │ 1. list_projects        2,341     │    │ Analysis      ████████████░░ 45%   │ │
│ │ 2. list_test_cases      1,892     │    │ Projects      ██████░░░░░░░░ 22%   │ │
│ │ 3. get_analysis_status  1,456     │    │ Test Cases    █████░░░░░░░░░ 18%   │ │
│ │ 4. list_requirements    1,234     │    │ Todos         ███░░░░░░░░░░░ 10%   │ │
│ │ 5. create_test_case       892     │    │ Other         █░░░░░░░░░░░░░  5%   │ │
│ └────────────────────────────────────┘    └────────────────────────────────────┘ │
│                                                                                  │
│ DANGEROUS ACTIONS (Last 30 days)                                                 │
│ ┌────────────────────────────────────────────────────────────────────────────┐  │
│ │ Tool                    Attempted   Confirmed   Cancelled   Success Rate   │  │
│ │ delete_project                 15          12           3          80%     │  │
│ │ delete_test_case               47          45           2          96%     │  │
│ │ bulk_import_tests              23          21           2          91%     │  │
│ │ delete_requirement             31          28           3          90%     │  │
│ └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│ USAGE OVER TIME                                                                  │
│ ┌────────────────────────────────────────────────────────────────────────────┐  │
│ │     ▲                                                                      │  │
│ │ 500 │                              ╭─╮                                     │  │
│ │     │        ╭──╮                 ╱   ╲        ╭──╮                        │  │
│ │ 400 │       ╱    ╲     ╭──╮     ╱     ╲      ╱    ╲                       │  │
│ │     │      ╱      ╲   ╱    ╲   ╱       ╲    ╱      ╲                      │  │
│ │ 300 │ ────╱        ╲─╱      ╲─╱         ╲──╱        ╲────                 │  │
│ │     │                                                                      │  │
│ │     └──────────────────────────────────────────────────────────────────►  │  │
│ │        Nov 6     Nov 13    Nov 20    Nov 27    Dec 4                      │  │
│ └────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `ai_settings`
```sql
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Global permission level
  global_permission_level VARCHAR(20) DEFAULT 'read_only'
    CHECK (global_permission_level IN ('read_only', 'read_suggest', 'read_write', 'full_access')),

  -- Section overrides (NULL = use global)
  projects_permission VARCHAR(20) CHECK (projects_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  requirements_permission VARCHAR(20) CHECK (requirements_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  test_cases_permission VARCHAR(20) CHECK (test_cases_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  executions_permission VARCHAR(20) CHECK (executions_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  analysis_permission VARCHAR(20) CHECK (analysis_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  history_permission VARCHAR(20) CHECK (history_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  todos_permission VARCHAR(20) CHECK (todos_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),
  settings_permission VARCHAR(20) CHECK (settings_permission IN (NULL, 'read_only', 'read_suggest', 'read_write', 'full_access')),

  -- Confirmation settings
  confirm_deletes BOOLEAN DEFAULT TRUE,
  confirm_bulk_operations BOOLEAN DEFAULT TRUE,
  confirm_integration_changes BOOLEAN DEFAULT TRUE,
  require_password_destructive BOOLEAN DEFAULT FALSE,
  bulk_threshold INTEGER DEFAULT 5,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX idx_ai_settings_user ON ai_settings(user_id);
```

### Table: `ai_action_log`
```sql
CREATE TABLE ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tool information
  tool_name VARCHAR(100) NOT NULL,
  tool_category VARCHAR(50) NOT NULL,
  permission_level INTEGER NOT NULL,

  -- Input/Output
  tool_input JSONB NOT NULL DEFAULT '{}',
  tool_result JSONB,
  error_message TEXT,

  -- Context
  page_path VARCHAR(255),
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,

  -- Status tracking
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending_confirmation', 'confirmed', 'cancelled', 'denied')),
  required_confirmation BOOLEAN DEFAULT FALSE,
  user_confirmed BOOLEAN,
  confirmation_shown_at TIMESTAMP WITH TIME ZONE,
  confirmation_responded_at TIMESTAMP WITH TIME ZONE,

  -- Execution timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_ai_log_user ON ai_action_log(user_id);
CREATE INDEX idx_ai_log_created ON ai_action_log(created_at DESC);
CREATE INDEX idx_ai_log_tool ON ai_action_log(tool_name);
CREATE INDEX idx_ai_log_status ON ai_action_log(status);
CREATE INDEX idx_ai_log_user_created ON ai_action_log(user_id, created_at DESC);
```

### Table: `ai_tool_config` (Admin)
```sql
CREATE TABLE ai_tool_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tool identification
  tool_name VARCHAR(100) NOT NULL UNIQUE,
  tool_category VARCHAR(50) NOT NULL,

  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,

  -- Rate limiting (overrides default)
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,

  -- Confirmation overrides
  always_require_confirmation BOOLEAN DEFAULT FALSE,
  custom_confirmation_message TEXT,
  require_password BOOLEAN DEFAULT FALSE,

  -- Audit settings
  log_all_invocations BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed with default configs for all 69 tools
INSERT INTO ai_tool_config (tool_name, tool_category) VALUES
  ('list_projects', 'projects'),
  ('get_project', 'projects'),
  -- ... all 69 tools
;
```

### Table: `ai_pending_confirmations`
```sql
CREATE TABLE ai_pending_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action details
  tool_name VARCHAR(100) NOT NULL,
  tool_input JSONB NOT NULL,
  confirmation_message TEXT NOT NULL,

  -- Display info
  affected_items JSONB, -- e.g., [{ type: 'test_case', id: '...', name: '...' }]
  affected_count INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Index for pending confirmations
CREATE INDEX idx_pending_conf_user ON ai_pending_confirmations(user_id, status);
CREATE INDEX idx_pending_conf_expires ON ai_pending_confirmations(expires_at) WHERE status = 'pending';
```

---

## Confirmation Flow UI

### In-Chat Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Assistant                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 👤 Delete all my failed test cases                              │
│                                                                  │
│ 🤖 I found 12 failed test cases in your project "Banking App".  │
│                                                                  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ ⚠️  CONFIRMATION REQUIRED                                │  │
│    │                                                          │  │
│    │ This action will permanently delete:                     │  │
│    │                                                          │  │
│    │ • TC-001: Login validation                               │  │
│    │ • TC-005: Payment processing                             │  │
│    │ • TC-012: User registration                              │  │
│    │   ... and 9 more test cases                              │  │
│    │                                                          │  │
│    │ This cannot be undone.                                   │  │
│    │                                                          │  │
│    │ [🗑️ Delete 12 Test Cases]  [Cancel]                      │  │
│    │                                                          │  │
│    │ Expires in 2:00                                          │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Type a message...                                      [Send]   │
└─────────────────────────────────────────────────────────────────┘
```

### After Confirmation

```
│ 🤖 ✓ Deleted 12 test cases from "Banking App".                  │
│                                                                  │
│    This action has been logged.                                 │
│    [View in Audit Log →]                                        │
```

### After Cancellation

```
│ 🤖 Cancelled. No test cases were deleted.                       │
│                                                                  │
│    Is there something else I can help you with?                 │
```

---

## Implementation Phases

### Phase 1: Database & Settings Infrastructure (4-5 hours)
- [ ] Create migration for `ai_settings` table
- [ ] Create migration for `ai_action_log` table
- [ ] Create migration for `ai_tool_config` table
- [ ] Create migration for `ai_pending_confirmations` table
- [ ] Create API: `GET/POST /api/user/ai-settings`
- [ ] Create API: `GET /api/user/ai-action-log`
- [ ] Add AI Settings tab to `/settings` page
- [ ] Build `AISettingsTab.jsx` component

### Phase 2: Admin Panel Foundation (5-6 hours)
- [ ] Create `/admin` layout with access control
- [ ] Create `/admin/ai-tools` page
- [ ] Build `ToolCatalog.jsx` - list all 69 tools
- [ ] Build `ToolConfigModal.jsx` - configure individual tools
- [ ] Create API: `GET/POST /api/admin/ai-tools`
- [ ] Create API: `GET /api/admin/ai-tools/[name]`
- [ ] Add admin role check middleware

### Phase 3: Permission System (4-5 hours)
- [ ] Create `lib/aiPermissions.js` - permission checking logic
- [ ] Update `lib/assistantTools/executor.js` - integrate permission checks
- [ ] Create `lib/assistantTools/confirmationManager.js`
- [ ] Build confirmation queue system with expiration
- [ ] Add confirmation UI to `FloatingAssistant.jsx`
- [ ] Create API: `POST /api/ai/confirm/[id]`
- [ ] Create API: `POST /api/ai/cancel/[id]`

### Phase 4: Implement All Tools - Read Operations (6-8 hours)
- [ ] `lib/assistantTools/projectTools.js` (3 read tools)
- [ ] `lib/assistantTools/requirementTools.js` (3 read tools)
- [ ] `lib/assistantTools/testCaseTools.js` (3 read tools)
- [ ] `lib/assistantTools/executionTools.js` (3 read tools)
- [ ] `lib/assistantTools/analysisTools.js` (5 read tools) - expand existing
- [ ] `lib/assistantTools/historyTools.js` (3 read tools)
- [ ] `lib/assistantTools/dashboardTools.js` (4 read tools)
- [ ] `lib/assistantTools/todoTools.js` (2 read tools)
- [ ] `lib/assistantTools/settingsTools.js` (3 read tools)
- [ ] `lib/assistantTools/navigationTools.js` (6 tools)

### Phase 5: Implement All Tools - Write Operations (6-8 hours)
- [ ] Project write tools (create, update)
- [ ] Requirement write tools (create, update, link, unlink)
- [ ] Test case write tools (create, update, duplicate)
- [ ] Execution write tools (start, cancel)
- [ ] Analysis write tools (already done, expand if needed)
- [ ] History write tools (share, unshare)
- [ ] Todo write tools (create, update, complete, reopen)
- [ ] Settings write tools (update_profile - with confirmation)

### Phase 6: Dangerous Actions & Bulk Operations (4-5 hours)
- [ ] Project dangerous tools (archive, delete)
- [ ] Requirement dangerous tools (bulk_create, delete)
- [ ] Test case dangerous tools (bulk_import, delete)
- [ ] Execution dangerous tools (delete)
- [ ] History dangerous tools (delete)
- [ ] Todo dangerous tools (bulk_complete, delete)
- [ ] Settings dangerous tools (update_ai_permissions, disconnect_integration)
- [ ] Implement confirmation flow for each

### Phase 7: Admin Panel - Statistics & Logs (4-5 hours)
- [ ] Build `UsageStatistics.jsx` component
- [ ] Build `AuditLogViewer.jsx` component
- [ ] Create API: `GET /api/admin/ai-stats`
- [ ] Create API: `GET /api/admin/ai-audit-log`
- [ ] Add filtering and export functionality
- [ ] Build charts for usage visualization

### Phase 8: Testing & Polish (3-4 hours)
- [ ] Write unit tests for permission system
- [ ] Write integration tests for confirmation flow
- [ ] Test all 69 tools across permission levels
- [ ] Test admin panel functionality
- [ ] Add loading states and error handling
- [ ] Documentation update

---

## Total Tool Summary

| Section | Read | Write | Dangerous | Total |
|---------|------|-------|-----------|-------|
| Projects | 3 | 2 | 2 | 7 |
| Requirements | 3 | 4 | 2 | 9 |
| Test Cases | 3 | 3 | 2 | 8 |
| Executions | 3 | 2 | 1 | 6 |
| Analysis | 5 | 9 | 0 | 14 |
| History | 3 | 2 | 1 | 6 |
| Dashboard | 4 | 0 | 0 | 4 |
| Todos | 2 | 4 | 2 | 8 |
| Settings | 3 | 1 | 2 | 6 |
| Navigation | 6 | 0 | 0 | 6 |
| **TOTAL** | **35** | **27** | **12** | **74** |

*Note: Final count is 74 tools (5 more than original estimate after detailed specification)*

---

## Security Measures

1. **Permission Validation**: Every tool call validates user permission level
2. **Rate Limiting**: Configurable per-tool rate limits with default fallbacks
3. **Input Validation**: JSON Schema validation for all tool inputs
4. **Audit Logging**: Every action logged with user, input, result, timing
5. **Confirmation Queue**: Dangerous actions require explicit approval with timeout
6. **Session Binding**: Tools only operate on authenticated user's data
7. **Admin Oversight**: Full visibility into tool usage via admin panel
8. **Soft Deletes**: Archive operations where possible before hard delete
9. **IP Logging**: Track IP addresses for security analysis
10. **Expiring Confirmations**: Pending confirmations expire after 5 minutes

---

## Success Criteria

1. ✅ All 74 tools implemented and functional
2. ✅ Admin panel shows complete tool catalog
3. ✅ Permission levels enforced for every operation
4. ✅ Dangerous actions require user confirmation
5. ✅ All actions logged to audit log
6. ✅ Usage statistics visible in admin panel
7. ✅ Rate limiting prevents abuse
8. ✅ No security vulnerabilities in tool execution
9. ✅ Clean UX for confirmation flows
10. ✅ Full documentation for all tools
