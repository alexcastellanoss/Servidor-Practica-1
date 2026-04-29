import { Router } from 'express';
import {
    createDeliveryNote,
    getDeliveryNotes,
    getDeliveryNote,
    deleteDeliveryNote,
    signDeliveryNote,
    downloadPDF
} from '../controllers/deliverynote.controller.js';
import validate from '../middleware/validate.js';
import { auth } from '../middleware/auth.middleware.js';
import uploadSignature from '../middleware/uploadSignature.js';
import {
    createDeliveryNoteSchema,
    deliveryNoteIdSchema,
    listDeliveryNotesSchema,
    deleteDeliveryNoteSchema,
    signDeliveryNoteSchema
} from '../validators/deliverynote.validator.js';

const router = Router();

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags:
 *       - DeliveryNotes
 *     summary: Crear nuevo albarán
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201:
 *         description: Albarán creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente o proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', auth, validate(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags:
 *       - DeliveryNotes
 *     summary: Listar todos los albaranes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Albaranes por página
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filtrar por ID de proyecto
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *         description: Filtrar por tipo de albarán
 *       - in: query
 *         name: signed
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por estado de firma
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, workDate, -workDate]
 *           default: -createdAt
 *         description: Ordenar resultados
 *     responses:
 *       200:
 *         description: Lista de albaranes con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth, validate(listDeliveryNotesSchema), getDeliveryNotes);

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags:
 *       - DeliveryNotes
 *     summary: Descargar albarán en PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirección a PDF en Cloudinary
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/pdf/:id', auth, validate(deliveryNoteIdSchema), downloadPDF);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags:
 *       - DeliveryNotes
 *     summary: Obtener un albarán por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: Albarán encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', auth, validate(deliveryNoteIdSchema), getDeliveryNote);

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags:
 *       - DeliveryNotes
 *     summary: Firmar un albarán
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (jpg, png, webp)
 *     responses:
 *       200:
 *         description: Albarán firmado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *                 message:
 *                   type: string
 *                   example: Albarán firmado correctamente
 *       400:
 *         description: No se proporcionó firma o albarán ya firmado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/sign', auth, uploadSignature.single('signature'), validate(signDeliveryNoteSchema), signDeliveryNote);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags:
 *       - DeliveryNotes
 *     summary: Eliminar o archivar albarán
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán
 *       - in: query
 *         name: soft
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Si es true hace soft delete (archiva), si es false elimina permanentemente
 *     responses:
 *       200:
 *         description: Albarán eliminado o archivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: No se puede borrar un albarán firmado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', auth, validate(deleteDeliveryNoteSchema), deleteDeliveryNote);

export default router;