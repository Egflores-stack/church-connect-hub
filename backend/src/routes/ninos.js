const {
  listNinos,
  getNinoById,
  createNino,
  updateNino,
  deleteNino,
} = require("../db");
const { readJsonBody, sendJson, parseId } = require("../http");
const { validateRequired, validateEnum, validateDate } = require("../middleware/validator");

function normalizeTurno(turno) {
  if (!turno) return null;
  if (turno === "manana" || turno === "tarde") return turno;
  return null;
}

function buildFilters(url) {
  return {
    estado: url.searchParams.get("estado") || undefined,
    turno: normalizeTurno(url.searchParams.get("turno")) || undefined,
    grupo: url.searchParams.get("grupo") || undefined,
    search: url.searchParams.get("search") || undefined,
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  };
}

async function handleList(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  sendJson(res, 200, await listNinos(buildFilters(url)));
}

async function handleGet(req, res) {
  const id = parseId(req.url);
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }
  const n = await getNinoById(id);
  if (!n) { sendJson(res, 404, { error: "Nino no encontrado" }); return; }
  sendJson(res, 200, n);
}

async function handleCreate(req, res) {
  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);
  if (!required.valid) { sendJson(res, 400, { error: required.error, fields: required.fields }); return; }
  if (!validateDate(payload.fechaNacimiento)) { sendJson(res, 400, { error: "Fecha de nacimiento invalida (YYYY-MM-DD)" }); return; }
  if (payload.estado && !validateEnum(payload.estado, ["activo", "inactivo"])) {
    sendJson(res, 400, { error: "Estado debe ser 'activo' o 'inactivo'" }); return;
  }
  sendJson(res, 201, await createNino(payload));
}

async function handleUpdate(req, res) {
  const id = parseId(req.url);
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }
  const n = await getNinoById(id);
  if (!n) { sendJson(res, 404, { error: "Nino no encontrado" }); return; }

  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);
  if (!required.valid) { sendJson(res, 400, { error: required.error, fields: required.fields }); return; }
  if (!validateDate(payload.fechaNacimiento)) { sendJson(res, 400, { error: "Fecha de nacimiento invalida (YYYY-MM-DD)" }); return; }

  // Recalculate birthday notifications if estado changed
  if (payload.estado && n.estado !== payload.estado) {
    const { recalculateAppBirthdayNotifications } = require("../reminders");
    recalculateAppBirthdayNotifications().catch(() => {});
  }

  sendJson(res, 200, await updateNino(id, payload));
}

async function handleDelete(req, res) {
  const id = parseId(req.url);
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }
  const deleted = await deleteNino(id);
  if (!deleted) { sendJson(res, 404, { error: "Nino no encontrado" }); return; }
  sendJson(res, 200, { message: "Nino eliminado" });
}

module.exports = { handleList, handleGet, handleCreate, handleUpdate, handleDelete };
