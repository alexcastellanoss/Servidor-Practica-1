import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().trim().optional(),
    number: z.string().trim().optional(),
    postal: z.string().trim().optional(),
    city: z.string().trim().optional(),
    province: z.string().trim().optional()
}).optional();

export const createClientSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'El nombre del cliente es obligatorio')
            .trim(),
        cif: z.string()
            .min(1, 'El CIF es obligatorio')
            .trim(),
        email: z.string()
            .email('El email no es válido')
            .transform(val => val.toLowerCase())
            .optional()
            .or(z.literal('')),
        phone: z.string()
            .trim()
            .optional(),
        address: addressSchema
    })
});

export const updateClientSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, 'El nombre del cliente es obligatorio')
            .trim()
            .optional(),
        cif: z.string()
            .min(1, 'El CIF es obligatorio')
            .trim()
            .optional(),
        email: z.string()
            .email('El email no es válido')
            .transform(val => val.toLowerCase())
            .optional()
            .or(z.literal('')),
        phone: z.string()
            .trim()
            .optional(),
        address: addressSchema
    })
});

export const clientIdSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
    })
});

export const listClientsSchema = z.object({
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
        sort: z.enum(['createdAt', '-createdAt', 'name', '-name'])
            .optional()
            .default('createdAt')
    })
});

export const deleteClientSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
    }),
    query: z.object({
        soft: z.enum(['true', 'false'], 'El valor de soft debe ser "true" o "false"')
            .default('true')
    })
});