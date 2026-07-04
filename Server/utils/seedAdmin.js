require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eduforge');
  const email = 'admin@eduforge.io';
  if (await User.findOne({ email })) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({ name: 'Admin', email, password: 'Admin@123', role: 'admin' });
  console.log('✅ Admin created: admin@eduforge.io / Admin@123');
  process.exit(0);
})();
