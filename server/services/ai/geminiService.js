process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Google Generative AI production models priority list for 2026
const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

const withTimeout = (promise, ms = 25000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    )
  ]);
};

const NOTICE_ANALYSIS_PROMPT = `
You are an expert college notice analysis assistant.
Analyze ONLY the information present in the provided notice.
Your goal is to extract structured, 100% accurate information so students can easily understand the notice.

IMPORTANT RULES:
- Never hallucinate or invent information.
- If any detail is not explicitly mentioned in the notice, write "Not specified" or null.
- Extract the issuing department (e.g., "Examination Department", "Training & Placement Cell", "Accounts Section").
- Extract the category (e.g., "Exam", "Scholarship", "Assignment", "Event", "General").
- Determine priority based on urgency: "HIGH" (mandatory deadlines within 7 days, exam dates, disciplinary actions), "MEDIUM" (regular academic notices, general deadlines), or "LOW" (informational, clubs, holidays).
- For dates, provide exact date strings if found.
- For deadline, extract the final submission/payment deadline date and time.
- Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "summary": "string (short 2-3 sentence overview)",
  "simplifiedExplanation": "string (clear, easy to understand explanation for students)",
  "importantPoints": ["string"],
  "department": "string",
  "category": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "eventDate": "string or null",
  "deadline": {
    "date": "string or Not specified",
    "time": "string or Not specified"
  },
  "venue": "string",
  "targetAudience": ["string"],
  "actionRequired": "string",
  "keywords": ["string"],
  "language": "English",
  "dates": [
    { "label": "string", "date": "string" }
  ],
  "contactInformation": ["string"],
  "links": ["string"]
}
`;

const parseJsonResponse = (textResponse) => {
  if (!textResponse) throw new Error('Empty response from AI');
  // First clean markdown fences if present
  let cleaned = textResponse.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(cleaned);
};

const callGeminiWithFallback = async (genAI, contentParts) => {
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(model.generateContent(contentParts), 25000);
      const response = await result.response;
      const textResponse = response.text().trim();
      const parsed = parseJsonResponse(textResponse);
      if (parsed) return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini candidate model ${modelName} encountered: ${err.message}. Trying next candidate...`);
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
};

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
};

/**
 * Generates structured notice information from cleaned text using Gemini.
 */
const generateSummary = async (text) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `${NOTICE_ANALYSIS_PROMPT}\n\nNotice Content:\n${text}`;
  return await callGeminiWithFallback(genAI, prompt);
};

/**
 * Multimodal vision analysis directly from raw image/PDF file using Gemini
 */
const generateSummaryFromMedia = async (filePath, mimeType) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const fullPath = path.resolve(filePath);
  const fileBuffer = fs.readFileSync(fullPath);
  const base64Data = fileBuffer.toString('base64');

  const mediaPart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/jpeg'
    }
  };

  return await callGeminiWithFallback(genAI, [NOTICE_ANALYSIS_PROMPT, mediaPart]);
};

/**
 * Student "Ask AI / Summarize Notice" Personal Assistant
 * Answers 6 key questions directly from text or existing notice.
 */
const askAISummarizer = async (noticeText) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
You are an AI Notice Simplifier for college students.
Analyze this notice text and provide concise, student-friendly answers to these exact 6 points:
1. simpleExplanation: A very simple 2-3 sentence explanation of what this notice is about.
2. keyPoints: Array of 3-5 crucial points a student should remember.
3. whatShouldIDo: Clear instructions on what actionable steps the student needs to take.
4. importantDate: Main event or start date mentioned (or "Not specified").
5. deadline: Submission/payment/registration deadline (or "Not specified").
6. whoIsThisFor: Target audience, eligible departments, or years (e.g. "All 3rd Year B.Tech students").

Rules:
- Never invent data. If not mentioned, write "Not specified".
- Return ONLY valid JSON:
{
  "simpleExplanation": "string",
  "keyPoints": ["string"],
  "whatShouldIDo": "string",
  "importantDate": "string",
  "deadline": "string",
  "whoIsThisFor": "string"
}

Notice Text:
${noticeText}
`;

  return await callGeminiWithFallback(genAI, prompt);
};

const translateContent = async (contentJson, targetLanguage) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `
Translate the following JSON object's text values into ${targetLanguage}.
IMPORTANT RULES:
- Do NOT translate dates, numbers, URLs, email addresses, or names.
- Maintain the exact same JSON keys, ONLY translate the values.
- Return ONLY valid JSON.

JSON to translate:
${JSON.stringify(contentJson)}
`;

  return await callGeminiWithFallback(genAI, prompt);
};

module.exports = {
  generateSummary,
  generateSummaryFromMedia,
  askAISummarizer,
  translateContent
};
