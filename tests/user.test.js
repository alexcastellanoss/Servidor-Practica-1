import request from 'supertest';
import { app } from '../src/app.js';

const BASE = '/api/user';
const TEST_EMAIL = 'user@test.com';
const TEST_PASS = 'password123';

const register = (email = TEST_EMAIL, password = TEST_PASS) =>
    request(app).post(`${BASE}/register`).send({ email, password });

const login = (email = TEST_EMAIL, password = TEST_PASS) =>
    request(app).post(`${BASE}/login`).send({ email, password });

const setupUser = async (email = TEST_EMAIL, password = TEST_PASS) => {
    const res = await register(email, password);
    return {
        token: res.body.accessToken,
        refreshToken: res.body.refreshToken,
        verificationCode: res.body.verificationCode
    };
};

const setupUserWithCompany = async (email = TEST_EMAIL, password = TEST_PASS, cif = 'A12345678') => {
    const { token } = await setupUser(email, password);
    await request(app)
        .patch(`${BASE}/company`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Empresa Test S.A.', cif, isFreelance: false });
    return { token };
};

describe('POST /api/user/register', () => {
    it('debería registrar un nuevo usuario y devolver tokens', async () => {
        const res = await register();

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('verificationCode');
        expect(res.body.data).toMatchObject({
            email: TEST_EMAIL,
            status: 'pending',
            role: 'admin'
        });
    });

    it('debería rechazar email duplicado', async () => {
        await register();
        const res = await register();

        expect(res.status).toBe(409);
        expect(res.body.error).toBe(true);
    });

    it('debería rechazar email inválido', async () => {
        const res = await register('no-es-email', TEST_PASS);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(true);
    });

    it('debería rechazar contraseña demasiado corta', async () => {
        const res = await register(TEST_EMAIL, 'corta');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(true);
    });
});

describe('PUT /api/user/validation', () => {
    let token, verificationCode;

    beforeEach(async () => {
        ({ token, verificationCode } = await setupUser());
    });

    it('debería verificar el email con el código correcto', async () => {
        const res = await request(app)
            .put(`${BASE}/validation`)
            .set('Authorization', `Bearer ${token}`)
            .send({ code: verificationCode });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/verificado/i);
    });

    it('debería rechazar código incorrecto', async () => {
        const res = await request(app)
            .put(`${BASE}/validation`)
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '000000' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(true);
    });

    it('debería rechazar código de formato incorrecto', async () => {
        const res = await request(app)
            .put(`${BASE}/validation`)
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'abc' });

        expect(res.status).toBe(400);
    });

    it('debería rechazar sin token de autenticación', async () => {
        const res = await request(app)
            .put(`${BASE}/validation`)
            .send({ code: verificationCode });

        expect(res.status).toBe(401);
    });
});

describe('POST /api/user/login', () => {
    beforeEach(async () => {
        await register();
    });

    it('debería autenticar con credenciales válidas', async () => {
        const res = await login();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.data).toMatchObject({ email: TEST_EMAIL });
    });

    it('debería rechazar contraseña incorrecta', async () => {
        const res = await login(TEST_EMAIL, 'contraseña_mala');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe(true);
    });

    it('debería rechazar email no registrado', async () => {
        const res = await login('noexiste@test.com', TEST_PASS);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe(true);
    });
});

describe('GET /api/user', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería devolver los datos del usuario autenticado', async () => {
        const res = await request(app)
            .get(`${BASE}/`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ email: TEST_EMAIL });
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app).get(`${BASE}/`);

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/user/register — datos personales', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería actualizar nombre, apellido y NIF', async () => {
        const res = await request(app)
            .put(`${BASE}/register`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Juan', lastName: 'García', nif: '12345678A' });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ name: 'Juan', lastName: 'García', nif: '12345678A' });
    });

    it('debería rechazar si faltan campos requeridos', async () => {
        const res = await request(app)
            .put(`${BASE}/register`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Solo nombre' });

        expect(res.status).toBe(400);
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app)
            .put(`${BASE}/register`)
            .send({ name: 'Juan', lastName: 'García', nif: '12345678A' });

        expect(res.status).toBe(401);
    });
});

