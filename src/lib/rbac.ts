export type UserRole = "ADMIN" | "MANAGER" | "TEAM_LEADER" | "EMPLOYEE";

export type PermissionAction =
  | "import_employees"
  | "change_status"
  | "view_audit_log"
  | "bulk_assign"
  | "create_subtask"
  | "delegate"
  | "create_task";

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  ADMIN: [
    "import_employees",
    "change_status",
    "view_audit_log",
    "bulk_assign",
    "create_subtask",
    "delegate",
    "create_task"
  ],
  MANAGER: [
    "bulk_assign",
    "create_subtask",
    "delegate",
    "create_task"
  ],
  TEAM_LEADER: [
    "create_subtask",
    "delegate",
    "create_task"
  ],
  EMPLOYEE: [
    "create_task",
    "create_subtask"
  ]
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) || false;
}

const ADMIN_ONLY_ROUTES = [
  "/employees",
  "/all-tasks",
  "/task-templates",
  "/task-directory",
  "/audit-log",
];

const EMPLOYEE_ONLY_ROUTES = [
  "/my-tasks",
  "/activities",
  "/notifications",
];

/**
 * Checks if a user role is permitted to access a given route path.
 */
export function canAccess(role: UserRole, path: string): boolean {
  const cleanPath = path.split("?")[0].replace(/\/$/, "");

  // Check if it matches an admin-only route prefix
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(
    (r) => cleanPath === r || cleanPath.startsWith(r + "/")
  );

  if (isAdminRoute) {
    if (cleanPath === "/audit-log" || cleanPath.startsWith("/audit-log/")) {
      return role === "ADMIN";
    }
    return role === "ADMIN" || role === "MANAGER" || role === "TEAM_LEADER";
  }

  // All other dashboard routes (like /dashboard, /profile, /holidays) are accessible to all roles
  return true;
}

