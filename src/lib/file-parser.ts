import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import path from 'path';
import { pathToFileURL } from 'url';

// Fix for Next.js/pdfjs-dist worker issue
// We need to explicitly set the worker path to a file that exists on the filesystem
const workerPath = pathToFileURL(path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).toString();
PDFParse.setWorker(workerPath);

export interface Section {
  id: string;
  title?: string;
  content: string;
}

const MIN_SECTION_LENGTH = 50; // Filter out very short lines

export async function parseFile(buffer: Buffer, mimeType: string, fileName: string): Promise<Section[]> {
  let text = '';
  
  // Normalize mimeType if generic
  let effectiveMimeType = mimeType;
  if (mimeType === 'application/octet-stream') {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') effectiveMimeType = 'application/pdf';
    else if (ext === 'docx') effectiveMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'md') effectiveMimeType = 'text/markdown';
    else if (ext === 'html' || ext === 'htm') effectiveMimeType = 'text/html';
    else if (ext === 'txt') effectiveMimeType = 'text/plain';
  }

  switch (effectiveMimeType) {
    case 'application/pdf':
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      text = pdfData.text;
      break;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;

    case 'text/html':
      const $ = cheerio.load(buffer.toString());
      // Remove scripts and styles
      $('script').remove();
      $('style').remove();
      text = $('body').text();
      break;

    case 'text/markdown':
    case 'text/plain':
      text = buffer.toString();
      break;

    default:
      throw new Error(`Unsupported file type: ${mimeType} (mapped to ${effectiveMimeType})`);
  }

  return processTextToSections(text);
}

function processTextToSections(text: string): Section[] {
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n');
  
  // Split by double newlines to find paragraphs
  const rawParagraphs = normalizedText.split(/\n\s*\n/);
  
  const sections: Section[] = [];
  let currentId = 1;

  rawParagraphs.forEach((para) => {
    const cleanPara = para.trim();
    if (cleanPara.length > MIN_SECTION_LENGTH) {
      sections.push({
        id: `section_${currentId++}`,
        // Try to infer a title from the first sentence or just use "Section X"
        // For now, let's keep it simple as titles are optional
        content: cleanPara
      });
    }
  });

  // If no valid sections found (maybe text is a huge blob without double newlines)
  if (sections.length === 0 && text.trim().length > 0) {
     // Fallback: Split by length or just return one big section
     sections.push({
       id: 'section_1',
       content: text.trim()
     });
  }

  return sections;
}
