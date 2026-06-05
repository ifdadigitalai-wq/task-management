export type UserRole = "ADMIN" | "EMPLOYEE";

const ADMIN_ONLY_ROUTES = [
  "/employees",
  "/all-tasks",
  "/task-templates",
  "/task-directory",
];

const EMPLOYEE_ONLY_ROUTES = [
  "/my-tasks",
  "/activities",
  "/notifications",
];

const BOTH_ROUTES = [
  "/dashboard",
  "/profile",
  "/holidays",
];

/**
 * Checks if a user role is permitted to access a given route path.
 * 
 * - ADMIN can access Admin-only, Both, and Employee routes (Admin can also have personal tasks/activities).
 * - EMPLOYEE can access Employee-only and Both routes, but is forbidden from Admin-only routes.
 */
export function canAccess(role: UserRole, path: string): boolean {
  const cleanPath = path.split("?")[0].replace(/\/$/, "");

  // Check if it matches an admin-only route prefix
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(
    (r) => cleanPath === r || cleanPath.startsWith(r + "/")
  );

  if (isAdminRoute) {
    return role === "ADMIN";
  }

  // Check if it matches an employee-only route prefix
  const isEmployeeRoute = EMPLOYEE_ONLY_ROUTES.some(
    (r) => cleanPath === r || cleanPath.startsWith(r + "/")
  );

  if (isEmployeeRoute) {
    // Both ADMIN and EMPLOYEE can access notifications/activities/my-tasks,
    // but employees are the primary audience. Let's allow admins too for convenience.
    return true;
  }

  // All other dashboard routes (like /dashboard, /profile, /holidays) are accessible to both roles
  return true;
}
