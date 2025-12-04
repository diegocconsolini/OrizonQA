# Implementation Plan: Multi-Session Persistent Todo List

## Overview

Create a database-backed todo list feature that persists across browser sessions and user logins.

**Status Legend:**
- [ ] Not started
- [x] Completed
- [~] In progress

---

## Phase 1: Database Layer ✅ COMPLETE

### 1.1 Create Todos Table Schema
- [x] Add `todos` table to `lib/db.js`
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
- [x] Add indexes for performance
  ```sql
  CREATE INDEX idx_todos_user ON todos(user_id);
  CREATE INDEX idx_todos_status ON todos(status);
  CREATE INDEX idx_todos_parent ON todos(parent_id);
  CREATE INDEX idx_todos_priority ON todos(priority);
  ```

### 1.2 Database Helper Functions
Add to `lib/db.js`:
- [x] `initTodosTable()` - Create table and indexes
- [x] `createTodo(userId, data)` - Create new todo
- [x] `getTodosByUser(userId, filters)` - Get all todos for user with optional filters
- [x] `getTodoById(id, userId)` - Get single todo (with permission check)
- [x] `updateTodo(id, userId, updates)` - Update todo fields
- [x] `deleteTodo(id, userId)` - Delete todo (cascade to subtasks)
- [x] `reorderTodos(userId, todoIds)` - Update positions for drag-drop
- [x] `getSubtasks(parentId, userId)` - Get subtasks for a todo
- [x] `getTodoStats(userId)` - Get statistics
- [x] `bulkUpdateTodoStatus(userId, todoIds, status)` - Bulk status update
- [x] `bulkDeleteTodos(userId, todoIds)` - Bulk delete

### 1.3 Migration Endpoint
- [x] Create `app/api/db/migrate-todos/route.js`
  - GET handler to run migration
  - Return success/error status

---

## Phase 2: API Routes ✅ COMPLETE

### 2.1 Main Todos Endpoint
**File:** `app/api/todos/route.js`
- [x] `GET` - List todos for authenticated user
  - Query params: `status`, `priority`, `tag`, `search`, `limit`, `offset`, `includeStats`
  - Return paginated list with total count and stats
- [x] `POST` - Create new todo
  - Body: `{ title, description?, priority?, dueDate?, tags?, parentId? }`
  - Return created todo

### 2.2 Single Todo Endpoint
**File:** `app/api/todos/[id]/route.js`
- [x] `GET` - Get single todo with subtasks
- [x] `PATCH` - Update todo fields
  - Body: partial todo object
- [x] `DELETE` - Delete todo and subtasks

### 2.3 Bulk Operations Endpoint
**File:** `app/api/todos/bulk/route.js`
- [x] `POST` - Bulk operations
  - Actions: `reorder`, `delete`, `updateStatus`
  - Body: `{ action, todoIds, status? }`

---

## Phase 3: React Hook ✅ COMPLETE

### 3.1 useTodos Hook
**File:** `app/hooks/useTodos.js`

State:
- [x] `todos` - Array of todo items
- [x] `stats` - Statistics object
- [x] `total` - Total count
- [x] `loading` - Loading state
- [x] `error` - Error state
- [x] `filters` - Current filter state

Actions:
- [x] `fetchTodos(filters?)` - Load todos from API
- [x] `createTodo(data)` - Create and add to state
- [x] `updateTodo(id, updates)` - Update in state and API
- [x] `deleteTodo(id)` - Remove from state and API
- [x] `toggleStatus(id)` - Toggle pending/completed
- [x] `reorderTodos(startIndex, endIndex)` - Drag-drop reorder
- [x] `updateFilters(filters)` - Update filters and refetch
- [x] `clearFilters()` - Clear all filters
- [x] `bulkUpdateStatus(todoIds, status)` - Bulk status update
- [x] `bulkDelete(todoIds)` - Bulk delete

Computed:
- [x] `pendingTodos` - Filtered pending items
- [x] `inProgressTodos` - Filtered in-progress items
- [x] `completedTodos` - Filtered completed items
- [x] `overdueTodos` - Filtered overdue items
- [x] `todosByPriority` - Grouped by priority

---

## Phase 4: UI Components ✅ COMPLETE

### 4.1 TodoList Component
**File:** `app/components/todos/TodoList.jsx`
- [x] Main container with header and filters
- [x] Empty state when no todos
- [x] Loading spinner
- [x] Error state display
- [x] Add todo button + form modal

