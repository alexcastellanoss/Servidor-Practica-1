import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().trim().optional(),
    number: z.string().trim().optional(),
    postal: z.string().trim().optional(),
    city: z.string().trim().optional(),
    province: z.string().trim().optional()
}).optional();

export const createProjectSchema = z.object({
    body: z.object({
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido'),
        name: z.string()
            .min(1, 'El nombre del proyecto es obligatorio')
            .trim(),
        projectCode: z.string()
            .min(1, 'El código del proyecto es obligatorio')
            .trim()
            .transform(val => val.toUpperCase()),
        address: addressSchema,
        email: z.string()
            .email('El email no es válido')
            .transform(val => val.toLowerCase())
            .optional()
            .or(z.literal('')),
        notes: z.string()
            .trim()
            .optional(),
        active: z.boolean()
            .default(true)
    })
});

export const updateProjectSchema = z.object({
    body: z.object({
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
            .optional(),
        name: z.string()
            .min(1, 'El nombre del proyecto es obligatorio')
            .trim()
            .optional(),
        projectCode: z.string()
            .min(1, 'El código del proyecto es obligatorio')
            .trim()
            .transform(val => val.toUpperCase())
            .optional(),
        address: addressSchema,
        email: z.string()
            .email('El email no es válido')
            .transform(val => val.toLowerCase())
            .optional()
            .or(z.literal('')),
        notes: z.string()
            .trim()
            .optional(),
        active: z.boolean()
            .optional()
    })
});

export const projectIdSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto inválido')
    })
});

export const listProjectsSchema = z.object({
    query: z.object({
        page: z.string()
            .regex(/^\d+$/, 'La página debe ser un número')
            .transform(val => parseInt(val, 10))
            .default('1'),
        limit: z.string()
            .regex(/^\d+$/, 'El límite debe ser un número')
            .transform(val => parseInt(val, 10))
            .default('10'),
        name: z.string()
            .trim()
            .optional(),
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
            .optional(),
        active: z.enum(['true', 'false'])
            .transform(val => val === 'true')
            .optional(),
        sort: z.enum(['createdAt', '-createdAt', 'name', '-name', 'projectCode', '-projectCode'])
            .optional()
            .default('createdAt')
    })
});

export const deleteProjectSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto inválido')
    }),
    query: z.object({
        soft: z.enum(['true', 'false'], 'El valor de soft debe ser "true" o "false"')
            .default('true')
    })
});