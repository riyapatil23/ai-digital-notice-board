const express = require('express');
const router = express.Router();
const {
  getStudentNotices,
  getNoticeById,
  markNoticeRead,
  getUpcomingDeadlines,
  translateNotice
} = require('../controllers/studentController');
const { protect, student } = require('../middleware/auth');

router.get('/notices', protect, student, getStudentNotices);
router.get('/notices/:id', protect, student, getNoticeById);
router.put('/notices/:id/read', protect, student, markNoticeRead);
router.get('/deadlines', protect, student, getUpcomingDeadlines);
router.post('/notices/:id/translate', protect, student, translateNotice);

module.exports = router;
