const fs = require("fs");
const { SCHEMA_PATH } = require("./config");
const { pool } = require("./config/db");
const { createPasswordHash, isPasswordHashed } = require("./auth");
const {
  seedUsers,
  seedMaestros,
  seedNinos,
  seedAttendances,
} = require("./seed");


const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "schema.sql");

async function query(text, params = []) {
  return pool.query(text, params);
}

function mapUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    fechaCumpleanos: row.fecha_cumpleanos,
    role: row.role,
    estado: row.estado,
    creadoEn: row.creado_en,
  };
}

function mapMaestro(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email,
    fechaCumpleanos: row.fecha_cumpleanos,
    grupo: row.grupo,
    turno: row.turno,
    estado: row.estado,
    creadoEn: row.creado_en,
  };
}

function mapNino(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    edad: Number(row.edad),
    fechaNacimiento: row.fecha_nacimiento,
    grupo: row.grupo,
    turno: row.turno,
    responsable: row.responsable,
    telefonoResponsable: row.telefono_responsable,
    estado: row.estado,
    creadoEn: row.creado_en,
  };
}

function mapAttendance(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    turno: row.turno,
    ninoId: row.nino_id,
    ninoNombre: row.nino_nombre,
    grupo: row.grupo,
    maestroId: row.maestro_id,
    maestroNombre: row.maestro_nombre,
    presente: row.presente,
    maestroPresente: row.maestro_presente,
    registradoPor: row.registrado_por,
    creadoEn: row.creado_en,
  };
}

function mapTeacherAttendance(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    turno: row.turno,
    maestroId: row.maestro_id,
    maestroNombre: row.maestro_nombre,
    grupo: row.grupo,
    presente: row.presente,
    registradoPor: row.registrado_por,
    creadoEn: row.creado_en,
  };
}

async function initializeDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await query(schemaSql);
  await seedDatabase();
}

async function seedDatabase() {
  const usersCount = await query("SELECT COUNT(*)::int AS total FROM users");
  if (usersCount.rows[0].total === 0) {
    for (const user of seedUsers) {
      await query(
        "INSERT INTO users (nombre, email, password, fecha_cumpleanos, role, estado) VALUES ($1, $2, $3, $4, $5, $6)",
        [user.nombre, user.email, createPasswordHash(user.password), user.fechaCumpleanos || null, user.role, user.estado],
      );
    }
  }

  await migrateLegacyPasswords();

  const maestrosCount = await query("SELECT COUNT(*)::int AS total FROM maestros");
  if (maestrosCount.rows[0].total === 0) {
    for (const maestro of seedMaestros) {
      await query(
        "INSERT INTO maestros (nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          maestro.nombre,
          maestro.telefono,
          maestro.email,
          maestro.fechaCumpleanos,
          maestro.grupo || null,
          maestro.turno,
          maestro.estado,
        ],
      );
    }
  }

  const ninosCount = await query("SELECT COUNT(*)::int AS total FROM ninos");
  if (ninosCount.rows[0].total === 0) {
    for (const nino of seedNinos) {
      await query(
        `INSERT INTO ninos (
          nombre,
          fecha_nacimiento,
          grupo,
          turno,
          responsable,
          telefono_responsable,
          estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          nino.nombre,
          nino.fechaNacimiento,
          nino.grupo,
          nino.turno,
          nino.responsable,
          nino.telefonoResponsable,
          nino.estado,
        ],
      );
    }
  }

  const attendanceCount = await query("SELECT COUNT(*)::int AS total FROM asistencias");
  if (attendanceCount.rows[0].total === 0) {
    for (const attendance of seedAttendances) {
      const ninoResult = await query("SELECT id FROM ninos WHERE nombre = $1 LIMIT 1", [attendance.ninoNombre]);
      const maestroResult = await query("SELECT id FROM maestros WHERE email = $1 LIMIT 1", [attendance.maestroEmail]);

      if (ninoResult.rows.length === 0) {
        continue;
      }

      await query(
        `INSERT INTO asistencias (
          fecha,
          turno,
          nino_id,
          maestro_id,
          presente,
          maestro_presente,
          registrado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          attendance.fecha,
          attendance.turno,
          ninoResult.rows[0].id,
          maestroResult.rows[0]?.id || null,
          attendance.presente,
          attendance.maestroPresente,
          attendance.registradoPor,
        ],
      );
    }
  }
}

