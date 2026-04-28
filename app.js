const express = require('express');
const path = require('path');
const connectDB = require('./config');
const Usuario = require('./usuario');


//definicion de la app y el puerto
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    return res.status(405).json({
        message: 'Metodo no permitido. Usa POST /login con usuario y password.',
    });
});

app.post('/usuariosdg', async (req, res) => {
    const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim() : '';
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!usuario || !password) {
        return res.status(400).json({ message: 'usuario y password son requeridos' });
    }

    try {
        const nuevoUsuario = await Usuario.create({ usuario, nombre, email, password });
        const { password: _password, ...safeUser } = nuevoUsuario.toObject();
        return res.status(201).json({ message: 'Usuario creado', user: safeUser });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }
        return res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
});

//codigo para el login
app.post('/login', async (req, res) => {
    const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    const expectsJson = req.headers.accept?.includes('application/json');

    const respondError = (statusCode, message) => {
        if (expectsJson) {
            return res.status(statusCode).json({ message });
        }
        return res.redirect(`/?status=error&message=${encodeURIComponent(message)}`);
    };

    if (!usuario || !password) {
        return respondError(400, 'Usuario y contraseña son requeridos');
    }
    try {
        const user = await Usuario.findOne({ usuario }).lean();
        if (!user) {
            return respondError(401, 'Usuario no encontrado');
        }
        if (user.password !== password) {
            return respondError(401, 'Contraseña incorrecta');
        }
        const { password: _password, ...safeUser } = user;
        if (expectsJson) {
            return res.json({ message: 'Usuario encontrado', user: safeUser });
        }
        return res.redirect('/dashboard.html?usuario=' + encodeURIComponent(safeUser.usuario));
    } catch (error) {
        if (expectsJson) {
            return res.status(500).json({ message: 'Error al buscar el usuario', error: error.message });
        }
        return res.redirect('/?status=error&message=' + encodeURIComponent('Error interno del servidor'));
    }
});

//listar usuarios
app.get('/usuariosdg', async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, { _id: 0, __v: 0 });
        return res.json(usuarios);
    } catch (error) {
        return res.status(500).send('Error al obtener usuarios');
    }
});

//Buscar usuario por nombre
app.get('/usuariosdg/:usuario', async (req, res) => {
    const { usuario } = req.params || {};
    try {
        const usuarioEncontrado = await Usuario.findOne({ usuario }, { __v: 0 });
        if (!usuarioEncontrado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json(usuarioEncontrado);
    } catch (error) {
        return res.status(500).send('Error al buscar usuario');
    }
});

//Actualizar usuario
app.put('/usuariosdg/:usuario', async (req, res) => {
    const { usuario } = req.params || {};
    const hasNombre = Object.prototype.hasOwnProperty.call(req.body || {}, 'nombre');
    const hasEmail = Object.prototype.hasOwnProperty.call(req.body || {}, 'email');
    const hasPassword = Object.prototype.hasOwnProperty.call(req.body || {}, 'password');

    if (!hasNombre && !hasEmail && !hasPassword) {
        return res.status(400).json({ message: 'Debes enviar al menos un campo para actualizar' });
    }

    const updateData = {};

    if (hasNombre) {
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
        if (!nombre) {
            return res.status(400).json({ message: 'nombre no puede estar vacío' });
        }
        updateData.nombre = nombre;
    }

    if (hasEmail) {
        const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
        if (!email) {
            return res.status(400).json({ message: 'email no puede estar vacío' });
        }
        updateData.email = email;
    }

    if (hasPassword) {
        const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';
        if (!password) {
            return res.status(400).json({ message: 'password no puede estar vacío' });
        }
        updateData.password = password;
    }

    try {
        const usuarioActualizado = await Usuario.findOneAndUpdate(
            { usuario },
            updateData,
            { new: true, runValidators: true }
        );

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { password: _password, ...safeUser } = usuarioActualizado.toObject();
        return res.json({ message: 'Usuario actualizado', user: safeUser });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

//Eliminar usuario por nombre   
app.delete('/usuariosdg/:usuario', async (req, res) => {
    const { usuario } = req.params || {};
    try {
        const usuarioEliminado = await Usuario.findOneAndDelete({ usuario });
        if (!usuarioEliminado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const { password: _password, ...safeUser } = usuarioEliminado.toObject();
        return res.json({ message: 'Usuario eliminado', user: safeUser });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});
//iniciar el servidor
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Servidor en http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('No se pudo iniciar la app:', err?.message || err);
        process.exit(1);
    });