import { AppError } from "../utils/AppError.js";

export const checkRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        throw AppError.forbidden('No tienes permisos para realizar esta acción', 403);
    }
    next();
};