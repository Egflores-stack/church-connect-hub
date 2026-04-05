import type {
  AdvancedReportResponse,
  AppNotification,
  AsistenciaRegistro,
  AsistenciaMaestroRegistro,
  AttendanceReportRow,
  CatalogSettings,
  DashboardSummary,
  Maestro,
  Nino,
  NotificationSettings,
  RolePermission,
  UpcomingBirthday,
  User,
} from "@/types";
import { clearAuthSession, getAuthToken } from "./auth";


const API_BASE_URL = "/api";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    throw new ApiError(data?.error || "Error en la solicitud", response.status);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return apiFetch<{ message: string; token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getDashboard() {
  return apiFetch<DashboardSummary>("/api/dashboard");
}

export async function getUsers() {
  return apiFetch<User[]>("/api/users");
}

export async function createUser(payload: {
  nombre: string;
  email: string;
  password: string;
  fechaCumpleanos?: string;
  role: string;
  estado?: string;
}) {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: number,
  payload: {
    nombre: string;
    email: string;
    password?: string;
    fechaCumpleanos?: string;
    role: string;
    estado?: string;
  },
) {
  return apiFetch<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: number) {
  return apiFetch<{ message: string }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function getRolePermissions() {
  return apiFetch<RolePermission[]>("/api/permisos/roles");
}

export async function getMaestros(search?: string) {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  return apiFetch<Maestro[]>(`/api/maestros${query ? `?${query}` : ""}`);
}

export async function createMaestro(payload: Omit<Maestro, "id">) {
  return apiFetch<Maestro>("/api/maestros", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMaestro(id: number, payload: Omit<Maestro, "id">) {
  return apiFetch<Maestro>(`/api/maestros/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaestro(id: number) {
  return apiFetch<{ message: string }>(`/api/maestros/${id}`, {
    method: "DELETE",
  });
}

export async function getNinos(filters?: { search?: string; turno?: string; grupo?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) {
    params.set("search", filters.search);
  }
  if (filters?.turno && filters.turno !== "todos") {
    params.set("turno", filters.turno);
  }
  if (filters?.grupo && filters.grupo !== "todos") {
    params.set("grupo", filters.grupo);
  }

  const query = params.toString();
  return apiFetch<Nino[]>(`/api/ninos${query ? `?${query}` : ""}`);
}

export async function createNino(payload: Omit<Nino, "id" | "edad">) {
  return apiFetch<Nino>("/api/ninos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNino(id: number, payload: Omit<Nino, "id" | "edad">) {
  return apiFetch<Nino>(`/api/ninos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteNino(id: number) {
  return apiFetch<{ message: string }>(`/api/ninos/${id}`, {
    method: "DELETE",
  });
}

export async function getAsistencias(fecha: string, turno: string, grupo?: string) {
  const params = new URLSearchParams({ fecha, turno });
  if (grupo) {
    params.set("grupo", grupo);
  }
  return apiFetch<AsistenciaRegistro[]>(`/api/asistencias?${params.toString()}`);
}

export async function saveAsistencia(payload: {
  fecha: string;
  turno: string;
  ninoId: number;
  maestroId: number | null;
  presente: boolean;
  maestroPresente: boolean;
  registradoPor: string;
}) {
  return apiFetch<AsistenciaRegistro>("/api/asistencias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAsistenciasMaestros(fecha: string, turno: string) {
  const params = new URLSearchParams({ fecha, turno });
  return apiFetch<AsistenciaMaestroRegistro[]>(`/api/asistencias-maestros?${params.toString()}`);
}

export async function saveAsistenciaMaestro(payload: {
  fecha: string;
  turno: string;
  maestroId: number;
  presente: boolean;
  registradoPor: string;
}) {
  return apiFetch<AsistenciaMaestroRegistro>("/api/asistencias-maestros", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAttendanceReport(month: string) {
  return apiFetch<AttendanceReportRow[]>(`/api/reportes/asistencia?month=${month}`);
}

export async function getAdvancedReport(month: string) {
  return apiFetch<AdvancedReportResponse>(`/api/reportes/avanzados?month=${month}`);
}

export async function getNotificationSettings() {
  return apiFetch<NotificationSettings>("/api/config/notificaciones");
}

export async function updateNotificationSettings(payload: NotificationSettings) {
  return apiFetch<NotificationSettings>("/api/config/notificaciones", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getCatalogSettings() {
  return apiFetch<CatalogSettings>("/api/config/catalogos");
}

export async function updateCatalogSettings(payload: CatalogSettings) {
  return apiFetch<CatalogSettings>("/api/config/catalogos", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getAppNotifications(limit = 6) {
  return apiFetch<AppNotification[]>(`/api/notificaciones/app?limit=${limit}`);
}

export async function getUpcomingBirthdays(days = 30) {
  return apiFetch<UpcomingBirthday[]>(`/api/cumpleanos/proximos?days=${days}`);
}

export async function syncBirthdayCalendar() {
  return apiFetch<{ synced: number }>("/api/cumpleanos/sync-calendar", {
    method: "POST",
  });
}

export { ApiError, API_BASE_URL };
