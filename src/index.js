import { httpServer, io } from './app.js';
import dbConnect from './config/index.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await dbConnect();
        httpServer.listen(PORT, () => {
            console.log(`🚀 Servidor en http://localhost:${PORT}`);
            console.log(`📚 API en http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket en ws://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar:', error);
        process.exit(1);
    }
};

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    httpServer.close(async () => {
        console.log('HTTP server closed');

        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');

            io.close(() => {
                console.log('Socket.IO closed');
                process.exit(0);
            });

        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();