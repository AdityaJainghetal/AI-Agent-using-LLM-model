const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/register', validate({
  name: { required: true, min: 2, max: 60 },
  email: { required: true, type: 'email' },
  password: { required: true, min: 6, max: 128 },
}), c.register);

router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true, min: 6 },
}), c.login);

router.get('/me', protect, c.me);

module.exports = router;
