# Implementation Plan: Multi-Session Persistent Todo List

## Overview

Create a database-backed todo list feature that persists across browser sessions and user logins.

**Status Legend:**
- [ ] Not started
- [x] Completed
- [~] In progress

---

## Phase 1: Database Layer

### 1.1 Create Todos Table Schema
- [ ] Add `todos` table to `lib/db.js`
  ```sql
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP,
    tags TEXT[],
    parent_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,  -- For subtasks
    position INTEGER DEFAULT 0,  -- For ordering
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  );
  ```
- [ ] Add indexes for performance
  ```sql
  CREATE INDEX idx_todos_user ON todos(user_id);
  CREATE INDEX idx_todos_status ON todos(status);
  CREATE INDEX idx_todos_parent ON todos(parent_id);
  ```

### 1.2 Database Helper Functions
Add to `lib/db.js`:
- [ ] `createTodo(userId, data)` - Create new todo
- [ ] `getTodosByUser(userId, filters)` - Get all todos for user with optional filters
- [ ] `getTodoById(id, userId)` - Get single todo (with permission check)
- [ ] `updateTodo(id, userId, updates)` - Update todo fields
- [ ] `deleteTodo(id, userId)` - Delete todo (cascade to subtasks)
- [ ] `reorderTodos(userId, todoIds)` - Update positions for drag-drop
- [ ] `getSubtasks(parentId, userId)` - Get subtasks for a todo

### 1.3 Migration Endpoint
- [ ] Create `app/api/db/migrate-todos/route.js`
  - GET handler to run migration
  - Return success/error status

---

## Phase 2: API Routes

### 2.1 Main Todos Endpoint
**File:** `app/api/todos/route.js`
- [ ] `GET` - List todos for authenticated user
  - Query params: `status`, `priority`, `tag`, `search`, `limit`, `offset`
  - Return paginated list with total count
- [ ] `POST` - Create new todo
  - Body: `{ title, description?, priority?, dueDate?, tags?, parentId? }`
  - Return created todo

### 2.2 Single Todo Endpoint
**File:** `app/api/todos/[id]/route.js`
- [ ] `GET` - Get single todo with subtasks
- [ ] `PATCH` - Update todo fields
  - Body: partial todo object
- [ ] `DELETE` - Delete todo and subtasks

### 2.3 Bulk Operations Endpoint
**File:** `app/api/todos/bulk/route.js`
- [ ] `POST` - Bulk operations
  - Actions: `reorder`, `complete`, `delete`, `updateStatus`
  - Body: `{ action, todoIds, data? }`

---

## Phase 3: React Hook

### 3.1 useTodos Hook
**File:** `app/hooks/useTodos.js`

State:
- [ ] `todos` - Array of todo items
- [ ] `loading` - Loading state
- [ ] `error` - Error state
- [ ] `filters` - Current filter state

Actions:
- [ ] `fetchTodos(filters?)` - Load todos from API
- [ ] `createTodo(data)` - Create and add to state
- [ ] `updateTodo(id, updates)` - Update in state and API
- [ ] `deleteTodo(id)` - Remove from state and API
- [ ] `toggleStatus(id)` - Toggle pending/completed
- [ ] `reorderTodos(startIndex, endIndex)` - Drag-drop reorder
- [ ] `setFilters(filters)` - Update filters and refetch

Computed:
- [ ] `pendingTodos` - Filtered pending items
- [ ] `completedTodos` - Filtered completed items
- [ ] `todosByPriority` - Grouped by priority

---

## Phase 4: UI Components

### 4.1 TodoList Component
**File:** `app/components/todos/TodoList.jsx`
- [ ] Main container with header and filters
- [ ] Empty state when no todos
- [ ] Loading skeleton
- [ ] Error state with retry

### 4.2 TodoItem Component
**File:** `app/components/todos/TodoItem.jsx`
- [ ] Checkbox for status toggle
- [ ] Title with inline edit
- [ ] Priority badge (color coded)
- [ ] Due date display (overdue highlighting)
- [ ] Tags display
- [ ] Actions menu (edit, delete, add subtask)
- [ ] Expand/collapse for subtasks
- [ ] Drag handle for reordering

### 4.3 TodoForm Component
**File:** `app/components/todos/TodoForm.jsx`
- [ ] Title input (required)
- [ ] Description textarea (optional)
- [ ] Priority select (low/medium/high)
- [ ] Due date picker (optional)
- [ ] Tags input (comma separated or chips)
- [ ] Submit/Cancel buttons
- [ ] Validation feedback

