process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { resetDb, closeDb } = require('./helpers/testDb');

describe('Orders API', () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  test('POST order requires valid customerId', async () => {
    const res = await request(app).post('/api/orders').send({ customerId: 999, items: [{ productId: 1, quantity: 1, unitPrice: 10 }] });
    expect(res.statusCode).toBe(400);
  });

  test('requires shippingAddress when requiresShipping=true', async () => {
    const customer = await request(app).post('/api/customers').send({ firstName: 'S' });
    expect(customer.statusCode).toBe(201);

    const product = await request(app).post('/api/products').send({ name: 'P', trackStock: false });
    expect(product.statusCode).toBe(201);

    const res = await request(app).post('/api/orders').send({
      customerId: customer.body.id,
      requiresShipping: true,
      items: [{ productId: product.body.id, quantity: 1, unitPrice: 10 }]
    });
    expect(res.statusCode).toBe(400);
  });

  test('Create order and update status', async () => {
    const customer = await request(app).post('/api/customers').send({ firstName: 'C' });
    expect(customer.statusCode).toBe(201);

    const product = await request(app).post('/api/products').send({ name: 'P2', trackStock: false });
    expect(product.statusCode).toBe(201);

    const order = await request(app).post('/api/orders').send({
      customerId: customer.body.id,
      status: 'draft',
      requiresShipping: true,
      shippingAddress: 'Kadıköy',
      items: [{ productId: product.body.id, quantity: 2, unitPrice: 10 }]
    });
    expect(order.statusCode).toBe(201);
    expect(order.body.id).toBeDefined();

    const orderId = order.body.id;

    const updated = await request(app).post(`/api/orders/${orderId}/status`).send({ status: 'preparing' });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.status).toBe('preparing');

    const listed = await request(app).get('/api/orders?status=preparing');
    expect(listed.statusCode).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.length).toBeGreaterThan(0);
  });

  test('Reject invalid status', async () => {
    const customer = await request(app).post('/api/customers').send({ firstName: 'D' });
    const product = await request(app).post('/api/products').send({ name: 'P3', trackStock: false });
    const res = await request(app).post('/api/orders').send({
      customerId: customer.body.id,
      status: 'nope',
      items: [{ productId: product.body.id, quantity: 1, unitPrice: 10 }]
    });
    expect(res.statusCode).toBe(400);
  });

  test('Guest order without customerId', async () => {
    const product = await request(app).post('/api/products').send({ name: 'P4', trackStock: false });
    expect(product.statusCode).toBe(201);

    const res = await request(app).post('/api/orders').send({
      guestCustomer: { firstName: 'Guest', phone: '05321112233' },
      items: [{ productId: product.body.id, quantity: 1, unitPrice: 99 }]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.customerId).toBe(null);
    expect(res.body.guestFirstName).toBe('Guest');
  });

  test('Stock policy: reject when insufficient stock (default)', async () => {
    const customer = await request(app).post('/api/customers').send({ firstName: 'Stock' });
    expect(customer.statusCode).toBe(201);

    const product = await request(app)
      .post('/api/products')
      .send({ name: 'Stocked', trackStock: true, stockQuantity: 1 });
    expect(product.statusCode).toBe(201);

    const res = await request(app).post('/api/orders').send({
      customerId: customer.body.id,
      items: [{ productId: product.body.id, quantity: 2, unitPrice: 10 }]
    });
    expect(res.statusCode).toBe(409);
  });
});
