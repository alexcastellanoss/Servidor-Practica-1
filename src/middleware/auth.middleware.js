import jwt from 'jsonwebtoken';
import { AppError } from "../utils/AppError.js";

export const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw AppError.unauthorized('Token no proporcionado');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        throw AppError.unauthorized('Token inválido o expirado');
    }
};