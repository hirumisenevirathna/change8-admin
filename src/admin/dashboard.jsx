app.get('/dashboard', async (req, res) => {
  const session = req.session?.adminUser || req.session?.passport?.user;
  
  const totalUsers    = await User.count();
  const totalOrders   = await Order.count();
  const totalProducts = await Product.count();
  const totalRevenue  = parseFloat(await Order.sum('total') || 0).toFixed(2);

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Change8 Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f9; }
    .topbar { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .topbar .logo { font-size: 20px; font-weight: 700; color: #3b82f6; text-decoration: none; }
    .topbar .back { font-size: 14px; color: #3b82f6; text-decoration: none; }
    .topbar .back:hover { text-decoration: underline; }
    .content { padding: 2.5rem; }
    h1 { color: #1e3a5f; font-size: 26px; margin-bottom: 6px; }
    .sub { color: #888; font-size: 14px; margin-bottom: 2.5rem; }
    .cards { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
    .card { background: white; border-radius: 14px; padding: 1.8rem 2rem; flex: 1; min-width: 180px; box-shadow: 0 2px 10px rgba(0,0,0,0.07); border-left: 4px solid #3b82f6; }
    .card.green { border-left-color: #10b981; }
    .card.purple { border-left-color: #8b5cf6; }
    .card.orange { border-left-color: #f59e0b; }
    .label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
    .value { font-size: 34px; font-weight: 700; color: #1e3a5f; }
  </style>
</head>
<body>
  <div class="topbar">
    <a class="logo" href="/admin">▲ adminJS</a>
    <a class="back" href="/admin">← Back to Admin Panel</a>
  </div>
  <div class="content">
    <h1>Admin Dashboard</h1>
    <p class="sub">Change8 eCommerce — system overview</p>
    <div class="cards">
      <div class="card">
        <div class="label">Total Users</div>
        <div class="value">${totalUsers}</div>
      </div>
      <div class="card green">
        <div class="label">Total Orders</div>
        <div class="value">${totalOrders}</div>
      </div>
      <div class="card purple">
        <div class="label">Total Products</div>
        <div class="value">${totalProducts}</div>
      </div>
      <div class="card orange">
        <div class="label">Total Revenue</div>
        <div class="value">$${totalRevenue}</div>
      </div>
    </div>
  </div>
</body>
</html>`);
});