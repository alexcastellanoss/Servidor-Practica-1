import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.issues.map(err => ({
                campo: err.path.join('.'),
                mensaje: err.message
            }));

            throw AppError.validation('Error de validación', errors);
        }
        next(error);
    }
};

export default validate;