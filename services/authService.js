const Usuario = require('../usuario');
const { sanitizeUser } = require('./userSanitizer');

// authService concentra reglas de autenticacion para no duplicarlas en las rutas.
const validateLoginPayload = (payload) => {
  // Valida y normaliza datos de entrada para login.
  const usuario = typeof payload?.usuario === 'string' ? payload.usuario.trim() : '';//Se verifica que exista payload y que sea de tipo string y se limpia el espacio en blanco.
  const password = typeof payload?.password === 'string' ? payload.password.trim() : '';//Se verifica que exista payload y que sea de tipo string y se limpia el espacio en blanco. 

  if (!usuario || !password) {
    return { isValid: false, message: 'Usuario y contraseña son requeridos' };//Si no existe usuario o password, se retorna un objeto con isValid en false y un mensaje de error.
  }

  return {
    isValid: true,
    credentials: { usuario, password },//Se retorna un objeto con isValid en true y las credenciales del usuario.
  };
};
// login es la funcion que se encarga de autenticar al usuario.
const login = async ({ usuario, password }) => {  //Se recibe el usuario y la contraseña.
  // Ejecuta la regla de negocio de autenticacion.
  const user = await Usuario.findOne({ usuario }).lean();//Se busca el usuario en la base de datos.
  if (!user) {
    return { ok: false, statusCode: 401, message: 'Usuario no encontrado' };//Si no existe el usuario, se retorna un objeto con ok en false y un mensaje de error. 401 es el codigo de error para no autorizado.
  }

  if (user.password !== password) {// validacion contraseña
    return { ok: false, statusCode: 401, message: 'Contraseña incorrecta' };
  }

  return {
    ok: true,
    statusCode: 200,
    message: 'Usuario encontrado', //mensaje
    user: sanitizeUser(user),//Usuario limpoio sin password
  };
};

module.exports = {
  validateLoginPayload,
  login,
};
