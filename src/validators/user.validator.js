import { z } from 'zod';

// Usuario
export const registerSchema = z.object({
    email: z.string()
        .email('El email no es válido')
        .transform(val => val.toLowerCase()),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
});

// Verificación de email
export const verifyEmailSchema = z.object({
    code: z.string()
        .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos')
});

// Login de usuario
export const loginSchema = z.object({
    email: z.string()
        .email('El email no es válido')
        .transform(val => val.toLowerCase()),
    password: z.string()
        .min(1, 'La contraseña es obligatoria')
});

// Actualización de datos personales
export const personalDataSchema = z.object({
    name: z.string()
        .min(1, 'El nombre es obligatorio')
        .trim(),
    lastName: z.string()
        .min(1, 'Los apellidos son obligatorios')
        .trim(),
    nif: z.string()
        .min(1, 'El NIF es obligatorio')
        .trim()
});

// Actualización de datos de empresa
export const companyDataSchema = z.object({
    name: z.string()
        .min(1, 'El nombre es obligatorio')
        .trim(),
    cif: z.string()
        .min(1, 'El CIF es obligatorio')
        .trim(),
    address: z.object({
        street: z.string().trim().optional(),
        number: z.string().trim().optional(),
        postal: z.string().trim().optional(),
        city: z.string().trim().optional(),
        province: z.string().trim().optional()
    }).optional(),
    isFreelance: z.boolean().default(false)
});

// Cambio de contraseña
export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'La contraseña actual es obligatoria'),
    newPassword: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword']
});

// Invitación de usuario
export const inviteSchema = z.object({
    email: z.string()
        .email('El email no es válido')
        .transform(val => val.toLowerCase())
});