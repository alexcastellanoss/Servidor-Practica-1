import express from 'express';
import { createServer } from 'node:http';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { sanitizeBody } from './middleware/sanitize.middleware.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';
import { setupSocket } from './socket/index.js';
import swaggerSpecs from './docs/swagger.js';

const app = express();
const httpServer = createServer(app);
const io = setupSocket(httpServer);

app.set('io', io);

app.use(express.json());

morganBody(app, {
    noColors: true,
    skip: (req, res) => res.statusCode < 500,
    stream: loggerStream
});

app.use(helmet());

if (process.env.NODE_ENV !== 'test') {
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
    }));
}

app.use('/uploads', express.static('uploads'));

app.use(sanitizeBody);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        status: 'OK',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development'
    };

    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState === 1) {
            healthcheck.status = 'OK';
        } else {
            healthcheck.status = 'DEGRADED';
        }

        res.status(healthcheck.status === 'OK' ? 200 : 503).json(healthcheck);
    } catch (error) {
        healthcheck.status = 'ERROR';
        healthcheck.error = error.message;
        res.status(503).json(healthcheck);
    }
});

app.use('/api', routes);

app.use(errorHandler);

export { app, httpServer, io };