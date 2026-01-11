const { Product, ProductPrice } = require('../models');
const logger = require('../lib/logger');
const { isNonEmptyString } = require('../lib/validation');

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toIntOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function normalizePriceType(value) {
  if (!isNonEmptyString(value)) return null;
  return value.trim().toLowerCase();
}

async function listProducts({ limit = 50, offset = 0 } = {}) {
  return Product.findAll({
    limit,
    offset,
    order: [['id', 'DESC']],
    include: [{ model: ProductPrice, as: 'prices' }]
  });
}

async function getProductById(id) {
  return Product.findByPk(id, { include: [{ model: ProductPrice, as: 'prices' }] });
}

async function createProduct(payload) {
  const name = isNonEmptyString(payload.name) ? payload.name.trim() : null;
  if (!name) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }

  const trackStock = toBool(payload.trackStock, true);
  const stockQuantity = toIntOrNull(payload.stockQuantity);
  if (trackStock && stockQuantity === null) {
    const err = new Error('stockQuantity is required when trackStock is true');
    err.statusCode = 400;
    throw err;
  }

  const product = await Product.create({
    name,
    sku: isNonEmptyString(payload.sku) ? payload.sku.trim() : null,
    trackStock,
    stockQuantity: trackStock ? stockQuantity : null
  });

  logger.info('Product created', { productId: product.id });
  return getProductById(product.id);
}

async function updateProduct(id, payload) {
  const product = await Product.findByPk(id);
  if (!product) return null;

  const patch = {};
  if ('name' in payload) {
    if (!isNonEmptyString(payload.name)) {
      const err = new Error('name cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    patch.name = payload.name.trim();
  }
  if ('sku' in payload) patch.sku = isNonEmptyString(payload.sku) ? payload.sku.trim() : null;
  if ('trackStock' in payload) patch.trackStock = toBool(payload.trackStock, product.trackStock);
  if ('stockQuantity' in payload) patch.stockQuantity = toIntOrNull(payload.stockQuantity);

  const nextTrackStock = 'trackStock' in patch ? patch.trackStock : product.trackStock;
  const nextStockQuantity = 'stockQuantity' in patch ? patch.stockQuantity : product.stockQuantity;
  if (nextTrackStock && nextStockQuantity === null) {
    const err = new Error('stockQuantity is required when trackStock is true');
    err.statusCode = 400;
    throw err;
  }
  if (!nextTrackStock) patch.stockQuantity = null;

  await product.update(patch);
  logger.info('Product updated', { productId: product.id });
  return getProductById(product.id);
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) return null;
  await product.update({ isActive: false });
  logger.info('Product deactivated', { productId: product.id });
  return true;
}

async function upsertProductPrice(productId, payload) {
  const product = await Product.findByPk(productId);
  if (!product) return null;

  const priceType = normalizePriceType(payload.priceType);
  if (!priceType) {
    const err = new Error('priceType is required');
    err.statusCode = 400;
    throw err;
  }

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount)) {
    const err = new Error('amount is required and must be a number');
    err.statusCode = 400;
    throw err;
  }

  const currency = isNonEmptyString(payload.currency) ? payload.currency.trim().toUpperCase() : 'TRY';

  const [price, created] = await ProductPrice.findOrCreate({
    where: { productId, priceType },
    defaults: { amount, currency, isActive: true }
  });

  if (!created) {
    await price.update({ amount, currency, isActive: true });
  }

  logger.info('Product price upserted', { productId, priceType });
  return getProductById(productId);
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upsertProductPrice
};
