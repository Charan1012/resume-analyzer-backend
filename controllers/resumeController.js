import fs from 'fs';
import User from '../models/User.js';
import { extractText } from '../services/fileParser.js';
import { analyzeResumeWithGemini } from '../services/geminiService.js';

// @desc    Upload and analyze resume
// @route   POST /api/resume/analyze
// @access  Private
export const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const { jobRole = 'Software Engineer' } = req.body;
    const filePath = req.file.path;

    console.log(`📄 Processing file: ${req.file.originalname}`);

    // Extract text from file
    let extractedText;
    try {
      extractedText = await extractText(filePath, req.file.mimetype);
    } catch (parseError) {
      // Clean up file if parsing fails
      fs.unlinkSync(filePath);
      throw new Error(`File parsing failed: ${parseError.message}`);
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 100) {
      fs.unlinkSync(filePath);
      throw new Error('Could not extract sufficient text from file. Please check the file content.');
    }

    console.log(`📝 Extracted ${extractedText.length} characters`);

    // Get AI analysis
    let analysis;
    try {
      analysis = await analyzeResumeWithGemini(extractedText, jobRole);
      console.log('✅ AI Analysis completed');
    } catch (aiError) {
      fs.unlinkSync(filePath);
      throw new Error(`AI analysis failed: ${aiError.message}`);
    }

    // Save to database
    const user = await User.findById(req.userId);
    user.resumes.push({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      extractedText: extractedText.substring(0, 20000), // Limit storage
      analysis
    });

    await user.save();

    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      analysis,
      resumeId: user.resumes[user.resumes.length - 1]._id,
      message: 'Resume analyzed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's resume history
// @route   GET /api/resume/history
// @access  Private
export const getHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('resumes')
      .lean();

    // Sort by newest first and limit fields
    const history = user.resumes
      .reverse()
      .map(resume => ({
        id: resume._id,
        originalName: resume.originalName,
        atsScore: resume.analysis.atsScore,
        createdAt: resume.createdAt
      }));

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single resume analysis
// @route   GET /api/resume/:id
// @access  Private
export const getAnalysis = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const resume = user.resumes.id(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error('Resume analysis not found');
    }

    res.json({
      success: true,
      analysis: resume.analysis,
      originalName: resume.originalName,
      createdAt: resume.createdAt
    });

  } catch (error) {
    next(error);
  }
};