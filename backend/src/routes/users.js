const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../db");
const { readJsonBody, sendJson, sendError, parseId } = require("../http");
const { validateRequired, validateEmail, validatePassword } = require("../middleware/validator");
const { recalculateAppBirthdayNotifications } = require("../reminders");

async function handleGetUsers(req, res, auth) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = {
    estado: url.searchParams.get("estado") || undefined,
    search: url.searchParams.get("search") || undefined,
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  };
  sendJson(res, 200, await getUsers(params));
}

async function handleGetUser(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleGetUser", resource: "/api/users/:id", parameter: "id", value: req.url });
    return;
  }

  const user = await getUserById(id);
  if (!user) {
    sendError(res, 404, "Usuario no encontrado", { operation: "handleGetUser", resource: "/api/users/:id", parameter: "id", value: id });
    return;
  }
  sendJson(res, 200, user);
}

async function handleCreateUser(req, res) {
  const payload = await readJsonBody(req);
  const required = validateRequired(payload, ["nombre", "email", "password", "role"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleCreateUser",
      resource: "/api/users",
      fields: required.fields,
    });
    return;
  }
  if (!validateEmail(payload.email)) {
    sendError(res, 400, "Correo invalido", {
      operation: "handleCreateUser",
      resource: "/api/users",
      field: "email",
      value: payload.email,
    });
    return;
  }
  if (!validatePassword(payload.password)) {
    sendError(res, 400, "Contrasena minimo 6 caracteres", {
      operation: "handleCreateUser",
      resource: "/api/users",
      field: "password",
    });
    return;
  }
  sendJson(res, 201, await createUser(payload));
}

async function handleUpdateUser(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleUpdateUser", resource: "/api/users/:id", parameter: "id", value: req.url });
    return;
  }

  const user = await getUserById(id);
  if (!user) {
    sendError(res, 404, "Usuario no encontrado", { operation: "handleUpdateUser", resource: "/api/users/:id", parameter: "id", value: id });
    return;
  }

  const payload = await readJsonBody(req);
  const required = validateRequired(payload, ["nombre", "email", "role"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleUpdateUser",
      resource: "/api/users/:id",
      parameter: "id",
      value: id,
      fields: required.fields,
    });
    return;
  }
  if (!validateEmail(payload.email)) {
    sendError(res, 400, "Correo invalido", {
      operation: "handleUpdateUser",
      resource: "/api/users/:id",
      parameter: "id",
      value: id,
      field: "email",
      value: payload.email,
    });
    return;
  }

  const oldUser = await getUserById(id);
  const result = await updateUser(id, payload);

  // Recalculate birthday notifications if estado or fechaCumpleanos changed
  if (
    (payload.estado && oldUser && oldUser.estado !== payload.estado) ||
    payload.fechaCumpleanos
  ) {
    recalculateAppBirthdayNotifications().catch(() => {});
  }

  sendJson(res, 200, result);
}

async function handleDeleteUser(req, res) {
  const id = parseId(req.url);
  if (!id) {
    sendError(res, 400, "Id invalido", { operation: "handleDeleteUser", resource: "/api/users/:id", parameter: "id", value: req.url });
    return;
  }

  const deleted = await deleteUser(id);
  if (!deleted) {
    sendError(res, 404, "Usuario no encontrado", { operation: "handleDeleteUser", resource: "/api/users/:id", parameter: "id", value: id });
    return;
  }

  // Remove birthday notifications for deleted user
  const { query } = require("../db");
  await query("DELETE FROM app_notifications WHERE entity_type = 'staff' AND entity_id = $1", [id]);

  sendJson(res, 200, { message: "Usuario eliminado" });
}

module.exports = { handleGetUsers, handleGetUser, handleCreateUser, handleUpdateUser, handleDeleteUser };
