const User = require('../models/User');

const Chat = require('../models/Chat');

exports.stats = async (_req, res) => {
  const [students, teachers, courses, enrollments, revenueAgg, certs, chats] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    
    Chat.countDocuments(),
  ]);
  res.json({
    students, teachers, courses, enrollments,
    revenue: revenueAgg[0]?.total || 0,
    certificates: certs,
    aiInteractions: chats,
  });
};

exports.aiAnalytics = async (_req, res) => {
  const byMode = await Chat.aggregate([
    { $group: { _id: '$mode', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ byMode });
};
