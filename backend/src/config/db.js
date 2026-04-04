const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "infantil",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

if (!process.env.DB_PASSWORD && process.env.NODE_ENV === "production") {
  console.warn("[WARN] DB_PASSWORD no esta configurada. Configurala en produccion.");
}

module.exports = { pool };
