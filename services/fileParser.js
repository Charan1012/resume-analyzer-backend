import { PDFParse as pdfParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const extractTextFromPDF = async (buffer) => {
  try {
    const parser = new pdfParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text || '';
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

export const extractTextFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

export const extractText = async (filePath, mimetype) => {
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  
  if (mimetype === 'application/pdf') {
    return await extractTextFromPDF(buffer);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return await extractTextFromDOCX(buffer);
  }
  
  throw new Error('Unsupported file type');
};