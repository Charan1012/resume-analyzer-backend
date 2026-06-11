require('dotenv').config();
(async () => {
  try {
    const k = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'groq/compound-mini';
    if (!k) {
      console.error('No GROQ_API_KEY in environment');
      process.exit(2);
    }
    const prompt = `Return ONLY a JSON object: {"atsScore": 95, "strengths": ["test"], "improvements": ["test"], "missingKeywords": ["test"], "formattingTips": ["test"], "overallFeedback": "ok"}`;

    const res = await fetch('https://api.groq.com/openai/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${k}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: model, input: prompt })
    });

    const status = res.status;
    const text = await res.text();
    console.log('HTTP', status);
    try {
      const j = JSON.parse(text);
      console.log('JSON RESPONSE:', JSON.stringify(j, null, 2));
    } catch (e) {
      console.log('RAW RESPONSE:', text);
    }

    // try to extract text like service
    try {
      const parsed = JSON.parse(text);
      if (parsed.output_text) console.log('output_text:', parsed.output_text);
      if (parsed.output) console.log('output:', JSON.stringify(parsed.output, null, 2));
      if (parsed.choices) console.log('choices:', JSON.stringify(parsed.choices, null, 2));
    } catch (e) {}

  } catch (err) {
    console.error('Request failed:', err.message || err);
    process.exit(1);
  }
})();
