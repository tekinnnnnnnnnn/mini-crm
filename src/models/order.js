module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      guestFirstName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      guestLastName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      guestPhone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      guestEmail: {
        type: DataTypes.STRING,
        allowNull: true
      },
      requiresShipping: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'draft'
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      }
    },
    {
      tableName: 'orders',
      underscored: true
    }
  );

  return Order;
};

