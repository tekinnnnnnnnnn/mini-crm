const { Customer } = require('../models');
const logger = require('../lib/logger');
const { normalizeEmail, normalizePhoneTR, isNonEmptyString, isValidEmail } = require('../lib/validation');

async function listCustomers({ limit = 50, offset = 0 } = {}) {
  return Customer.findAll({
    limit,
    offset,
    order: [['id', 'DESC']]
  });
}

async function createCustomer(payload) {
  const firstName = isNonEmptyString(payload.firstName) ? payload.firstName.trim() : null;
  if (!firstName) {
    const err = new Error('firstName is required');
    err.statusCode = 400;
    throw err;
  }

  const email = normalizeEmail(payload.email);
  if (email && !isValidEmail(email)) {
    const err = new Error('email is invalid');
    err.statusCode = 400;
    throw err;
  }

  if (payload.phone !== undefined && payload.phone !== null && payload.phone !== '') {
    const existing = await Customer.findOne({ where: { phone: normalizePhoneTR(payload.phone) } });
    if (existing) {
      const err = new Error('customer with this phone already exists');
      err.statusCode = 409;
      throw err;
    }
  }

  const customer = await Customer.create({
    firstName,
    lastName: isNonEmptyString(payload.lastName) ? payload.lastName.trim() : null,
    phone: normalizePhoneTR(payload.phone),
    email,
    address: isNonEmptyString(payload.address) ? payload.address.trim() : null
  });

  logger.info('Customer created', { customerId: customer.id });
  return customer;
}

async function getCustomerById(id) {
  return Customer.findByPk(id);
}

async function updateCustomer(id, payload) {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;

  const patch = {};

  if ('firstName' in payload) {
    if (!isNonEmptyString(payload.firstName)) {
      const err = new Error('firstName cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    patch.firstName = payload.firstName.trim();
  }
  if ('lastName' in payload) patch.lastName = isNonEmptyString(payload.lastName) ? payload.lastName.trim() : null;
  if ('phone' in payload) patch.phone = normalizePhoneTR(payload.phone);
  if ('email' in payload) {
    const email = normalizeEmail(payload.email);
    if (email && !isValidEmail(email)) {
      const err = new Error('email is invalid');
      err.statusCode = 400;
      throw err;
    }
    patch.email = email;
  }
  if ('address' in payload) patch.address = isNonEmptyString(payload.address) ? payload.address.trim() : null;

  if ('phone' in patch && patch.phone) {
    const existing = await Customer.findOne({ where: { phone: patch.phone } });
    if (existing && existing.id !== customer.id) {
      const err = new Error('customer with this phone already exists');
      err.statusCode = 409;
      throw err;
    }
  }

  await customer.update(patch);
  logger.info('Customer updated', { customerId: customer.id });
  return customer;
}

async function deleteCustomer(id) {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;

  if ('isActive' in customer) {
    await customer.update({ isActive: false });
  } else {
    await customer.destroy();
  }

  logger.info('Customer deleted', { customerId: id });
  return true;
}

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