describe('PATCH /api/user/company', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería crear y asociar una compañía', async () => {
        const res = await request(app)
            .patch(`${BASE}/company`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Mi Empresa S.A.', cif: 'B12345678', isFreelance: false });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('company');
        expect(res.body.data.company).toMatchObject({ name: 'Mi Empresa S.A.', cif: 'B12345678' });
    });

    it('debería crear empresa freelance usando datos del usuario', async () => {
        await request(app)
            .put(`${BASE}/register`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Ana', lastName: 'Martínez', nif: '87654321B' });

        const res = await request(app)
            .patch(`${BASE}/company`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Placeholder', cif: '87654321B', isFreelance: true });

        expect(res.status).toBe(200);
        expect(res.body.data.company.isFreelance).toBe(true);
        expect(res.body.data.company.name).toBe('Ana');
    });

    it('debería rechazar si el usuario ya tiene compañía', async () => {
        await request(app)
            .patch(`${BASE}/company`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Primera Empresa', cif: 'B12345678', isFreelance: false });

        const res = await request(app)
            .patch(`${BASE}/company`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Segunda Empresa', cif: 'C99999999', isFreelance: false });

        expect(res.status).toBe(409);
    });
});

describe('POST /api/user/refresh', () => {
    let token, refreshToken;

    beforeEach(async () => {
        ({ token, refreshToken } = await setupUser());
    });

    it('debería renovar el access token', async () => {
        const res = await request(app)
            .post(`${BASE}/refresh`)
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('debería rechazar refresh token revocado', async () => {
        await request(app)
            .post(`${BASE}/logout`)
            .set('Authorization', `Bearer ${token}`);

        const res = await request(app)
            .post(`${BASE}/refresh`)
            .send({ refreshToken });

        expect(res.status).toBe(401);
    });

    it('debería rechazar sin refresh token', async () => {
        const res = await request(app)
            .post(`${BASE}/refresh`)
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('POST /api/user/logout', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería cerrar la sesión correctamente', async () => {
        const res = await request(app)
            .post(`${BASE}/logout`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/cerrada/i);
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app).post(`${BASE}/logout`);

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/user', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería desactivar con soft delete', async () => {
        const res = await request(app)
            .delete(`${BASE}/`)
            .set('Authorization', `Bearer ${token}`)
            .query({ soft: 'true' });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/desactivado/i);
    });

    it('debería eliminar permanentemente con hard delete', async () => {
        const res = await request(app)
            .delete(`${BASE}/`)
            .set('Authorization', `Bearer ${token}`)
            .query({ soft: 'false' });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/eliminado/i);
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app)
            .delete(`${BASE}/`)
            .query({ soft: 'true' });

        expect(res.status).toBe(401);
    });

    it('debería rechazar sin parámetro soft', async () => {
        const res = await request(app)
            .delete(`${BASE}/`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});

describe('PUT /api/user/password', () => {
    let token;

    beforeEach(async () => {
        ({ token } = await setupUser());
    });

    it('debería cambiar la contraseña correctamente', async () => {
        const res = await request(app)
            .put(`${BASE}/password`)
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: TEST_PASS, newPassword: 'nuevapassword456' });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/actualizada/i);
    });

    it('debería rechazar contraseña actual incorrecta', async () => {
        const res = await request(app)
            .put(`${BASE}/password`)
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'contraseña_mala', newPassword: 'nuevapassword456' });

        expect(res.status).toBe(401);
    });

    it('debería rechazar si nueva y actual son iguales', async () => {
        const res = await request(app)
            .put(`${BASE}/password`)
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: TEST_PASS, newPassword: TEST_PASS });

        expect(res.status).toBe(400);
    });

    it('debería rechazar sin token', async () => {
        const res = await request(app)
            .put(`${BASE}/password`)
            .send({ currentPassword: TEST_PASS, newPassword: 'nuevapassword456' });

        expect(res.status).toBe(401);
    });
});

describe('POST /api/user/invite', () => {
    let adminToken;

    beforeEach(async () => {
        ({ token: adminToken } = await setupUserWithCompany());
    });

    it('debería invitar a un usuario como guest', async () => {
        const res = await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'invitado@test.com', password: TEST_PASS });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ email: 'invitado@test.com', role: 'guest' });
    });

    it('debería rechazar email duplicado', async () => {
        await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'invitado@test.com', password: TEST_PASS });

        const res = await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'invitado@test.com', password: TEST_PASS });

        expect(res.status).toBe(409);
    });

    it('debería rechazar si el guest intenta invitar', async () => {
        await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'guest@test.com', password: TEST_PASS });

        const loginRes = await login('guest@test.com', TEST_PASS);
        const guestToken = loginRes.body.accessToken;

        const res = await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${guestToken}`)
            .send({ email: 'otro@test.com', password: TEST_PASS });

        expect(res.status).toBe(403);
    });

    it('debería rechazar si el admin no tiene empresa', async () => {
        const { token: tokenSinEmpresa } = await setupUser('sinempresa@test.com');

        const res = await request(app)
            .post(`${BASE}/invite`)
            .set('Authorization', `Bearer ${tokenSinEmpresa}`)
            .send({ email: 'otro@test.com', password: TEST_PASS });

        expect(res.status).toBe(400);
    });
});
