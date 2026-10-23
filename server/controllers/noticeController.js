const Notice = require('../models/Notice');
const NoticeReadStatus = require('../models/NoticeReadStatus');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { extractTextFromFile } = require('../services/file/fileService');
const { analyzeNotice } = require('../services/ai/aiService');
const { notifyNoticePublished, notifyAIProcessing } = require('../services/notificationService');

// Admin publishes a notice
const createNotice = async (req, res) => {
  try {
    const { title, category, priority, department, venue, targetStudentsStr } = req.body;
    let targetStudents = [];
    if (targetStudentsStr) {
      try {
        targetStudents = JSON.parse(targetStudentsStr);
      } catch (e) {
        targetStudents = [];
      }
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload a PDF or Image (JPG, PNG).' });
    }

    const originalFileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    // 1. Extract text using PDF parser or local Tesseract OCR
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file.path, fileType);
    } catch (extractErr) {
      console.warn('Text extraction encountered issue:', extractErr.message);
      extractedText = '';
    }

    // 2. Perform AI Analysis with Gemini (with graceful zero-crash fallback)
    let aiResult = {};
    try {
      aiResult = await analyzeNotice(extractedText, { filePath: req.file.path, mimeType: fileType });
    } catch (aiErr) {
      console.error('AI Analysis failed:', aiErr.message);
      aiResult = {
        title: title || 'Official College Notice',
        summary: 'Notice uploaded. Summary processing failed.',
        simplifiedExplanation: 'Notice document uploaded. AI analysis could not be completed.',
        importantPoints: ['Please review the attached document for complete instructions.'],
        department: department || 'General Administration',
        category: category || 'General',
        priority: priority || 'LOW',
        aiProcessingStatus: 'failed',
        aiProcessingError: aiErr.message,
        deadline: { date: 'Not specified in the notice', time: 'Not specified in the notice' }
      };
    }

    // 3. Determine target students
    if (targetStudents.length === 0) {
      const connections = await Connection.find({ adminId: req.user._id, status: 'accepted' });
      if (connections.length > 0) {
        targetStudents = connections.map(c => c.studentId);
      } else {
        // If no explicit connections, target all students in database
        const allStudents = await User.find({ role: 'student' }).select('_id');
        targetStudents = allStudents.map(s => s._id);
      }
    }

    // 4. Save Notice in MongoDB
    const finalPriority = (priority || aiResult.priority || 'LOW').toUpperCase();
    const notice = await Notice.create({
      title: title || aiResult.title || 'Official College Notice',
      category: category || aiResult.category || 'General',
      department: department || aiResult.department || 'Not specified',
      priority: ['LOW', 'MEDIUM', 'HIGH'].includes(finalPriority) ? finalPriority : 'LOW',
      originalFileUrl,
      fileType,
      extractedText: extractedText || '',
      aiProcessingStatus: aiResult.aiProcessingStatus || 'completed',
      aiProcessingError: aiResult.aiProcessingError || null,
      createdBy: req.user._id,
      targetStudents,
      targetAudience: aiResult.targetAudience || ['All Students'],
      aiSummary: aiResult.summary || '',
      summary: aiResult.summary || '',
      simplifiedExplanation: aiResult.simplifiedExplanation || aiResult.summary || '',
      importantPoints: aiResult.importantPoints || [],
      dates: aiResult.dates || [],
      eventDate: aiResult.eventDate || null,
      deadline: aiResult.deadline || { date: 'Not specified in the notice', time: 'Not specified in the notice' },
      venue: venue || aiResult.venue || 'Not specified',
      requiredAction: aiResult.requiredAction || aiResult.actionRequired || '',
      actionRequired: aiResult.requiredAction || aiResult.actionRequired || '',
      eligibility: aiResult.eligibility || 'All Students',
      keywords: aiResult.keywords || [],
      contactInformation: aiResult.contactInformation || [],
      links: aiResult.links || [],
      studentsReachedCount: targetStudents.length
    });

    // 5. Create unread status tracking for students
    if (targetStudents.length > 0) {
      const statusDocs = targetStudents.map(studentId => ({
        noticeId: notice._id,
        studentId,
        isRead: false
      }));
      await NoticeReadStatus.insertMany(statusDocs).catch(err => console.warn('Status save error:', err.message));
    }

    // 6. Trigger Real Notifications (NEW_NOTICE, IMPORTANT_NOTICE, DEADLINE, AI_PROCESSING)
    await notifyNoticePublished(notice, targetStudents, req.user._id);
    await notifyAIProcessing(req.user._id, notice._id, notice.aiProcessingStatus, notice.title, notice.aiProcessingError);

    // 7. Pre-warm common translations (Marathi, Hindi, Gujarati) asynchronously in background
    setImmediate(async () => {
      try {
        const { translateNoticeContent } = require('../services/ai/translateService');
        const contentJson = {
          title: notice.title,
          summary: notice.aiSummary,
          simplifiedExplanation: notice.simplifiedExplanation,
          importantPoints: notice.importantPoints,
          dates: notice.dates,
          deadline: notice.deadline,
          requiredAction: notice.requiredAction,
          eligibility: notice.eligibility,
          contactInformation: notice.contactInformation,
          links: notice.links
        };
        const [mr, hi, gu] = await Promise.all([
          translateNoticeContent(contentJson, 'Marathi'),
          translateNoticeContent(contentJson, 'Hindi'),
          translateNoticeContent(contentJson, 'Gujarati')
        ]);
        const freshNotice = await Notice.findById(notice._id);
        if (freshNotice) {
          if (!freshNotice.translations) freshNotice.translations = new Map();
          freshNotice.translations.set('Marathi', mr);
          freshNotice.translations.set('Hindi', hi);
          freshNotice.translations.set('Gujarati', gu);
          await freshNotice.save();
        }
      } catch (bgErr) {
        console.warn('Background translation pre-warm warning:', bgErr.message);
      }
    });

    res.status(201).json(notice);
  } catch (error) {
    console.error('Error in createNotice:', error);
    res.status(500).json({ message: error.message || 'Error creating notice' });
  }
};

