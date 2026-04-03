import { z } from 'zod';

export const emailSchema = z.object({
    body: z.object({
        email: z.email('El email no es válido')
            .transform(val => val.toLowerCase()),
        password: z.string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
    })
});

export const verifyEmailSchema = z.object({

    body: z.object({
        code: z.string()
            .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos')
    })
});

export const personalDataSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'El nombre es obligatorio')
            .trim(),
        lastName: z.string()
            .min(1, 'Los apellidos son obligatorios')
            .trim(),
        nif: z.string()
            .min(1, 'El NIF es obligatorio')
            .trim()
    })
});

export const companyDataSchema = z.object({
    body: z.object({
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
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string()
            .min(1, 'La contraseña actual es obligatoria'),
        newPassword: z.string()
            .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    }).refine(data => data.currentPassword !== data.newPassword, {
        message: 'La nueva contraseña debe ser diferente a la actual',
        path: ['newPassword']
    })
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string()
            .min(1, 'El refresh token es obligatorio')
    })
});

export const deleteUserSchema = z.object({
    query: z.object({
        soft: z.enum(['true', 'false'], 'El valor de soft debe ser "true" o "false"')
    })
});