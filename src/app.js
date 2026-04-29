import express from 'express';
import { createServer } from 'node:http';
import helmet from 'helmet';
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
    skip: (req, res) => res.statusCode < 400,
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use('/api', routes);

app.use(errorHandler);

export { app, httpServer, io };