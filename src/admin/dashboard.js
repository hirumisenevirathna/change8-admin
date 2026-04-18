const { User, Order, Product, OrderItem } = require('../models');

const dashboardHandler = async (req, res) => {
  const currentAdmin = req.session?.adminUser;

  if (currentAdmin?.role === 'admin') {
    const totalUsers    = await User.count();
    const totalOrders   = await Order.count();
    const totalProducts = await Product.count();

    const revenueResult = await Order.sum('total');
    const totalRevenue  = parseFloat(revenueResult || 0).toFixed(2);

    return res.json({ role: 'admin', totalUsers, totalOrders, totalProducts, totalRevenue });
  }

  // Regular user — show their own orders
  const myOrders = await Order.findAll({
    where: { UserId: currentAdmin?.id },
    include: [{ model: OrderItem }],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  return res.json({ role: 'user', myOrders });
};

module.exports = dashboardHandler;