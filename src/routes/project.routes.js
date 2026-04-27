import { Router } from 'express';
import {
    createProject,
    updateProject,
    getProjects,
    getProject,
    deleteProject,
    getArchivedProjects,
    restoreProject
} from '../controllers/project.controller.js';
import validate from '../middleware/validate.js';
import { auth } from '../middleware/auth.middleware.js';
import {
    createProjectSchema,
    updateProjectSchema,
    projectIdSchema,
    listProjectsSchema,
    deleteProjectSchema
} from '../validators/project.validator.js';

const router = Router();

router.post('/', auth, validate(createProjectSchema), createProject);
router.put('/:id', auth, validate(updateProjectSchema), validate(projectIdSchema), updateProject);
router.get('/', auth, validate(listProjectsSchema), getProjects);
router.get('/archived', auth, getArchivedProjects);
router.get('/:id', auth, validate(projectIdSchema), getProject);
router.delete('/:id', auth, validate(deleteProjectSchema), deleteProject);
router.patch('/:id/restore', auth, validate(projectIdSchema), restoreProject);

export default router;