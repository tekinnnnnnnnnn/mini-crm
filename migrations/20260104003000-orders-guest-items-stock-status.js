'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = new Set(tables.map(t => (typeof t === 'string' ? t : t.tableName)));

    // orders: allow customer_id null + guest fields + status default draft + shipping already added earlier
    const orders = await queryInterface.describeTable('orders');

    if (orders.customer_id && orders.customer_id.allowNull === false) {
      await queryInterface.changeColumn('orders', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!orders.guest_first_name) {
      await queryInterface.addColumn('orders', 'guest_first_name', { type: Sequelize.STRING, allowNull: true });
    }
    if (!orders.guest_last_name) {
      await queryInterface.addColumn('orders', 'guest_last_name', { type: Sequelize.STRING, allowNull: true });
    }
    if (!orders.guest_phone) {
      await queryInterface.addColumn('orders', 'guest_phone', { type: Sequelize.STRING, allowNull: true });
    }
    if (!orders.guest_email) {
      await queryInterface.addColumn('orders', 'guest_email', { type: Sequelize.STRING, allowNull: true });
    }

    try {
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'draft'
      });
    } catch (e) {}

    try {
      await queryInterface.sequelize.query("UPDATE orders SET status='draft' WHERE status IS NULL;");
    } catch (e) {}

    if (tableNames.has('order_items')) return;

    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      line_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    try {
      await queryInterface.addConstraint('order_items', {
        fields: ['order_id'],
        type: 'foreign key',
        name: 'fk_order_items_order_id_orders',
        references: { table: 'orders', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (e) {}

    try {
      await queryInterface.addConstraint('order_items', {
        fields: ['product_id'],
        type: 'foreign key',
        name: 'fk_order_items_product_id_products',
        references: { table: 'products', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('order_items', ['order_id'], { name: 'idx_order_items_order_id' });
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('order_items');
    } catch (e) {}

    try {
      await queryInterface.removeColumn('orders', 'guest_email');
    } catch (e) {}
    try {
      await queryInterface.removeColumn('orders', 'guest_phone');
    } catch (e) {}
    try {
      await queryInterface.removeColumn('orders', 'guest_last_name');
    } catch (e) {}
    try {
      await queryInterface.removeColumn('orders', 'guest_first_name');
    } catch (e) {}

    try {
      await queryInterface.changeColumn('orders', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (e) {}

    try {
      await queryInterface.changeColumn('orders', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      });
    } catch (e) {}
  }
};
