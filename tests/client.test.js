import request from 'supertest';
import { app } from '../src/app.js';

const BASE = '/api/client';
const FAKE_ID = '507f1f77bcf86cd799439011';

const setupUserWithCompany = async (email = 'admin@test.com', cif = 'A12345678') => {
    const regRes = await request(app)
        .post('/api/user/register')
        .send({ email, password: 'password123' });
    const token = regRes.body.accessToken;

    await request(app)
        .patch('/api/user/company')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Empresa Test S.A.', cif, isFreelance: false });

    return token;
};

const createClient = (token, data = {}) =>
    request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Test S.L.', cif: 'B87654321', email: 'cliente@test.com', ...data });

describe('Client API', () => {
    let token;

    beforeEach(async () => {
        token = await setupUserWithCompany();
    });

    describe('POST /api/client', () => {
        it('debería crear un cliente correctamente', async () => {
            const res = await createClient(token);

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({
                name: 'Cliente Test S.L.',
                cif: 'B87654321'
            });
        });

        it('debería rechazar CIF duplicado', async () => {
            await createClient(token);
            const res = await createClient(token);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe(true);
        });

        it('debería rechazar sin nombre requerido', async () => {
            const res = await request(app)
                .post(BASE)
                .set('Authorization', `Bearer ${token}`)
                .send({ cif: 'B87654321' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar sin CIF requerido', async () => {
            const res = await request(app)
                .post(BASE)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Cliente sin CIF' });

            expect(res.status).toBe(400);
        });

        it('debería rechazar si el usuario no tiene empresa', async () => {
            const regRes = await request(app)
                .post('/api/user/register')
                .send({ email: 'sinempresa@test.com', password: 'password123' });
            const tokenSinEmpresa = regRes.body.accessToken;

            const res = await createClient(tokenSinEmpresa);

            expect(res.status).toBe(400);
        });

        it('debería rechazar sin autenticación', async () => {
            const res = await request(app)
                .post(BASE)
                .send({ name: 'Cliente', cif: 'B87654321' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/client', () => {
        beforeEach(async () => {
            await createClient(token, { name: 'Alpha SL', cif: 'B11111111' });
            await createClient(token, { name: 'Beta SA', cif: 'B22222222' });
        });

        it('debería listar clientes con paginación', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination).toMatchObject({ currentPage: 1, totalItems: 2 });
        });

        it('debería filtrar clientes por nombre', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ name: 'Alpha' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Alpha SL');
        });

        it('debería respetar los parámetros de paginación', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ page: '1', limit: '1' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination).toMatchObject({ totalItems: 2, totalPages: 2 });
        });

        it('debería devolver lista vacía si no hay clientes', async () => {
            const tokenOtro = await setupUserWithCompany('otro@test.com', 'C99999999');

            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${tokenOtro}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

        it('debería rechazar sin autenticación', async () => {
            const res = await request(app).get(BASE);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/client/archived', () => {
        it('debería listar solo los clientes archivados', async () => {
            const c1 = (await createClient(token, { cif: 'B11111111' })).body.data;
            await createClient(token, { name: 'Activo', cif: 'B22222222' });

            await request(app)
                .delete(`${BASE}/${c1._id}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            const res = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0]._id).toBe(c1._id);
        });

        it('debería devolver lista vacía si no hay archivados', async () => {
            const res = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/client/:id', () => {
        let clientId;

        beforeEach(async () => {
            const res = await createClient(token);
            clientId = res.body.data._id;
        });

        it('debería devolver el cliente por ID', async () => {
            const res = await request(app)
                .get(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(clientId);
        });

        it('debería rechazar ID no existente', async () => {
            const res = await request(app)
                .get(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería rechazar sin autenticación', async () => {
            const res = await request(app).get(`${BASE}/${clientId}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/client/:id', () => {
        let clientId;

        beforeEach(async () => {
            const res = await createClient(token);
            clientId = res.body.data._id;
        });

        it('debería actualizar el cliente correctamente', async () => {
            const res = await request(app)
                .put(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Nombre Actualizado', phone: '600000000' });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Nombre Actualizado');
            expect(res.body.data.phone).toBe('600000000');
        });

        it('debería rechazar CIF duplicado', async () => {
            await createClient(token, { name: 'Otro cliente', cif: 'B99999999' });

            const res = await request(app)
                .put(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ cif: 'B99999999' });

            expect(res.status).toBe(409);
        });

        it('debería permitir actualizar al mismo CIF', async () => {
            const res = await request(app)
                .put(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ cif: 'B87654321' });

            expect(res.status).toBe(200);
        });

        it('debería rechazar cliente no existente', async () => {
            const res = await request(app)
                .put(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'No existe' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/client/:id', () => {
        let clientId;

        beforeEach(async () => {
            const res = await createClient(token);
            clientId = res.body.data._id;
        });

        it('debería archivar con soft delete', async () => {
            const delRes = await request(app)
                .delete(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(delRes.status).toBe(200);
            expect(delRes.body.message).toMatch(/archivado/i);

            const archivedRes = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);

            expect(archivedRes.body.data).toHaveLength(1);
            expect(archivedRes.body.data[0]._id).toBe(clientId);
        });

        it('debería no aparecer en lista principal tras soft delete', async () => {
            await request(app)
                .delete(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);

            expect(listRes.body.data).toHaveLength(0);
        });

        it('debería eliminar permanentemente con hard delete', async () => {
            const delRes = await request(app)
                .delete(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'false' });

            expect(delRes.status).toBe(200);
            expect(delRes.body.message).toMatch(/eliminado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(0);

            const archivedRes = await request(app)
                .get(`${BASE}/archived`)
                .set('Authorization', `Bearer ${token}`);
            expect(archivedRes.body.data).toHaveLength(0);
        });

        it('debería rechazar ID no existente', async () => {
            const res = await request(app)
                .delete(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/client/:id/restore', () => {
        let clientId;

        beforeEach(async () => {
            const createRes = await createClient(token);
            clientId = createRes.body.data._id;

            await request(app)
                .delete(`${BASE}/${clientId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });
        });

        it('debería restaurar un cliente archivado', async () => {
            const res = await request(app)
                .patch(`${BASE}/${clientId}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/restaurado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(1);
        });

        it('debería rechazar restaurar cliente no archivado', async () => {
            await request(app)
                .patch(`${BASE}/${clientId}/restore`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app)
                .patch(`${BASE}/${clientId}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('debería rechazar ID no existente', async () => {
            const res = await request(app)
                .patch(`${BASE}/${FAKE_ID}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
