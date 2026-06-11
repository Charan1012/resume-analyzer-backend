import 'dotenv/config';
import { analyzeResumeWithGroq } from '../services/groqService.js';

(async () => {
  try {
    const shortResume = 'John Doe\nSoftware Engineer with 5 years experience in Node, React, AWS.\nWorked on APIs and microservices.';
    const result = await analyzeResumeWithGroq(shortResume, 'Software Engineer');
    console.log('ANALYSIS:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Service call failed:', err.message || err);
    process.exit(1);
  }
})();
