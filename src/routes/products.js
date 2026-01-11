const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const logger = require('../lib/logger');

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const products = await productService.listProducts({ limit, offset });
    res.json(products);
  } catch (err) {
    logger.error('Error listing products', { err, traceId: req.traceId });
    next(err);
  }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    logger.error('Error creating product', { err, traceId: req.traceId });
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductById(Number(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    logger.error('Error getting product', { err, traceId: req.traceId });
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const product = await productService.updateProduct(Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    logger.error('Error updating product', { err, traceId: req.traceId });
    next(err);
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting product', { err, traceId: req.traceId });
    next(err);
  }
});

// POST /api/products/:id/prices (upsert)
router.post('/:id/prices', async (req, res, next) => {
  try {
    const product = await productService.upsertProductPrice(Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    logger.error('Error upserting product price', { err, traceId: req.traceId });
    next(err);
  }
});

module.exports = router;
