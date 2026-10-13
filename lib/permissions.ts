import { Role, User } from "./types";

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  "Super Admin": [
    "defects:view", "defects:create", "defects:edit", "defects:delete",
    "reports:download", "reports:upload",
    "projects:manage",
    "testcases:view", "testcases:manage",
    "performance:access", "vapt:access", "browsers:access",
    "users:manage",
  ],
  Admin: [
    "defects:view", "defects:create", "defects:edit", "defects:delete",
    "reports:download", "reports:upload",
    "projects:manage",
    "testcases:view", "testcases:manage",
    "performance:access", "vapt:access", "browsers:access",
    "users:manage",
  ],
  "QA Manager": [
    "defects:view", "defects:create", "defects:edit", "defects:delete",
    "reports:download", "reports:upload",
    "projects:manage",
    "testcases:view", "testcases:manage",
    "performance:access", "vapt:access", "browsers:access",
  ],
  "QA Lead": [
    "defects:view", "defects:create", "defects:edit",
    "reports:download", "reports:upload",
    "projects:manage",
    "testcases:view", "testcases:manage",
    "performance:access", "browsers:access",
  ],
  "QA Engineer": [
    "defects:view", "defects:create", "defects:edit",
    "reports:download",
    "testcases:view",
    "browsers:access",
  ],
  Client: [
    "defects:view",
    "reports:download",
  ],
};

/**
 * Checks whether a user has a specific permission.
 * - Super Admin and Admin always have full access.
 * - If user.permissions is explicitly defined and non-empty, checks against user.permissions.
 * - Otherwise falls back to DEFAULT_ROLE_PERMISSIONS for their assigned role.
 */
export function hasPermission(user: User | null | undefined, permissionId: string): boolean {
  if (!user) return false;
  if (user.role === "Super Admin" || user.role === "Admin") return true;

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permissionId);
  }

  const defaults = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  return defaults.includes(permissionId);
}

/**
 * Convenience helper to check if a user has any permission in a given list.
 */
export function hasAnyPermission(user: User | null | undefined, permissionIds: string[]): boolean {
  if (!user) return false;
  if (user.role === "Super Admin" || user.role === "Admin") return true;
  return permissionIds.some((p) => hasPermission(user, p));
}
