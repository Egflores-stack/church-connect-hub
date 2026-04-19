const http = require("http");
const { PORT, HOST } = require("./config");
const { pool, initializeDatabase, getDashboardSummary, getAttendanceReport, getAdvancedReports } = require("./db");
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
const { verifySessionToken, getBearerToken } = require("./auth");
const { sendJson, sendError } = require("./http");

// Middleware
const { buildCorsMiddleware } = require("./middleware/cors");
const { rateLimit } = require("./middleware/rateLimit");
const { logger, isProduction } = require("./middleware/logger");

// Routes
const { handleLogin } = require("./routes/auth");
const { handleGetUsers, handleGetUser, handleCreateUser, handleUpdateUser, handleDeleteUser } = require("./routes/users");
const { handleList: handleListMaestros, handleGet: handleGetMaestro, handleCreate: handleCreateMaestro, handleUpdate: handleUpdateMaestro, handleDelete: handleDeleteMaestro } = require("./routes/maestros");
const { handleList: handleListNinos, handleGet: handleGetNino, handleCreate: handleCreateNino, handleUpdate: handleUpdateNino, handleDelete: handleDeleteNino } = require("./routes/ninos");
const { handleListAttendances, handleSaveAttendance, handleListTeacherAttendances, handleSaveTeacherAttendance } = require("./routes/asistencia");

// ── Auth helpers ──────────────────────────────────────────

async function authenticateRequest(req, res) {
  const token = getBearerToken(req);
  const session = verifySessionToken(token);
  if (!session) {
    sendError(res, 401, "Sesion invalida o expirada.", {
      operation: "authenticateRequest",
      resource: new URL(req.url, `http://${req.headers.host}`).pathname,
    });
    return null;
  }

  const { findUserById } = require("./db");
  const user = await findUserById(session.sub);
  if (!user || user.estado === "inactivo") {
    sendError(res, 401, "Usuario no autorizado.", {
      operation: "authenticateRequest",
      resource: new URL(req.url, `http://${req.headers.host}`).pathname,
      parameter: "session.sub",
      value: session.sub,
    });
    return null;
  }

  return { session, user, permissions: getPermissionsForRole(user.role).permissions };
}

function hasPermission(auth, permission) { return auth.permissions.includes(permission); }

function getRequestResource(req) {
  return new URL(req.url, `http://${req.headers.host}`).pathname;
}

async function requirePermission(req, res, permission) {
  const auth = await authenticateRequest(req, res);
  if (!auth) return null;
  if (!hasPermission(auth, permission)) {
    sendError(res, 403, "No tienes permiso para realizar esta accion.", {
      operation: "requirePermission",
      resource: getRequestResource(req),
      parameter: "permission",
      value: permission,
    });
    return null;
  }
  return auth;
}

async function requireAnyPermission(req, res, permissions) {
  const auth = await authenticateRequest(req, res);
  if (!auth) return null;
  if (!permissions.some((p) => hasPermission(auth, p))) {
    sendError(res, 403, "No tienes permiso para realizar esta accion.", {
      operation: "requireAnyPermission",
      resource: getRequestResource(req),
      fields: permissions,
    });
    return null;
  }
  return auth;
}

