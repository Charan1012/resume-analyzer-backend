import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const apiUrl = 'https://api.groq.com/openai/v1/responses';

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
        model: 'groq-1.1-mini',
        input: prompt,
        max_output_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    // Groq Responses API may return `output_text` or `output` array/object.
    let text = '';
    if (result.output_text) {
      text = result.output_text;
    } else if (result.output) {
      const out = result.output;
      if (typeof out === 'string') {
        text = out;
      } else if (Array.isArray(out) && out.length > 0) {
        const first = out[0];
        text = typeof first === 'string' ? first : first?.content ?? first?.text ?? '';
      } else if (out.content) {
        text = out.content;
      }
    } else if (result.choices && Array.isArray(result.choices) && result.choices[0]) {
      // fallback for openai-compatible choice schema
      const choice = result.choices[0];
      text = choice.message?.content || choice.text || '';
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