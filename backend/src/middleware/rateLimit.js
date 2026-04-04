/**
 * Simple in-memory rate limiter.
 *
 * RATE_LIMIT_MAX  — max requests per window (default 20)
 * RATE_LIMIT_WINDOW_MS — window duration in ms (default 60 000 = 1 min)
 */
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 20;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;

const buckets = new Map();

function rateLimit(req, res, next) {
  const key = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let entry = buckets.get(key);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, start: now };
    buckets.set(key, entry);
  }

  entry.count += 1;

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - entry.count));

  if (entry.count > RATE_LIMIT_MAX) {
    res.writeHead(429, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." }));
    return;
  }

  next();
}

/**
 * Cleanup old buckets every 5 minutes to prevent memory leaks.
 */
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [key, entry] of buckets) {
    if (entry.start < cutoff) {
      buckets.delete(key);
    }
  }
}, 300_000).unref();

module.exports = { rateLimit };
