const express = require('express');
const router = express.Router();
const {
  createNotice,
  retryNoticeAI,
  getAdminNotices,
  getNoticeStats
} = require('../controllers/noticeController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, admin, upload.single('file'), createNotice);
router.post('/:id/retry-ai', protect, admin, retryNoticeAI);
router.get('/', protect, admin, getAdminNotices);
router.get('/:id/stats', protect, admin, getNoticeStats);

module.exports = router;
