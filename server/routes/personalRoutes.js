const express = require('express');
const router = express.Router();
const {
  askAINotice,
  summarizePersonal,
  getPersonalHistory,
  translatePersonal
} = require('../controllers/personalController');
const { protect, student } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/ask-ai', protect, student, askAINotice);
router.post('/summarize', protect, student, upload.single('file'), summarizePersonal);
router.get('/history', protect, student, getPersonalHistory);
router.post('/translate', protect, student, translatePersonal);

module.exports = router;
