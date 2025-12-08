import fs from 'fs';

// Dynamic import for pdfjs-dist
const pdfjsLib = (await import('pdfjs-dist/legacy/build/pdf.mjs'));

/**
 * Extract text content from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);

    // Convert Buffer to Uint8Array for pdfjs-dist
    const uint8Array = new Uint8Array(dataBuffer);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    // Clean up the extracted text
    let text = fullText.trim();

    // Remove excessive whitespace and normalize line breaks
    text = text.replace(/\n\s*\n/g, '\n\n'); // Multiple newlines to double newline
    text = text.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    text = text.trim();

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Validate if a file is a valid PDF
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if valid PDF
 */
export function isValidPDF(buffer) {
  // Check PDF header (first 4 bytes should be %PDF)
  const header = buffer.subarray(0, 4).toString();
  return header === '%PDF';
}

/**
 * Get PDF metadata
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} PDF metadata
 */
export async function getPDFMetadata(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    return {
      pages: data.numpages,
      title: data.info?.Title || 'Unknown',
      author: data.info?.Author || 'Unknown',
      creator: data.info?.Creator || 'Unknown',
      producer: data.info?.Producer || 'Unknown',
      creationDate: data.info?.CreationDate || null,
      modificationDate: data.info?.ModDate || null,
    };
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return {
      pages: 0,
      title: 'Unknown',
      author: 'Unknown',
      creator: 'Unknown',
      producer: 'Unknown',
      creationDate: null,
      modificationDate: null,
    };
  }
}
