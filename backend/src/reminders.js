const { google } = require("googleapis");
const { query } = require("./db");

const DAILY_REFRESH_HOUR = 6;

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function nextBirthdayDate(fechaCumpleanos) {
  const source = new Date(`${fechaCumpleanos}T00:00:00`);
  const today = new Date();
  const next = new Date(today.getFullYear(), source.getMonth(), source.getDate());

  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next.setFullYear(today.getFullYear() + 1);
  }

  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function daysUntil(date) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((end - start) / 86400000);
}

async function getNotificationSettings() {
  const result = await query("SELECT * FROM notification_settings WHERE id = 1");
  const row = result.rows[0];

  return {
    appEnabled: row.app_enabled,
    googleCalendarEnabled: row.google_calendar_enabled,
    daysBefore: row.days_before,
    googleCalendarId: row.google_calendar_id || "",
    googleServiceAccountJson: row.google_service_account_json || "",
  };
}

async function updateNotificationSettings(payload) {
  await query(
    `UPDATE notification_settings
     SET
       app_enabled = $1,
       google_calendar_enabled = $2,
       days_before = $3,
       google_calendar_id = $4,
       google_service_account_json = $5,
       updated_at = NOW()
     WHERE id = 1`,
    [
      Boolean(payload.appEnabled),
      Boolean(payload.googleCalendarEnabled),
      Number(payload.daysBefore || 7),
      payload.googleCalendarId || null,
      payload.googleServiceAccountJson || null,
    ],
  );

  await recalculateAppBirthdayNotifications();
  return getNotificationSettings();
}

async function getBirthdayPeople() {
  const [users, maestros] = await Promise.all([
    query(
      `SELECT id, nombre, email, fecha_cumpleanos
       FROM users
       WHERE estado = 'activo' AND fecha_cumpleanos IS NOT NULL`,
    ),
    query(
      `SELECT id, nombre, email, fecha_cumpleanos, grupo
       FROM maestros
       WHERE estado = 'activo' AND fecha_cumpleanos IS NOT NULL`,
    ),
  ]);

  return [
    ...users.rows.map((row) => ({
      entityType: "staff",
      entityId: row.id,
      nombre: row.nombre,
      email: row.email,
      fechaCumpleanos: row.fecha_cumpleanos,
      grupo: null,
    })),
    ...maestros.rows.map((row) => ({
      entityType: "maestro",
      entityId: row.id,
      nombre: row.nombre,
      email: row.email,
      fechaCumpleanos: row.fecha_cumpleanos,
      grupo: row.grupo,
    })),
  ];
}

async function listUpcomingBirthdays(daysAhead = 30) {
  const people = await getBirthdayPeople();
  const maxDate = addDays(new Date(), Number(daysAhead));

  return people
    .map((person) => {
      const next = nextBirthdayDate(person.fechaCumpleanos);
      return {
        ...person,
        nextBirthday: formatDate(next),
        daysUntil: daysUntil(next),
      };
    })
    .filter((person) => new Date(`${person.nextBirthday}T00:00:00`) <= maxDate)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.nombre.localeCompare(b.nombre));
}

function buildNotificationTitle(person) {
  return person.daysUntil === 0 ? `Hoy cumple ${person.nombre}` : `Cumpleanos proximo: ${person.nombre}`;
}

function buildNotificationMessage(person) {
  const roleLabel = person.entityType === "maestro" ? "maestro" : "staff";

  if (person.daysUntil === 0) {
    return person.grupo
      ? `${person.nombre} (${roleLabel} del aula ${person.grupo}) esta de cumpleanos hoy.`
      : `${person.nombre} (${roleLabel}) esta de cumpleanos hoy.`;
  }

  const dayLabel = person.daysUntil === 1 ? "manana" : `en ${person.daysUntil} dias`;
  return person.grupo
    ? `${person.nombre} (${roleLabel} del aula ${person.grupo}) cumple ${dayLabel}.`
    : `${person.nombre} (${roleLabel}) cumple ${dayLabel}.`;
}

