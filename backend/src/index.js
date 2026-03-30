const http = require("http");
const { PORT, HOST, DATABASE_URL } = require("./config");
const {
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
} = require("./db");
const {
  getNotificationSettings,
  updateNotificationSettings,
  listUpcomingBirthdays,
  listAppNotifications,
  syncBirthdayCalendarEvents,
  scheduleDailyBirthdayReminderRefresh,
} = require("./reminders");
const { getCatalogSettings, updateCatalogSettings } = require("./catalogs");
const { buildRolePermissions, getPermissionsForRole } = require("./permissions");
const {
  createPasswordHash,
  verifyPassword,
  sanitizeUser,
  createSessionToken,
  verifySessionToken,
  getBearerToken,
} = require("./auth");
const { readJsonBody, sendJson, sendNoContent, parseId } = require("./http");

function normalizeTurno(turno) {
  if (!turno) {
    return null;
  }

  if (turno === "mañana") {
    return "manana";
  }

  return turno;
}

function validateRequiredFields(payload, requiredFields) {
  return requiredFields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === "";
  });
}

function buildQueryFilters(url) {
  return {
    estado: url.searchParams.get("estado") || undefined,
    turno: normalizeTurno(url.searchParams.get("turno")) || undefined,
    grupo: url.searchParams.get("grupo") || undefined,
    search: url.searchParams.get("search") || undefined,
    fecha: url.searchParams.get("fecha") || undefined,
  };
}

async function authenticateRequest(req, res) {
  const token = getBearerToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    sendJson(res, 401, { error: "Sesion invalida o expirada." });
    return null;
  }

  const user = await findUserById(session.sub);
  if (!user || user.estado === "inactivo") {
    sendJson(res, 401, { error: "Usuario no autorizado." });
    return null;
  }

  return {
    session,
    user,
    permissions: getPermissionsForRole(user.role).permissions,
  };
}

function hasPermission(auth, permission) {
  return auth.permissions.includes(permission);
}

async function requirePermission(req, res, permission) {
  const auth = await authenticateRequest(req, res);
  if (!auth) {
    return null;
  }

  if (!hasPermission(auth, permission)) {
    sendJson(res, 403, { error: "No tienes permiso para realizar esta accion." });
    return null;
  }

  return auth;
}

