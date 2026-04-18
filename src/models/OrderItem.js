import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quantity:  { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  OrderId:   { type: DataTypes.INTEGER },
  ProductId: { type: DataTypes.INTEGER },
});

export default OrderItem;