### 4.2 TodoItem Component
**File:** `app/components/todos/TodoItem.jsx`
- [x] Checkbox for status toggle
- [x] Title with inline edit
- [x] Priority badge (color coded)
- [x] Due date display (overdue highlighting)
- [x] Tags display
- [x] Actions menu (edit, delete, add subtask)
- [x] Expand/collapse for subtasks
- [x] Subtask count indicator

### 4.3 TodoForm Component
**File:** `app/components/todos/TodoForm.jsx`
- [x] Title input (required)
- [x] Description textarea (optional, in advanced)
- [x] Priority select (low/medium/high)
- [x] Due date picker (optional)
- [x] Tags input (comma separated)
- [x] Submit/Cancel buttons
- [x] Validation feedback
- [x] Compact mode for quick add

### 4.4 TodoFilters Component
**File:** `app/components/todos/TodoFilters.jsx`
- [x] Status filter tabs (All/Pending/In Progress/Completed)
- [x] Priority filter dropdown
- [x] Search input
- [x] Clear filters button
- [x] Stats count display in tabs

### 4.5 TodoStats Component
**File:** `app/components/todos/TodoStats.jsx`
- [x] Total count
- [x] Pending count
- [x] In Progress count
- [x] Completed count
- [x] Overdue count
- [x] Completion rate progress bar

---

## Phase 5: Page Integration ✅ COMPLETE

### 5.1 Todos Page
**File:** `app/todos/page.js`
- [x] Protected route (require auth)
- [x] AppLayout wrapper
- [x] TodoList with all features
- [x] Page title and description

### 5.2 Sidebar Integration
**File:** `app/components/layout/Sidebar.jsx`
- [x] Add "Todos" link with icon (CheckSquare)
- [x] Active state styling

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
| P0 | `lib/db.js` | Add todos table + functions | [x] |
| P0 | `app/api/db/migrate-todos/route.js` | Migration endpoint | [x] |
| P0 | `app/api/todos/route.js` | List/Create API | [x] |
| P0 | `app/api/todos/[id]/route.js` | Get/Update/Delete API | [x] |
| P0 | `app/hooks/useTodos.js` | React hook | [x] |
| P0 | `app/components/todos/TodoList.jsx` | Main list component | [x] |
| P0 | `app/components/todos/TodoItem.jsx` | Single item component | [x] |
| P0 | `app/components/todos/TodoForm.jsx` | Create/Edit form | [x] |
| P1 | `app/components/todos/TodoFilters.jsx` | Filter controls | [x] |
| P1 | `app/components/todos/TodoStats.jsx` | Statistics display | [x] |
| P1 | `app/todos/page.js` | Todos page | [x] |
| P1 | `app/components/layout/Sidebar.jsx` | Modify: add link | [x] |
| P1 | `app/api/todos/bulk/route.js` | Bulk operations | [x] |
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

### Session 1: 2025-12-04
- Tasks completed:
  - Database schema and all helper functions (lib/db.js)
  - Migration endpoint
  - All API routes (todos, todos/[id], todos/bulk)
  - useTodos React hook with full functionality
  - All UI components (TodoList, TodoItem, TodoForm, TodoFilters, TodoStats)
  - Todos page with AppLayout
  - Sidebar integration with CheckSquare icon
  - ✅ Build passes (60+ routes)
  - ✅ Migration ran successfully
  - ✅ Table verified in database with all columns and indexes
- Blockers: None
- Next steps:
  - Test the feature in browser
  - Consider adding Dashboard widget (optional)
  - Consider drag-and-drop reordering (optional)

---

## Notes

- Follow existing patterns in `lib/db.js` for database functions
- Use existing UI components from `app/components/ui/`
- Match styling with rest of application (Tailwind + slate colors)
- API routes require authentication via `auth()` from `@/auth`
- Use optimistic updates in hook for better UX

## How to Use

1. **Run the migration** (first time only):
   ```
   GET /api/db/migrate-todos
   ```

2. **Access the todos page**:
   - Navigate to `/todos` in your browser
   - Or click "Todos" in the sidebar

3. **Features available**:
   - Create, edit, delete todos
   - Set priority (low/medium/high)
   - Set due dates
   - Add tags
   - Create subtasks
   - Filter by status/priority/search
   - View statistics

---

*Last updated: 2025-12-04*
