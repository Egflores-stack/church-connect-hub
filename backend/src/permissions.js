const defaultPermissions = {
  admin: {
    accessLevel: "total",
    permissions: [
      "dashboard.view",
      "attendance.manage",
      "maestros.manage",
      "ninos.manage",
      "reports.view",
      "reports.export",
      "settings.manage",
      "users.manage",
    ],
  },
  supervisor: {
    accessLevel: "supervision",
    permissions: [
      "dashboard.view",
      "attendance.manage",
      "maestros.manage",
      "ninos.manage",
      "reports.view",
      "settings.manage",
    ],
  },
  digitador: {
    accessLevel: "operacion",
    permissions: [
      "dashboard.view",
      "attendance.manage",
      "ninos.manage",
      "reports.view",
    ],
  },
};

function getPermissionsForRole(role) {
  return defaultPermissions[role] || {
    accessLevel: "basico",
    permissions: ["dashboard.view"],
  };
}

function buildRolePermissions(roles = []) {
  return roles.map((role) => ({
    role,
    ...getPermissionsForRole(role),
  }));
}

module.exports = {
  getPermissionsForRole,
  buildRolePermissions,
};
