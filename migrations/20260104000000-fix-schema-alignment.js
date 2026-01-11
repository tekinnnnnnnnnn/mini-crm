'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const customers = await queryInterface.describeTable('customers');
    if (!customers.is_active) {
      await queryInterface.addColumn('customers', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    const orders = await queryInterface.describeTable('orders');
    if (orders.status && orders.status.allowNull) {
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      });
    }

    try {
      await queryInterface.addConstraint('orders', {
        fields: ['customer_id'],
        type: 'foreign key',
        name: 'fk_orders_customer_id_customers',
        references: {
          table: 'customers',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    } catch (e) {
    }

    try {
      await queryInterface.addIndex('orders', ['customer_id'], { name: 'idx_orders_customer_id' });
    } catch (e) {
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('orders', 'idx_orders_customer_id');
    } catch (e) {}

    try {
      await queryInterface.removeConstraint('orders', 'fk_orders_customer_id_customers');
    } catch (e) {}

    try {
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } catch (e) {}

    try {
      await queryInterface.removeColumn('customers', 'is_active');
    } catch (e) {}
  }
};

