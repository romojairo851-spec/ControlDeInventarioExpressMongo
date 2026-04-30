const express = require('express');
const cors = require("cors");
const path = require('path');
const connectDB = require('./config');
const {
    getCreatePayload,
    createUser,
    listUsers,
    findUserByUsername,
    getUpdatePayload,
    updateUserByUsername,
    deleteUserByUsername,
} = require('./services/usuarioService');
const { validateLoginPayload, login } = require('./services/authService');

// app.js mantiene las rutas HTTP (controladores) y delega la logica de negocio a /services.

//definicion de la app y el puerto
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const port = process.env.PORT || 3000;

// Middleware para recibir JSON, formularios y archivos estaticos (html, css, js, img).
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname)));

/*app.get('/', (req, res) => {
    // Entrega la vista principal del login.
    res.sendFile(path.join(__dirname, 'index.html'));
});*/

app.get('/', (req, res) => {
    res.send("API funcionando correctamente");
});

app.get('/login', (req, res) => {
    // Se bloquea GET /login para forzar el uso de POST /login.
    return res.status(405).json({
        message: 'Metodo no permitido. Usa POST /login con usuario y password.',
    });
});

app.post('/usuariosdg', async (req, res) => {
    // Endpoint CRUD: crea usuario. La validacion y persistencia viven en usuarioService.
    const payloadResult = getCreatePayload(req.body);
    if (!payloadResult.isValid) {
        return res.status(400).json({ message: payloadResult.message });
    }

    try {
        const safeUser = await createUser(payloadResult.data);
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
    // Endpoint de autenticacion: solo maneja request/response, el flujo de login vive en authService.
    const expectsJson = req.headers.accept?.includes('application/json');

    const respondError = (statusCode, message) => {
        // Respuesta dual: JSON para clientes API y redirect para navegadores.
        if (expectsJson) {
            return res.status(statusCode).json({ message });
        }
        return res.redirect(`/?status=error&message=${encodeURIComponent(message)}`);
    };

    const loginPayload = validateLoginPayload(req.body);
    if (!loginPayload.isValid) {
        return respondError(400, loginPayload.message);
    }

    try {
        const authResult = await login(loginPayload.credentials);
        if (!authResult.ok) {
            return respondError(authResult.statusCode, authResult.message);
        }

        const safeUser = authResult.user;
        if (expectsJson) {
            return res.json({ message: 'Usuario encontrado', user: safeUser });
        }
        // Flujo web: si login es correcto, redirige al dashboard.
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
    // Endpoint CRUD: listar usuarios.
    try {
        const usuarios = await listUsers();
        return res.json(usuarios);
    } catch (error) {
        return res.status(500).send('Error al obtener usuarios');
    }
});

//Buscar usuario por nombre 
app.get('/usuariosdg/:usuario', async (req, res) => {
    // Endpoint CRUD: buscar usuario por nombre.
    const { usuario } = req.params || {};
    try {
        const usuarioEncontrado = await findUserByUsername(usuario);
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
    // Endpoint CRUD: actualizar usuario por nombre.
    const usuario = typeof req.params?.usuario === 'string' ? req.params.usuario.trim() : '';
    const payloadResult = getUpdatePayload(req.body);
    if (!payloadResult.isValid) {
        return res.status(400).json({ message: payloadResult.message });
    }

    try {
        const usuarioActualizado = await updateUserByUsername(usuario, payloadResult.data);

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.json({ message: 'Usuario actualizado', user: usuarioActualizado });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }
        return res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

//Eliminar usuario por nombre   
app.delete('/usuariosdg/:usuario', async (req, res) => {
    // Endpoint CRUD: eliminar usuario por nombre.
    const { usuario } = req.params || {};
    try {
        const usuarioEliminado = await deleteUserByUsername(usuario);
        if (!usuarioEliminado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json({ message: 'Usuario eliminado', user: usuarioEliminado });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});
//iniciar el servidor
connectDB()
    .then(() => {
        // Solo se levanta el servidor si la conexion a MongoDB fue exitosa.
        app.listen(port, () => {
            console.log(`Servidor en http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('No se pudo iniciar la app:', err?.message || err);
        process.exit(1);
    });