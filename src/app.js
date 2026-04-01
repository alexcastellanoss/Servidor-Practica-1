import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { sanitizeBody } from './middleware/sanitize.middleware.js';

const app = express();

app.use(express.json());

app.use(helmet());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}));

app.use('/uploads', express.static('uploads'));

app.use('/api', routes);

app.use(errorHandler);

app.use(sanitizeBody);

export default app;