CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  fecha_cumpleanos DATE,
  role VARCHAR(30) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS fecha_cumpleanos DATE;

CREATE TABLE IF NOT EXISTS maestros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150) UNIQUE,
  fecha_cumpleanos DATE,
  grupo VARCHAR(20),
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manana', 'tarde')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE maestros
ADD COLUMN IF NOT EXISTS grupo VARCHAR(20);

CREATE TABLE IF NOT EXISTS ninos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  grupo VARCHAR(20) NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manana', 'tarde')),
  responsable VARCHAR(150),
  telefono_responsable VARCHAR(30),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manana', 'tarde')),
  nino_id INTEGER NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  maestro_id INTEGER REFERENCES maestros(id) ON DELETE SET NULL,
  presente BOOLEAN NOT NULL DEFAULT FALSE,
  maestro_presente BOOLEAN NOT NULL DEFAULT FALSE,
  registrado_por VARCHAR(150) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT asistencias_unicas UNIQUE (fecha, turno, nino_id)
);

CREATE TABLE IF NOT EXISTS asistencias_maestros (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  turno VARCHAR(20) NOT NULL CHECK (turno IN ('manana', 'tarde')),
  maestro_id INTEGER NOT NULL REFERENCES maestros(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT FALSE,
  registrado_por VARCHAR(150) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT asistencias_maestros_unicas UNIQUE (fecha, turno, maestro_id)
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY,
  app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  wasender_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  days_before INTEGER NOT NULL DEFAULT 7,
  recipients_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  wasender_base_url TEXT NOT NULL DEFAULT 'https://www.wasenderapi.com',
  wasender_api_key TEXT,
  google_calendar_id TEXT,
  google_service_account_json TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birthday_reminder_logs (
  id SERIAL PRIMARY KEY,
  reminder_date DATE NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  channel VARCHAR(30) NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT birthday_reminder_unique UNIQUE (reminder_date, entity_type, entity_id, channel, target)
);

CREATE TABLE IF NOT EXISTS calendar_birthday_events (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  calendar_event_id TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT calendar_birthday_unique UNIQUE (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS app_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(30) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_date DATE NOT NULL,
  birthday_date DATE NOT NULL,
  days_until INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT app_notifications_unique UNIQUE (type, entity_type, entity_id, trigger_date)
);

CREATE TABLE IF NOT EXISTS system_catalogs (
  id INTEGER PRIMARY KEY,
  aulas JSONB NOT NULL DEFAULT '["4-6","7-9","10-12"]'::jsonb,
  turnos JSONB NOT NULL DEFAULT '["manana","tarde"]'::jsonb,
  roles JSONB NOT NULL DEFAULT '["admin","supervisor","digitador"]'::jsonb,
  edades JSONB NOT NULL DEFAULT '[{"label":"4-6 anos","min":4,"max":6},{"label":"7-9 anos","min":7,"max":9},{"label":"10-12 anos","min":10,"max":12}]'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO notification_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_catalogs (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
