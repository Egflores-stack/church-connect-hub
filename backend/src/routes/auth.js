const {
  findUserByEmail,
  updateUserPassword,
} = require("../db");
const {
  createPasswordHash,
  verifyPassword,
  sanitizeUser,
  createSessionToken,
  isPasswordHashed,
} = require("../auth");
const { readJsonBody, sendJson } = require("../http");
const { validateRequired, validateEmail, validatePassword } = require("../middleware/validator");

async function handleLogin(req, res) {
  const payload = await readJsonBody(req);

  const required = validateRequired(payload, ["email", "password"]);
  if (!required.valid) {
    sendJson(res, 400, { error: required.error, fields: required.fields });
    return;
  }

  if (!validateEmail(payload.email)) {
    sendJson(res, 400, { error: "El formato del correo no es valido." });
    return;
  }

  if (!validatePassword(payload.password)) {
    sendJson(res, 400, { error: "La contrasena debe tener al menos 6 caracteres." });
    return;
  }

  const user = await findUserByEmail(payload.email);
  if (!user || user.estado === "inactivo" || !verifyPassword(payload.password, user.password)) {
    sendJson(res, 401, { error: "Credenciales invalidas" });
    return;
  }

  // Auto-migrate legacy plain-text passwords
  if (!isPasswordHashed(user.password)) {
    await updateUserPassword(user.id, createPasswordHash(payload.password));
  }

  const safeUser = sanitizeUser(user);
  sendJson(res, 200, {
    message: "Login exitoso",
    token: createSessionToken(user),
    user: safeUser,
  });
}

module.exports = { handleLogin };
