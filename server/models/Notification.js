const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: 'Notification',
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'NEW_NOTICE',
      'IMPORTANT_NOTICE',
      'DEADLINE',
      'EVENT',
      'CONNECTION',
      'SYSTEM',
      'AI_PROCESSING'
    ],
    default: 'NEW_NOTICE',
  },
  notice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // Extra metadata for deduplication or action links
  metadata: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Backward compatibility virtuals/aliases for legacy code using userId and noticeId
notificationSchema.virtual('userId').get(function() {
  return this.recipient;
}).set(function(val) {
  this.recipient = val;
});

notificationSchema.virtual('noticeId').get(function() {
  return this.notice;
}).set(function(val) {
  this.notice = val;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Compound index for fast queries & deduplication
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, notice: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
