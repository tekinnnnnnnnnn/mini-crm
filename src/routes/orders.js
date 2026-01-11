const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const logger = require('../lib/logger');

// GET /api/orders?limit=20&status=pending&customerId=1
router.get('/', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const orders = await orderService.listOrders({
      limit,
      offset,
      status: req.query.status,
      customerId: req.query.customerId ? Number(req.query.customerId) : undefined
    });
    res.json(orders);
  } catch (err) {
    logger.error('Error listing orders', { err, traceId: req.traceId });
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    logger.error('Error getting order', { err, traceId: req.traceId });
    next(err);
  }
});

// POST /api/orders
router.post('/', async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    logger.error('Error creating order', { err, traceId: req.traceId });
    next(err);
  }
});

// POST /api/orders/:id/status
router.post('/:id/status', async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    logger.error('Error updating order status', { err, traceId: req.traceId });
    next(err);
  }
});

module.exports = router;
