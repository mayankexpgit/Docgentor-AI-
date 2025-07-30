'use client';

import { getDocument } from 'pdfjs-dist';

// Note: The workerSrc is now set in the component using this utility,
// inside a useEffect hook to prevent server-side execution errors.

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves with the extracted text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
}
