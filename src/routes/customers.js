const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const logger = require('../lib/logger');

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const customers = await customerService.listCustomers({ limit, offset });
    res.json(customers);
  } catch (err) {
    logger.error('Error listing customers', { err, traceId: req.traceId });
    next(err);
  }
});

// POST /api/customers
router.post('/', async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    logger.error('Error creating customer', { err, traceId: req.traceId });
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    logger.error('Error getting customer', { err, traceId: req.traceId });
    next(err);
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    logger.error('Error updating customer', { err, traceId: req.traceId });
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await customerService.deleteCustomer(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting customer', { err, traceId: req.traceId });
    next(err);
  }
});

module.exports = router;
