require('dotenv').config();
(async () => {
  try {
    const k = process.env.GROQ_API_KEY;
    if (!k) {
      console.error('No GROQ_API_KEY in environment');
      process.exit(2);
    }
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${k}`,
        'Content-Type': 'application/json'
      }
    });
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      console.log(JSON.stringify(j, null, 2));
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error('Request failed:', err.message || err);
    process.exit(1);
  }
})();
