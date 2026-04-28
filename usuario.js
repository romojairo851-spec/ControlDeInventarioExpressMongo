const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, unique: true },
    nombre: String,
    email: String,
    password: { type: String, required: true },
  },
  { collection: 'usuariosdg' }
);

module.exports = mongoose.model('usuario', UsuarioSchema);