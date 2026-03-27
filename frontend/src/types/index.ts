export type UserRole = string;
export type Turno = "manana" | "tarde";
export type Estado = "activo" | "inactivo";

export interface User {
  id: number;
  nombre: string;
  email: string;
  fechaCumpleanos?: string;
  role: UserRole;
  estado?: Estado;
}

export interface Maestro {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  fechaCumpleanos: string;
  grupo?: string;
  turno: Turno;
  estado: Estado;
}

export interface Nino {
  id: number;
  nombre: string;
  edad: number;
  fechaNacimiento: string;
  grupo: string;
  turno: Turno;
  responsable?: string;
  telefonoResponsable?: string;
  estado: Estado;
}

export interface AsistenciaRegistro {
  id: number;
  fecha: string;
  turno: Turno;
  ninoId: number;
  ninoNombre?: string;
  grupo?: string;
  maestroId?: number | null;
  maestroNombre?: string | null;
  presente: boolean;
  maestroPresente: boolean;
  registradoPor: string;
}

export interface AsistenciaMaestroRegistro {
  id: number;
  fecha: string;
  turno: Turno;
  maestroId: number;
  maestroNombre: string;
  grupo?: string;
  presente: boolean;
  registradoPor: string;
}

export interface DashboardSummary {
  totalNinosActivos: number;
  totalMaestrosActivos: number;
  asistenciasRegistradasHoy: number;
  presentesHoy: number;
  maestrosPresentesHoy: number;
  asistenciaPorTurno: Array<{
    turno: Turno;
    total: number;
    presentes: number;
  }>;
  asistenciaPorGrupo: Array<{
    grupo: string;
    total: number;
    presentes: number;
  }>;
  recientes: AsistenciaRegistro[];
}

export interface AttendanceReportRow {
  fecha: string;
  turno: Turno;
  total_registros: number;
  total_presentes: number;
  porcentaje: number;
}

export interface RolePermission {
  role: string;
  accessLevel: string;
  permissions: string[];
}

export interface AdvancedAttendanceBreakdownRow {
  turno?: string;
  grupo?: string;
  total_registros: number;
  total_presentes: number;
  porcentaje: number;
}

export interface TeacherReportRow {
  id: number;
  nombre: string;
  grupo: string | null;
  turno: Turno;
  total_registros: number;
  dias_presente: number;
  porcentaje: number;
}

export interface ChildAlertReportRow {
  id: number;
  nombre: string;
  grupo: string;
  turno: Turno;
  total_registros: number;
  total_presentes: number;
  total_ausencias: number;
  porcentaje: number;
}

export interface AdvancedReportSummary {
  totalRegistros: number;
  totalPresentes: number;
  porcentajeGeneral: number;
  totalNinosActivos: number;
  totalMaestrosActivos: number;
  totalMaestrosPresentes: number;
}

export interface AdvancedReportResponse {
  summary: AdvancedReportSummary;
  daily: AttendanceReportRow[];
  byTurn: AdvancedAttendanceBreakdownRow[];
  byGroup: AdvancedAttendanceBreakdownRow[];
  teachers: TeacherReportRow[];
  childrenAlerts: ChildAlertReportRow[];
}

export interface NotificationSettings {
  appEnabled: boolean;
  googleCalendarEnabled: boolean;
  daysBefore: number;
  googleCalendarId: string;
  googleServiceAccountJson: string;
}

export interface AgeRangeCatalogItem {
  label: string;
  min: number;
  max: number;
}

export interface CatalogSettings {
  aulas: string[];
  turnos: string[];
  roles: string[];
  edades: AgeRangeCatalogItem[];
}

export interface UpcomingBirthday {
  entityType: string;
  entityId: number;
  nombre: string;
  email: string;
  fechaCumpleanos: string;
  grupo: string | null;
  nextBirthday: string;
  daysUntil: number;
}

export interface AppNotification {
  id: number;
  type: string;
  entityType: string;
  entityId: number;
  title: string;
  message: string;
  triggerDate: string;
  birthdayDate: string;
  daysUntil: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
