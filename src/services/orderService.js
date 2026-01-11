const { Order, Customer, OrderItem, Product, sequelize } = require('../models');
const config = require('../config');
const logger = require('../lib/logger');

const ALLOWED_STATUSES = new Set(['draft', 'preparing', 'shipped', 'delivered', 'cancelled']);

function normalizeStatus(status) {
  if (!status) return null;
  const value = String(status).trim().toLowerCase();
  if (value === 'pending') return 'draft';
  return value;
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

async function listOrders({ limit = 20, offset = 0, status, customerId } = {}) {
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  return Order.findAll({ where, limit, offset, order: [['id', 'DESC']] });
}

async function getOrderById(id) {
  return Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
}

async function createOrder(payload) {
  const customerId = payload.customerId ? Number(payload.customerId) : null;
  if (payload.customerId && (!customerId || Number.isNaN(customerId))) {
    const err = new Error('customerId is invalid');
    err.statusCode = 400;
    throw err;
  }

  let customer = null;
  if (customerId) {
    customer = await Customer.findByPk(customerId);
    if (!customer) {
      const err = new Error('customer not found');
      err.statusCode = 400;
      throw err;
    }
  }

  const guest = payload.guestCustomer || null;
  if (!customerId && !guest) {
    const err = new Error('customerId or guestCustomer is required');
    err.statusCode = 400;
    throw err;
  }

  const status = normalizeStatus(payload.status) || 'draft';
  if (!ALLOWED_STATUSES.has(status)) {
    const err = new Error('status is invalid');
    err.statusCode = 400;
    throw err;
  }

  const requiresShipping = toBool(payload.requiresShipping, false);
  const shippingAddress = payload.shippingAddress ? String(payload.shippingAddress).trim() : null;
  if (requiresShipping && !shippingAddress) {
    const err = new Error('shippingAddress is required when requiresShipping is true');
    err.statusCode = 400;
    throw err;
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    const err = new Error('items is required');
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async transaction => {
    const order = await Order.create(
      {
        customerId,
        guestFirstName: guest?.firstName ? String(guest.firstName).trim() : null,
        guestLastName: guest?.lastName ? String(guest.lastName).trim() : null,
        guestPhone: guest?.phone ? String(guest.phone).replace(/[^\d]/g, '') : null,
        guestEmail: guest?.email ? String(guest.email).trim().toLowerCase() : null,
        requiresShipping,
        shippingAddress: shippingAddress || null,
        status,
        totalAmount: null
      },
      { transaction }
    );

    let total = 0;

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      if (!productId || Number.isNaN(productId) || !quantity || Number.isNaN(quantity) || quantity <= 0) {
        const err = new Error('item.productId and item.quantity are required');
        err.statusCode = 400;
        throw err;
      }

      const product = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!product) {
        const err = new Error(`product not found: ${productId}`);
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(unitPrice)) {
        const err = new Error('item.unitPrice is required and must be a number');
        err.statusCode = 400;
        throw err;
      }

      if (product.trackStock) {
        const current = product.stockQuantity ?? 0;
        const next = current - quantity;
        if (next < 0 && !config.order.allowBackorder) {
          const err = new Error(`insufficient stock for productId ${productId}`);
          err.statusCode = 409;
          throw err;
        }
        await product.update({ stockQuantity: next }, { transaction });
      }

      const lineTotal = unitPrice * quantity;
      total += lineTotal;

      await OrderItem.create(
        {
          orderId: order.id,
          productId,
          quantity,
          unitPrice,
          lineTotal
        },
        { transaction }
      );
    }

    await order.update({ totalAmount: total }, { transaction });
    logger.info('Order created', { orderId: order.id, customerId: customer?.id ?? null });
    return getOrderById(order.id);
  });
}

async function updateOrderStatus(id, payload) {
  const order = await Order.findByPk(id);
  if (!order) return null;

  const status = normalizeStatus(payload.status);
  if (!status || !ALLOWED_STATUSES.has(status)) {
    const err = new Error('status is invalid');
    err.statusCode = 400;
    throw err;
  }

  const transitions = {
    draft: new Set(['preparing', 'cancelled']),
    preparing: new Set(['shipped', 'cancelled']),
    shipped: new Set(['delivered']),
    delivered: new Set([]),
    cancelled: new Set([])
  };
  const allowed = transitions[order.status] || new Set();
  if (!allowed.has(status)) {
    const err = new Error(`invalid status transition: ${order.status} -> ${status}`);
    err.statusCode = 409;
    throw err;
  }

  await order.update({ status });
  logger.info('Order status updated', { orderId: order.id, status });
  return order;
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
