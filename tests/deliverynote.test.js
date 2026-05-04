import request from 'supertest';
import { app } from '../src/app.js';

const BASE = '/api/deliverynote';
const FAKE_ID = '507f1f77bcf86cd799439011';
const WORK_DATE = '2024-01-15';
const FAKE_PNG = Buffer.alloc(200, 0xff);

const setupTestContext = async () => {
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
        .send({ name: 'Cliente Albarán', cif: 'B87654321' });
    const clientId = clientRes.body.data._id;

    const projectRes = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ client: clientId, name: 'Proyecto Albarán', projectCode: 'ALB-001' });
    const projectId = projectRes.body.data._id;

    return { token, clientId, projectId };
};

const materialNote = (clientId, projectId, overrides = {}) => ({
    client: clientId,
    project: projectId,
    format: 'material',
    description: 'Suministro de cemento Portland',
    workDate: WORK_DATE,
    material: 'Cemento Portland',
    quantity: 100,
    unit: 'kg',
    ...overrides
});

const hoursNote = (clientId, projectId, overrides = {}) => ({
    client: clientId,
    project: projectId,
    format: 'hours',
    description: 'Trabajo de instalación eléctrica',
    workDate: WORK_DATE,
    hours: 8,
    workers: [
        { name: 'Carlos García', hours: 4 },
        { name: 'Ana López', hours: 4 }
    ],
    ...overrides
});

const createNote = (token, data) =>
    request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(data);

