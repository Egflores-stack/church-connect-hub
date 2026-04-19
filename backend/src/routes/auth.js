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
const { readJsonBody, sendJson, sendError } = require("../http");
const { validateRequired, validateEmail, validatePassword } = require("../middleware/validator");

async function handleLogin(req, res) {
  const payload = await readJsonBody(req);

  const required = validateRequired(payload, ["email", "password"]);
  if (!required.valid) {
    sendError(res, 400, required.error, {
      operation: "handleLogin",
      resource: "/api/auth/login",
      fields: required.fields,
    });
    return;
  }

  if (!validateEmail(payload.email)) {
    sendError(res, 400, "El formato del correo no es valido.", {
      operation: "handleLogin",
      resource: "/api/auth/login",
      field: "email",
      value: payload.email,
    });
    return;
  }

  if (!validatePassword(payload.password)) {
    sendError(res, 400, "La contrasena debe tener al menos 6 caracteres.", {
      operation: "handleLogin",
      resource: "/api/auth/login",
      field: "password",
    });
    return;
  }

  const user = await findUserByEmail(payload.email);
  if (!user || user.estado === "inactivo" || !verifyPassword(payload.password, user.password)) {
    sendError(res, 401, "Credenciales invalidas", {
      operation: "handleLogin",
      resource: "/api/auth/login",
      field: "email",
      value: payload.email,
    });
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
