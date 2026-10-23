const { OpenAI } = require('openai');

const generateSummary = async (text) => {
  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY is missing');
  }

  const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

  const prompt = `
You are an official college notice analysis assistant.
Analyze ONLY the information present in the provided notice.
Your goal is to make the notice easy for a student to understand.

Extract:
1. Notice title
2. Short summary
3. Important points
4. Dates
5. Deadline (date and time)
6. Required action
7. Eligibility
8. Contact information
9. Important links

IMPORTANT RULES:
- Never invent information.
- Never guess a deadline.
- Never guess a date.
- Never create fake links.
- Never change numbers.
- Never change names.
- If information is missing, return "Not specified in the notice".
- Preserve exact factual information.
- Keep the summary concise.
- Return ONLY valid JSON format with the following exact structure:
{
  "title": "string",
  "summary": "string",
  "importantPoints": ["string"],
  "dates": [{"label": "string", "date": "string"}],
  "deadline": {"date": "string", "time": "string"},
  "requiredAction": "string",
  "eligibility": "string",
  "contactInformation": ["string"],
  "links": ["string"]
}

Notice Text:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API Error:', error?.status, error?.message || error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      const err = new Error('OpenAI Quota Exhausted (429): You have no credits remaining. Please add credits at https://platform.openai.com/settings/organization/billing or switch to a Gemini API key.');
      err.status = 429;
      err.code = 'insufficient_quota';
      throw err;
    }
    if (error?.status === 401) {
      const err = new Error('OpenAI Authentication Error (401): The provided AI_API_KEY is invalid or expired.');
      err.status = 401;
      throw err;
    }
    throw new Error(error?.message || 'Failed to generate summary from AI');
  }
};

const translateContent = async (contentJson, targetLanguage) => {
  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY is missing');
  }

  const openai = new OpenAI({ apiKey: process.env.AI_API_KEY });

  const prompt = `
Translate the following JSON object's text values into ${targetLanguage}.
IMPORTANT RULES:
- Do NOT translate dates, numbers, URLs, email addresses, or names.
- Maintain the exact same JSON keys, ONLY translate the values.
- Return ONLY valid JSON.

JSON to translate:
${JSON.stringify(contentJson)}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Translation Error:', error?.status, error?.message || error);
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      const err = new Error('OpenAI Quota Exhausted (429): You have no credits remaining on your account.');
      err.status = 429;
      err.code = 'insufficient_quota';
      throw err;
    }
    throw new Error(error?.message || 'Failed to translate content');
  }
};

module.exports = { generateSummary, translateContent };