const signNote = (token, noteId) =>
    request(app)
        .patch(`${BASE}/${noteId}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', FAKE_PNG, { filename: 'firma.png', contentType: 'image/png' });

describe('DeliveryNote API', () => {
    let token, clientId, projectId;

    beforeEach(async () => {
        ({ token, clientId, projectId } = await setupTestContext());
    });

    describe('POST /api/deliverynote', () => {
        it('crea un albarán de tipo material correctamente', async () => {
            const res = await createNote(token, materialNote(clientId, projectId));

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({
                format: 'material',
                material: 'Cemento Portland',
                quantity: 100,
                unit: 'kg',
                signed: false
            });
            expect(res.body.data.client._id).toBe(clientId);
            expect(res.body.data.project._id).toBe(projectId);
        });

        it('crea un albarán de tipo horas con trabajadores', async () => {
            const res = await createNote(token, hoursNote(clientId, projectId));

            expect(res.status).toBe(201);
            expect(res.body.data).toMatchObject({ format: 'hours', hours: 8 });
            expect(res.body.data.workers).toHaveLength(2);
            expect(res.body.data.workers[0]).toMatchObject({ name: 'Carlos García', hours: 4 });
        });

        it('crea un albarán de horas solo con total de horas (sin workers)', async () => {
            const res = await createNote(token, hoursNote(clientId, projectId, { workers: undefined }));

            expect(res.status).toBe(201);
            expect(res.body.data.hours).toBe(8);
        });

        it('devuelve 400 si falta material en formato "material"', async () => {
            const data = {
                client: clientId,
                project: projectId,
                format: 'material',
                description: 'Sin campos de material',
                workDate: WORK_DATE
            };
            const res = await createNote(token, data);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 400 si falta hours/workers en formato "hours"', async () => {
            const data = {
                client: clientId,
                project: projectId,
                format: 'hours',
                description: 'Sin horas',
                workDate: WORK_DATE
            };
            const res = await createNote(token, data);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 400 con formato de fecha incorrecto', async () => {
            const res = await createNote(token, materialNote(clientId, projectId, { workDate: '15/01/2024' }));

            expect(res.status).toBe(400);
        });

        it('devuelve 404 con cliente no existente', async () => {
            const res = await createNote(token, materialNote(FAKE_ID, projectId));

            expect(res.status).toBe(404);
        });

        it('devuelve 404 con proyecto no existente', async () => {
            const res = await createNote(token, materialNote(clientId, FAKE_ID));

            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el usuario no tiene empresa', async () => {
            const regRes = await request(app)
                .post('/api/user/register')
                .send({ email: 'sinempresa@test.com', password: 'password123' });
            const tokenSinEmpresa = regRes.body.accessToken;

            const res = await createNote(tokenSinEmpresa, materialNote(clientId, projectId));

            expect(res.status).toBe(400);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app)
                .post(BASE)
                .send(materialNote(clientId, projectId));

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/deliverynote', () => {
        beforeEach(async () => {
            await createNote(token, materialNote(clientId, projectId));
            await createNote(token, hoursNote(clientId, projectId));
        });

        it('lista albaranes con paginación y referencias populadas', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination).toMatchObject({ currentPage: 1, totalItems: 2 });
            expect(res.body.data[0].client).toHaveProperty('_id');
            expect(res.body.data[0].project).toHaveProperty('_id');
        });

        it('filtra por formato "material"', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ format: 'material' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].format).toBe('material');
        });

        it('filtra por formato "hours"', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ format: 'hours' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].format).toBe('hours');
        });

        it('filtra por cliente', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ client: clientId });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });

        it('filtra por proyecto', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ project: projectId });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });

        it('filtra por estado de firma (no firmados)', async () => {
            const res = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`)
                .query({ signed: 'false' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data.every(n => n.signed === false)).toBe(true);
        });

        it('respeta la paginación', async () => {
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

    describe('GET /api/deliverynote/:id', () => {
        let noteId;

        beforeEach(async () => {
            const res = await createNote(token, materialNote(clientId, projectId));
            noteId = res.body.data._id;
        });

        it('devuelve el albarán con cliente y proyecto populados', async () => {
            const res = await request(app)
                .get(`${BASE}/${noteId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(noteId);
            expect(res.body.data.client._id).toBe(clientId);
            expect(res.body.data.project._id).toBe(projectId);
        });

        it('devuelve 404 para ID no existente', async () => {
            const res = await request(app)
                .get(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app).get(`${BASE}/${noteId}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PATCH /api/deliverynote/:id/sign', () => {
        let noteId;

        beforeEach(async () => {
            const res = await createNote(token, materialNote(clientId, projectId));
            noteId = res.body.data._id;
        });

        it('firma el albarán con imagen de firma válida', async () => {
            const res = await signNote(token, noteId);

            expect(res.status).toBe(200);
            expect(res.body.data.signed).toBe(true);
            expect(res.body.data.signatureUrl).toBe('https://mock.cloudinary.com/signature.png');
            expect(res.body.data.pdfUrl).toBe('https://mock.cloudinary.com/pdf.pdf');
            expect(res.body.data.signedAt).toBeTruthy();
            expect(res.body.message).toMatch(/firmado/i);
        });

        it('devuelve 400 si no se adjunta imagen de firma', async () => {
            const res = await request(app)
                .patch(`${BASE}/${noteId}/sign`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 400 si el albarán ya está firmado', async () => {
            await signNote(token, noteId);

            const res = await signNote(token, noteId);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 400 con tipo de archivo no permitido', async () => {
            const res = await request(app)
                .patch(`${BASE}/${noteId}/sign`)
                .set('Authorization', `Bearer ${token}`)
                .attach('signature', FAKE_PNG, { filename: 'firma.pdf', contentType: 'application/pdf' });

            expect(res.status).toBe(400);
        });

        it('devuelve 404 para albarán no existente', async () => {
            const res = await request(app)
                .patch(`${BASE}/${FAKE_ID}/sign`)
                .set('Authorization', `Bearer ${token}`)
                .attach('signature', FAKE_PNG, { filename: 'firma.png', contentType: 'image/png' });

            expect(res.status).toBe(404);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app)
                .patch(`${BASE}/${noteId}/sign`)
                .attach('signature', FAKE_PNG, { filename: 'firma.png', contentType: 'image/png' });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/deliverynote/:id', () => {
        let noteId;

        beforeEach(async () => {
            const res = await createNote(token, materialNote(clientId, projectId));
            noteId = res.body.data._id;
        });

        it('soft delete: archiva el albarán correctamente', async () => {
            const res = await request(app)
                .delete(`${BASE}/${noteId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/archivado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(0);
        });

        it('hard delete: elimina el albarán permanentemente', async () => {
            const res = await request(app)
                .delete(`${BASE}/${noteId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'false' });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/eliminado/i);

            const listRes = await request(app)
                .get(BASE)
                .set('Authorization', `Bearer ${token}`);
            expect(listRes.body.data).toHaveLength(0);
        });

        it('NO permite eliminar un albarán firmado', async () => {
            await signNote(token, noteId);

            const res = await request(app)
                .delete(`${BASE}/${noteId}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe(true);
        });

        it('devuelve 404 para ID no existente', async () => {
            const res = await request(app)
                .delete(`${BASE}/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(404);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app)
                .delete(`${BASE}/${noteId}`)
                .query({ soft: 'true' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/deliverynote/pdf/:id', () => {
        let noteId;

        beforeEach(async () => {
            const res = await createNote(token, materialNote(clientId, projectId));
            noteId = res.body.data._id;
        });

        it('genera y devuelve el PDF de un albarán no firmado', async () => {
            const res = await request(app)
                .get(`${BASE}/pdf/${noteId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/pdf');
            expect(res.headers['content-disposition']).toContain('albaran_');
        });

        it('redirige a Cloudinary para un albarán ya firmado', async () => {
            await signNote(token, noteId);

            let res;
            try {
                res = await request(app)
                    .get(`${BASE}/pdf/${noteId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .redirects(0);
            } catch (err) {
                res = err.response;
            }

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe('https://mock.cloudinary.com/pdf.pdf');
        });

        it('devuelve 404 para ID no existente', async () => {
            const res = await request(app)
                .get(`${BASE}/pdf/${FAKE_ID}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it('devuelve 401 sin autenticación', async () => {
            const res = await request(app).get(`${BASE}/pdf/${noteId}`);

            expect(res.status).toBe(401);
        });
    });
});
