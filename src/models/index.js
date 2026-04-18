import User     from './User.js';
import Category from './Category.js';
import Product  from './Product.js';
import Order    from './Order.js';
import OrderItem from './OrderItem.js';
import Setting  from './Setting.js';

Category.hasMany(Product,   { foreignKey: 'CategoryId' });
Product.belongsTo(Category, { foreignKey: 'CategoryId' });

User.hasMany(Order,   { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

Order.hasMany(OrderItem,   { foreignKey: 'OrderId' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });

Product.hasMany(OrderItem,    { foreignKey: 'ProductId' });
OrderItem.belongsTo(Product,  { foreignKey: 'ProductId' });

export { User, Category, Product, Order, OrderItem, Setting };