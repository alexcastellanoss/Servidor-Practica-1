import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { sanitizeBody } from './middleware/sanitize.middleware.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';

const app = express();

app.use(express.json());

// Después de express.json(), antes de las rutas
morganBody(app, {
    noColors: true,
    skip: (req, res) => res.statusCode < 400, // Solo errores
    stream: loggerStream
});

app.use(helmet());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}));

app.use('/uploads', express.static('uploads'));

app.use(sanitizeBody);

app.use('/api', routes);

app.use(errorHandler);

export default app;