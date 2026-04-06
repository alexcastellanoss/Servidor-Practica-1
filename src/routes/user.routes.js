import { Router } from 'express';
import {
    registerUser, verifyEmail, loginUser, updatePersonalData, updateCompany, uploadLogo,
    getUser, refreshToken, logoutUser, deleteUser, changePassword, inviteUser
} from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { auth } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import upload from '../middleware/upload.js';
import {
    codeSchema, personalDataSchema, companyDataSchema,
    changePasswordSchema, emailSchema, refreshTokenSchema, deleteUserSchema
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(emailSchema), registerUser);
router.put('/validation', auth, validate(codeSchema), verifyEmail);
router.post('/login', validate(emailSchema), loginUser);
router.put('/register', auth, validate(personalDataSchema), updatePersonalData);
router.patch('/company', auth, validate(companyDataSchema), updateCompany);
router.patch('/logo', auth, upload.single('logo'), uploadLogo);
router.get('/', auth, getUser);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/logout', auth, logoutUser);
router.delete('/', auth, validate(deleteUserSchema), deleteUser);
router.put('/password', auth, validate(changePasswordSchema), changePassword);
router.post('/invite', auth, checkRole('admin'), validate(emailSchema), inviteUser);

export default router;