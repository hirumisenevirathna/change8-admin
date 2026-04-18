import { User, Category, Product, Order, OrderItem, Setting } from '../models/index.js';
import bcrypt from 'bcryptjs';

export default [
  {
    resource: User,
    options: {
      navigation: { show: false },
      actions: {
        list:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        show:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        edit:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        new:    { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        delete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
      },
      properties: {
        password: { isVisible: { list: false, edit: false, filter: false, show: false } },
      },
    },
  },
  { resource: Category, options: { isAccessible: () => true } },
  {
    resource: Product,
    options: {
      isAccessible: () => true,
      properties: { CategoryId: { reference: 'Category' } },
    },
  },
  {
    resource: Order,
    options: {
      isAccessible: () => true,
      properties: { UserId: { reference: 'User' } },
    },
  },
  {
    resource: OrderItem,
    options: {
      isAccessible: () => true,
      properties: {
        OrderId:   { reference: 'Order' },
        ProductId: { reference: 'Product' },
      },
    },
  },
  {
    resource: Setting,
    options: {
      navigation: { show: false },
      actions: {
        list:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        show:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        edit:   { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        new:    { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        delete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
      },
    },
  },
];