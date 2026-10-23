const Notice = require('../models/Notice');
const NoticeReadStatus = require('../models/NoticeReadStatus');
const Connection = require('../models/Connection');
const { translateNotice: translateAiNotice } = require('../services/ai/aiService');

// Student gets their notices list
const getStudentNotices = async (req, res) => {
  try {
    const { category, priority, search } = req.query;

    // Student can see notices targeted to them, or notices marked for everyone
    let query = {
      $or: [
        { targetStudents: req.user._id },
        { targetStudents: { $size: 0 } },
        { targetStudents: { $exists: false } }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority.toUpperCase();
    }

    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { aiSummary: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name email role')
      .sort('-createdAt');

    // Attach read status
    const statuses = await NoticeReadStatus.find({ studentId: req.user._id });
    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.noticeId.toString()] = s.isRead;
    });

    const enrichedNotices = notices.map(notice => {
      const isRead = statusMap[notice._id.toString()] || false;
      return { ...notice.toObject(), isRead };
    });

    res.json(enrichedNotices);
  } catch (error) {
    console.error('Error in getStudentNotices:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fast single notice fetch
const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name email role');
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const status = await NoticeReadStatus.findOne({ noticeId: notice._id, studentId: req.user._id });
    const isRead = status ? status.isRead : false;

    res.json({ ...notice.toObject(), isRead });
  } catch (error) {
    console.error('Error in getNoticeById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Student marks notice as read
const markNoticeRead = async (req, res) => {
  try {
    let status = await NoticeReadStatus.findOne({ 
      noticeId: req.params.id, 
      studentId: req.user._id 
    });

    if (status) {
      status.isRead = true;
      status.readAt = Date.now();
      await status.save();
    } else {
      status = await NoticeReadStatus.create({
        noticeId: req.params.id,
        studentId: req.user._id,
        isRead: true,
        readAt: Date.now()
      });
    }
    res.json({ message: 'Marked as read', status });
  } catch (error) {
    console.error('Error in markNoticeRead:', error);
    res.status(500).json({ message: error.message });
  }
};

const getUpcomingDeadlines = async (req, res) => {
  try {
    const notices = await Notice.find({
      $or: [
        { targetStudents: req.user._id },
        { targetStudents: { $size: 0 } },
        { targetStudents: { $exists: false } }
      ]
    });
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const deadlines = [];
    for (const n of notices) {
      const rawDate = n.deadline?.date;
      if (!rawDate || rawDate === 'Not specified in the notice') continue;

      const normalizedDateStr = rawDate.replace(/(\d+)(st|nd|rd|th)/gi, '$1');
      const parsedDate = new Date(normalizedDateStr);
      if (isNaN(parsedDate.getTime())) continue;

      const deadlineDayStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()).getTime();
      const diffMs = deadlineDayStart - todayStart;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      deadlines.push({
        _id: n._id,
        title: n.title,
        category: n.category,
        priority: n.priority,
        deadline: n.deadline,
        diffDays,
        isPassed: diffDays < 0,
        isUrgent: diffDays >= 0 && diffDays <= 2
      });
    }

    // Sort by soonest upcoming deadline
    deadlines.sort((a, b) => a.diffDays - b.diffDays);

    res.json(deadlines);
  } catch (error) {
    console.error('Error in getUpcomingDeadlines:', error);
    res.status(500).json({ message: error.message });
  }
};

// Optimized notice translator with database caching
const translateNotice = async (req, res) => {
  try {
    const { language, contentJson } = req.body;
    const noticeId = req.params.id;

    if (!language || !contentJson) {
      return res.status(400).json({ message: 'Language and content required' });
    }

    // 1. Check if translation is already cached in MongoDB
    if (noticeId) {
      const notice = await Notice.findById(noticeId);
      if (notice && notice.translations && notice.translations.get(language)) {
        return res.json(notice.translations.get(language));
      }
    }

    // 2. Perform translation
    const translated = await translateAiNotice(contentJson, language);

    // 3. Persist to MongoDB so all future requests take 0ms
    if (noticeId && translated) {
      Notice.findById(noticeId).then(notice => {
        if (notice) {
          if (!notice.translations) notice.translations = new Map();
          notice.translations.set(language, translated);
          notice.save().catch(err => console.warn('Notice translation cache save failed:', err.message));
        }
      }).catch(err => console.warn('DB lookup failed for cache save:', err.message));
    }

    res.json(translated);
  } catch (error) {
    console.error('Error in translateNotice:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentNotices,
  getNoticeById,
  markNoticeRead,
  getUpcomingDeadlines,
  translateNotice
};
