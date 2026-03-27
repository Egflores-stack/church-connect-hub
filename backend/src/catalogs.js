const { query } = require("./db");

const defaultCatalogs = {
  aulas: ["4-6", "7-9", "10-12"],
  turnos: ["manana", "tarde"],
  roles: ["admin", "supervisor", "digitador"],
  edades: [
    { label: "4-6 anos", min: 4, max: 6 },
    { label: "7-9 anos", min: 7, max: 9 },
    { label: "10-12 anos", min: 10, max: 12 },
  ],
};

function uniqueNonEmptyStrings(values, fallback) {
  const cleaned = Array.isArray(values)
    ? values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    : [];

  return cleaned.length > 0 ? [...new Set(cleaned)] : fallback;
}

function normalizeAgeRanges(values) {
  const cleaned = Array.isArray(values)
    ? values
        .map((value) => ({
          label: String(value?.label || "").trim(),
          min: Number(value?.min),
          max: Number(value?.max),
        }))
        .filter((value) => value.label && Number.isFinite(value.min) && Number.isFinite(value.max) && value.min <= value.max)
    : [];

  return cleaned.length > 0 ? cleaned : defaultCatalogs.edades;
}

function mapCatalogsRow(row) {
  return {
    aulas: row.aulas || defaultCatalogs.aulas,
    turnos: row.turnos || defaultCatalogs.turnos,
    roles: row.roles || defaultCatalogs.roles,
    edades: row.edades || defaultCatalogs.edades,
  };
}

async function getCatalogSettings() {
  const result = await query("SELECT aulas, turnos, roles, edades FROM system_catalogs WHERE id = 1");
  return mapCatalogsRow(result.rows[0] || defaultCatalogs);
}

async function updateCatalogSettings(payload) {
  const normalized = {
    aulas: uniqueNonEmptyStrings(payload.aulas, defaultCatalogs.aulas),
    turnos: uniqueNonEmptyStrings(payload.turnos, defaultCatalogs.turnos),
    roles: uniqueNonEmptyStrings(payload.roles, defaultCatalogs.roles),
    edades: normalizeAgeRanges(payload.edades),
  };

  await query(
    `UPDATE system_catalogs
     SET aulas = $1::jsonb,
         turnos = $2::jsonb,
         roles = $3::jsonb,
         edades = $4::jsonb,
         updated_at = NOW()
     WHERE id = 1`,
    [
      JSON.stringify(normalized.aulas),
      JSON.stringify(normalized.turnos),
      JSON.stringify(normalized.roles),
      JSON.stringify(normalized.edades),
    ],
  );

  return getCatalogSettings();
}

module.exports = {
  defaultCatalogs,
  getCatalogSettings,
  updateCatalogSettings,
};
