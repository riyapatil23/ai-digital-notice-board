/**
 * High-Speed Multilingual Translation Engine
 * Translates structured notice JSON into Marathi, Hindi, Gujarati, Tamil, Telugu, etc.
 * Features:
 * 1. In-memory LRU-style cache for sub-millisecond repeated lookups.
 * 2. Unified single-payload batching (translates all notice fields in 1 single network trip).
 * 3. Preserves deadlines, dates, numbers, URLs, and keys untouched.
 */

const LANG_CODE_MAP = {
  marathi: 'mr',
  mr: 'mr',
  hindi: 'hi',
  hi: 'hi',
  gujarati: 'gu',
  gu: 'gu',
  tamil: 'ta',
  ta: 'ta',
  telugu: 'te',
  te: 'te',
  kannada: 'kn',
  kn: 'kn',
  bengali: 'bn',
  bn: 'bn',
  punjabi: 'pa',
  pa: 'pa',
  english: 'en',
  en: 'en'
};

// Global in-memory translation cache (Key: `${langCode}:::${text}`)
const translationMemoryCache = new Map();
const MAX_CACHE_SIZE = 5000;

const getCacheKey = (langCode, text) => `${langCode}:::${text.trim()}`;

const setCache = (langCode, text, translated) => {
  if (translationMemoryCache.size > MAX_CACHE_SIZE) {
    const firstKey = translationMemoryCache.keys().next().value;
    translationMemoryCache.delete(firstKey);
  }
  translationMemoryCache.set(getCacheKey(langCode, text), translated);
};

const translateRawText = async (text, targetLangCode) => {
  if (!text || typeof text !== 'string' || text.trim() === '') return text;
  if (targetLangCode === 'en') return text;

  const cacheKey = getCacheKey(targetLangCode, text);
  if (translationMemoryCache.has(cacheKey)) {
    return translationMemoryCache.get(cacheKey);
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map(s => (s && s[0]) ? s[0] : '').join('').trim();
      setCache(targetLangCode, text, translated);
      return translated;
    }
    return text;
  } catch (err) {
    console.warn(`Translation error for text fragment (${targetLangCode}):`, err.message);
    return text;
  }
};

/**
 * Translates an array of strings in ONE single network request using delimiter batching
 */
const translateMultipleStrings = async (stringsList, targetLangCode) => {
  if (!Array.isArray(stringsList) || stringsList.length === 0) return [];
  if (targetLangCode === 'en') return stringsList;

  // 1. Identify which items are already cached
  const results = new Array(stringsList.length);
  const uncachedIndices = [];
  const uncachedTexts = [];

  for (let i = 0; i < stringsList.length; i++) {
    const original = stringsList[i];
    if (!original || typeof original !== 'string' || original.trim() === '') {
      results[i] = original;
      continue;
    }
    const cacheKey = getCacheKey(targetLangCode, original);
    if (translationMemoryCache.has(cacheKey)) {
      results[i] = translationMemoryCache.get(cacheKey);
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(original);
    }
  }

  // If all were cached, return immediately in 0ms!
  if (uncachedTexts.length === 0) {
    return results;
  }

  // 2. Batch uncached items into single request
  const DELIM = ' ||| ';
  const combined = uncachedTexts.join(DELIM);

  try {
    const translatedCombined = await translateRawText(combined, targetLangCode);
    const splitParts = translatedCombined.split(/\s*\|\|\|\s*/);

    if (splitParts.length === uncachedTexts.length) {
      for (let j = 0; j < uncachedTexts.length; j++) {
        const translatedItem = splitParts[j].trim();
        const origIdx = uncachedIndices[j];
        results[origIdx] = translatedItem;
        setCache(targetLangCode, uncachedTexts[j], translatedItem);
      }
      return results;
    }
  } catch (err) {
    console.warn('Batch translation delimiter mismatch, falling back:', err.message);
  }

  // 3. Fallback for any remaining uncached items (translate individually)
  for (let k = 0; k < uncachedTexts.length; k++) {
    const origIdx = uncachedIndices[k];
    const trans = await translateRawText(uncachedTexts[k], targetLangCode);
    results[origIdx] = trans;
  }

  return results;
};

const translateNoticeContent = async (contentJson, targetLanguage) => {
  if (!contentJson || typeof contentJson !== 'object') return contentJson;

  const langKey = (targetLanguage || '').toLowerCase().trim();
  const langCode = LANG_CODE_MAP[langKey] || 'en';

  if (langCode === 'en') {
    return contentJson;
  }

  try {
    const translated = { ...contentJson };

    // Collect all translatable fields into a single list
    const fieldsToTranslate = [];
    const mapping = [];

    // Title
    if (contentJson.title) {
      fieldsToTranslate.push(contentJson.title);
      mapping.push({ type: 'title' });
    }

    // Summary
    const summaryVal = contentJson.summary || contentJson.aiSummary;
    if (summaryVal) {
      fieldsToTranslate.push(summaryVal);
      mapping.push({ type: 'summary' });
    }

    // Required Action
    if (contentJson.requiredAction && contentJson.requiredAction !== 'Not specified in the notice') {
      fieldsToTranslate.push(contentJson.requiredAction);
      mapping.push({ type: 'requiredAction' });
    }

    // Eligibility
    if (contentJson.eligibility && contentJson.eligibility !== 'Not specified in the notice') {
      fieldsToTranslate.push(contentJson.eligibility);
      mapping.push({ type: 'eligibility' });
    }

    // Important Points
    const points = Array.isArray(contentJson.importantPoints) ? contentJson.importantPoints : [];
    points.forEach((pt, idx) => {
      fieldsToTranslate.push(pt);
      mapping.push({ type: 'importantPoint', index: idx });
    });

    // Date Labels
    const dates = Array.isArray(contentJson.dates) ? contentJson.dates : [];
    dates.forEach((d, idx) => {
      if (d.label) {
        fieldsToTranslate.push(d.label);
        mapping.push({ type: 'dateLabel', index: idx });
      }
    });

    // Translate ALL strings at once in 1 network call!
    const translatedStrings = await translateMultipleStrings(fieldsToTranslate, langCode);

    // Map translated strings back into the object
    const newPoints = [...points];
    const newDates = dates.map(d => ({ ...d }));

    mapping.forEach((mapItem, idx) => {
      const val = translatedStrings[idx] || fieldsToTranslate[idx];
      if (mapItem.type === 'title') {
        translated.title = val;
      } else if (mapItem.type === 'summary') {
        translated.summary = val;
        if (translated.aiSummary) translated.aiSummary = val;
      } else if (mapItem.type === 'requiredAction') {
        translated.requiredAction = val;
      } else if (mapItem.type === 'eligibility') {
        translated.eligibility = val;
      } else if (mapItem.type === 'importantPoint') {
        newPoints[mapItem.index] = val;
      } else if (mapItem.type === 'dateLabel') {
        newDates[mapItem.index].label = val;
      }
    });

    translated.importantPoints = newPoints;
    translated.dates = newDates;

    return translated;
  } catch (error) {
    console.error('Unified translation error:', error);
    return contentJson;
  }
};

module.exports = { translateNoticeContent, LANG_CODE_MAP, translationMemoryCache };
