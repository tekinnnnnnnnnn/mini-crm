process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/testDb');

describe('Products API', () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('Create product with stock tracking', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'P1', trackStock: true, stockQuantity: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.trackStock).toBe(true);
    expect(res.body.stockQuantity).toBe(10);
  });

  test('Create product without stock tracking', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Service', trackStock: false });
    expect(res.statusCode).toBe(201);
    expect(res.body.trackStock).toBe(false);
    expect(res.body.stockQuantity).toBe(null);
  });

  test('Upsert multiple price types', async () => {
    const product = await request(app).post('/api/products').send({ name: 'P2', trackStock: false });
    expect(product.statusCode).toBe(201);

    const id = product.body.id;

    const retail = await request(app)
      .post(`/api/products/${id}/prices`)
      .send({ priceType: 'retail', currency: 'TRY', amount: 100 });
    expect(retail.statusCode).toBe(200);

    const wholesale = await request(app)
      .post(`/api/products/${id}/prices`)
      .send({ priceType: 'wholesale', currency: 'TRY', amount: 80 });
    expect(wholesale.statusCode).toBe(200);

    const got = await request(app).get(`/api/products/${id}`);
    expect(got.statusCode).toBe(200);
    expect(Array.isArray(got.body.prices)).toBe(true);
    expect(got.body.prices.length).toBe(2);
  });
});

