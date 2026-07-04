const User = require('../models/User');

exports.list = async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
};

exports.get = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
};

exports.updateMe = async (req, res) => {
  const updates = (({ name, bio, phone, avatar }) => ({ name, bio, phone, avatar }))(req.body);
  if (req.file) updates.avatar = `/uploads/profiles/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json(user);
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'teacher', 'student'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.json(user);
};

exports.toggleActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json(user);
};

exports.remove = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};
