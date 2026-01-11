const express = require('express');
const crypto = require('crypto');
const logger = require('./lib/logger');
const config = require('./config');

const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  req.traceId = String(traceId);
  res.setHeader('x-trace-id', req.traceId);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      traceId: req.traceId
    };

    const requestLevel = (config.log.requests || 'info').toLowerCase();
    if (requestLevel === 'off') return;

    if (durationMs >= config.log.slowRequestMs) {
      logger.warn('slow_request', meta);
      return;
    }

    if (res.statusCode >= 500) logger.error('request', meta);
    else if (res.statusCode >= 400) logger.warn('request', meta);
    else if (requestLevel === 'debug') logger.debug('request', meta);
    else logger.info('request', meta);
  });
  next();
});

app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const meta = {
    traceId: req.traceId,
    method: req.method,
    path: req.originalUrl
  };

  if (statusCode >= 500) logger.error('Unhandled error', { err, ...meta });
  else logger.warn('Request error', { message: err.message, ...meta });

  res.status(statusCode).json({ message: err.message || 'Bir hata oluştu' });
});

module.exports = app;
