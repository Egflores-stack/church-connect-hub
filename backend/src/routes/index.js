module.exports = {
  handleLogin: require("./auth").handleLogin,
  // Users
  handleGetUsers: require("./users").handleGetUsers,
  handleGetUser: require("./users").handleGetUser,
  handleCreateUser: require("./users").handleCreateUser,
  handleUpdateUser: require("./users").handleUpdateUser,
  handleDeleteUser: require("./users").handleDeleteUser,
  // Maestros
  handleListMaestros: require("./maestros").handleList,
  handleGetMaestro: require("./maestros").handleGet,
  handleCreateMaestro: require("./maestros").handleCreate,
  handleUpdateMaestro: require("./maestros").handleUpdate,
  handleDeleteMaestro: require("./maestros").handleDelete,
  // Ninos
  handleListNinos: require("./ninos").handleList,
  handleGetNino: require("./ninos").handleGet,
  handleCreateNino: require("./ninos").handleCreate,
  handleUpdateNino: require("./ninos").handleUpdate,
  handleDeleteNino: require("./ninos").handleDelete,
  // Asistencia
  handleListAttendances: require("./asistencia").handleListAttendances,
  handleSaveAttendance: require("./asistencia").handleSaveAttendance,
  handleListTeacherAttendances: require("./asistencia").handleListTeacherAttendances,
  handleSaveTeacherAttendance: require("./asistencia").handleSaveTeacherAttendance,
};