// Retry AI analysis if initial Gemini call failed
const retryNoticeAI = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    let text = notice.extractedText;
    if (!text && notice.originalFileUrl) {
      const fullPath = require('path').join(__dirname, '../..', notice.originalFileUrl);
      try {
        text = await extractTextFromFile(fullPath, notice.fileType);
        notice.extractedText = text;
      } catch (e) {
        // Continue with empty or existing
      }
    }

    const aiResult = await analyzeNotice(text || notice.title, {
      filePath: notice.originalFileUrl ? require('path').join(__dirname, '../..', notice.originalFileUrl) : null,
      mimeType: notice.fileType
    });

    notice.title = notice.title || aiResult.title;
    notice.aiSummary = aiResult.summary;
    notice.summary = aiResult.summary;
    notice.simplifiedExplanation = aiResult.simplifiedExplanation;
    notice.importantPoints = aiResult.importantPoints;
    notice.department = aiResult.department;
    notice.category = aiResult.category;
    notice.priority = aiResult.priority;
    notice.deadline = aiResult.deadline;
    notice.dates = aiResult.dates;
    notice.requiredAction = aiResult.requiredAction;
    notice.actionRequired = aiResult.requiredAction;
    notice.targetAudience = aiResult.targetAudience;
    notice.aiProcessingStatus = aiResult.aiProcessingStatus;
    notice.aiProcessingError = aiResult.aiProcessingError;

    await notice.save();

    await notifyAIProcessing(req.user._id, notice._id, notice.aiProcessingStatus, notice.title, notice.aiProcessingError);

    res.json(notice);
  } catch (error) {
    console.error('Error retrying notice AI:', error);
    res.status(500).json({ message: error.message || 'Error retrying notice AI' });
  }
};

// Admin gets all their published notices
const getAdminNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ createdBy: req.user._id }).sort('-createdAt');
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin views notice stats
const getNoticeStats = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice || notice.createdBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const statuses = await NoticeReadStatus.find({ noticeId: notice._id });
    const read = statuses.filter(s => s.isRead).length;
    const unread = statuses.length - read;

    res.json({
      notice,
      stats: {
        totalReached: notice.studentsReachedCount || statuses.length,
        read,
        unread
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotice,
  retryNoticeAI,
  getAdminNotices,
  getNoticeStats
};
