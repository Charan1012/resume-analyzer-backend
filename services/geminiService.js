import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResumeWithGemini = async (resumeText, jobRole = 'Software Engineer') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || 
                      text.match(/```\n?([\s\S]*?)\n?```/) || 
                      text.match(/(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
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
    console.error('Gemini Service Error:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};