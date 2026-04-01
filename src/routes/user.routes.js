import { Router } from 'express';
import {
    registerUser, verifyEmail, loginUser, updatePersonalData, updateCompany, uploadLogo,
    getUser, refreshToken, logoutUser, deleteUser, changePassword, inviteUser
} from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';
import {
    registerSchema, verifyEmailSchema, loginSchema, personalDataSchema, companyDataSchema,
    changePasswordSchema, inviteSchema
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.put('/validation', auth, validate(verifyEmailSchema), verifyEmail);
router.post('/login', validate(loginSchema), loginUser);
router.put('/register', auth, validate(personalDataSchema), updatePersonalData);
router.patch('/company', auth, validate(companyDataSchema), updateCompany);
router.patch('/logo', auth, upload.single('logo'), uploadLogo);
router.get('/', auth, getUser);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logoutUser);
router.delete('/', auth, deleteUser);
router.put('/password', auth, validate(changePasswordSchema), changePassword);
router.post('/invite', auth, checkRole('admin'), inviteUser);

export default router;