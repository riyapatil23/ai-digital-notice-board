const mongoose = require('mongoose');

const personalUploadSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
  },
  aiSummary: {
    title: String,
    summary: String,
    importantPoints: [String],
    dates: [{
      label: String,
      date: String,
    }],
    deadline: {
      date: String,
      time: String,
    },
    requiredAction: String,
    eligibility: String,
    contactInformation: [String],
    links: [String]
  },
  translations: {
    type: Map,
    of: Object,
    default: {}
  }
}, { timestamps: true });

const PersonalUpload = mongoose.model('PersonalUpload', personalUploadSchema);
module.exports = PersonalUpload;
