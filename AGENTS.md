<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Developer Guide & Codebase Manual

This document provides a concise, high-level manual of the Task Management system for any AI developer agent working on this codebase.

> [!IMPORTANT]
> **Developer Agent Duty**: You MUST append, update, and maintain this documentation whenever you modify the system structure, database schemas, APIs, or user flows.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router, dynamic page structures)
- **Frontend**: React 19, Lucide React (Icons), Tailwind CSS (Vanilla PostCSS config)
- **State Management**: Zustand (`src/store/useTaskStore.ts`)
- **Database**: Prisma Client with Neon Serverless PostgreSQL (`prisma/schema.prisma`)
- **Data Exchange**: CSV/XLSX import parsing with frontend-generated CSV template download to prevent format mismatching.

---

## 🗄️ Database Models & Relations

### `User`
- **Roles**: `ADMIN`, `EMPLOYEE`
- **Statuses**: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `RESIGNED`, `ON_LEAVE`
- **Relations**: Task Creator, Task Assignee, Delegated From, Delegated To.

### `Task`
- **Properties**: `id`, `title`, `description`, `status` (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `progress` (0-100), `isSubtask`, `parentTaskId`.
- **Progress Calculation**: Computed automatically if subtasks or checklist items exist. Disabled manual sliding capability in this scenario.

### `Activity`
- **Properties**: Log transaction for mutation records (`userId`, `action` like `CREATE_TASK`, `STOP_TASK_TIMER`, `entityType`, `meta` JSON payload).

---

## 🔄 Core Business Workflows

### 1. Task Delegation & Boundaries
- Employees can delegate active tasks *only* to colleagues inside the **same department**.
- Toggling delegation status immediately triggers toast updates and dashboard status badge syncs.

### 2. Task Progress Auto-Calculation
- Parent task progress is automatically recalculated upon subtask completion/creation or checklist item toggle.
- Frontend: `TaskDetailPanel.tsx` disables the progress slider range input if subtasks/checklists are present.
- Backend: Recalculates parent progress on PATCH updates (`api/tasks/[id]/route.ts`), subtask creation (`api/tasks/route.ts`), and deletes.

### 3. Employee Exit Task Transfer
- When deactivating an employee or changing status to an inactive type (`RESIGNED`, `SUSPENDED`, etc.), the admin is prompted to transfer outstanding tasks.
- Target employee selection is strictly limited to active users from the **same department** (`e.department === employee.department`).
- Handled via POST `/api/tasks/transfer`.

### 4. Interactive Sidebar
- The employees dropdown list (collapsible list of departments for admins) collapses (`setEmployeesDropdownOpen(false)`) whenever the user navigates away from the `/employees` route path.

### 5. Scoped Dashboard Statistics
- When the logged-in session user role is `EMPLOYEE`, the `/api/dashboard/stats` endpoint bypasses the company-wide metrics and returns task counts scoped only to their own tasks (assigned to them, created by them, or pending delegation). It also returns empty lists for departments and employee statistics.

### 6. Role-Based Notification Links
- All API routes generating task, comment, subtask, or delegation notifications dynamically resolve the notification redirect link based on the recipient's role (`/all-tasks?taskId=...` for admins and `/my-tasks?taskId=...` for employees).

### 7. Notification Visual Categories
- The notification bell (`NotificationBell.tsx`) styles messages dynamically: assignments, delegations, and transfers display in blue; overdue actions display in red; comments and replies display in purple; and completed tasks display in green.

### 8. Employee Import & Template Download
- Admins can import multiple employee accounts at once using CSV or Excel files (`ImportEmployeesModal` inside `/employees`).
- Beside the file upload button, a "Template" button allows downloading a pre-formatted CSV template with standard headers (`name,email,role,department,team,phone,job title`) and a sample row to prevent format clashing.

---

## 🧪 Development & Verification
- **Run Dev Server**: `npm run dev` (already active on port 3000)
- **Build / Typecheck Check**: `npx tsc --noEmit` (ensure this passes with zero errors after every action).
