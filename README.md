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

Variables esperadas por el backend:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `AUTH_SECRET`
- `HOST`
- `PORT`

Endpoints principales:

- `GET /health`
- `POST /api/auth/login`
- Todas las rutas `/api/*` fuera de login requieren token `Bearer`.
- `GET /api/dashboard`
- `GET|POST|PUT|DELETE /api/users`
- `GET|POST|PUT|DELETE /api/maestros`
- `GET|POST|PUT|DELETE /api/ninos`
- `GET|POST /api/asistencias`
- `GET|POST /api/asistencias-maestros`
- `GET /api/reportes/asistencia`
- `GET /api/reportes/avanzados`
