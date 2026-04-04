/**
 * Lightweight field validation helpers.
 * No external dependencies required.
 */

function validateRequired(payload, fields) {
  const missing = fields.filter((f) => {
    const v = payload[f];
    return v === undefined || v === null || v === "";
  });
  if (missing.length > 0) {
    return { valid: false, error: `Faltan campos requeridos: ${missing.join(", ")}`, fields: missing };
  }
  return { valid: true };
}

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6;
}

function validateEnum(value, allowed) {
  return allowed.includes(value);
}

function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function validateMaxLength(value, max) {
  if (!value || typeof value !== "string") return true;
  return value.length <= max;
}

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateEnum,
  validateDate,
  validateMaxLength,
};
