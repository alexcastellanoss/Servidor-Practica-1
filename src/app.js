import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

const app = express();

// Seguridad
// Añade cabeceras de seguridad HTTP
app.use(helmet());

// Limita a 100 peticiones por IP cada 15 minutos
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}));

// Middleware globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Rutas
app.use('/api', routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

export default app;