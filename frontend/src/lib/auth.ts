import type { User } from "@/types";

const AUTH_USER_KEY = "cch_user";
const AUTH_TOKEN_KEY = "cch_token";

export function isAuthenticated() {
  return Boolean(getAuthToken() && getAuthUser());
}

export function setAuthSession(user: User, token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser(): User | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    clearAuthSession();
    return null;
  }
}

const rolePermissions: Record<string, string[]> = {
  admin: [
    "dashboard.view",
    "attendance.manage",
    "maestros.manage",
    "ninos.manage",
    "reports.view",
    "reports.export",
    "settings.manage",
    "users.manage",
  ],
  supervisor: [
    "dashboard.view",
    "attendance.manage",
    "maestros.manage",
    "ninos.manage",
    "reports.view",
    "settings.manage",
  ],
  digitador: [
    "dashboard.view",
    "attendance.manage",
    "ninos.manage",
    "reports.view",
  ],
};

export function hasPermission(permission: string) {
  const user = getAuthUser();
  if (!user) {
    return false;
  }

  return (rolePermissions[user.role] || ["dashboard.view"]).includes(permission);
}
