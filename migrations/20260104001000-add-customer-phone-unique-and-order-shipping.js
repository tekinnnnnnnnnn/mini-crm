'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    // customers.phone unique (null allowed)
    try {
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique ON customers (phone) WHERE phone IS NOT NULL;'
        );
      } else {
        await queryInterface.addIndex('customers', ['phone'], {
          unique: true,
          name: 'idx_customers_phone_unique'
        });
      }
    } catch (e) {
      // ignore if exists / dialect limitations
    }

    // orders: requires_shipping + shipping_address
    const orders = await queryInterface.describeTable('orders');
    if (!orders.requires_shipping) {
      await queryInterface.addColumn('orders', 'requires_shipping', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    if (!orders.shipping_address) {
      await queryInterface.addColumn('orders', 'shipping_address', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('customers', 'idx_customers_phone_unique');
    } catch (e) {}

    try {
      await queryInterface.removeColumn('orders', 'shipping_address');
    } catch (e) {}
    try {
      await queryInterface.removeColumn('orders', 'requires_shipping');
    } catch (e) {}
  }
};

