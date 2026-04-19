const {
  listNinos,
  getNinoById,
  createNino,
  updateNino,
  deleteNino,
} = require("../db");
const { readJsonBody, sendJson, sendError, parseId } = require("../http");
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
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleGetNino", resource: "/api/ninos/:id", parameter: "id", value: req.url });
    return;
  }
  const n = await getNinoById(id);
  if (!n) {
    sendError(res, 404, "Nino no encontrado", { operation: "handleGetNino", resource: "/api/ninos/:id", parameter: "id", value: id });
    return;
  }
  sendJson(res, 200, n);
}

async function handleCreate(req, res) {
  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);
  if (!required.valid) {
    sendError(res, 400, required.error, { operation: "handleCreateNino", resource: "/api/ninos", fields: required.fields });
    return;
  }
  if (!validateDate(payload.fechaNacimiento)) {
    sendError(res, 400, "Fecha de nacimiento invalida (YYYY-MM-DD)", {
      operation: "handleCreateNino",
      resource: "/api/ninos",
      field: "fechaNacimiento",
      value: payload.fechaNacimiento,
    });
    return;
  }
  if (payload.estado && !validateEnum(payload.estado, ["activo", "inactivo"])) {
    sendError(res, 400, "Estado debe ser 'activo' o 'inactivo'", {
      operation: "handleCreateNino",
      resource: "/api/ninos",
      field: "estado",
      value: payload.estado,
    });
    return;
  }
  sendJson(res, 201, await createNino(payload));
}

async function handleUpdate(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleUpdateNino", resource: "/api/ninos/:id", parameter: "id", value: req.url });
    return;
  }
  const n = await getNinoById(id);
  if (!n) {
    sendError(res, 404, "Nino no encontrado", { operation: "handleUpdateNino", resource: "/api/ninos/:id", parameter: "id", value: id });
    return;
  }

  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleUpdateNino",
      resource: "/api/ninos/:id",
      parameter: "id",
      value: id,
      fields: required.fields,
    });
    return;
  }
  if (!validateDate(payload.fechaNacimiento)) {
    sendError(res, 400, "Fecha de nacimiento invalida (YYYY-MM-DD)", {
      operation: "handleUpdateNino",
      resource: "/api/ninos/:id",
      parameter: "id",
      value: id,
      field: "fechaNacimiento",
      value: payload.fechaNacimiento,
    });
    return;
  }

  // Recalculate birthday notifications if estado changed
  if (payload.estado && n.estado !== payload.estado) {
    const { recalculateAppBirthdayNotifications } = require("../reminders");
    recalculateAppBirthdayNotifications().catch(() => {});
  }

  sendJson(res, 200, await updateNino(id, payload));
}

async function handleDelete(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleDeleteNino", resource: "/api/ninos/:id", parameter: "id", value: req.url });
    return;
  }
  const deleted = await deleteNino(id);
  if (!deleted) {
    sendError(res, 404, "Nino no encontrado", { operation: "handleDeleteNino", resource: "/api/ninos/:id", parameter: "id", value: id });
    return;
  }
  sendJson(res, 200, { message: "Nino eliminado" });
}

module.exports = { handleList, handleGet, handleCreate, handleUpdate, handleDelete };
