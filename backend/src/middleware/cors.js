/**
 * CORS middleware — origins are loaded from environment variable.
 *
 * Set CORS_ORIGINS to a comma-separated list of allowed origins.
 * Examples:
 *   CORS_ORIGINS=http://localhost:5173,https://myapp.com
 *   CORS_ORIGINS=*
 */
function buildCorsMiddleware() {
  const raw = process.env.CORS_ORIGINS || "";
  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowAll = origins.length === 1 && origins[0] === "*";

  return function corsMiddleware(req, res, next) {
    const origin = req.headers.origin || "";

    if (allowAll || origins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  };
}

module.exports = { buildCorsMiddleware };
