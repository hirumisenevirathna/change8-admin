import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:       { type: DataTypes.STRING, allowNull: false },
  price:      { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock:      { type: DataTypes.INTEGER, defaultValue: 0 },
  CategoryId: { type: DataTypes.INTEGER },
});

export default Product;