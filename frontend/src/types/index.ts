export type UserRole = 'admin' | 'supervisor' | 'digitador';
export type Turno = 'mañana' | 'tarde';
export type Estado = 'activo' | 'inactivo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Maestro {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaCumpleanos: string;
  turno: Turno;
  estado: Estado;
}

export interface Nino {
  id: string;
  nombre: string;
  edad: number;
  fechaNacimiento: string;
  grupo: string;
  turno: Turno;
  responsable?: string;
  estado: Estado;
}

export interface AsistenciaRegistro {
  id: string;
  fecha: string;
  turno: Turno;
  ninoId: string;
  presente: boolean;
  maestroPresente: boolean;
  registradoPor: string;
}
