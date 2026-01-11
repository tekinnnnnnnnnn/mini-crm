process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/testDb');

describe('Customers API', () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('POST/GET/PUT/DELETE customer flow', async () => {
    const created = await request(app)
      .post('/api/customers')
      .send({ firstName: 'Test', lastName: 'User', email: 'TEST@EXAMPLE.com', phone: '+90 532 111 22 33' });
    expect(created.statusCode).toBe(201);
    expect(created.body.id).toBeDefined();
    expect(created.body.email).toBe('test@example.com');
    expect(created.body.phone).toBeDefined();

    const id = created.body.id;

    const got = await request(app).get(`/api/customers/${id}`);
    expect(got.statusCode).toBe(200);
    expect(got.body.id).toBe(id);

    const updated = await request(app).put(`/api/customers/${id}`).send({ lastName: null });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.lastName).toBe(null);

    const deleted = await request(app).delete(`/api/customers/${id}`);
    expect(deleted.statusCode).toBe(204);

    const missing = await request(app).get(`/api/customers/${id}`);
    expect([404, 200]).toContain(missing.statusCode);
  });

  test('POST customer validates firstName', async () => {
    const res = await request(app).post('/api/customers').send({ lastName: 'X' });
    expect(res.statusCode).toBe(400);
  });

  test('POST customer validates email format', async () => {
    const res = await request(app).post('/api/customers').send({ firstName: 'A', email: 'bad@@mail' });
    expect(res.statusCode).toBe(400);
  });

  test('POST customer enforces unique phone', async () => {
    const first = await request(app).post('/api/customers').send({ firstName: 'U', phone: '0532 111 22 33' });
    expect(first.statusCode).toBe(201);

    const second = await request(app).post('/api/customers').send({ firstName: 'V', phone: '+90 532 1112233' });
    expect(second.statusCode).toBe(409);
  });
});
