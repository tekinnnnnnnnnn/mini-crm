process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

jest.mock('../src/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const orderService = require('../src/services/orderService');

describe('orderService with mocked logger', () => {
  test('rejects invalid status (stubbed validation path)', async () => {
    await expect(orderService.updateOrderStatus(1, { status: 'nope' })).rejects.toMatchObject({
      statusCode: 400
    });
  });
});

