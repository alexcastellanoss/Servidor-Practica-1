import { Router } from 'express';
import {
    createClient,
    updateClient,
    getClients,
    getClient,
    deleteClient,
    getArchivedClients,
    restoreClient
} from '../controllers/client.controller.js';
import validate from '../middleware/validate.js';
import { auth } from '../middleware/auth.middleware.js';
import {
    createClientSchema,
    updateClientSchema,
    clientIdSchema,
    listClientsSchema,
    deleteClientSchema
} from '../validators/client.validator.js';

const router = Router();

router.post('/', auth, validate(createClientSchema), createClient);
router.put('/:id', auth, validate(updateClientSchema), validate(clientIdSchema), updateClient);
router.get('/', auth, validate(listClientsSchema), getClients);
router.get('/archived', auth, getArchivedClients);
router.get('/:id', auth, validate(clientIdSchema), getClient);
router.delete('/:id', auth, validate(deleteClientSchema), deleteClient);
router.patch('/:id/restore', auth, validate(clientIdSchema), restoreClient);

export default router;