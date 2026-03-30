const path = require("path");

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/infantil";
const DEFAULT_AUTH_SECRET = "church-connect-hub-dev-secret";

function buildDatabaseUrlFromParts() {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME;

  if (!user || !database) {
    return null;
  }

  const url = new URL(`postgresql://${host}:${port}/${database}`);
  url.username = user;
  url.password = password || "";
  return url.toString();
}

const DATABASE_URL =
  process.env.DATABASE_URL || buildDatabaseUrlFromParts() || DEFAULT_DATABASE_URL;
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const SCHEMA_PATH = path.resolve(__dirname, "../sql/schema.sql");

function resolveAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET es obligatorio en produccion.");
  }

  return DEFAULT_AUTH_SECRET;
}

const AUTH_SECRET = resolveAuthSecret();

module.exports = {
  DATABASE_URL,
  PORT,
  HOST,
  SCHEMA_PATH,
  AUTH_SECRET,
};
