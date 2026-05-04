import request from 'supertest';
import { app } from '../src/app.js';

const BASE = '/api/project';
const FAKE_ID = '507f1f77bcf86cd799439011';

const setupUserWithCompanyAndClient = async () => {
    const regRes = await request(app)
        .post('/api/user/register')
        .send({ email: 'admin@test.com', password: 'password123' });
    const token = regRes.body.accessToken;

    await request(app)
        .patch('/api/user/company')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Empresa Test S.A.', cif: 'A12345678', isFreelance: false });

    const clientRes = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente para proyectos', cif: 'B87654321' });
    const clientId = clientRes.body.data._id;

    return { token, clientId };
};

const createProject = (token, clientId, data = {}) =>
    request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${token}`)
        .send({ client: clientId, name: 'Proyecto Test', projectCode: 'PROJ-001', ...data });

describe('Project API', () => {
    let token, clientId;

    beforeEach(async () => {
        ({ token, clientId } = await setupUserWithCompanyAndClient());
    });

    describe('POST /api/project', () => {
        it('crea un proyecto correctamente', async () => {
            const res = await createProject(token, clientId);

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({
                name: 'Proyecto Test',
                projectCode: 'PROJ-001'
            });
            expect(res.body.data.client).toBeTruthy();
            expect(res.body.data.client._id).toBe(clientId);
        });

        it('almacena el código de proyecto en mayúsculas', async () => {
            const res = await createProject(token, clientId, { projectCode: 'minusculas-001' });

            expect(res.status).toBe(201);
            expect(res.body.data.projectCode).toBe('MINUSCULAS-001');
        });

        it('el proyecto está activo por defecto', async () => {
            const res = await createProject(token, clientId);

            expect(res.status).toBe(201);
            expect(res.body.data.active).toBe(true);
        });

        it('devuelve 409 por código de proyecto duplicado', async () => {
            await createProject(token, clientId);
            const res = await createProject(token, clientId);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 404 con cliente no existente', async () => {
            const res = await createProject(token, FAKE_ID);

            expect(res.status).toBe(404);
        });

        it('devuelve 400 sin nombre requerido', async () => {
            const res = await request(app)
                .post(BASE)
                .set('Authorization', `Bearer ${token}`)
                .send({ client: clientId, projectCode: 'P-001' });

            expect(res.status).toBe(400);
        });

        it('devuelve 400 sin código de proyecto requerido', async () => {
            const res = await request(app)
                .post(BASE)
                .set('Authorization', `Bearer ${token}`)
                .send({ client: clientId, name: 'Sin código' });

            expect(res.status).toBe(400);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app)
                .post(BASE)
                .send({ client: clientId, name: 'Test', projectCode: 'P-001' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/project', () => {
        beforeEach(async () => {
            await createProject(token, clientId, { name: 'Proyecto Alpha', projectCode: 'ALPHA-001' });
            await createProject(token, clientId, { name: 'Proyecto Beta', projectCode: 'BETA-001' });
        });

        it('lista proyectos con paginación y datos de cliente populados', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination).toMatchObject({ currentPage: 1, totalItems: 2 });
            expect(res.body.data[0].client).toHaveProperty('_id');
        });

        it('filtra proyectos por nombre', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ name: 'Alpha' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Proyecto Alpha');
        });

        it('filtra proyectos por cliente', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ client: clientId });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });

        it('respeta el parámetro de paginación limit', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ page: '1', limit: '1' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination.totalItems).toBe(2);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app).get(BASE);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/project/archived', () => {
        it('lista solo los proyectos archivados', async () => {
            const p1 = (await createProject(token, clientId, { projectCode: 'P-001' })).body.data;
            await createProject(token, clientId, { name: 'Activo', projectCode: 'P-002' });

            await request(app)
                .delete(`${BASE}/${p1._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            const res = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]._id).toBe(p1._id);
        });

        it('devuelve lista vacía si no hay archivados', async () => {
            const res = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/project/:id', () => {
        let projectId;

        beforeEach(async () => {
            const res = await createProject(token, clientId);
            projectId = res.body.data._id;
        });

        it('devuelve el proyecto con cliente populado', async () => {
            const res = await request(app)
                .get(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(projectId);
            expect(res.body.data.client._id).toBe(clientId);
        });

        it('devuelve 404 para ID no existente', async () => {
            const res = await request(app)
                .get(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app).get(`${BASE}/${projectId}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/project/:id', () => {
        let projectId;

        beforeEach(async () => {
            const res = await createProject(token, clientId);
            projectId = res.body.data._id;
        });

        it('actualiza el proyecto correctamente', async () => {
            const res = await request(app)
                .put(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Proyecto Actualizado', notes: 'Nuevas notas del proyecto' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Proyecto Actualizado');
            expect(res.body.data.notes).toBe('Nuevas notas del proyecto');
        });

        it('actualiza el estado activo del proyecto', async () => {
            const res = await request(app)
                .put(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ active: false });

            expect(res.status).toBe(200);
            expect(res.body.data.active).toBe(false);
        });

        it('devuelve 409 con código duplicado de otro proyecto', async () => {
            await createProject(token, clientId, { name: 'Otro', projectCode: 'OTRO-001' });

            const res = await request(app)
                .put(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ projectCode: 'OTRO-001' });

            expect(res.status).toBe(409);
        });

        it('permite actualizar con el mismo código de proyecto (sin conflicto)', async () => {
            const res = await request(app)
                .put(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ projectCode: 'PROJ-001' });

            expect(res.status).toBe(200);
        });

        it('devuelve 404 para proyecto no existente', async () => {
            const res = await request(app)
                .put(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'No existe' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/project/:id', () => {
        let projectId;

        beforeEach(async () => {
            const res = await createProject(token, clientId);
            projectId = res.body.data._id;
        });

        it('soft delete: archiva el proyecto y no aparece en la lista principal', async () => {
            const delRes = await request(app)
                .delete(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(delRes.status).toBe(200);
            expect(delRes.body.message).toMatch(/archivado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(0);
        });

        it('hard delete: elimina el proyecto permanentemente', async () => {
            const delRes = await request(app)
                .delete(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'false' });

            expect(delRes.status).toBe(200);
            expect(delRes.body.message).toMatch(/eliminado/i);

            const archivedRes = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);
            expect(archivedRes.body.data).toHaveLength(0);
        });

        it('devuelve 404 para proyecto no existente', async () => {
            const res = await request(app)
                .delete(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/project/:id/restore', () => {
        let projectId;

        beforeEach(async () => {
            const createRes = await createProject(token, clientId);
            projectId = createRes.body.data._id;

            await request(app)
                .delete(`${BASE}/${projectId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });
        });

        it('restaura un proyecto archivado', async () => {
            const res = await request(app)
                .patch(`${BASE}/${projectId}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/restaurado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(1);
        });

        it('devuelve 404 al intentar restaurar un proyecto no archivado', async () => {
            await request(app)
                .patch(`${BASE}/${projectId}/restore`)
                .set('Authorization', `Bearer ${token}`);
            const res = await request(app)
                .patch(`${BASE}/${projectId}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('devuelve 404 para ID no existente', async () => {
            const res = await request(app)
                .patch(`${BASE}/${FAKE_ID}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
