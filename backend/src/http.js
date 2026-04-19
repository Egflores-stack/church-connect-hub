async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeErrorContext(context = {}) {
  const normalized = {};

  for (const key of ["operation", "resource", "parameter", "value", "field", "code", "detail"]) {
    if (context[key] !== undefined && context[key] !== null && context[key] !== "") {
      normalized[key] = context[key];
    }
  }

  if (Array.isArray(context.fields) && context.fields.length > 0) {
    normalized.fields = context.fields.filter((field) => field !== undefined && field !== null && field !== "");
  }

  return normalized;
}

function createErrorPayload(message, context = {}) {
  const normalizedContext = normalizeErrorContext(context);
  return {
    error: message,
    context: normalizedContext,
    ...normalizedContext,
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, context = {}) {
  sendJson(res, statusCode, createErrorPayload(message, context));
}

function sendNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end();
}

function parseId(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const id = Number(segments[segments.length - 1]);
  return Number.isInteger(id) ? id : null;
}

module.exports = {
  readJsonBody,
  createErrorPayload,
  normalizeErrorContext,
  sendJson,
  sendError,
  sendNoContent,
  parseId,
};
