import { z } from 'zod';

const workerSchema = z.object({
    name: z.string()
        .min(1, 'El nombre del trabajador es obligatorio')
        .trim(),
    hours: z.number()
        .min(0, 'Las horas deben ser mayor o igual a 0')
});

export const createDeliveryNoteSchema = z.object({
    body: z.object({
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido'),
        project: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto inválido'),
        format: z.enum(['material', 'hours'], {
            errorMap: () => ({ message: 'El formato debe ser "material" o "hours"' })
        }),
        description: z.string()
            .min(1, 'La descripción es obligatoria')
            .trim(),
        workDate: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .transform(val => new Date(val)),
        material: z.string()
            .trim()
            .optional(),
        quantity: z.number()
            .min(0, 'La cantidad debe ser mayor o igual a 0')
            .optional(),
        unit: z.string()
            .trim()
            .optional(),
        hours: z.number()
            .min(0, 'Las horas deben ser mayor o igual a 0')
            .optional(),
        workers: z.array(workerSchema)
            .optional()
    })
        .refine(
            (data) => {
                if (data.format === 'material') {
                    return data.material && data.quantity !== undefined && data.unit;
                }
                return true;
            },
            {
                message: 'Para albaranes de material, debe incluir: material, quantity y unit',
                path: ['material']
            }
        )
        .refine(
            (data) => {
                if (data.format === 'hours') {
                    return data.hours !== undefined || (data.workers && data.workers.length > 0);
                }
                return true;
            },
            {
                message: 'Para albaranes de horas, debe incluir: hours o workers',
                path: ['hours']
            }
        )
});

export const updateDeliveryNoteSchema = z.object({
    body: z.object({
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
            .optional(),
        project: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto inválido')
            .optional(),
        format: z.enum(['material', 'hours'], {
            errorMap: () => ({ message: 'El formato debe ser "material" o "hours"' })
        }).optional(),
        description: z.string()
            .min(1, 'La descripción es obligatoria')
            .trim()
            .optional(),
        workDate: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD')
            .transform(val => new Date(val))
            .optional(),
        material: z.string()
            .trim()
            .optional(),
        quantity: z.number()
            .min(0, 'La cantidad debe ser mayor o igual a 0')
            .optional(),
        unit: z.string()
            .trim()
            .optional(),
        hours: z.number()
            .min(0, 'Las horas deben ser mayor o igual a 0')
            .optional(),
        workers: z.array(workerSchema)
            .optional()
    })
});

export const deliveryNoteIdSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de albarán inválido')
    })
});

export const listDeliveryNotesSchema = z.object({
    query: z.object({
        page: z.string()
            .regex(/^\d+$/, 'La página debe ser un número')
            .transform(val => parseInt(val, 10))
            .default('1'),
        limit: z.string()
            .regex(/^\d+$/, 'El límite debe ser un número')
            .transform(val => parseInt(val, 10))
            .default('10'),
        client: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente inválido')
            .optional(),
        project: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto inválido')
            .optional(),
        format: z.enum(['material', 'hours'])
            .optional(),
        signed: z.enum(['true', 'false'])
            .transform(val => val === 'true')
            .optional(),
        sort: z.enum(['createdAt', '-createdAt', 'workDate', '-workDate'])
            .optional()
            .default('-createdAt')
    })
});

export const deleteDeliveryNoteSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de albarán inválido')
    }),
    query: z.object({
        soft: z.enum(['true', 'false'], 'El valor de soft debe ser "true" o "false"')
            .default('true')
    })
});

export const signDeliveryNoteSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de albarán inválido')
    })
});

export const generatePdfSchema = z.object({
    params: z.object({
        id: z.string()
            .regex(/^[0-9a-fA-F]{24}$/, 'ID de albarán inválido')
    })
});