### 4.4 TodoFilters Component
**File:** `app/components/todos/TodoFilters.jsx`
- [ ] Status filter tabs (All/Pending/Completed)
- [ ] Priority filter dropdown
- [ ] Tag filter (multi-select)
- [ ] Search input
- [ ] Clear filters button

### 4.5 TodoStats Component
**File:** `app/components/todos/TodoStats.jsx`
- [ ] Total count
- [ ] Completed count / percentage
- [ ] Overdue count
- [ ] By priority breakdown

---

## Phase 5: Page Integration

### 5.1 Todos Page
**File:** `app/todos/page.js`
- [ ] Protected route (require auth)
- [ ] AppLayout wrapper
- [ ] TodoList with all features
- [ ] Add todo button/form
- [ ] Page title and description

### 5.2 Sidebar Integration
**File:** `app/components/layout/Sidebar.jsx`
- [ ] Add "Todos" link with icon (CheckSquare)
- [ ] Badge showing pending count
- [ ] Active state styling

### 5.3 Dashboard Widget (Optional)
**File:** `app/dashboard/components/TodoWidget.jsx`
- [ ] Compact todo list (5 items max)
- [ ] Quick add input
- [ ] "View all" link

---

## Phase 6: Advanced Features (Optional)

### 6.1 Drag and Drop
- [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] Implement sortable todo list
- [ ] Persist order to database

### 6.2 Due Date Reminders
- [ ] Add `reminder_at` column
- [ ] Browser notification permission
- [ ] Toast notifications for due items

### 6.3 Categories/Projects
- [ ] Add `category_id` column
- [ ] Create categories table
- [ ] Category CRUD
- [ ] Filter by category

### 6.4 Recurring Todos
- [ ] Add `recurrence` JSONB column
- [ ] Recurrence patterns (daily, weekly, monthly)
- [ ] Auto-create next occurrence on completion

---

## File Creation Checklist

| Priority | File | Purpose | Status |
|----------|------|---------|--------|
| P0 | `lib/db.js` | Add todos table + functions | [ ] |
| P0 | `app/api/db/migrate-todos/route.js` | Migration endpoint | [ ] |
| P0 | `app/api/todos/route.js` | List/Create API | [ ] |
| P0 | `app/api/todos/[id]/route.js` | Get/Update/Delete API | [ ] |
| P0 | `app/hooks/useTodos.js` | React hook | [ ] |
| P0 | `app/components/todos/TodoList.jsx` | Main list component | [ ] |
| P0 | `app/components/todos/TodoItem.jsx` | Single item component | [ ] |
| P0 | `app/components/todos/TodoForm.jsx` | Create/Edit form | [ ] |
| P1 | `app/components/todos/TodoFilters.jsx` | Filter controls | [ ] |
| P1 | `app/components/todos/TodoStats.jsx` | Statistics display | [ ] |
| P1 | `app/todos/page.js` | Todos page | [ ] |
| P1 | `app/components/layout/Sidebar.jsx` | Modify: add link | [ ] |
| P2 | `app/api/todos/bulk/route.js` | Bulk operations | [ ] |
| P2 | `app/dashboard/components/TodoWidget.jsx` | Dashboard widget | [ ] |

---

## Testing Checklist

### Manual Testing
- [ ] Create todo - verify appears in list
- [ ] Edit todo - verify changes persist after refresh
- [ ] Delete todo - verify removed from list
- [ ] Toggle status - verify state updates
- [ ] Filter by status - verify correct items shown
- [ ] Filter by priority - verify correct items shown
- [ ] Search - verify results match query
- [ ] Subtasks - verify parent/child relationship
- [ ] Logout/login - verify todos persist
- [ ] Different browser - verify todos sync

### Edge Cases
- [ ] Empty title validation
- [ ] Very long title/description
- [ ] Special characters in title
- [ ] Delete parent with subtasks
- [ ] Concurrent edits (two tabs)
- [ ] Offline behavior

---

## Session Progress Tracker

### Session 1: [DATE]
- Tasks completed:
- Blockers:
- Next steps:

### Session 2: [DATE]
- Tasks completed:
- Blockers:
- Next steps:

### Session 3: [DATE]
- Tasks completed:
- Blockers:
- Next steps:

---

## Notes

- Follow existing patterns in `lib/db.js` for database functions
- Use existing UI components from `app/components/ui/`
- Match styling with rest of application (Tailwind + slate colors)
- API routes require authentication via `auth()` from `@/auth`
- Use optimistic updates in hook for better UX

---

*Last updated: 2025-12-04*
