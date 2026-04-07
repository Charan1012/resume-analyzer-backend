import express from 'express';
import { analyzeResume, getHistory, getAnalysis } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.post('/analyze', protect, upload.single('resume'), analyzeResume);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getAnalysis);

export default router;