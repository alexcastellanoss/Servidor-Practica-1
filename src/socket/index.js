import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function setupSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token
            || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Token no proporcionado'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WS] Usuario conectado: ${socket.user.id}`);

        socket.join(`company_${socket.user.companyId}`);

        socket.on('disconnect', () => {
            console.log(`[WS] Usuario desconectado: ${socket.user.id}`);
        });
    });

    return io;
}