const PersonalUpload = require('../models/PersonalUpload');
const Notice = require('../models/Notice');
const { extractTextFromFile } = require('../services/file/fileService');
const { analyzeNotice, translateNotice, askAI } = require('../services/ai/aiService');

// Ask AI / Summarize Notice feature for students (accepts pasted text or noticeId)
const askAINotice = async (req, res) => {
  try {
    const { text, noticeId } = req.body;
    let contentToAnalyze = text;

    if (noticeId) {
      const notice = await Notice.findById(noticeId);
      if (notice) {
        contentToAnalyze = [
          `Title: ${notice.title}`,
          `Category: ${notice.category}`,
          `Department: ${notice.department || ''}`,
          `Deadline: ${notice.deadline?.date || ''}`,
          `Action: ${notice.requiredAction || ''}`,
          `Extracted text: ${notice.extractedText || notice.aiSummary || ''}`
        ].join('\n');
      }
    }

    if (!contentToAnalyze || !contentToAnalyze.trim()) {
      return res.status(400).json({ message: 'Please provide notice text or select a valid notice.' });
    }

    const aiResult = await askAI(contentToAnalyze);
    res.json(aiResult);
  } catch (error) {
    console.error('Ask AI error:', error);
    res.status(500).json({ message: error.message || 'AI could not process this notice. Please try again.' });
  }
};

const summarizePersonal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const originalFileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const text = await extractTextFromFile(req.file.path, fileType);
    const aiResult = await analyzeNotice(text, { filePath: req.file.path, mimeType: fileType });

    const upload = await PersonalUpload.create({
      studentId: req.user._id,
      originalFileUrl,
      fileType,
      aiSummary: aiResult
    });

    res.status(201).json(upload);
  } catch (error) {
    console.error('Personal summarize error:', error);
    res.status(500).json({ message: error.message || 'Error processing file' });
  }
};

const getPersonalHistory = async (req, res) => {
  try {
    const uploads = await PersonalUpload.find({ studentId: req.user._id }).sort('-createdAt');
    res.json(uploads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const translatePersonal = async (req, res) => {
  try {
    const { language, contentJson, uploadId } = req.body;
    if (!language || !contentJson) {
      return res.status(400).json({ message: 'Language and content required' });
    }

    // 1. Check database cache if uploadId provided
    if (uploadId) {
      const upload = await PersonalUpload.findById(uploadId);
      if (upload && upload.translations && upload.translations.get(language)) {
        return res.json(upload.translations.get(language));
      }
    }

    // 2. Perform fast translation
    const translated = await translateNotice(contentJson, language);

    // 3. Persist to DB asynchronously
    if (uploadId && translated) {
      PersonalUpload.findById(uploadId).then(upload => {
        if (upload) {
          if (!upload.translations) upload.translations = new Map();
          upload.translations.set(language, translated);
          upload.save().catch(err => console.warn('Failed saving personal translation:', err.message));
        }
      }).catch(err => console.warn('DB lookup error for personal cache save:', err.message));
    }

    res.json(translated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  askAINotice,
  summarizePersonal,
  getPersonalHistory,
  translatePersonal
};
