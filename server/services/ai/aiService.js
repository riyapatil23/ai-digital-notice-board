const crypto = require('crypto');
const geminiService = require('./geminiService');
const openAIService = require('./openAIService');
const { extractWithFallback } = require('./fallbackService');
const { translateNoticeContent } = require('./translateService');

// In-memory summary cache to prevent redundant re-analysis of identical notices
const summaryMemoryCache = new Map();
const MAX_CACHE_ENTRIES = 500;

const getTextHash = (text) => {
  return crypto.createHash('sha256').update((text || '').trim()).digest('hex');
};

const analyzeNotice = async (text, fileContext = {}) => {
  const safeText = typeof text === 'string' ? text : '';
  const textHash = getTextHash(safeText);

  if (summaryMemoryCache.has(textHash)) {
    return { ...summaryMemoryCache.get(textHash), fromCache: true };
  }

  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  let result = null;
  let processingStatus = 'completed';
  let processingError = null;

  try {
    if (provider === 'gemini') {
      // 1. If physical file is available and image/pdf, attempt vision
      if (fileContext.filePath && fileContext.mimeType) {
        try {
          result = await geminiService.generateSummaryFromMedia(fileContext.filePath, fileContext.mimeType);
        } catch (mediaErr) {
          console.warn(`Gemini multimodal attempt failed (${mediaErr.message}), falling back to text prompt...`);
        }
      }

      // 2. Fall back to Gemini text-based analysis
      if (!result && safeText) {
        result = await geminiService.generateSummary(safeText);
      }
    } else if (provider === 'openai' && safeText) {
      result = await openAIService.generateSummary(safeText);
    }
  } catch (error) {
    console.warn(`Primary AI provider (${provider}) encountered error: ${error.message}`);
    processingStatus = 'failed';
    processingError = error.message;
  }

  // 3. Fallback local extractor if AI returned null or failed
  if (!result || !result.title || !result.summary) {
    const fallbackData = extractWithFallback(safeText);
    result = {
      ...(result || {}),
      ...fallbackData
    };
  }

  // Ensure strict schema conformity
  const normalizedPriority = ['LOW', 'MEDIUM', 'HIGH'].includes((result.priority || '').toUpperCase())
    ? result.priority.toUpperCase()
    : 'LOW';

  const normalized = {
    title: result.title || 'Official College Notice',
    summary: result.summary || result.aiSummary || 'Summary not available.',
    simplifiedExplanation: result.simplifiedExplanation || result.summary || 'Please refer to the attached notice for details.',
    importantPoints: Array.isArray(result.importantPoints) && result.importantPoints.length > 0
      ? result.importantPoints
      : ['Please review the notice document carefully for complete guidelines.'],
    department: result.department && result.department !== 'Not specified' ? result.department : 'General Administration',
    category: result.category || 'General',
    priority: normalizedPriority,
    eventDate: result.eventDate || null,
    deadline: typeof result.deadline === 'object' && result.deadline !== null
      ? {
          date: result.deadline.date || 'Not specified in the notice',
          time: result.deadline.time || 'Not specified in the notice'
        }
      : typeof result.deadline === 'string'
      ? { date: result.deadline, time: 'Not specified in the notice' }
      : { date: 'Not specified in the notice', time: 'Not specified in the notice' },
    venue: result.venue && result.venue !== 'Not specified' ? result.venue : 'Not specified',
    targetAudience: Array.isArray(result.targetAudience) && result.targetAudience.length > 0
      ? result.targetAudience
      : ['All Enrolled Students'],
    actionRequired: result.actionRequired || result.requiredAction || 'Please review the notice for necessary steps.',
    requiredAction: result.actionRequired || result.requiredAction || 'Please review the notice for necessary steps.',
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    language: result.language || 'English',
    dates: Array.isArray(result.dates) ? result.dates : [],
    eligibility: result.eligibility || 'All Students',
    contactInformation: Array.isArray(result.contactInformation) ? result.contactInformation : [],
    links: Array.isArray(result.links) ? result.links : [],
    aiProcessingStatus: processingStatus,
    aiProcessingError: processingError
  };

  // Cache result
  if (summaryMemoryCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = summaryMemoryCache.keys().next().value;
    summaryMemoryCache.delete(firstKey);
  }
  summaryMemoryCache.set(textHash, normalized);

  return normalized;
};

/**
 * Ask AI / Summarize Notice feature for students
 */
const askAI = async (noticeText) => {
  if (!noticeText || typeof noticeText !== 'string' || !noticeText.trim()) {
    throw new Error('Notice text is required for AI analysis');
  }

  try {
    const result = await geminiService.askAISummarizer(noticeText.trim());
    return {
      simpleExplanation: result.simpleExplanation || 'Notice summary generated.',
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [result.simpleExplanation],
      whatShouldIDo: result.whatShouldIDo || 'Review notice instructions.',
      importantDate: result.importantDate || 'Not specified',
      deadline: result.deadline || 'Not specified',
      whoIsThisFor: result.whoIsThisFor || 'All Students'
    };
  } catch (err) {
    console.warn('Gemini askAI failed, using smart rule-based fallback:', err.message);
    const fallback = extractWithFallback(noticeText);
    return {
      simpleExplanation: fallback.summary || noticeText.slice(0, 200) + '...',
      keyPoints: fallback.importantPoints || ['Review complete notice document.'],
      whatShouldIDo: fallback.requiredAction || 'Follow instructions outlined in the notice.',
      importantDate: fallback.dates?.[0]?.date || 'Not specified',
      deadline: fallback.deadline?.date || 'Not specified',
      whoIsThisFor: fallback.eligibility || 'All Students'
    };
  }
};

/**
 * High-Speed Multilingual Notice Translator
 */
const translateNotice = async (contentJson, targetLanguage) => {
  if (!contentJson || typeof contentJson !== 'object') return contentJson;

  const targetLangLower = (targetLanguage || '').toLowerCase().trim();
  if (targetLangLower === 'english' || targetLangLower === 'en') {
    return contentJson;
  }

  return await translateNoticeContent(contentJson, targetLanguage);
};

module.exports = { analyzeNotice, askAI, translateNotice };
