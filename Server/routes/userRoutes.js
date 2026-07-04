const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadProfile } = require('../config/multer');

router.get('/', protect, authorize('admin'), c.list);
router.get('/:id', protect, c.get);
router.put('/me/update', protect, uploadProfile.single('avatar'), c.updateMe);
router.put('/:id/role', protect, authorize('admin'), c.updateRole);
router.put('/:id/toggle-active', protect, authorize('admin'), c.toggleActive);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;
