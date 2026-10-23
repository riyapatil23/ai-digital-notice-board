const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    default: 'General',
  },
  department: {
    type: String,
    default: 'Not specified',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
  },
  originalFileUrl: {
    type: String, // path to the uploaded file
    required: true,
  },
  fileType: {
    type: String, // pdf, image
  },
  extractedText: {
    type: String, // raw text extracted from PDF or OCR
    default: '',
  },
  aiProcessingStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  aiProcessingError: {
    type: String,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  targetAudience: [{
    type: String,
  }],
  aiSummary: {
    type: String,
  },
  summary: {
    type: String, // alias for aiSummary
  },
  simplifiedExplanation: {
    type: String,
  },
  importantPoints: [{
    type: String,
  }],
  dates: [{
    label: String,
    date: String,
  }],
  eventDate: {
    type: String,
    default: null,
  },
  deadline: {
    date: { type: String, default: 'Not specified in the notice' },
    time: { type: String, default: 'Not specified in the notice' },
  },
  rawDeadline: {
    type: String, // string representation if provided
  },
  venue: {
    type: String,
    default: 'Not specified',
  },
  requiredAction: {
    type: String,
  },
  actionRequired: {
    type: String, // alias for requiredAction
  },
  eligibility: {
    type: String,
  },
  keywords: [{
    type: String,
  }],
  language: {
    type: String,
    default: 'English',
  },
  contactInformation: [{
    type: String,
  }],
  links: [{
    type: String,
  }],
  studentsReachedCount: {
    type: Number,
    default: 0,
  },
  translations: {
    type: Map,
    of: Object,
    default: {}
  }
}, { timestamps: true });

// Pre-save hook to synchronize aliases
noticeSchema.pre('save', function() {
  if (this.aiSummary && !this.summary) {
    this.summary = this.aiSummary;
  } else if (this.summary && !this.aiSummary) {
    this.aiSummary = this.summary;
  }
  if (this.requiredAction && !this.actionRequired) {
    this.actionRequired = this.requiredAction;
  } else if (this.actionRequired && !this.requiredAction) {
    this.requiredAction = this.actionRequired;
  }
});

const Notice = mongoose.model('Notice', noticeSchema);
module.exports = Notice;
