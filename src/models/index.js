const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../lib/logger');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    storage: config.db.storage,
    dialectOptions: config.db.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
    logging: config.db.logSql ? msg => logger.debug(msg) : false
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Customer = require('./customer')(sequelize, Sequelize.DataTypes);
db.Order = require('./order')(sequelize, Sequelize.DataTypes);
db.OrderItem = require('./orderItem')(sequelize, Sequelize.DataTypes);
db.Product = require('./product')(sequelize, Sequelize.DataTypes);
db.ProductPrice = require('./productPrice')(sequelize, Sequelize.DataTypes);

db.Customer.hasMany(db.Order, { foreignKey: 'customerId' });
db.Order.belongsTo(db.Customer, { foreignKey: 'customerId' });

db.Product.hasMany(db.ProductPrice, { foreignKey: 'productId', as: 'prices' });
db.ProductPrice.belongsTo(db.Product, { foreignKey: 'productId' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'orderId', as: 'items' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });
db.Product.hasMany(db.OrderItem, { foreignKey: 'productId' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId' });

module.exports = db;
