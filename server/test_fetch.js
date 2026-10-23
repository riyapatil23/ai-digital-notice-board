require('dotenv').config();

async function rawFetch() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.AI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hello" }] }] })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", json);
  } catch(e) {
    console.error("Fetch failed!", e);
    console.error("Cause:", e.cause);
  }
}
rawFetch();
