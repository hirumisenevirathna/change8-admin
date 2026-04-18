import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

const adminAuth = {
  authenticate: async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  },
  cookieName: 'adminjs',
  cookiePassword: process.env.JWT_SECRET || 'secret-change-this-32chars-minimum!!',
};

export default adminAuth;