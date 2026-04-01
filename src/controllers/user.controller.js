import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import notificationService from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';
import { request } from 'http';

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

export const registerUser = async (req, res) => {

    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
        throw AppError.conflict('Ya existe un usuario con ese email');
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
        verificationCode,
        accessToken,
        refreshToken
    });
};

export const verifyEmail = async (req, res) => {

    const user = await User.findById(req.user.id).select('+verificationCode +verificationAttempts');

    if (user.verificationAttempts < 0) {
        throw AppError.tooManyRequests('Has excedido el número de intentos de verificación.');
    }

    if (user.verificationCode !== req.body.code) {
        user.verificationAttempts -= 1;
        await user.save();
        throw AppError.badRequest(`Código de verificación incorrecto. Te quedan ${user.verificationAttempts} intentos.`);
    }

    user.status = 'verified';
    user.verificationCode = null;
    await user.save();

    notificationService.emit('user:verified', user);

    res.json({ message: 'Email verificado correctamente' });
};

export const loginUser = async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw AppError.unauthorized('Credenciales incorrectas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw AppError.unauthorized('Credenciales incorrectas');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        data: { email: user.email, status: user.status, role: user.role },
        accessToken,
        refreshToken
    });
};

export const updatePersonalData = async (req, res) => {

    const user = await User.findByIdAndUpdate(
        req.user.id,
        req.body,
        { new: true }
    );

    res.json({ data: user });
};

export const updateCompany = async (req, res) => {
    const { name, cif, address, isFreelance } = req.body;
    const user = await User.findById(req.user.id);

    let company = await Company.findOne({ cif });

    if (user.company) {
        throw AppError.conflict('Ya tienes una compañía asociada.');
    }

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
};

export const uploadLogo = async (req, res) => {
    if (!req.file) {
        throw AppError.badRequest('No se ha proporcionado un archivo de logo válido');
    }

    const user = await User.findById(req.user.id);

    if (!user.company) {
        throw AppError.badRequest('No tienes una compañía asociada para subir un logo');
    }

    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
        user.company,
        { logo: logoUrl },
        { new: true }
    );

    res.json({ data: { logo: company.logo } });
};

export const getUser = async (req, res) => {
    const user = await User.findById(req.user.id).populate('company');

    res.json({ data: user });
};

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw AppError.badRequest('Refresh token es requerido');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
        throw AppError.unauthorized('Refresh token inválido');
    }

    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    res.json({ accessToken });
};

export const logoutUser = async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    res.json({ message: 'Sesión cerrada correctamente' });
};

export const deleteUser = async (req, res) => {
    const soft = req.query.soft !== 'false';

    if (soft) {
        await User.softDeleteById(req.user.id, req.user.email);
        res.json({ message: 'Usuario desactivado correctamente' });
    } else {
        await User.hardDelete(req.user.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    }

    notificationService.emit('user:deleted', { id: req.user.id });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        throw AppError.unauthorized('Contraseña actual incorrecta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });

};

export const inviteUser = async (req, res) => {
    const { email, password } = req.body;

    const inviter = await User.findById(req.user.id);

    if (!inviter.company) {
        throw AppError.badRequest('No tienes una compañía asociada para invitar usuarios');
    }

    const exists = await User.findOne({ email });
    if (exists) {
        throw AppError.conflict('Ya existe un usuario con ese email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
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
};