import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import notificationService from '../services/notification.service.js';

// Genera un access token (15min) y un refresh token (7 días) para el usuario
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    return { accessToken, refreshToken };
};

// Registra un nuevo usuario, genera tokens y emite el evento user:registered
export const registerUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({
                error: true,
                message: 'Ya existe un usuario con ese email'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            email,
            password: hashedPassword,
            verificationCode,
            verificationAttempts: 3
        });

        const { accessToken, refreshToken } = generateTokens(user);

        user.refreshToken = refreshToken;
        await user.save();

        notificationService.emit('user:registered', user);

        res.status(201).json({
            data: { email: user.email, status: user.status, role: user.role },
            accessToken,
            refreshToken
        });

    } catch (error) {
        next(error);
    }
};

// Verifica el email del usuario comprobando el código de 6 dígitos
export const verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+verificationCode +verificationAttempts');

        if (user.verificationAttempts <= 0) {
            return res.status(429).json({
                error: true,
                message: 'Has agotado los intentos de verificación'
            });
        }

        if (user.verificationCode !== req.body.code) {
            user.verificationAttempts -= 1;
            await user.save();
            return res.status(400).json({
                error: true,
                message: `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`
            });
        }

        user.status = 'verified';
        user.verificationCode = null;
        await user.save();

        notificationService.emit('user:verified', user);

        res.json({ message: 'Email verificado correctamente' });

    } catch (error) {
        next(error);
    }
};

// Inicia sesión y devuelve access token y refresh token
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales incorrectas'
            });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales incorrectas'
            });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            data: { email: user.email, status: user.status, role: user.role },
            accessToken,
            refreshToken
        });

    } catch (error) {
        next(error);
    }
};

// Actualiza los datos personales del usuario autenticado
export const updatePersonalData = async (req, res, next) => {
    try {
        const { name, lastName, nif } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, lastName, nif },
            { new: true }
        );

        res.json({ data: user });

    } catch (error) {
        next(error);
    }
};

// Asigna o crea una compañía al usuario autenticado según el CIF
export const updateCompany = async (req, res, next) => {
    try {
        const { name, cif, address, isFreelance } = req.body;
        const user = await User.findById(req.user.id);

        let company = await Company.findOne({ cif });

        if (company) {
            user.role = 'guest';
            user.company = company._id;
            await user.save();
        } else {
            if (isFreelance) {
                company = await Company.create({
                    owner: user._id,
                    name: user.name,
                    cif: user.nif,
                    address: user.address,
                    isFreelance: true
                });
            } else {
                company = await Company.create({
                    owner: user._id,
                    name,
                    cif,
                    address,
                    isFreelance: false
                });
            }
            user.company = company._id;
            await user.save();
        }

        res.json({ data: { user, company } });

    } catch (error) {
        next(error);
    }
};

// Sube el logo de la compañía del usuario autenticado
export const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: true,
                message: 'No se ha subido ninguna imagen'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user.company) {
            return res.status(400).json({
                error: true,
                message: 'El usuario no tiene una compañía asociada'
            });
        }

        const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const company = await Company.findByIdAndUpdate(
            user.company,
            { logo: logoUrl },
            { new: true }
        );

        res.json({ data: { logo: company.logo } });

    } catch (error) {
        next(error);
    }
};

// Devuelve los datos del usuario autenticado con su compañía populated
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('company');

        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'Usuario no encontrado'
            });
        }

        res.json({ data: user });

    } catch (error) {
        next(error);
    }
};

// Genera un nuevo access token a partir del refresh token
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: true,
                message: 'Refresh token no proporcionado'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                error: true,
                message: 'Refresh token inválido'
            });
        }

        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });

    } catch (error) {
        return res.status(401).json({
            error: true,
            message: 'Refresh token inválido o expirado'
        });
    }
};

// Cierra la sesión del usuario eliminando el refresh token de la base de datos
export const logoutUser = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

        res.json({ message: 'Sesión cerrada correctamente' });

    } catch (error) {
        next(error);
    }
};

// Elimina el usuario autenticado, soft o hard según el query param ?soft=true
export const deleteUser = async (req, res, next) => {
    try {
        const soft = req.query.soft !== 'false';

        if (soft) {
            await User.findByIdAndUpdate(req.user.id, { deleted: true });
            res.json({ message: 'Usuario desactivado correctamente' });
        } else {
            await User.findByIdAndDelete(req.user.id);
            res.json({ message: 'Usuario eliminado correctamente' });
        }

        notificationService.emit('user:deleted', { id: req.user.id });

    } catch (error) {
        next(error);
    }
};

// Cambia la contraseña del usuario autenticado verificando la actual
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({
                error: true,
                message: 'La contraseña actual es incorrecta'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        next(error);
    }
};

// Invita a un nuevo usuario a la compañía del usuario autenticado (solo admin)
export const inviteUser = async (req, res, next) => {
    try {
        const { email } = req.body;

        const inviter = await User.findById(req.user.id);

        if (!inviter.company) {
            return res.status(400).json({
                error: true,
                message: 'Debes tener una compañía para invitar usuarios'
            });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({
                error: true,
                message: 'Ya existe un usuario con ese email'
            });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await User.create({
            email,
            password: hashedPassword,
            verificationCode,
            verificationAttempts: 3,
            company: inviter.company,
            role: 'guest'
        });

        notificationService.emit('user:invited', newUser);

        res.status(201).json({ data: { email: newUser.email, role: newUser.role } });

    } catch (error) {
        next(error);
    }
};