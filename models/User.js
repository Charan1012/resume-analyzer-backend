import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  analysis: {
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    strengths: [String],
    improvements: [String],
    missingKeywords: [String],
    formattingTips: [String],
    overallFeedback: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  resumes: [resumeSchema]  // Embedded array of resume analyses
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

export default mongoose.model('User', userSchema);