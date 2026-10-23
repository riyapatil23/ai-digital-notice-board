const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');

const serverRoot = path.resolve(__dirname, '../../');

// Reusable lazy singleton Tesseract worker with local traineddata to eliminate startup & network latency
let tesseractWorkerPromise = null;

const getWorker = async () => {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = Tesseract.createWorker('eng', 1, {
      langPath: serverRoot,
      cachePath: serverRoot
    }).catch(err => {
      console.warn('Failed to pre-initialize local Tesseract worker:', err.message);
      tesseractWorkerPromise = null;
      throw err;
    });
  }
  return await tesseractWorkerPromise;
};

const cleanExtractedText = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\bf\{otice\b/gi, 'Notice')
    .replace(/\bA1l\b/gi, 'All')
    .replace(/\bCredit-l\b/gi, 'Credit-1')
    .replace(/\b1\.0pen\b/gi, '1. Open')
    .replace(/student\.\s*sesr?cp\.in/gi, 'student.sesrcp.in')
    .replace(/\bHow\s+o\s+pay\b/gi, 'How to pay')
    .replace(/\badmited\b/gi, 'admitted')
    .replace(/\bVerity\b/gi, 'Verify')
    .replace(/\bControlr\s+of\s+Examinatigns\b/gi, 'Controller of Examinations')
    .replace(/\bControllsr\s+of\s+Examing(?:\s+ig)?\b/gi, 'Controller of Examinations')
    .replace(/(\d{1,2})["°%]/g, '$1th')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const recognizeImage = async (imageSource) => {
  try {
    const worker = await getWorker();
    const ret = await worker.recognize(imageSource);
    return cleanExtractedText(ret?.data?.text || '');
  } catch (err) {
    console.warn('Worker recognize failed, falling back to direct recognize:', err.message);
    tesseractWorkerPromise = null;
    const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
      langPath: serverRoot,
      cachePath: serverRoot
    });
    return cleanExtractedText(text || '');
  }
};

const extractTextFromFile = async (filePath, mimeType) => {
  try {
    let text = '';
    const fullPath = path.resolve(filePath);

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: dataBuffer });
      try {
        const parseResult = await parser.getText();
        let extracted = parseResult?.text || '';
        // Clean up page marker headers from pdf-parse like "\n-- 1 of 1 --\n"
        extracted = extracted.replace(/\n\s*-- \d+ of \d+ --\s*\n/g, '').trim();

        // Check readability of direct text: discard garbage font lines
        const lines = extracted.split('\n').filter(l => {
          const trimmed = l.trim();
          if (trimmed.length < 3) return false;
          const letters = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
          return (letters / trimmed.length) >= 0.45;
        });

        const readableText = cleanExtractedText(lines.join('\n'));

        // If direct readable text is found and sufficiently detailed (at least 15 words)
        const wordCount = readableText.split(/\s+/).filter(w => w.length > 2).length;
        if (wordCount >= 15) {
          text = readableText;
        } else {
          // Scanned document or image-only PDF: perform OCR on rendered page screenshots
          console.log('PDF has insufficient direct text. Performing high-resolution OCR on rendered pages...');
          const screenshots = await parser.getScreenshot({ scale: 2.0 });
          if (screenshots?.pages && screenshots.pages.length > 0) {
            const ocrTexts = [];
            for (const page of screenshots.pages) {
              if (page.data) {
                const pageOcrText = await recognizeImage(Buffer.from(page.data));
                if (pageOcrText && pageOcrText.trim()) {
                  ocrTexts.push(pageOcrText.trim());
                }
              }
            }
            text = cleanExtractedText(ocrTexts.join('\n\n'));
          }
        }
      } finally {
        await parser.destroy();
      }
    } else if (mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|tiff)$/i.test(fullPath)) {
      console.log('Processing image notice using high-resolution local OCR...');
      text = await recognizeImage(fullPath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType || path.extname(fullPath)}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract readable text from the uploaded file.');
    }

    return text.trim();
  } catch (error) {
    console.error('File extraction error:', error);
    throw new Error(error.message || 'Failed to process file content');
  }
};

module.exports = { extractTextFromFile };