async function recalculateAppBirthdayNotifications() {
  const settings = await getNotificationSettings();

  if (!settings.appEnabled) {
    await query("DELETE FROM app_notifications WHERE type = 'birthday'");
    return { created: 0, cleared: true };
  }

  const birthdays = await listUpcomingBirthdays(settings.daysBefore);

  await query("DELETE FROM app_notifications WHERE type = 'birthday'");

  for (const person of birthdays) {
    await query(
      `INSERT INTO app_notifications (
         type,
         entity_type,
         entity_id,
         title,
         message,
         trigger_date,
         birthday_date,
         days_until,
         metadata,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8::jsonb, NOW())`,
      [
        "birthday",
        person.entityType,
        person.entityId,
        buildNotificationTitle(person),
        buildNotificationMessage(person),
        person.nextBirthday,
        person.daysUntil,
        JSON.stringify({
          nombre: person.nombre,
          grupo: person.grupo,
          email: person.email,
          nextBirthday: person.nextBirthday,
        }),
      ],
    );
  }

  return { created: birthdays.length, cleared: false };
}

async function listAppNotifications(limit = 6) {
  const result = await query(
    `SELECT
       id,
       type,
       entity_type,
       entity_id,
       title,
       message,
       trigger_date,
       birthday_date,
       days_until,
       metadata,
       created_at,
       updated_at
     FROM app_notifications
     WHERE birthday_date >= CURRENT_DATE
     ORDER BY days_until ASC, birthday_date ASC, created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    message: row.message,
    triggerDate: row.trigger_date,
    birthdayDate: row.birthday_date,
    daysUntil: row.days_until,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function getGoogleAuth(settings) {
  if (!settings.googleServiceAccountJson || !settings.googleCalendarId) {
    throw new Error("Falta configuracion de Google Calendar.");
  }

  const credentials = JSON.parse(settings.googleServiceAccountJson);
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

async function syncBirthdayCalendarEvents() {
  const settings = await getNotificationSettings();

  if (!settings.googleCalendarEnabled) {
    throw new Error("Google Calendar esta deshabilitado en configuracion.");
  }

  const auth = getGoogleAuth(settings);
  const calendar = google.calendar({ version: "v3", auth });
  const birthdays = await getBirthdayPeople();
  const currentYear = new Date().getFullYear();
  let synced = 0;

  for (const birthday of birthdays) {
    const monthDay = birthday.fechaCumpleanos.slice(5, 10);
    const startDate = `${currentYear}-${monthDay}`;
    const end = new Date(`${startDate}T00:00:00`);
    end.setDate(end.getDate() + 1);
    const endDate = formatDate(end);

    const titlePrefix = birthday.entityType === "maestro" ? "Cumpleanos Maestro" : "Cumpleanos Staff";
    const eventBody = {
      summary: `${titlePrefix}: ${birthday.nombre}`,
      description: birthday.grupo ? `Aula: ${birthday.grupo}` : "Staff de iglesia",
      start: { date: startDate },
      end: { date: endDate },
      recurrence: ["RRULE:FREQ=YEARLY"],
    };

    const existing = await query(
      `SELECT calendar_event_id
       FROM calendar_birthday_events
       WHERE entity_type = $1 AND entity_id = $2`,
      [birthday.entityType, birthday.entityId],
    );

    if (existing.rows[0]?.calendar_event_id) {
      await calendar.events.update({
        calendarId: settings.googleCalendarId,
        eventId: existing.rows[0].calendar_event_id,
        requestBody: eventBody,
      });
    } else {
      const created = await calendar.events.insert({
        calendarId: settings.googleCalendarId,
        requestBody: eventBody,
      });

      await query(
        `INSERT INTO calendar_birthday_events (entity_type, entity_id, calendar_event_id, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (entity_type, entity_id)
         DO UPDATE SET calendar_event_id = EXCLUDED.calendar_event_id, updated_at = NOW()`,
        [birthday.entityType, birthday.entityId, created.data.id],
      );
    }

    synced += 1;
  }

  return { synced };
}

function getDelayUntilNextRun(now = new Date()) {
  const next = new Date(now);
  next.setHours(DAILY_REFRESH_HOUR, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

function scheduleDailyBirthdayReminderRefresh() {
  let timeoutId = null;

  const runAndSchedule = async () => {
    try {
      const result = await recalculateAppBirthdayNotifications();
      console.log(`[reminders] Recordatorios recalculados: ${result.created}`);
    } catch (error) {
      console.error("[reminders] No se pudieron recalcular los recordatorios:", error.message);
    } finally {
      const delay = getDelayUntilNextRun();
      timeoutId = setTimeout(runAndSchedule, delay);
    }
  };

  runAndSchedule();

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  listUpcomingBirthdays,
  recalculateAppBirthdayNotifications,
  listAppNotifications,
  syncBirthdayCalendarEvents,
  scheduleDailyBirthdayReminderRefresh,
};
