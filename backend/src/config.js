const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SQL_DIR = path.join(ROOT_DIR, "sql");
const SCHEMA_PATH = path.join(SQL_DIR, "schema.sql");
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/church_connect_hub";

module.exports = {
  ROOT_DIR,
  SQL_DIR,
  SCHEMA_PATH,
  PORT,
  HOST,
  DATABASE_URL,
};
