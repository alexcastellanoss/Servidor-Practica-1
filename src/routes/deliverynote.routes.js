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

router.post('/', auth, validate(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', auth, validate(listDeliveryNotesSchema), getDeliveryNotes);
router.get('/pdf/:id', auth, validate(deliveryNoteIdSchema), downloadPDF);
router.get('/:id', auth, validate(deliveryNoteIdSchema), getDeliveryNote);
router.patch('/:id/sign', auth, uploadSignature.single('signature'), validate(signDeliveryNoteSchema), signDeliveryNote);
router.delete('/:id', auth, validate(deleteDeliveryNoteSchema), deleteDeliveryNote);

export default router;