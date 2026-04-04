/**
 * Simple request logger.
 * Logs method, path, status and response time.
 * In production, detail is hidden from error responses.
 */
const isProduction = process.env.NODE_ENV === "production";

function logger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    console.log(`[${level}] ${method} ${url} → ${status} (${duration}ms)`);
  });

  next();
}

function getSanitizedError(error) {
  if (isProduction) {
    return { error: "Error interno del servidor" };
  }
  return { error: "Error interno del servidor", detail: error.message };
}

module.exports = { logger, getSanitizedError, isProduction };
