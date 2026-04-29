const Usuario = require('../usuario');
const { sanitizeUser } = require('./userSanitizer');

// usuarioService centraliza validaciones y operaciones CRUD de usuarios.
const getCreatePayload = (payload) => {
  // Normaliza y valida datos minimos para crear usuarios.
  const usuario = typeof payload?.usuario === 'string' ? payload.usuario.trim() : '';
  const nombre = typeof payload?.nombre === 'string' ? payload.nombre.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password.trim() : '';

  if (!usuario || !password) {
    return { isValid: false, message: 'usuario y password son requeridos' };
  }

  return {
    isValid: true,
    data: { usuario, nombre, email, password },
  };
};

const createUser = async (data) => {
  const user = await Usuario.create(data);
  return sanitizeUser(user);
};

const listUsers = async () => Usuario.find({}, { _id: 0, __v: 0 });

const findUserByUsername = async (usuario) => Usuario.findOne({ usuario }, { __v: 0 });

const getUpdatePayload = (payload) => {
  // Valida que exista al menos un campo actualizable y evita valores vacios.
  const hasUsuario = Object.prototype.hasOwnProperty.call(payload || {}, 'usuario');
  const hasNombre = Object.prototype.hasOwnProperty.call(payload || {}, 'nombre');
  const hasEmail = Object.prototype.hasOwnProperty.call(payload || {}, 'email');
  const hasPassword = Object.prototype.hasOwnProperty.call(payload || {}, 'password');

  if (!hasUsuario && !hasNombre && !hasEmail && !hasPassword) {
    return { isValid: false, message: 'Debes enviar al menos un campo para actualizar' };
  }

  const updateData = {};

  if (hasUsuario) {
    const usuario = typeof payload.usuario === 'string' ? payload.usuario.trim() : '';
    if (!usuario) return { isValid: false, message: 'usuario no puede estar vacío' };
    updateData.usuario = usuario;
  }

  if (hasNombre) {
    const nombre = typeof payload.nombre === 'string' ? payload.nombre.trim() : '';
    if (!nombre) return { isValid: false, message: 'nombre no puede estar vacío' };
    updateData.nombre = nombre;
  }

  if (hasEmail) {
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!email) return { isValid: false, message: 'email no puede estar vacío' };
    updateData.email = email;
  }

  if (hasPassword) {
    const password = typeof payload.password === 'string' ? payload.password.trim() : '';
    if (!password) return { isValid: false, message: 'password no puede estar vacío' };
    updateData.password = password;
  }

  return { isValid: true, data: updateData };
};

const updateUserByUsername = async (usuario, updateData) => {
  const user = await Usuario.findOneAndUpdate({ usuario }, updateData, { new: true, runValidators: true });
  return sanitizeUser(user);
};

const deleteUserByUsername = async (usuario) => {
  const user = await Usuario.findOneAndDelete({ usuario });
  return sanitizeUser(user);
};

module.exports = {
  getCreatePayload,
  createUser,
  listUsers,
  findUserByUsername,
  getUpdatePayload,
  updateUserByUsername,
  deleteUserByUsername,
};
