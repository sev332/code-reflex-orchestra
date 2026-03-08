

# Tasks Page — Major Upgrade Plan

## Current State Analysis

The Tasks page has a solid foundation: Kanban with drag-drop, list view, timeline view, subtasks, search, and label filtering. However, there are critical gaps:

1. **TaskDetailPanel is defined but never rendered** — `selectedTask` is set but the component isn't mounted anywhere in the JSX
2. **No inline editing** — can't edit title, description, priority, assignee, or labels from the detail panel
3. **Timeline view is a vertical dot-list**, not a Gantt chart
4. **No sorting or grouping** in list view
5. **No keyboard shortcuts** (Linear-style `C` to create, arrow keys to navigate)
6. **No bulk operations** (multi-select, bulk move, bulk delete)
7. **No activity log or task history**
8. **No dependencies between tasks**
9. **No date picker** — due dates can't be set or changed
10. **No description editing** on existing tasks

---

## Upgrade Plan

### 1. Fix TaskDetailPanel Rendering
Wire `selectedTask` to render `TaskDetailPanel` as a slide-over panel on the right side of the workspace, with proper open/close transitions.

### 2. Full Inline Editing in Detail Panel
- Editable title (click-to-edit)
- Rich description with markdown textarea
- Priority selector dropdown (already partially there, make it functional and persist changes)
- Assignee picker dropdown with all available assignees
- Label picker with add/remove and color-coded chips
- Due date picker using the existing `Calendar` component
- Estimate editor
- Project selector

### 3. Professional Gantt Timeline View
Replace the simple vertical timeline with a canvas-based horizontal Gantt chart:
- Date columns across the top (scrollable)
- Task bars with drag-to-resize for start/end dates
- Color-coded by status or priority
- Dependency arrows between linked tasks
- Today marker line
- Zoom levels (day/week/month)

### 4. Task Dependencies
- Add `dependencies: string[]` (task IDs) and `blockedBy: string[]` to the Task interface
- Visual dependency indicators on cards ("Blocked by T-A1B2")
- Dependency arrows in Gantt view
- Automatic "blocked" status when dependencies aren't done

### 5. Sorting & Grouping in List View
- Sort by: priority, due date, created date, assignee, status
- Group by: status, priority, assignee, project, label
- Collapsible groups with counts
- Persist sort/group preferences

### 6. Keyboard Navigation & Shortcuts
- `C` — create new task
- `↑/↓` — navigate tasks
- `Enter` — open detail panel
- `Escape` — close panel
- `1-4` — set priority (urgent/high/medium/low)
- `Delete/Backspace` — delete with confirmation
- `/` — focus search

### 7. Bulk Operations
- Checkbox multi-select on tasks
- Shift+click for range select
- Bulk action bar: move status, change priority, assign, delete
- Select all / deselect all

### 8. Activity Feed & Comments
- Task-level activity log (status changes, assignee changes, subtask completions)
- Comment thread on each task with timestamps
- @mention support in comments

### 9. Enhanced Stats Dashboard
- Burndown-style mini chart in header
- Velocity metric (tasks completed per week)
- Distribution charts by priority and assignee
- Overdue tasks alert with quick-filter

### 10. Polish & Animations
- Smooth card reorder animations during drag
- Panel slide-in/out transitions
- Status change micro-animations
- Empty state illustrations per column

---

## Technical Approach

All changes are within `src/components/Productivity/TasksPage.tsx`. The Task interface will be extended with `dependencies`, `blockedBy`, `activity`, and `comments` arrays. The Gantt view will use a custom canvas-rendered timeline component. Keyboard shortcuts via a `useEffect` keydown listener. Bulk selection via a `Set<string>` state.

## Implementation Order

1. Fix detail panel rendering + inline editing (immediate impact)
2. Sorting, grouping, keyboard shortcuts (power-user essentials)
3. Bulk operations + activity feed
4. Gantt timeline + dependencies
5. Stats dashboard + polish

