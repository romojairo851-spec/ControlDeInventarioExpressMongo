const express = require('express');
const cors = require("cors");
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

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz (solo para verificar que la API funciona)
app.get('/', (req, res) => {
    res.json({ 
        message: "API funcionando correctamente",
        endpoints: {
            login: "POST /login",
            usuarios: "GET /usuariosdg",
            crearUsuario: "POST /usuariosdg",
            buscarUsuario: "GET /usuariosdg/:usuario",
            actualizarUsuario: "PUT /usuariosdg/:usuario",
            eliminarUsuario: "DELETE /usuariosdg/:usuario"
        }
    });
});

// ============= ENDPOINT DE LOGIN (SOLO JSON) =============
app.post('/login', async (req, res) => {
    try {
        // Validar payload
        const loginPayload = validateLoginPayload(req.body);
        if (!loginPayload.isValid) {
            return res.status(400).json({ 
                success: false,
                message: loginPayload.message 
            });
        }

        // Autenticar usuario
        const authResult = await login(loginPayload.credentials);
        if (!authResult.ok) {
            return res.status(authResult.statusCode).json({ 
                success: false,
                message: authResult.message 
            });
        }

        // Login exitoso - devolver solo JSON (sin redirect)
        return res.status(200).json({ 
            success: true,
            message: 'Login exitoso',
            user: authResult.user
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

// ============= ENDPOINTS CRUD USUARIOS =============

// Crear usuario
app.post('/usuariosdg', async (req, res) => {
    const payloadResult = getCreatePayload(req.body);
    if (!payloadResult.isValid) {
        return res.status(400).json({ success: false, message: payloadResult.message });
    }

    try {
        const safeUser = await createUser(payloadResult.data);
        return res.status(201).json({ success: true, message: 'Usuario creado', user: safeUser });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'El usuario ya existe' });
        }
        return res.status(500).json({ success: false, message: 'Error al crear usuario', error: error.message });
    }
});

// Listar todos los usuarios
app.get('/usuariosdg', async (req, res) => {
    try {
        const usuarios = await listUsers();
        return res.json({ success: true, data: usuarios });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

// Buscar usuario por nombre
app.get('/usuariosdg/:usuario', async (req, res) => {
    const { usuario } = req.params;
    try {
        const usuarioEncontrado = await findUserByUsername(usuario);
        if (!usuarioEncontrado) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        return res.json({ success: true, data: usuarioEncontrado });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al buscar usuario' });
    }
});

// Actualizar usuario
app.put('/usuariosdg/:usuario', async (req, res) => {
    const usuario = req.params.usuario?.trim() || '';
    const payloadResult = getUpdatePayload(req.body);
    if (!payloadResult.isValid) {
        return res.status(400).json({ success: false, message: payloadResult.message });
    }

    try {
        const usuarioActualizado = await updateUserByUsername(usuario, payloadResult.data);
        if (!usuarioActualizado) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        return res.json({ success: true, message: 'Usuario actualizado', user: usuarioActualizado });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, message: 'El nombre de usuario ya existe' });
        }
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});

// Eliminar usuario
app.delete('/usuariosdg/:usuario', async (req, res) => {
    const { usuario } = req.params;
    try {
        const usuarioEliminado = await deleteUserByUsername(usuario);
        if (!usuarioEliminado) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        return res.json({ success: true, message: 'Usuario eliminado', user: usuarioEliminado });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
    }
});

// Iniciar servidor
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`✅ Servidor API corriendo en http://localhost:${port}`);
            console.log(`📋 Endpoints disponibles:`);
            console.log(`   POST   /login`);
            console.log(`   GET    /usuariosdg`);
            console.log(`   POST   /usuariosdg`);
            console.log(`   GET    /usuariosdg/:usuario`);
            console.log(`   PUT    /usuariosdg/:usuario`);
            console.log(`   DELETE /usuariosdg/:usuario`);
        });
    })
    .catch((err) => {
        console.error('❌ No se pudo iniciar la app:', err?.message || err);
        process.exit(1);
    });