import mongoose from 'mongoose';

export const validateBody = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        const errors = error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        res.status(400).json({
            error: true,
            message: 'Error de validación',
            details: errors
        });
    }
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: true,
            message: `'${paramName}' no es un ID válido`
        });
    }

    next();
};