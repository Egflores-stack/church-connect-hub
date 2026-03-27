// backend/src/config/db.js o backend/src/config/db.ts
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Infantil',
  password: process.env.DB_PASSWORD || '2026',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Opcional: probar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});