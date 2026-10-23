const mongoose = require('mongoose');

const noticeReadStatusSchema = new mongoose.Schema({
  noticeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, { timestamps: true });

const NoticeReadStatus = mongoose.model('NoticeReadStatus', noticeReadStatusSchema);
module.exports = NoticeReadStatus;
