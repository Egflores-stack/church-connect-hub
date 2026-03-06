import { Maestro, Nino } from '@/types';

export const mockMaestros: Maestro[] = [
  { id: '1', nombre: 'María García López', telefono: '555-0101', email: 'maria@iglesia.com', fechaCumpleanos: '1985-03-15', turno: 'mañana', estado: 'activo' },
  { id: '2', nombre: 'Carlos Rodríguez', telefono: '555-0102', email: 'carlos@iglesia.com', fechaCumpleanos: '1990-07-22', turno: 'tarde', estado: 'activo' },
  { id: '3', nombre: 'Ana Martínez Ruiz', telefono: '555-0103', email: 'ana@iglesia.com', fechaCumpleanos: '1988-11-08', turno: 'mañana', estado: 'activo' },
  { id: '4', nombre: 'Pedro Sánchez', telefono: '555-0104', email: 'pedro@iglesia.com', fechaCumpleanos: '1992-01-30', turno: 'tarde', estado: 'inactivo' },
  { id: '5', nombre: 'Lucía Fernández', telefono: '555-0105', email: 'lucia@iglesia.com', fechaCumpleanos: '1987-06-12', turno: 'mañana', estado: 'activo' },
];

export const mockNinos: Nino[] = [
  { id: '1', nombre: 'Sofía Hernández', edad: 8, fechaNacimiento: '2018-03-10', grupo: 'A', turno: 'mañana', responsable: 'Juan Hernández', estado: 'activo' },
  { id: '2', nombre: 'Diego López', edad: 6, fechaNacimiento: '2020-05-22', grupo: 'B', turno: 'mañana', responsable: 'Rosa López', estado: 'activo' },
  { id: '3', nombre: 'Valentina Torres', edad: 10, fechaNacimiento: '2016-08-15', grupo: 'A', turno: 'tarde', estado: 'activo' },
  { id: '4', nombre: 'Mateo Rivera', edad: 7, fechaNacimiento: '2019-01-03', grupo: 'B', turno: 'tarde', responsable: 'Elena Rivera', estado: 'activo' },
  { id: '5', nombre: 'Isabella Cruz', edad: 9, fechaNacimiento: '2017-12-20', grupo: 'A', turno: 'mañana', responsable: 'Mario Cruz', estado: 'activo' },
  { id: '6', nombre: 'Sebastián Morales', edad: 5, fechaNacimiento: '2021-04-18', grupo: 'C', turno: 'mañana', estado: 'activo' },
  { id: '7', nombre: 'Camila Ortiz', edad: 11, fechaNacimiento: '2015-09-07', grupo: 'A', turno: 'tarde', responsable: 'Laura Ortiz', estado: 'inactivo' },
  { id: '8', nombre: 'Daniel Vargas', edad: 8, fechaNacimiento: '2018-06-25', grupo: 'B', turno: 'mañana', responsable: 'Carlos Vargas', estado: 'activo' },
];
