'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = new Set(tables.map(t => (typeof t === 'string' ? t : t.tableName)));
    if (!tableNames.has('product_prices')) {
      await queryInterface.createTable('product_prices', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'TRY'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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
    }

    try {
      await queryInterface.addConstraint('product_prices', {
        fields: ['product_id'],
        type: 'foreign key',
        name: 'fk_product_prices_product_id_products',
        references: { table: 'products', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('product_prices', ['product_id', 'price_type'], {
        unique: true,
        name: 'idx_product_prices_product_id_price_type_unique'
      });
    } catch (e) {}
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('product_prices', 'idx_product_prices_product_id_price_type_unique');
    } catch (e) {}
    try {
      await queryInterface.removeConstraint('product_prices', 'fk_product_prices_product_id_products');
    } catch (e) {}
    await queryInterface.dropTable('product_prices');
  }
};
