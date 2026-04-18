import 'dotenv/config';
import express from 'express';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSSequelize from '@adminjs/sequelize';
import sequelize from './src/config/database.js';
import { User, Category, Product, Order, OrderItem, Setting } from './src/models/index.js';
import adminAuth from './src/admin/auth.js';
import authRoutes from './src/routes/auth.js';
import bcrypt from 'bcryptjs';
import { componentLoader, Components } from './src/admin/components.js';

AdminJS.registerAdapter({ Database: AdminJSSequelize.Database, Resource: AdminJSSequelize.Resource });

const app = express();
app.use(express.json());

// debug — remove later
const origAuth = adminAuth.authenticate;
adminAuth.authenticate = async (email, password) => {
  const result = await origAuth(email, password);
  console.log('Auth result:', result);
  return result;
};

const adminJs = new AdminJS({
  resources: [
    {
      resource: User,
      options: {
        navigation: { show: false },
        actions: {
          list:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          show:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          edit:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          new:        { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          delete:     { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
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
        properties: { CategoryId: { reference: 'Categories' } },
      },
    },
    {
  resource: Order,
  options: {
    isAccessible: () => true,
    properties: { UserId: { reference: 'Users' } },
    actions: {
      list: {
        after: async (response, request, context) => {
          return response;
        },
      },
    },
  },
},
    {
      resource: OrderItem,
      options: {
        isAccessible: () => true,
        properties: {
          OrderId:   { reference: 'Orders' },
          ProductId: { reference: 'Products' },
        },
      },
    },
    {
      resource: Setting,
      options: {
        navigation: { show: true },
        actions: {
          list:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          show:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          edit:       { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          new:        { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          delete:     { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        },
        properties: {
          id:    { isVisible: { list: true, show: true, edit: false, filter: true } },
          key:   { isVisible: true },
          value: { isVisible: true },
          label: { isVisible: true },
        },
      },
    },
  ],
  rootPath: '/admin',
  componentLoader,
  branding: {
  companyName: 'Change8 Admin',
  softwareBrothers: false,
},
  dashboard: {
    component: Components.Dashboard,
    handler: async (req, res) => {
      const currentAdmin = req.session?.adminUser;
      if (currentAdmin?.role === 'admin') {
        const totalUsers    = await User.count();
        const totalOrders   = await Order.count();
        const totalProducts = await Product.count();
        const totalRevenue  = parseFloat(await Order.sum('total') || 0).toFixed(2);
        return { role: 'admin', totalUsers, totalOrders, totalProducts, totalRevenue };
      }
      const myOrders = await Order.findAll({
        where: { UserId: currentAdmin?.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
      });
      return {
        role: 'user',
        name: currentAdmin?.name,
        email: currentAdmin?.email,
        totalOrders: myOrders.length,
        recentOrders: myOrders.map(o => ({ id: o.id, status: o.status, total: o.total })),
      };
    },
  },
});

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate: adminAuth.authenticate,
    cookieName:     adminAuth.cookieName,
    cookiePassword: adminAuth.cookiePassword,
  },
  null,
  { resave: false, saveUninitialized: false }
);

// Force redirect dashboard to /dashboard

app.use(adminJs.options.rootPath, adminRouter);
app.use('/api', authRoutes);
app.get('/', (req, res) => res.json({ message: 'Change8 API running' }));

// Admin dashboard (role-based)
app.get('/dashboard', async (req, res) => {
  const totalUsers    = await User.count();
  const totalOrders   = await Order.count();
  const totalProducts = await Product.count();
  const totalRevenue  = parseFloat(await Order.sum('total') || 0).toFixed(2);

  const recentOrders = await Order.findAll({
    include: [{ model: User, attributes: ['name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Change8 Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; }

    .sidebar {
      width: 240px; min-height: 100vh; background: #1e293b;
      display: flex; flex-direction: column; position: fixed; left: 0; top: 0;
    }
    .sidebar-logo {
      padding: 1.5rem; font-size: 18px; font-weight: 700;
      color: #3b82f6; border-bottom: 1px solid #334155;
      text-decoration: none; display: block;
    }
    .sidebar-section { padding: 1rem 0.75rem 0.5rem; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 1.25rem; color: #94a3b8; text-decoration: none;
      font-size: 14px; border-radius: 8px; margin: 2px 8px;
      transition: all 0.15s;
    }
    .nav-item:hover { background: #334155; color: white; }
    .nav-item.active { background: #3b82f6; color: white; }
    .nav-icon { font-size: 16px; width: 20px; text-align: center; }

    .main { margin-left: 240px; flex: 1; min-height: 100vh; }
    .topbar {
      background: white; padding: 0 2rem; height: 60px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .page-title { font-size: 16px; font-weight: 600; color: #374151; }
    .admin-badge { background: #dbeafe; color: #1e40af; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }

    .content { padding: 2rem; }
    .header { margin-bottom: 2rem; }
    .header h1 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .header p { color: #6b7280; font-size: 14px; }

    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
    .card {
      background: white; border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07); border-top: 4px solid #3b82f6;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
    .card.green  { border-top-color: #10b981; }
    .card.purple { border-top-color: #8b5cf6; }
    .card.orange { border-top-color: #f59e0b; }
    .card-icon { font-size: 28px; margin-bottom: 12px; }
    .card-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .card-value { font-size: 36px; font-weight: 700; color: #111827; }

    .section { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px solid #f3f4f6; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; }
    td { padding: 12px; border-top: 1px solid #f9fafb; font-size: 14px; color: #374151; }
    tr:hover td { background: #f9fafb; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.delivered { background: #d1fae5; color: #065f46; }
    .badge.pending   { background: #fef3c7; color: #92400e; }
    .badge.processing{ background: #dbeafe; color: #1e40af; }
    .badge.shipped   { background: #e0e7ff; color: #3730a3; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <div class="sidebar">
    <a class="sidebar-logo" href="/admin">▲ Change8 Admin</a>

    <div class="sidebar-section">Main</div>
    <a class="nav-item active" href="/dashboard">
      <span class="nav-icon">📊</span> Dashboard
    </a>

    <div class="sidebar-section">Resources</div>
    <a class="nav-item" href="/admin/resources/Users/actions/list">
      <span class="nav-icon">👥</span> Users
    </a>
    <a class="nav-item" href="/admin/resources/Categories/actions/list">
      <span class="nav-icon">📁</span> Categories
    </a>
    <a class="nav-item" href="/admin/resources/Products/actions/list">
      <span class="nav-icon">🛍️</span> Products
    </a>
    <a class="nav-item" href="/admin/resources/Orders/actions/list">
      <span class="nav-icon">📦</span> Orders
    </a>
    <a class="nav-item" href="/admin/resources/OrderItems/actions/list">
      <span class="nav-icon">📋</span> Order Items
    </a>

    <div class="sidebar-section">Config</div>
    <a class="nav-item" href="/settings-page">
      <span class="nav-icon">⚙️</span> Settings
    </a>

    <div style="margin-top:auto; padding: 1rem;">
      <a class="nav-item" href="/admin" style="background:#334155">
        <span class="nav-icon">🔙</span> Admin Panel
      </a>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <div class="topbar">
      <span class="page-title">Dashboard Overview</span>
      <span class="admin-badge">👑 Admin</span>
    </div>

    <div class="content">
      <div class="header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your store.</p>
      </div>

      <div class="cards">
        <div class="card">
          <div class="card-icon">👥</div>
          <div class="card-label">Total Users</div>
          <div class="card-value">${totalUsers}</div>
        </div>
        <div class="card green">
          <div class="card-icon">📦</div>
          <div class="card-label">Total Orders</div>
          <div class="card-value">${totalOrders}</div>
        </div>
        <div class="card purple">
          <div class="card-icon">🛍️</div>
          <div class="card-label">Total Products</div>
          <div class="card-value">${totalProducts}</div>
        </div>
        <div class="card orange">
          <div class="card-icon">💰</div>
          <div class="card-label">Total Revenue</div>
          <div class="card-value">LKR ${totalRevenue}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Recent Orders</div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${recentOrders.map(o => `
              <tr>
                <td>#${o.id}</td>
                <td>${o.User?.name || 'N/A'}<br>
                  <span style="color:#9ca3af;font-size:12px">${o.User?.email || ''}</span>
                </td>
                <td><span class="badge ${o.status}">${o.status}</span></td>
                <td style="font-weight:600">LKR ${o.total}</td>
                <td style="color:#9ca3af">${new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// User dashboard (role-based)
app.get('/user-dashboard', async (req, res) => {
  const currentAdmin = req.session?.adminUser ||
                       req.session?.['adminjs']?.adminUser;

  const myOrders = await Order.findAll({
    where: currentAdmin?.id ? { UserId: currentAdmin.id } : {},
    include: [{ model: OrderItem, include: [{ model: Product }] }],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>My Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; }
    .topbar { background: white; padding: 0 2rem; height: 60px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .logo { font-size: 18px; font-weight: 700; color: #3b82f6; text-decoration: none; }
    .back-btn { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; }
    .content { padding: 2rem 2.5rem; max-width: 900px; margin: 0 auto; }
    .profile-card { background: white; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); display: flex; align-items: center; gap: 1.5rem; }
    .avatar { width: 64px; height: 64px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: white; font-weight: 700; }
    .profile-info h2 { font-size: 20px; color: #111827; margin-bottom: 4px; }
    .profile-info p { color: #6b7280; font-size: 14px; }
    .role-badge { background: #dbeafe; color: #1e40af; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 6px; display: inline-block; }
    .stat-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); border-top: 4px solid #10b981; margin-bottom: 2rem; display: inline-block; min-width: 200px; }
    .card-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; }
    .card-value { font-size: 36px; font-weight: 700; color: #111827; }
    .section { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px solid #f3f4f6; }
    .order-row { padding: 1rem; border-radius: 10px; margin-bottom: 10px; background: #f9fafb; display: flex; justify-content: space-between; align-items: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.delivered { background: #d1fae5; color: #065f46; }
    .badge.pending   { background: #fef3c7; color: #92400e; }
    .badge.processing{ background: #dbeafe; color: #1e40af; }
    .badge.shipped   { background: #e0e7ff; color: #3730a3; }
    .badge.cancelled { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="topbar">
    <a class="logo" href="/admin">▲ Change8</a>
    <a style="color:#3b82f6;font-size:13px;text-decoration:none;margin-left:1rem;" href="/user-dashboard">📊 My Dashboard</a>
    <a class="back-btn" href="/admin">← Admin Panel</a>
  </div>
  <div class="content">
    <div class="profile-card">
      <div class="avatar">${(currentAdmin?.name || 'U')[0].toUpperCase()}</div>
      <div class="profile-info">
        <h2>${currentAdmin?.name || 'User'}</h2>
        <p>${currentAdmin?.email || ''}</p>
        <span class="role-badge">👤 Regular User</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="card-label">My Total Orders</div>
      <div class="card-value">${myOrders.length}</div>
    </div>

    <div class="section">
      <div class="section-title">📋 My Recent Orders</div>
      ${myOrders.length > 0 ? myOrders.map(o => `
        <div class="order-row">
          <span style="font-weight:600">Order #${o.id}</span>
          <span class="badge ${o.status}">${o.status}</span>
          <span style="color:#6b7280;font-size:13px">${new Date(o.createdAt).toLocaleDateString()}</span>
          <span style="font-weight:700;color:#111827">$${o.total}</span>
        </div>
      `).join('') : '<p style="color:#9ca3af;text-align:center;padding:2rem">No orders yet.</p>'}
    </div>
  </div>
</body>
</html>`);
});

// Settings page
app.get('/settings-page', async (req, res) => {
  const settings = await Setting.findAll();
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Settings</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; }
    .topbar { background: white; padding: 0 2rem; height: 60px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .logo { font-size: 18px; font-weight: 700; color: #3b82f6; text-decoration: none; }
    .back-btn { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500; }
    .content { padding: 2rem 2.5rem; max-width: 800px; margin: 0 auto; }
    .header { margin-bottom: 2rem; }
    .header h1 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .header p { color: #6b7280; font-size: 14px; }
    .section { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
    .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 0; border-bottom: 1px solid #f3f4f6; gap: 1rem; }
    .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
    .setting-label { font-size: 14px; font-weight: 600; color: #374151; min-width: 180px; }
    .setting-key { font-size: 12px; color: #9ca3af; margin-top: 2px; font-family: monospace; }
    .setting-input { flex: 1; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151; outline: none; }
    .setting-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .save-btn { background: #3b82f6; color: white; padding: 8px 20px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .save-btn:hover { background: #2563eb; }
    .toast { display: none; position: fixed; bottom: 2rem; right: 2rem; background: #10b981; color: white; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  </style>
</head>
<body>
  <div class="topbar">
    <a class="logo" href="/admin">▲ Change8</a>
    <a class="back-btn" href="/admin">← Admin Panel</a>
  </div>
  <div class="content">
    <div class="header">
      <h1>⚙️ Settings</h1>
      <p>Manage your store configuration</p>
    </div>
    <div class="section">
      ${settings.map(s => `
        <div class="setting-row">
          <div>
            <div class="setting-label">${s.label || s.key}</div>
            <div class="setting-key">${s.key}</div>
          </div>
          <input class="setting-input" id="input-${s.id}" value="${s.value || ''}" placeholder="Enter value..." />
          <button class="save-btn" onclick="saveSetting(${s.id}, '${s.key}')">Save</button>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="toast" id="toast">✅ Setting saved!</div>

  <script>
    async function saveSetting(id, key) {
      const value = document.getElementById('input-' + id).value;
      const res = await fetch('/api/settings/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2500);
      }
    }
  </script>
</body>
</html>`);
});

// Settings update API
app.put('/api/settings/:id', async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  await Setting.update({ value }, { where: { id } });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

await sequelize.authenticate();
console.log('DB connected');
await sequelize.sync({ alter: false });

app.listen(PORT, () => {
  console.log(`Server    => http://localhost:${PORT}`);
  console.log(`Admin     => http://localhost:${PORT}/admin`);
  console.log(`Dashboard => http://localhost:${PORT}/dashboard`);
});