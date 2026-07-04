const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/stats', protect, authorize('admin'), c.stats);
router.get('/ai-analytics', protect, authorize('admin'), c.aiAnalytics);

module.exports = router;
