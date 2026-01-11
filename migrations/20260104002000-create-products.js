'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = new Set(tables.map(t => (typeof t === 'string' ? t : t.tableName)));
    if (tableNames.has('products')) return;

    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      track_stock: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      stock_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
