export const checkRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            error: true,
            message: 'No tienes permisos para realizar esta acción'
        });
    }
    next();
};