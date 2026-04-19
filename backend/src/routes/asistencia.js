const {
  listAttendances,
  listTeacherAttendances,
  upsertAttendance,
  upsertTeacherAttendance,
} = require("../db");
const { readJsonBody, sendJson, sendError } = require("../http");
const { validateRequired, validateDate, validateEnum } = require("../middleware/validator");

function normalizeTurno(turno) {
  if (!turno) return null;
  if (turno === "manana" || turno === "tarde") return turno;
  return null;
}

function buildFilters(url) {
  return {
    fecha: url.searchParams.get("fecha") || undefined,
    turno: normalizeTurno(url.searchParams.get("turno")) || undefined,
    grupo: url.searchParams.get("grupo") || undefined,
  };
}

async function handleListAttendances(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  sendJson(res, 200, await listAttendances(buildFilters(url)));
}

async function handleSaveAttendance(req, res, auth) {
  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["fecha", "turno", "ninoId", "registradoPor"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleSaveAttendance",
      resource: "/api/asistencias",
      fields: required.fields,
    });
    return;
  }
  if (!validateDate(payload.fecha)) {
    sendError(res, 400, "Fecha invalida (YYYY-MM-DD)", {
      operation: "handleSaveAttendance",
      resource: "/api/asistencias",
      field: "fecha",
      value: payload.fecha,
    });
    return;
  }

  sendJson(res, 200, await upsertAttendance({
    fecha: payload.fecha,
    turno: payload.turno,
    ninoId: Number(payload.ninoId),
    maestroId: payload.maestroId ? Number(payload.maestroId) : null,
    presente: Boolean(payload.presente),
    maestroPresente: Boolean(payload.maestroPresente),
    registradoPor: auth.user.email,
  }));
}

async function handleListTeacherAttendances(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  sendJson(res, 200, await listTeacherAttendances(buildFilters(url)));
}

async function handleSaveTeacherAttendance(req, res, auth) {
  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["fecha", "turno", "maestroId", "registradoPor"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleSaveTeacherAttendance",
      resource: "/api/asistencias-maestros",
      fields: required.fields,
    });
    return;
  }
  if (!validateDate(payload.fecha)) {
    sendError(res, 400, "Fecha invalida (YYYY-MM-DD)", {
      operation: "handleSaveTeacherAttendance",
      resource: "/api/asistencias-maestros",
      field: "fecha",
      value: payload.fecha,
    });
    return;
  }

  sendJson(res, 200, await upsertTeacherAttendance({
    fecha: payload.fecha,
    turno: payload.turno,
    maestroId: Number(payload.maestroId),
    presente: Boolean(payload.presente),
    registradoPor: auth.user.email,
  }));
}

module.exports = {
  handleListAttendances,
  handleSaveAttendance,
  handleListTeacherAttendances,
  handleSaveTeacherAttendance,
};
