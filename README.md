# Church Connect Hub

Proyecto estructurado por capas:

- `frontend/`: aplicacion React + Vite + Tailwind para dashboard, asistencia, reportes y configuracion.
- `backend/`: API Node.js conectada a PostgreSQL para usuarios, maestros, ninos, asistencia, catalogos y recordatorios.

## Comandos desde la raiz

- `npm run dev` inicia el frontend.
- `npm run dev:frontend` inicia el frontend.
- `npm run dev:backend` inicia el backend.
- `npm run build` compila el frontend.
- `npm run test` ejecuta pruebas del frontend.
- `npm run lint` ejecuta lint del frontend.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
npm run dev
```

## Variables de entorno (.env en backend/)

| Variable | Requerida | Default | Descripcion |
|---|---|---|---|
| `DB_HOST` | No | `localhost` | Host de PostgreSQL |
| `DB_PORT` | No | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | No | `infantil` | Nombre de la base de datos |
| `DB_USER` | Si | — | Usuario de PostgreSQL |
| `DB_PASSWORD` | Si | — | Password de PostgreSQL |
| `AUTH_SECRET` | Produccion | auto | Secreto para tokens JWT (usa algo largo y aleatorio en prod) |
| `HOST` | No | `0.0.0.0` | Host del servidor |
| `PORT` | No | `4000` | Puerto del servidor |
| `CORS_ORIGINS` | No | `*` | Origenes permitidos separados por coma |
| `RATE_LIMIT_MAX` | No | `20` | Maximo de requests por ventana |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Ventana de rate limiting en ms |
| `NODE_ENV` | No | — | `production` activa seguridad estricta |

## Endpoints principales

- `GET /health`
- `POST /api/auth/login` (rate-limited)
- Todas las rutas `/api/*` fuera de login requieren token `Bearer`.
- `GET /api/dashboard`
- `GET|POST|PUT|DELETE /api/users`
- `GET|POST|PUT|DELETE /api/maestros`
- `GET|POST|PUT|DELETE /api/ninos`
- `GET|POST /api/asistencias`
- `GET|POST /api/asistencias-maestros`
- `GET /api/reportes/asistencia`
- `GET /api/reportes/avanzados`
- `GET|PUT /api/config/notificaciones`
- `GET|PUT /api/config/catalogos`
- `GET /api/notificaciones/app`
- `GET /api/cumpleanos/proximos`
- `POST /api/cumpleanos/sync-calendar`

## Estructura del Backend

```
backend/src/
  index.js          # Entry point + router
  config.js          # Environment config
  config/db.js       # PostgreSQL pool
  auth.js            # Password hashing, JWT tokens
  db.js              # Database queries + pagination
  http.js            # Request/response helpers
  permissions.js     # Role-based permissions
  catalogs.js        # System catalogs
  reminders.js       # Birthday reminders + Google Calendar
  seed.js            # Seed data
  middleware/        # CORS, rate limiting, logging, validation, pagination
  routes/            # Route handlers by resource
```