async function requireAnyPermission(req, res, permissions) {
  const auth = await authenticateRequest(req, res);
  if (!auth) {
    return null;
  }

  if (!permissions.some((permission) => hasPermission(auth, permission))) {
    sendJson(res, 403, { error: "No tienes permiso para realizar esta accion." });
    return null;
  }

  return auth;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  try {
    if (pathname === "/" && req.method === "GET") {
      sendJson(res, 200, {
        service: "church-connect-hub-backend",
        status: "running",
        database: "postgresql",
        databaseUrl: DATABASE_URL,
        endpoints: [
          "GET /health",
          "POST /api/auth/login",
          "GET /api/dashboard",
          "GET|POST|PUT|DELETE /api/users",
          "GET /api/permisos/roles",
          "GET|POST|PUT|DELETE /api/maestros",
          "GET|POST|PUT|DELETE /api/ninos",
          "GET|POST /api/asistencias",
          "GET|POST /api/asistencias-maestros",
          "GET|PUT /api/config/notificaciones",
          "GET|PUT /api/config/catalogos",
          "GET /api/notificaciones/app",
          "GET /api/cumpleanos/proximos",
          "POST /api/cumpleanos/sync-calendar",
          "GET /api/reportes/asistencia",
          "GET /api/reportes/avanzados",
        ],
      });
      return;
    }

    if (pathname === "/health" && req.method === "GET") {
      await pool.query("SELECT 1");
      sendJson(res, 200, {
        status: "ok",
        service: "church-connect-hub-backend",
        database: "connected",
      });
      return;
    }

    if (pathname === "/api/users" && req.method === "GET") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await getUsers());
      return;
    }

    if (pathname === "/api/users" && req.method === "POST") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      const missing = validateRequiredFields(payload, ["nombre", "email", "password", "role"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      sendJson(res, 201, await createUser(payload));
      return;
    }

    if (pathname.startsWith("/api/users/")) {
      const id = parseId(pathname);
      if (!id) {
        sendJson(res, 400, { error: "Id invalido" });
        return;
      }

      if (req.method === "GET") {
        const auth = await requirePermission(req, res, "users.manage");
        if (!auth) {
          return;
        }
        const user = await getUserById(id);
        if (!user) {
          sendJson(res, 404, { error: "Usuario no encontrado" });
          return;
        }

        sendJson(res, 200, user);
        return;
      }

      if (req.method === "PUT") {
        const auth = await requirePermission(req, res, "users.manage");
        if (!auth) {
          return;
        }
        const user = await getUserById(id);
        if (!user) {
          sendJson(res, 404, { error: "Usuario no encontrado" });
          return;
        }

        const payload = await readJsonBody(req);
        const missing = validateRequiredFields(payload, ["nombre", "email", "role"]);

        if (missing.length > 0) {
          sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
          return;
        }

        sendJson(res, 200, await updateUser(id, payload));
        return;
      }

      if (req.method === "DELETE") {
        const auth = await requirePermission(req, res, "users.manage");
        if (!auth) {
          return;
        }
        const deleted = await deleteUser(id);
        if (!deleted) {
          sendJson(res, 404, { error: "Usuario no encontrado" });
          return;
        }

        sendJson(res, 200, { message: "Usuario eliminado" });
        return;
      }
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      const payload = await readJsonBody(req);
      const missing = validateRequiredFields(payload, ["email", "password"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      const user = await findUserByEmail(payload.email);
      if (!user || user.estado === "inactivo" || !verifyPassword(payload.password, user.password)) {
        sendJson(res, 401, { error: "Credenciales invalidas" });
        return;
      }

      if (user.password === payload.password) {
        await updateUserPassword(user.id, createPasswordHash(payload.password));
      }

      const safeUser = sanitizeUser(user);

      sendJson(res, 200, {
        message: "Login exitoso",
        token: createSessionToken(user),
        user: safeUser,
      });
      return;
    }

    if (pathname === "/api/dashboard" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await getDashboardSummary());
      return;
    }

    if (pathname === "/api/config/notificaciones" && req.method === "GET") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await getNotificationSettings());
      return;
    }

    if (pathname === "/api/config/notificaciones" && req.method === "PUT") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 200, await updateNotificationSettings(payload));
      return;
    }

    if (pathname === "/api/config/catalogos" && req.method === "GET") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await getCatalogSettings());
      return;
    }

    if (pathname === "/api/config/catalogos" && req.method === "PUT") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      sendJson(res, 200, await updateCatalogSettings(payload));
      return;
    }

    if (pathname === "/api/permisos/roles" && req.method === "GET") {
      const auth = await authenticateRequest(req, res);
      if (!auth) {
        return;
      }
      const catalogs = await getCatalogSettings();
      sendJson(res, 200, buildRolePermissions(catalogs.roles));
      return;
    }

    if (pathname === "/api/notificaciones/app" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) {
        return;
      }
      const limit = Number(url.searchParams.get("limit") || 6);
      sendJson(res, 200, await listAppNotifications(limit));
      return;
    }

    if (pathname === "/api/cumpleanos/proximos" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) {
        return;
      }
      const days = Number(url.searchParams.get("days") || 30);
      sendJson(res, 200, await listUpcomingBirthdays(days));
      return;
    }

    if (pathname === "/api/cumpleanos/sync-calendar" && req.method === "POST") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await syncBirthdayCalendarEvents());
      return;
    }

    if (pathname === "/api/maestros" && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["maestros.manage", "attendance.manage"]);
      if (!auth) {
        return;
      }
      sendJson(res, 200, await listMaestros(buildQueryFilters(url)));
      return;
    }

    if (pathname === "/api/maestros" && req.method === "POST") {
      const auth = await requirePermission(req, res, "maestros.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      payload.turno = normalizeTurno(payload.turno);
      const missing = validateRequiredFields(payload, ["nombre", "turno"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      sendJson(res, 201, await createMaestro(payload));
      return;
    }

    if (pathname.startsWith("/api/maestros/")) {
      const id = parseId(pathname);
      if (!id) {
        sendJson(res, 400, { error: "Id invalido" });
        return;
      }

      if (req.method === "GET") {
        const auth = await requireAnyPermission(req, res, ["maestros.manage", "attendance.manage"]);
        if (!auth) {
          return;
        }
        const maestro = await getMaestroById(id);
        if (!maestro) {
          sendJson(res, 404, { error: "Maestro no encontrado" });
          return;
        }

        sendJson(res, 200, maestro);
        return;
      }

      if (req.method === "PUT") {
        const auth = await requirePermission(req, res, "maestros.manage");
        if (!auth) {
          return;
        }
        const maestro = await getMaestroById(id);
        if (!maestro) {
          sendJson(res, 404, { error: "Maestro no encontrado" });
          return;
        }

        const payload = await readJsonBody(req);
        payload.turno = normalizeTurno(payload.turno);
        const missing = validateRequiredFields(payload, ["nombre", "turno"]);

        if (missing.length > 0) {
          sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
          return;
        }

        sendJson(res, 200, await updateMaestro(id, payload));
        return;
      }

      if (req.method === "DELETE") {
        const auth = await requirePermission(req, res, "maestros.manage");
        if (!auth) {
          return;
        }
        const deleted = await deleteMaestro(id);
        if (!deleted) {
          sendJson(res, 404, { error: "Maestro no encontrado" });
          return;
        }

        sendJson(res, 200, { message: "Maestro eliminado" });
        return;
      }
    }

    if (pathname === "/api/ninos" && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["ninos.manage", "attendance.manage"]);
      if (!auth) {
        return;
      }
      sendJson(res, 200, await listNinos(buildQueryFilters(url)));
      return;
    }

    if (pathname === "/api/ninos" && req.method === "POST") {
      const auth = await requirePermission(req, res, "ninos.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      payload.turno = normalizeTurno(payload.turno);
      const missing = validateRequiredFields(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      sendJson(res, 201, await createNino(payload));
      return;
    }

    if (pathname.startsWith("/api/ninos/")) {
      const id = parseId(pathname);
      if (!id) {
        sendJson(res, 400, { error: "Id invalido" });
        return;
      }

      if (req.method === "GET") {
        const auth = await requireAnyPermission(req, res, ["ninos.manage", "attendance.manage"]);
        if (!auth) {
          return;
        }
        const nino = await getNinoById(id);
        if (!nino) {
          sendJson(res, 404, { error: "Nino no encontrado" });
          return;
        }

        sendJson(res, 200, nino);
        return;
      }

      if (req.method === "PUT") {
        const auth = await requirePermission(req, res, "ninos.manage");
        if (!auth) {
          return;
        }
        const nino = await getNinoById(id);
        if (!nino) {
          sendJson(res, 404, { error: "Nino no encontrado" });
          return;
        }

        const payload = await readJsonBody(req);
        payload.turno = normalizeTurno(payload.turno);
        const missing = validateRequiredFields(payload, ["nombre", "fechaNacimiento", "grupo", "turno"]);

        if (missing.length > 0) {
          sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
          return;
        }

        sendJson(res, 200, await updateNino(id, payload));
        return;
      }

      if (req.method === "DELETE") {
        const auth = await requirePermission(req, res, "ninos.manage");
        if (!auth) {
          return;
        }
        const deleted = await deleteNino(id);
        if (!deleted) {
          sendJson(res, 404, { error: "Nino no encontrado" });
          return;
        }

        sendJson(res, 200, { message: "Nino eliminado" });
        return;
      }
    }

    if (pathname === "/api/asistencias" && req.method === "GET") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await listAttendances(buildQueryFilters(url)));
      return;
    }

    if (pathname === "/api/asistencias" && req.method === "POST") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      payload.turno = normalizeTurno(payload.turno);
      const missing = validateRequiredFields(payload, ["fecha", "turno", "ninoId", "registradoPor"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      sendJson(
        res,
        200,
        await upsertAttendance({
          fecha: payload.fecha,
          turno: payload.turno,
          ninoId: Number(payload.ninoId),
          maestroId: payload.maestroId ? Number(payload.maestroId) : null,
          presente: Boolean(payload.presente),
          maestroPresente: Boolean(payload.maestroPresente),
          registradoPor: auth.user.email,
        }),
      );
      return;
    }

    if (pathname === "/api/asistencias-maestros" && req.method === "GET") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) {
        return;
      }
      sendJson(res, 200, await listTeacherAttendances(buildQueryFilters(url)));
      return;
    }

    if (pathname === "/api/asistencias-maestros" && req.method === "POST") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) {
        return;
      }
      const payload = await readJsonBody(req);
      payload.turno = normalizeTurno(payload.turno);
      const missing = validateRequiredFields(payload, ["fecha", "turno", "maestroId", "registradoPor"]);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Faltan campos requeridos", fields: missing });
        return;
      }

      sendJson(
        res,
        200,
        await upsertTeacherAttendance({
          fecha: payload.fecha,
          turno: payload.turno,
          maestroId: Number(payload.maestroId),
          presente: Boolean(payload.presente),
          registradoPor: auth.user.email,
        }),
      );
      return;
    }

    if (pathname === "/api/reportes/asistencia" && req.method === "GET") {
      const auth = await requirePermission(req, res, "reports.view");
      if (!auth) {
        return;
      }
      const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
      sendJson(res, 200, await getAttendanceReport(month));
      return;
    }

    if (pathname === "/api/reportes/avanzados" && req.method === "GET") {
      const auth = await requirePermission(req, res, "reports.view");
      if (!auth) {
        return;
      }
      const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
      sendJson(res, 200, await getAdvancedReports(month));
      return;
    }

    sendJson(res, 404, { error: "Ruta no encontrada" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: "JSON invalido" });
      return;
    }

    if (error.code === "23505") {
      sendJson(res, 409, { error: "Ya existe un registro con ese valor unico" });
      return;
    }

    sendJson(res, 500, {
      error: "Error interno del servidor",
      detail: error.message,
    });
  }
});

initializeDatabase()
  .then(() => {
    scheduleDailyBirthdayReminderRefresh();
    server.listen(PORT, HOST, () => {
      console.log(`Backend corriendo en http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar PostgreSQL:", error.message);
    process.exit(1);
  });
