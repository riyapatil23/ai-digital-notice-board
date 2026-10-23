require('dotenv').config();
const { generateSummary } = require('./services/ai/geminiService');

async function test() {
  try {
    console.log("Testing gemini...");
    const res = await generateSummary("This is a test notice. Deadline is tomorrow.");
    console.log("Result:", res);
  } catch (e) {
    console.error("Test failed:", e);
  }
}

// Let's modify geminiService inline for the test to see the fetch error cause
const { GoogleGenerativeAI } = require('@google/generative-ai');
async function testDirect() {
  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  try {
    await model.generateContent("hello");
  } catch(e) {
    console.error("Fetch failed cause:", e.cause);
  }
}
testDirect();
