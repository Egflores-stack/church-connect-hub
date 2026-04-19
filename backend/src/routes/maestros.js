const {
  listMaestros,
  getMaestroById,
  createMaestro,
  updateMaestro,
  deleteMaestro,
} = require("../db");
const { readJsonBody, sendJson, sendError, parseId } = require("../http");
const { validateRequired, validateEnum } = require("../middleware/validator");

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
  sendJson(res, 200, await listMaestros(buildFilters(url)));
}

async function handleGet(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleGetMaestro", resource: "/api/maestros/:id", parameter: "id", value: req.url });
    return;
  }
  const m = await getMaestroById(id);
  if (!m) {
    sendError(res, 404, "Maestro no encontrado", { operation: "handleGetMaestro", resource: "/api/maestros/:id", parameter: "id", value: id });
    return;
  }
  sendJson(res, 200, m);
}

async function handleCreate(req, res) {
  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "turno"]);
  if (!required.valid) {
    sendError(res, 400, required.error, { operation: "handleCreateMaestro", resource: "/api/maestros", fields: required.fields });
    return;
  }
  if (payload.estado && !validateEnum(payload.estado, ["activo", "inactivo"])) {
    sendError(res, 400, "Estado debe ser 'activo' o 'inactivo'", {
      operation: "handleCreateMaestro",
      resource: "/api/maestros",
      field: "estado",
      value: payload.estado,
    });
    return;
  }
  sendJson(res, 201, await createMaestro(payload));
}

async function handleUpdate(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleUpdateMaestro", resource: "/api/maestros/:id", parameter: "id", value: req.url });
    return;
  }
  const m = await getMaestroById(id);
  if (!m) {
    sendError(res, 404, "Maestro no encontrado", { operation: "handleUpdateMaestro", resource: "/api/maestros/:id", parameter: "id", value: id });
    return;
  }

  const payload = await readJsonBody(req);
  payload.turno = normalizeTurno(payload.turno);
  const required = validateRequired(payload, ["nombre", "turno"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleUpdateMaestro",
      resource: "/api/maestros/:id",
      parameter: "id",
      value: id,
      fields: required.fields,
    });
    return;
  }
  if (payload.estado && !validateEnum(payload.estado, ["activo", "inactivo"])) {
    sendError(res, 400, "Estado debe ser 'activo' o 'inactivo'", {
      operation: "handleUpdateMaestro",
      resource: "/api/maestros/:id",
      parameter: "id",
      value: id,
      field: "estado",
      value: payload.estado,
    });
    return;
  }

  // Recalculate birthday notifications if estado or fechaCumpleanos changed
  if (
    (payload.estado && m.estado !== payload.estado) ||
    payload.fechaCumpleanos
  ) {
    const { recalculateAppBirthdayNotifications } = require("../reminders");
    recalculateAppBirthdayNotifications().catch(() => {});
  }

  sendJson(res, 200, await updateMaestro(id, payload));
}

async function handleDelete(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleDeleteMaestro", resource: "/api/maestros/:id", parameter: "id", value: req.url });
    return;
  }
  const deleted = await deleteMaestro(id);
  if (!deleted) {
    sendError(res, 404, "Maestro no encontrado", { operation: "handleDeleteMaestro", resource: "/api/maestros/:id", parameter: "id", value: id });
    return;
  }

  // Remove birthday notifications for deleted maestro
  const { query } = require("../db");
  await query("DELETE FROM app_notifications WHERE entity_type = 'maestro' AND entity_id = $1", [id]);

  sendJson(res, 200, { message: "Maestro eliminado" });
}

module.exports = { handleList, handleGet, handleCreate, handleUpdate, handleDelete };
