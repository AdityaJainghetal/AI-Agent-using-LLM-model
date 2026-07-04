const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already in use' });
  const user = await User.create({
    name, email, password,
    role: role === 'teacher' ? 'teacher' : 'student', // admin only via seed/promotion
  });
  res.status(201).json({ token: signToken(user._id), user: sanitize(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });
  res.json({ token: signToken(user._id), user: sanitize(user) });
};

exports.me = async (req, res) => res.json({ user: sanitize(req.user) });

function sanitize(u) {
  return {
    _id: u._id, name: u.name, email: u.email, role: u.role,
    avatar: u.avatar, bio: u.bio, phone: u.phone, xp: u.xp, streak: u.streak,
  };
}