async function getUsers() {
  const result = await query(
    "SELECT id, nombre, email, fecha_cumpleanos, role, estado, creado_en FROM users ORDER BY nombre ASC",
  );
  return result.rows.map(mapUser);
}

async function getUserById(id) {
  const result = await query(
    "SELECT id, nombre, email, fecha_cumpleanos, role, estado, creado_en FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

async function findUserByEmail(email) {
  const result = await query(
    "SELECT id, nombre, email, password, fecha_cumpleanos, role, estado, creado_en FROM users WHERE email = $1 LIMIT 1",
    [email],
  );
  return result.rows[0] || null;
}

async function createUser(payload) {
  const result = await query(
    `INSERT INTO users (nombre, email, password, fecha_cumpleanos, role, estado)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre, email, fecha_cumpleanos, role, estado, creado_en`,
    [
      payload.nombre,
      payload.email,
      createPasswordHash(payload.password),
      payload.fechaCumpleanos || null,
      payload.role,
      payload.estado || "activo",
    ],
  );
  return mapUser(result.rows[0]);
}

async function updateUser(id, payload) {
  const current = await findUserByEmail(payload.email);
  const passwordResult = await query("SELECT password FROM users WHERE id = $1", [id]);
  const password = payload.password
    ? createPasswordHash(payload.password)
    : passwordResult.rows[0]?.password || "";

  if (current && current.id !== id) {
    const error = new Error("Ya existe un usuario con ese correo.");
    error.code = "23505";
    throw error;
  }

  const result = await query(
    `UPDATE users
     SET nombre = $1,
         email = $2,
         password = $3,
         fecha_cumpleanos = $4,
         role = $5,
         estado = $6
     WHERE id = $7
     RETURNING id, nombre, email, fecha_cumpleanos, role, estado, creado_en`,
    [
      payload.nombre,
      payload.email,
      password,
      payload.fechaCumpleanos || null,
      payload.role,
      payload.estado || "activo",
      id,
    ],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

async function deleteUser(id) {
  const result = await query("DELETE FROM users WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function updateUserPassword(id, passwordHash) {
  await query("UPDATE users SET password = $1 WHERE id = $2", [passwordHash, id]);
}

async function findUserById(id) {
  const result = await query(
    "SELECT id, nombre, email, fecha_cumpleanos, role, estado, creado_en FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

async function migrateLegacyPasswords() {
  const result = await query("SELECT id, password FROM users");

  for (const row of result.rows) {
    if (row.password && !isPasswordHashed(row.password)) {
      await updateUserPassword(row.id, createPasswordHash(row.password));
    }
  }
}

async function listMaestros(filters = {}) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (filters.estado) {
    conditions.push(`estado = $${index++}`);
    params.push(filters.estado);
  }

  if (filters.turno) {
    conditions.push(`turno = $${index++}`);
    params.push(filters.turno);
  }

  if (filters.grupo) {
    conditions.push(`grupo = $${index++}`);
    params.push(filters.grupo);
  }

  if (filters.search) {
    conditions.push(`(nombre ILIKE $${index} OR email ILIKE $${index} OR telefono ILIKE $${index})`);
    params.push(`%${filters.search}%`);
    index += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT id, nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado, creado_en
     FROM maestros
     ${whereClause}
     ORDER BY nombre ASC`,
    params,
  );

  return result.rows.map(mapMaestro);
}

async function getMaestroById(id) {
  const result = await query(
    "SELECT id, nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado, creado_en FROM maestros WHERE id = $1",
    [id],
  );
  return result.rows[0] ? mapMaestro(result.rows[0]) : null;
}

async function createMaestro(payload) {
  const result = await query(
    `INSERT INTO maestros (nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado, creado_en`,
    [
      payload.nombre,
      payload.telefono || "",
      payload.email || null,
      payload.fechaCumpleanos || null,
      payload.grupo || null,
      payload.turno,
      payload.estado || "activo",
    ],
  );
  return mapMaestro(result.rows[0]);
}

async function updateMaestro(id, payload) {
  const result = await query(
    `UPDATE maestros
     SET nombre = $1, telefono = $2, email = $3, fecha_cumpleanos = $4, grupo = $5, turno = $6, estado = $7
     WHERE id = $8
     RETURNING id, nombre, telefono, email, fecha_cumpleanos, grupo, turno, estado, creado_en`,
    [
      payload.nombre,
      payload.telefono || "",
      payload.email || null,
      payload.fechaCumpleanos || null,
      payload.grupo || null,
      payload.turno,
      payload.estado || "activo",
      id,
    ],
  );
  return result.rows[0] ? mapMaestro(result.rows[0]) : null;
}

async function deleteMaestro(id) {
  const result = await query("DELETE FROM maestros WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function listNinos(filters = {}) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (filters.estado) {
    conditions.push(`estado = $${index++}`);
    params.push(filters.estado);
  }

  if (filters.turno) {
    conditions.push(`turno = $${index++}`);
    params.push(filters.turno);
  }

  if (filters.grupo) {
    conditions.push(`grupo = $${index++}`);
    params.push(filters.grupo);
  }

  if (filters.search) {
    conditions.push(`(nombre ILIKE $${index} OR responsable ILIKE $${index})`);
    params.push(`%${filters.search}%`);
    index += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT
       id,
       nombre,
       DATE_PART('year', AGE(CURRENT_DATE, fecha_nacimiento))::int AS edad,
       fecha_nacimiento,
       grupo,
       turno,
       responsable,
       telefono_responsable,
       estado,
       creado_en
     FROM ninos
     ${whereClause}
     ORDER BY nombre ASC`,
    params,
  );

  return result.rows.map(mapNino);
}

async function getNinoById(id) {
  const result = await query(
    `SELECT
       id,
       nombre,
       DATE_PART('year', AGE(CURRENT_DATE, fecha_nacimiento))::int AS edad,
       fecha_nacimiento,
       grupo,
       turno,
       responsable,
       telefono_responsable,
       estado,
       creado_en
     FROM ninos
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? mapNino(result.rows[0]) : null;
}

async function createNino(payload) {
  const result = await query(
    `INSERT INTO ninos (
       nombre,
       fecha_nacimiento,
       grupo,
       turno,
       responsable,
       telefono_responsable,
       estado
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       nombre,
       DATE_PART('year', AGE(CURRENT_DATE, fecha_nacimiento))::int AS edad,
       fecha_nacimiento,
       grupo,
       turno,
       responsable,
       telefono_responsable,
       estado,
       creado_en`,
    [
      payload.nombre,
      payload.fechaNacimiento,
      payload.grupo,
      payload.turno,
      payload.responsable || "",
      payload.telefonoResponsable || "",
      payload.estado || "activo",
    ],
  );
  return mapNino(result.rows[0]);
}

async function updateNino(id, payload) {
  const result = await query(
    `UPDATE ninos
     SET
       nombre = $1,
       fecha_nacimiento = $2,
       grupo = $3,
       turno = $4,
       responsable = $5,
       telefono_responsable = $6,
       estado = $7
     WHERE id = $8
     RETURNING
       id,
       nombre,
       DATE_PART('year', AGE(CURRENT_DATE, fecha_nacimiento))::int AS edad,
       fecha_nacimiento,
       grupo,
       turno,
       responsable,
       telefono_responsable,
       estado,
       creado_en`,
    [
      payload.nombre,
      payload.fechaNacimiento,
      payload.grupo,
      payload.turno,
      payload.responsable || "",
      payload.telefonoResponsable || "",
      payload.estado || "activo",
      id,
    ],
  );
  return result.rows[0] ? mapNino(result.rows[0]) : null;
}

async function deleteNino(id) {
  const result = await query("DELETE FROM ninos WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function listAttendances(filters = {}) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (filters.fecha) {
    conditions.push(`a.fecha = $${index++}`);
    params.push(filters.fecha);
  }

  if (filters.turno) {
    conditions.push(`a.turno = $${index++}`);
    params.push(filters.turno);
  }

  if (filters.grupo) {
    conditions.push(`n.grupo = $${index++}`);
    params.push(filters.grupo);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT
       a.id,
       a.fecha,
       a.turno,
       a.nino_id,
       n.nombre AS nino_nombre,
       n.grupo,
       a.maestro_id,
       m.nombre AS maestro_nombre,
       a.presente,
       a.maestro_presente,
       a.registrado_por,
       a.creado_en
     FROM asistencias a
     INNER JOIN ninos n ON n.id = a.nino_id
     LEFT JOIN maestros m ON m.id = a.maestro_id
     ${whereClause}
     ORDER BY a.fecha DESC, n.nombre ASC`,
    params,
  );

  return result.rows.map(mapAttendance);
}

async function listTeacherAttendances(filters = {}) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (filters.fecha) {
    conditions.push(`am.fecha = $${index++}`);
    params.push(filters.fecha);
  }

  if (filters.turno) {
    conditions.push(`am.turno = $${index++}`);
    params.push(filters.turno);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT
       am.id,
       am.fecha,
       am.turno,
       am.maestro_id,
       m.nombre AS maestro_nombre,
       m.grupo,
       am.presente,
       am.registrado_por,
       am.creado_en
     FROM asistencias_maestros am
     INNER JOIN maestros m ON m.id = am.maestro_id
     ${whereClause}
     ORDER BY am.fecha DESC, m.nombre ASC`,
    params,
  );

  return result.rows.map(mapTeacherAttendance);
}

async function upsertAttendance(payload) {
  const result = await query(
    `INSERT INTO asistencias (
       fecha,
       turno,
       nino_id,
       maestro_id,
       presente,
       maestro_presente,
       registrado_por
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (fecha, turno, nino_id)
     DO UPDATE SET
       maestro_id = EXCLUDED.maestro_id,
       presente = EXCLUDED.presente,
       maestro_presente = EXCLUDED.maestro_presente,
       registrado_por = EXCLUDED.registrado_por
     RETURNING id`,
    [
      payload.fecha,
      payload.turno,
      payload.ninoId,
      payload.maestroId || null,
      payload.presente,
      payload.maestroPresente,
      payload.registradoPor,
    ],
  );

  const joined = await query(
    `SELECT
       a.id,
       a.fecha,
       a.turno,
       a.nino_id,
       n.nombre AS nino_nombre,
       n.grupo,
       a.maestro_id,
       m.nombre AS maestro_nombre,
       a.presente,
       a.maestro_presente,
       a.registrado_por,
       a.creado_en
     FROM asistencias a
     INNER JOIN ninos n ON n.id = a.nino_id
     LEFT JOIN maestros m ON m.id = a.maestro_id
     WHERE a.id = $1`,
    [result.rows[0].id],
  );

  return mapAttendance(joined.rows[0]);
}

async function upsertTeacherAttendance(payload) {
  const result = await query(
    `INSERT INTO asistencias_maestros (
       fecha,
       turno,
       maestro_id,
       presente,
       registrado_por
     ) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (fecha, turno, maestro_id)
     DO UPDATE SET
       presente = EXCLUDED.presente,
       registrado_por = EXCLUDED.registrado_por
     RETURNING id`,
    [
      payload.fecha,
      payload.turno,
      payload.maestroId,
      payload.presente,
      payload.registradoPor,
    ],
  );

  const joined = await query(
    `SELECT
       am.id,
       am.fecha,
       am.turno,
       am.maestro_id,
       m.nombre AS maestro_nombre,
       m.grupo,
       am.presente,
       am.registrado_por,
       am.creado_en
     FROM asistencias_maestros am
     INNER JOIN maestros m ON m.id = am.maestro_id
     WHERE am.id = $1`,
    [result.rows[0].id],
  );

  return mapTeacherAttendance(joined.rows[0]);
}

async function getDashboardSummary() {
  const totals = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM ninos WHERE estado = 'activo') AS total_ninos_activos,
       (SELECT COUNT(*)::int FROM maestros WHERE estado = 'activo') AS total_maestros_activos,
       (SELECT COUNT(*)::int FROM asistencias WHERE fecha = CURRENT_DATE) AS asistencias_hoy,
       (SELECT COUNT(*)::int FROM asistencias WHERE fecha = CURRENT_DATE AND presente = TRUE) AS presentes_hoy`,
  );

  const attendanceByTurn = await query(
    `SELECT
       turno,
       COUNT(*)::int AS total,
       SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::int AS presentes
     FROM asistencias
     WHERE fecha = CURRENT_DATE
     GROUP BY turno
     ORDER BY turno ASC`,
  );

  const attendanceByGroup = await query(
    `SELECT
       n.grupo,
       COUNT(*)::int AS total,
       SUM(CASE WHEN a.presente = TRUE THEN 1 ELSE 0 END)::int AS presentes
     FROM asistencias a
     INNER JOIN ninos n ON n.id = a.nino_id
     WHERE a.fecha = CURRENT_DATE
     GROUP BY n.grupo
     ORDER BY n.grupo ASC`,
  );

  const teacherTotals = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM maestros WHERE estado = 'activo') AS total_maestros,
       (SELECT COUNT(*)::int FROM asistencias_maestros WHERE fecha = CURRENT_DATE AND presente = TRUE) AS maestros_presentes_hoy`,
  );

  const recent = await listAttendances();

  return {
    totalNinosActivos: totals.rows[0].total_ninos_activos,
    totalMaestrosActivos: totals.rows[0].total_maestros_activos,
    asistenciasRegistradasHoy: totals.rows[0].asistencias_hoy,
    presentesHoy: totals.rows[0].presentes_hoy,
    maestrosPresentesHoy: teacherTotals.rows[0].maestros_presentes_hoy,
    asistenciaPorTurno: attendanceByTurn.rows.map((row) => ({
      turno: row.turno,
      total: row.total,
      presentes: row.presentes || 0,
    })),
    asistenciaPorGrupo: attendanceByGroup.rows.map((row) => ({
      grupo: row.grupo,
      total: row.total,
      presentes: row.presentes || 0,
    })),
    recientes: recent.slice(0, 10),
  };
}

async function getAttendanceReport(month) {
  const result = await query(
    `SELECT
       fecha,
       turno,
       COUNT(*)::int AS total_registros,
       SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::int AS total_presentes,
       ROUND((SUM(CASE WHEN presente = TRUE THEN 1.0 ELSE 0 END) / COUNT(*)) * 100, 2) AS porcentaje
     FROM asistencias
     WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
     GROUP BY fecha, turno
     ORDER BY fecha DESC, turno ASC`,
    [month],
  );

  return result.rows;
}

async function getAdvancedReports(month) {
  const [daily, summary, byTurn, byGroup, teachers, childrenAlerts] = await Promise.all([
    getAttendanceReport(month),
    query(
      `SELECT
         COUNT(*)::int AS total_registros,
         SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::int AS total_presentes,
         ROUND((SUM(CASE WHEN presente = TRUE THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS porcentaje_general,
         (SELECT COUNT(*)::int FROM ninos WHERE estado = 'activo') AS total_ninos_activos,
         (SELECT COUNT(*)::int FROM maestros WHERE estado = 'activo') AS total_maestros_activos,
         (
           SELECT COUNT(*)::int
           FROM asistencias_maestros
           WHERE TO_CHAR(fecha, 'YYYY-MM') = $1 AND presente = TRUE
         ) AS total_maestros_presentes
       FROM asistencias
       WHERE TO_CHAR(fecha, 'YYYY-MM') = $1`,
      [month],
    ),
    query(
      `SELECT
         turno,
         COUNT(*)::int AS total_registros,
         SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)::int AS total_presentes,
         ROUND((SUM(CASE WHEN presente = TRUE THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS porcentaje
       FROM asistencias
       WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
       GROUP BY turno
       ORDER BY turno ASC`,
      [month],
    ),
    query(
      `SELECT
         n.grupo,
         COUNT(*)::int AS total_registros,
         SUM(CASE WHEN a.presente = TRUE THEN 1 ELSE 0 END)::int AS total_presentes,
         ROUND((SUM(CASE WHEN a.presente = TRUE THEN 1.0 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 2) AS porcentaje
       FROM asistencias a
       INNER JOIN ninos n ON n.id = a.nino_id
       WHERE TO_CHAR(a.fecha, 'YYYY-MM') = $1
       GROUP BY n.grupo
       ORDER BY n.grupo ASC`,
      [month],
    ),
    query(
      `SELECT
         m.id,
         m.nombre,
         m.grupo,
         m.turno,
         COUNT(am.id)::int AS total_registros,
         SUM(CASE WHEN am.presente = TRUE THEN 1 ELSE 0 END)::int AS dias_presente,
         ROUND((SUM(CASE WHEN am.presente = TRUE THEN 1.0 ELSE 0 END) / NULLIF(COUNT(am.id), 0)) * 100, 2) AS porcentaje
       FROM maestros m
       LEFT JOIN asistencias_maestros am
         ON am.maestro_id = m.id
        AND TO_CHAR(am.fecha, 'YYYY-MM') = $1
       WHERE m.estado = 'activo'
       GROUP BY m.id, m.nombre, m.grupo, m.turno
       ORDER BY dias_presente DESC, m.nombre ASC`,
      [month],
    ),
    query(
      `SELECT
         n.id,
         n.nombre,
         n.grupo,
         n.turno,
         COUNT(a.id)::int AS total_registros,
         SUM(CASE WHEN a.presente = TRUE THEN 1 ELSE 0 END)::int AS total_presentes,
         SUM(CASE WHEN a.presente = FALSE THEN 1 ELSE 0 END)::int AS total_ausencias,
         ROUND((SUM(CASE WHEN a.presente = TRUE THEN 1.0 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2) AS porcentaje
       FROM ninos n
       LEFT JOIN asistencias a
         ON a.nino_id = n.id
        AND TO_CHAR(a.fecha, 'YYYY-MM') = $1
       WHERE n.estado = 'activo'
       GROUP BY n.id, n.nombre, n.grupo, n.turno
       HAVING COUNT(a.id) > 0
       ORDER BY total_ausencias DESC, n.nombre ASC
       LIMIT 10`,
      [month],
    ),
  ]);

  return {
    summary: {
      totalRegistros: summary.rows[0]?.total_registros || 0,
      totalPresentes: summary.rows[0]?.total_presentes || 0,
      porcentajeGeneral: summary.rows[0]?.porcentaje_general || 0,
      totalNinosActivos: summary.rows[0]?.total_ninos_activos || 0,
      totalMaestrosActivos: summary.rows[0]?.total_maestros_activos || 0,
      totalMaestrosPresentes: summary.rows[0]?.total_maestros_presentes || 0,
    },
    daily,
    byTurn: byTurn.rows,
    byGroup: byGroup.rows,
    teachers: teachers.rows,
    childrenAlerts: childrenAlerts.rows,
  };
}

module.exports = {
  pool,
  initializeDatabase,
  getUsers,
  getUserById,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  listMaestros,
  getMaestroById,
  createMaestro,
  updateMaestro,
  deleteMaestro,
  listNinos,
  getNinoById,
  createNino,
  updateNino,
  deleteNino,
  listAttendances,
  listTeacherAttendances,
  upsertAttendance,
  upsertTeacherAttendance,
  getDashboardSummary,
  getAttendanceReport,
  getAdvancedReports,
  query,
};
