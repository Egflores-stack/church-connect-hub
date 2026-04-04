const { createPasswordHash } = require("./auth");

const seedUsers = [
  {
    nombre: "Administrador General",
    email: "admin@iglesia.com",
    passwordHash: createPasswordHash("admin123"),
    fechaCumpleanos: "1990-04-12",
    role: "admin",
    estado: "activo",
  },
  {
    nombre: "Supervisora Escuela",
    email: "supervisora@iglesia.com",
    passwordHash: createPasswordHash("super123"),
    fechaCumpleanos: "1988-05-03",
    role: "supervisor",
    estado: "activo",
  },
];

const seedMaestros = [
  {
    nombre: "Maria Garcia Lopez",
    telefono: "555-0101",
    email: "maria@iglesia.com",
    fechaCumpleanos: "1985-03-15",
    grupo: "4-6",
    turno: "manana",
    estado: "activo",
  },
  {
    nombre: "Carlos Rodriguez",
    telefono: "555-0102",
    email: "carlos@iglesia.com",
    fechaCumpleanos: "1990-07-22",
    grupo: "10-12",
    turno: "tarde",
    estado: "activo",
  },
  {
    nombre: "Ana Martinez Ruiz",
    telefono: "555-0103",
    email: "ana@iglesia.com",
    fechaCumpleanos: "1988-11-08",
    grupo: "7-9",
    turno: "manana",
    estado: "activo",
  },
  {
    nombre: "Pedro Sanchez",
    telefono: "555-0104",
    email: "pedro@iglesia.com",
    fechaCumpleanos: "1992-01-30",
    grupo: "7-9",
    turno: "tarde",
    estado: "inactivo",
  },
];

const seedNinos = [
  {
    nombre: "Sofia Hernandez",
    fechaNacimiento: "2018-03-10",
    grupo: "4-6",
    turno: "manana",
    responsable: "Juan Hernandez",
    telefonoResponsable: "555-1001",
    estado: "activo",
  },
  {
    nombre: "Diego Lopez",
    fechaNacimiento: "2020-05-22",
    grupo: "7-9",
    turno: "manana",
    responsable: "Rosa Lopez",
    telefonoResponsable: "555-1002",
    estado: "activo",
  },
  {
    nombre: "Valentina Torres",
    fechaNacimiento: "2016-08-15",
    grupo: "10-12",
    turno: "tarde",
    responsable: "",
    telefonoResponsable: "",
    estado: "activo",
  },
  {
    nombre: "Mateo Rivera",
    fechaNacimiento: "2019-01-03",
    grupo: "7-9",
    turno: "tarde",
    responsable: "Elena Rivera",
    telefonoResponsable: "555-1004",
    estado: "activo",
  },
  {
    nombre: "Isabella Cruz",
    fechaNacimiento: "2017-12-20",
    grupo: "4-6",
    turno: "manana",
    responsable: "Mario Cruz",
    telefonoResponsable: "555-1005",
    estado: "activo",
  },
  {
    nombre: "Sebastian Morales",
    fechaNacimiento: "2021-04-18",
    grupo: "10-12",
    turno: "manana",
    responsable: "",
    telefonoResponsable: "",
    estado: "activo",
  },
];

const seedAttendances = [
  {
    fecha: "2026-03-24",
    turno: "manana",
    ninoNombre: "Sofia Hernandez",
    maestroEmail: "maria@iglesia.com",
    presente: true,
    maestroPresente: true,
    registradoPor: "admin@iglesia.com",
  },
  {
    fecha: "2026-03-24",
    turno: "manana",
    ninoNombre: "Diego Lopez",
    maestroEmail: "ana@iglesia.com",
    presente: true,
    maestroPresente: true,
    registradoPor: "supervisora@iglesia.com",
  },
];

module.exports = {
  seedUsers,
  seedMaestros,
  seedNinos,
  seedAttendances,
};
