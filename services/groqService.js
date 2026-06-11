import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const apiUrl = 'https://api.groq.com/openai/v1/responses';
const modelId = process.env.GROQ_MODEL || 'groq/compound-mini';

if (!apiKey) {
  throw new Error('Missing GROQ_API_KEY environment variable');
}

export const analyzeResumeWithGroq = async (resumeText, jobRole = 'Software Engineer') => {
  try {
    const prompt = `
    You are an expert ATS (Applicant Tracking System) analyzer and career coach with 10+ years of experience.
    
    Analyze the following resume for a ${jobRole} position. Provide detailed, actionable feedback.
    
    Resume Content:
    """${resumeText.substring(0, 15000)}"""  // Limit text to avoid token limits
    
    Respond ONLY with a valid JSON object in this exact format:
    {
      "atsScore": <number between 0-100 based on ATS compatibility>,
      "strengths": [<3-5 specific strong points about this resume>],
      "improvements": [<3-5 specific actionable improvements>],
      "missingKeywords": [<5-8 important keywords missing for ${jobRole} role>],
      "formattingTips": [<2-3 formatting suggestions>],
      "overallFeedback": "<2-3 sentence summary of overall impression>"
    }
    
    Rules:
    - atsScore should reflect how well the resume would perform in ATS systems
    - Be honest but constructive
    - Focus on what hiring managers at top tech companies look for
    - Consider both content quality and ATS optimization
    `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        input: prompt,
        max_output_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let parsed;
      try { parsed = JSON.parse(errorBody); } catch(e) { parsed = null; }
      if (response.status === 404 || parsed?.error?.code === 'model_not_found') {
        throw new Error(`Groq API model not found: model='${modelId}'. Set a valid model in GROQ_MODEL or pick one from https://console.groq.com/docs/models. Raw: ${errorBody}`);
      }
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    // Groq Responses API may return `output_text`, an `output` array, or OpenAI-compatible `choices`.
    let text = '';

    if (result.output_text) {
      text = result.output_text;
    } else if (result.output) {
      const out = result.output;
      if (typeof out === 'string') {
        text = out;
      } else if (Array.isArray(out)) {
        // Walk the output array to find the first textual content
        for (const item of out) {
          if (!item) continue;
          if (typeof item === 'string') { text = item; break; }
          // message objects contain a content array with output_text entries
          if (item.type === 'message' && Array.isArray(item.content)) {
            const outText = item.content.find(c => c && (c.type === 'output_text' || c.text));
            if (outText) {
              text = outText.text || outText; // outText may be object with .text
              break;
            }
          }
          // some items may have direct .text or .content
          if (item.text) { text = item.text; break; }
          if (item.content && typeof item.content === 'string') { text = item.content; break; }
        }
      } else if (out.content) {
        text = out.content;
      } else if (out.text) {
        text = out.text;
      }
    } else if (result.choices && Array.isArray(result.choices) && result.choices[0]) {
      const choice = result.choices[0];
      if (choice.message && choice.message.content) {
        // content may be array or string
        text = Array.isArray(choice.message.content) ? choice.message.content.map(c=>c.text||c).join('\n') : choice.message.content;
      } else {
        text = choice.text || '';
      }
    }

    if (!text || !text.trim()) {
      throw new Error('Groq API returned empty response');
    }

    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/```\n?([\s\S]*?)\n?```/) ||
                      text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Groq response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const analysis = JSON.parse(jsonStr.trim());
    
    // Validate required fields
    const required = ['atsScore', 'strengths', 'improvements', 'missingKeywords', 'formattingTips', 'overallFeedback'];
    for (const field of required) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Groq Service Error:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};