function isValidMonth(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

// ── Router ────────────────────────────────────────────────

const cors = buildCorsMiddleware();

const server = http.createServer(async (req, res) => {
  // Global middleware
  cors(req, res, () => {});
  logger(req, res, () => {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Health
    if (pathname === "/" && req.method === "GET") {
      sendJson(res, 200, {
        service: "church-connect-hub-backend",
        status: "running",
        database: "postgresql",
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
      sendJson(res, 200, { status: "ok", service: "church-connect-hub-backend", database: "connected" });
      return;
    }

    // ── Auth (with rate limiting) ──
    if (pathname === "/api/auth/login" && req.method === "POST") {
      await rateLimit(req, res, () => {});
      if (res.headersSent) return;
      await handleLogin(req, res);
      return;
    }

    // ── Dashboard ──
    if (pathname === "/api/dashboard" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) return;
      sendJson(res, 200, await getDashboardSummary());
      return;
    }

    // ── Users ──
    if (pathname === "/api/users" && req.method === "GET") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) return;
      await handleGetUsers(req, res, auth);
      return;
    }
    if (pathname === "/api/users" && req.method === "POST") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) return;
      await handleCreateUser(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/users/") && req.method === "GET") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) return;
      await handleGetUser(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/users/") && req.method === "PUT") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) return;
      await handleUpdateUser(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/users/") && req.method === "DELETE") {
      const auth = await requirePermission(req, res, "users.manage");
      if (!auth) return;
      await handleDeleteUser(req, res, auth);
      return;
    }

    // ── Maestros ──
    if (pathname === "/api/maestros" && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["maestros.manage", "attendance.manage"]);
      if (!auth) return;
      await handleListMaestros(req, res, auth);
      return;
    }
    if (pathname === "/api/maestros" && req.method === "POST") {
      const auth = await requirePermission(req, res, "maestros.manage");
      if (!auth) return;
      await handleCreateMaestro(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/maestros/") && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["maestros.manage", "attendance.manage"]);
      if (!auth) return;
      await handleGetMaestro(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/maestros/") && req.method === "PUT") {
      const auth = await requirePermission(req, res, "maestros.manage");
      if (!auth) return;
      await handleUpdateMaestro(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/maestros/") && req.method === "DELETE") {
      const auth = await requirePermission(req, res, "maestros.manage");
      if (!auth) return;
      await handleDeleteMaestro(req, res, auth);
      return;
    }

    // ── Ninos ──
    if (pathname === "/api/ninos" && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["ninos.manage", "attendance.manage"]);
      if (!auth) return;
      await handleListNinos(req, res, auth);
      return;
    }
    if (pathname === "/api/ninos" && req.method === "POST") {
      const auth = await requirePermission(req, res, "ninos.manage");
      if (!auth) return;
      await handleCreateNino(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/ninos/") && req.method === "GET") {
      const auth = await requireAnyPermission(req, res, ["ninos.manage", "attendance.manage"]);
      if (!auth) return;
      await handleGetNino(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/ninos/") && req.method === "PUT") {
      const auth = await requirePermission(req, res, "ninos.manage");
      if (!auth) return;
      await handleUpdateNino(req, res, auth);
      return;
    }
    if (pathname.startsWith("/api/ninos/") && req.method === "DELETE") {
      const auth = await requirePermission(req, res, "ninos.manage");
      if (!auth) return;
      await handleDeleteNino(req, res, auth);
      return;
    }

    // ── Asistencia ninos ──
    if (pathname === "/api/asistencias" && req.method === "GET") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) return;
      await handleListAttendances(req, res, auth);
      return;
    }
    if (pathname === "/api/asistencias" && req.method === "POST") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) return;
      await handleSaveAttendance(req, res, auth);
      return;
    }

    // ── Asistencia maestros ──
    if (pathname === "/api/asistencias-maestros" && req.method === "GET") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) return;
      await handleListTeacherAttendances(req, res, auth);
      return;
    }
    if (pathname === "/api/asistencias-maestros" && req.method === "POST") {
      const auth = await requirePermission(req, res, "attendance.manage");
      if (!auth) return;
      await handleSaveTeacherAttendance(req, res, auth);
      return;
    }

    // ── Reportes ──
    if (pathname === "/api/reportes/asistencia" && req.method === "GET") {
      const auth = await requirePermission(req, res, "reports.view");
      if (!auth) return;
      const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
      if (!isValidMonth(month)) {
        sendError(res, 400, "Parametro month invalido. Se espera el formato YYYY-MM.", {
          operation: "getAttendanceReport",
          resource: "/api/reportes/asistencia",
          parameter: "month",
          value: month,
        });
        return;
      }

      try {
        sendJson(res, 200, await getAttendanceReport(month));
      } catch (error) {
        console.error("[reportes/asistencia]", error);
        sendError(res, 500, "Error al generar el reporte de asistencia.", {
          operation: "getAttendanceReport",
          resource: "/api/reportes/asistencia",
          parameter: "month",
          value: month,
          code: error.code,
          detail: isProduction ? undefined : error.message,
        });
      }
      return;
    }
    if (pathname === "/api/reportes/avanzados" && req.method === "GET") {
      const auth = await requirePermission(req, res, "reports.view");
      if (!auth) return;
      const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
      if (!isValidMonth(month)) {
        sendError(res, 400, "Parametro month invalido. Se espera el formato YYYY-MM.", {
          operation: "getAdvancedReports",
          resource: "/api/reportes/avanzados",
          parameter: "month",
          value: month,
        });
        return;
      }

      try {
        sendJson(res, 200, await getAdvancedReports(month));
      } catch (error) {
        console.error("[reportes/avanzados]", error);
        sendError(res, 500, "Error al generar el reporte avanzado.", {
          operation: "getAdvancedReports",
          resource: "/api/reportes/avanzados",
          parameter: "month",
          value: month,
          code: error.code,
          detail: isProduction ? undefined : error.message,
        });
      }
      return;
    }

    // ── Configuracion ──
    if (pathname === "/api/config/notificaciones" && req.method === "GET") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) return;
      sendJson(res, 200, await getNotificationSettings());
      return;
    }
    if (pathname === "/api/config/notificaciones" && req.method === "PUT") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) return;
      const { readJsonBody } = require("./http");
      const payload = await readJsonBody(req);
      sendJson(res, 200, await updateNotificationSettings(payload));
      return;
    }
    if (pathname === "/api/config/catalogos" && req.method === "GET") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) return;
      sendJson(res, 200, await getCatalogSettings());
      return;
    }
    if (pathname === "/api/config/catalogos" && req.method === "PUT") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) return;
      const { readJsonBody } = require("./http");
      const payload = await readJsonBody(req);
      sendJson(res, 200, await updateCatalogSettings(payload));
      return;
    }

    // ── Permisos ──
    if (pathname === "/api/permisos/roles" && req.method === "GET") {
      const auth = await authenticateRequest(req, res);
      if (!auth) return;
      const catalogs = await getCatalogSettings();
      sendJson(res, 200, buildRolePermissions(catalogs.roles));
      return;
    }

    // ── Notificaciones ──
    if (pathname === "/api/notificaciones/app" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) return;
      const limit = Number(url.searchParams.get("limit") || 6);
      sendJson(res, 200, await listAppNotifications(limit));
      return;
    }

    // ── Cumpleanos ──
    if (pathname === "/api/cumpleanos/proximos" && req.method === "GET") {
      const auth = await requirePermission(req, res, "dashboard.view");
      if (!auth) return;
      const days = Number(url.searchParams.get("days") || 30);
      sendJson(res, 200, await listUpcomingBirthdays(days));
      return;
    }
    if (pathname === "/api/cumpleanos/sync-calendar" && req.method === "POST") {
      const auth = await requirePermission(req, res, "settings.manage");
      if (!auth) return;
      sendJson(res, 200, await syncBirthdayCalendarEvents());
      return;
    }

    // 404
    sendError(res, 404, "Ruta no encontrada", {
      operation: "routeMatch",
      resource: pathname,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendError(res, 400, "JSON invalido", {
        operation: "readJsonBody",
        resource: pathname,
      });
      return;
    }
    if (error.code === "23505") {
      sendError(res, 409, "Ya existe un registro con ese valor unico", {
        operation: "databaseWrite",
        resource: pathname,
        code: "23505",
      });
      return;
    }
    console.error("[ERROR]", error);
    sendError(res, 500, "Error interno del servidor", {
      operation: "requestHandler",
      resource: pathname,
      code: error.code,
      detail: isProduction ? undefined : error.message,
    });
  }
});

// ── Startup ───────────────────────────────────────────────

initializeDatabase()
  .then(() => {
    scheduleDailyBirthdayReminderRefresh();
    server.listen(PORT, HOST, () => {
      console.log(`Backend corriendo en http://${HOST}:${PORT}`);
      console.log(`CORS orígenes permitidos: ${process.env.CORS_ORIGINS || "*"}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar PostgreSQL:", error.message);
    process.exit(1);
  });
