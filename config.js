const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventariodg';

    try {
        await mongoose.connect(mongoURI);
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.log('Error al conectar a la base de datos', error.message || 'Error desconocido');
        process.exit(1);
    }
};

module.exports = connectDB;