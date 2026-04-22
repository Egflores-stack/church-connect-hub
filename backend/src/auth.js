const crypto = require("crypto");
const { AUTH_SECRET } = require("./config");
const { getPermissionsForRole } = require("./permissions");

const HASH_PREFIX = "pbkdf2$";
const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function toBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST).toString("hex");
  return `${HASH_PREFIX}${HASH_ITERATIONS}$${salt}$${hash}`;
}

function isPasswordHashed(password) {
  return typeof password === "string" && password.startsWith(HASH_PREFIX);
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (!isPasswordHashed(storedPassword)) {
    return password === storedPassword;
  }

  const [, iterationsRaw, salt, storedHash] = storedPassword.split("$");
  const iterations = Number(iterationsRaw);

  if (!iterations || !salt || !storedHash) {
    return false;
  }

  const computedHash = crypto.pbkdf2Sync(password, salt, iterations, HASH_KEY_LENGTH, HASH_DIGEST);
  const storedBuffer = Buffer.from(storedHash, "hex");

  return storedBuffer.length === computedHash.length && crypto.timingSafeEqual(storedBuffer, computedHash);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
    estado: user.estado,
    fechaCumpleanos: user.fechaCumpleanos || user.fecha_cumpleanos || null,
  };
}

function buildSessionPayload(user) {
  const safeUser = sanitizeUser(user);
  return {
    sub: safeUser.id,
    role: safeUser.role,
    email: safeUser.email,
    permissions: getPermissionsForRole(safeUser.role).permissions,
    exp: Date.now() + TOKEN_TTL_MS,
  };
}

function createSessionToken(user) {
  const payload = buildSessionPayload(user);
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(encodedPayload).digest("base64url");

  try {
    const providedBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

module.exports = {
  createPasswordHash,
  isPasswordHashed,
  verifyPassword,
  sanitizeUser,
  createSessionToken,
  verifySessionToken,
  getBearerToken,
};
