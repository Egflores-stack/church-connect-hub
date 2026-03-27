# Backend

API base de Church Connect Hub usando PostgreSQL y `pg`.

## Instalacion

```bash
npm install
npm run dev
```

## Variables de entorno

Usa `DATABASE_URL` para apuntar a tu base de datos:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/church_connect_hub
PORT=4000
HOST=0.0.0.0
```

## Base de datos

- El esquema vive en `backend/sql/schema.sql`
- Al iniciar, el backend ejecuta ese esquema automaticamente
- Si las tablas estan vacias, inserta datos semilla para pruebas

## Credenciales semilla

- `admin@iglesia.com` / `admin123`
- `supervisora@iglesia.com` / `super123`

## Endpoints

- `GET /`
- `GET /health`
- `GET /api/users`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/maestros`
- `POST /api/maestros`
- `GET /api/maestros/:id`
- `PUT /api/maestros/:id`
- `DELETE /api/maestros/:id`
- `GET /api/ninos`
- `POST /api/ninos`
- `GET /api/ninos/:id`
- `PUT /api/ninos/:id`
- `DELETE /api/ninos/:id`
- `GET /api/asistencias`
- `POST /api/asistencias`
- `GET /api/reportes/asistencia?month=2026-03`
