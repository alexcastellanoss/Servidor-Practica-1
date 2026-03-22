import express from 'express';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

const app = express();

// ============================================
// Middleware globales
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static('storage'));

// ============================================
// Rutas
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api', routes);

// ============================================
// Manejo de errores
// ============================================

app.use(notFound);
app.use(errorHandler);

export default app;