import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  status: { type: DataTypes.ENUM('pending','processing','shipped','delivered','cancelled'), defaultValue: 'pending' },
  total:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  UserId: { type: DataTypes.INTEGER },
});

export default Order;