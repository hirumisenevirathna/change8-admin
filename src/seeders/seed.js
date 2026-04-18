import 'dotenv/config';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import { User, Category, Product, Order, OrderItem, Setting } from '../models/index.js';

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Database synced');

  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass  = await bcrypt.hash('user123', 10);

  const admin = await User.create({ name: 'Admin User', email: 'admin@change8.com', password: adminPass, role: 'admin' });
  const user  = await User.create({ name: 'Test User',  email: 'user@change8.com',  password: userPass,  role: 'user' });

  const electronics = await Category.create({ name: 'Electronics' });
  const clothing    = await Category.create({ name: 'Clothing' });

  const laptop = await Product.create({ name: 'Laptop Pro',    price: 999.99, stock: 10,  CategoryId: electronics.id });
  const phone  = await Product.create({ name: 'Smartphone X',  price: 599.99, stock: 25,  CategoryId: electronics.id });
  const tshirt = await Product.create({ name: 'T-Shirt Basic', price: 19.99,  stock: 100, CategoryId: clothing.id });

  const order1 = await Order.create({ UserId: user.id, status: 'delivered', total: 1019.98 });
  await OrderItem.create({ OrderId: order1.id, ProductId: laptop.id, quantity: 1, unitPrice: 999.99 });
  await OrderItem.create({ OrderId: order1.id, ProductId: tshirt.id, quantity: 1, unitPrice: 19.99 });

  const order2 = await Order.create({ UserId: user.id, status: 'pending', total: 599.99 });
  await OrderItem.create({ OrderId: order2.id, ProductId: phone.id, quantity: 1, unitPrice: 599.99 });

  await Setting.create({ key: 'site_name',       value: 'Change8 Store', label: 'Site Name' });
  await Setting.create({ key: 'currency',         value: 'USD',           label: 'Currency' });
  await Setting.create({ key: 'maintenance_mode', value: 'false',         label: 'Maintenance Mode' });

  console.log('Seed complete!');
  console.log('Admin => admin@change8.com / admin123');
  console.log('User  => user@change8.com  / user123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });