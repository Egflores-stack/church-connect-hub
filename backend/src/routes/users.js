const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../db");
const { readJsonBody, sendJson, parseId } = require("../http");
const { validateRequired, validateEmail, validatePassword } = require("../middleware/validator");

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
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }

  const user = await getUserById(id);
  if (!user) { sendJson(res, 404, { error: "Usuario no encontrado" }); return; }
  sendJson(res, 200, user);
}

async function handleCreateUser(req, res) {
  const payload = await readJsonBody(req);
  const required = validateRequired(payload, ["nombre", "email", "password", "role"]);
  if (!required.valid) { sendJson(res, 400, { error: required.error, fields: required.fields }); return; }
  if (!validateEmail(payload.email)) { sendJson(res, 400, { error: "Correo invalido" }); return; }
  if (!validatePassword(payload.password)) { sendJson(res, 400, { error: "Contrasena minimo 6 caracteres" }); return; }
  sendJson(res, 201, await createUser(payload));
}

async function handleUpdateUser(req, res) {
  const id = parseId(req.url);
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }

  const user = await getUserById(id);
  if (!user) { sendJson(res, 404, { error: "Usuario no encontrado" }); return; }

  const payload = await readJsonBody(req);
  const required = validateRequired(payload, ["nombre", "email", "role"]);
  if (!required.valid) { sendJson(res, 400, { error: required.error, fields: required.fields }); return; }
  if (!validateEmail(payload.email)) { sendJson(res, 400, { error: "Correo invalido" }); return; }
  sendJson(res, 200, await updateUser(id, payload));
}

async function handleDeleteUser(req, res) {
  const id = parseId(req.url);
  if (!id) { sendJson(res, 400, { error: "Id invalido" }); return; }

  const deleted = await deleteUser(id);
  if (!deleted) { sendJson(res, 404, { error: "Usuario no encontrado" }); return; }
  sendJson(res, 200, { message: "Usuario eliminado" });
}

module.exports = { handleGetUsers, handleGetUser, handleCreateUser, handleUpdateUser, handleDeleteUser };
