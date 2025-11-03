// Advanced Export Service with PDF and DOCX support
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Footer, PageNumber } from 'docx';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string; // URL to cover image
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  description?: string;
  genre?: string;
}

interface OutlineExport {
  title: string;
  author: string;
  description?: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    wordCount: number;
  }>;
  themes?: string[];
  characters?: Array<{ name: string; role: string }>;
}

export class ExportServiceAdvanced {
  /**
   * Export book as DOCX with professional formatting
   */
  static async exportBookAsDOCX(book: BookExport): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              pageNumbers: {
                start: 1,
                formatType: 'decimal',
              },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [
            // === COVER PAGE ===
            new Paragraph({
              text: '',
              spacing: { before: 3000 },
            }),
            new Paragraph({
              text: book.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `by ${book.author}`, size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new PageBreak()],
            }),

            // === TITLE PAGE ===
            new Paragraph({
              text: '',
              spacing: { before: 2000 },
            }),
            new Paragraph({
              text: book.title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `by ${book.author}`, italics: true, size: 24 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Description if available
            ...(book.description ? [
              new Paragraph({
                text: '',
                spacing: { before: 400 },
              }),
              new Paragraph({
                text: book.description,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 },
              }),
            ] : []),
            new Paragraph({
              children: [new PageBreak()],
            }),

            // === LEGAL/COPYRIGHT PAGE ===
            new Paragraph({
              children: [
                new TextRun({ text: book.title, bold: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `by ${book.author}` }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Copyright © ${new Date().getFullYear()} ${book.author}. All rights reserved.` }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'This book was created using PowerWrite, an AI-powered book writing platform developed by Dynamic Labs Media.',
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Published by:', bold: true }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: 'Dynamic Labs Media',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: 'Website: dlmworld.com',
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: 'Email: info@dlmworld.com',
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the copyright holder.',
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'PowerWrite is a product of Dynamic Labs Media.', italics: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new PageBreak()],
            }),

            // === TABLE OF CONTENTS ===
            new Paragraph({
              text: 'Table of Contents',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...book.chapters.map((chapter) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `Chapter ${chapter.number}: ${chapter.title}` }),
                ],
                spacing: { after: 150 },
              })
            ),
            new Paragraph({
              children: [new PageBreak()],
            }),

            // === CHAPTERS ===
            ...book.chapters.flatMap((chapter, index) => {
              // Remove duplicate chapter title from content with multiple patterns (more aggressive)
              const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const patterns = [
                // Pattern: "Chapter 1: Title"
                new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.]*`, 'i'),
                // Pattern: "Chapter 1 - Title"
                new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.]*`, 'i'),
                // Pattern: "Chapter 1 Title" 
                new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.]*`, 'i'),
                // Pattern: Just "Chapter 1:"
                new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+`, 'i'),
                // Pattern: Just the title at the start (with optional colon/period)
                new RegExp(`^${escapedTitle}[:\\s\\.]*`, 'i'),
                // Pattern: Title repeated after newlines
                new RegExp(`\\n+${escapedTitle}[\\s\\.]*`, 'gi'),
              ];
              
              const paragraphs = chapter.content.split('\n\n').map((para, pIndex) => {
                let cleaned = para.trim();
                // Apply all patterns to remove duplicates
                for (const pattern of patterns) {
                  cleaned = cleaned.replace(pattern, '').trim();
                }
                // Also remove if the first paragraph is ONLY the chapter title (case insensitive)
                if (pIndex === 0) {
                  const titleLower = chapter.title.toLowerCase().trim();
                  const paraLower = cleaned.toLowerCase().trim();
                  if (paraLower === titleLower || paraLower === `chapter ${chapter.number}` || paraLower === `chapter ${chapter.number}:`) {
                    cleaned = '';
                  }
                }
                return cleaned;
              }).filter(p => p);

              return [
                // Chapter heading (only once)
                new Paragraph({
                  text: `Chapter ${chapter.number}`,
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 100 },
                  pageBreakBefore: index > 0,
                }),
                new Paragraph({
                  text: chapter.title,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { after: 300 },
                }),

                // Chapter content (split into paragraphs)
                ...paragraphs.map(
                  (para) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: para,
                        }),
                      ],
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: { after: 200 },
                      indent: { firstLine: 720 }, // 0.5 inch indent for first line
                    })
                ),

                // Space after chapter
                new Paragraph({
                  text: '',
                  spacing: { after: 400 },
                }),
              ];
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Helper to add page number to current page
   */
  private static addPageNumberToPDF(doc: any, pageNum: number, skipPageNumber: boolean = false) {
    if (skipPageNumber) return;
    
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const yPos = pageHeight - 30;
    
    doc.fontSize(10)
       .fillColor('black')
       .font('Helvetica')
       .text(
         pageNum.toString(),
         72,
         yPos,
         { 
           align: 'center',
           width: pageWidth - 144,
           lineBreak: false
         }
       );
  }

  /**
   * Helper to fetch image as base64 for PDFKit
   */
  private static async fetchImageAsBuffer(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  /**
   * Export book as PDF with professional formatting
   */
  static async exportBookAsPDF(book: BookExport): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamic import for pdfkit to avoid Next.js issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PDFDocument = require('pdfkit');
        
        const chunks: Buffer[] = [];
        let currentPageNumber = 0;
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 72, bottom: 72, left: 72, right: 72 },
          autoFirstPage: false,
          info: {
            Title: book.title,
            Author: book.author,
            Creator: 'PowerWrite by Dynamic Labs Media',
          },
        });

        // Collect data chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          console.log(`PDF generation complete. Total pages: ${currentPageNumber}`);
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (err: Error) => {
          console.error('PDFKit error:', err);
          reject(err);
        });

        // === COVER PAGE ===
        doc.addPage();
        // Cover page never gets a page number
        
        // If cover image URL is provided, try to load and display it
        if (book.coverUrl) {
          try {
            console.log('Fetching cover image from:', book.coverUrl);
            const imageBuffer = await this.fetchImageAsBuffer(book.coverUrl);
            
            // Add image to cover - fit to page with some margin
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const margin = 50;
            
            // Center the image on the page
            doc.image(imageBuffer, margin, margin, {
              fit: [pageWidth - (margin * 2), pageHeight - (margin * 2)],
              align: 'center',
              valign: 'center',
            });
            
            console.log('Cover image added successfully');
          } catch (error) {
            console.error('Error adding cover image to PDFKit:', error);
            // Fall back to text cover
            doc.fontSize(40).font('Helvetica-Bold').text(book.title, {
              align: 'center',
              width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
            });
            doc.moveDown(2);
            doc.fontSize(24).font('Helvetica').text(`by ${book.author}`, { align: 'center' });
          }
        } else {
          // Text-based cover page
          doc.fontSize(40).font('Helvetica-Bold').text(book.title, {
            align: 'center',
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          });
          doc.moveDown(2);
          doc.fontSize(24).font('Helvetica').text(`by ${book.author}`, { align: 'center' });
        }

        // === TITLE PAGE ===
        doc.addPage();
        currentPageNumber++;
        const titleY = doc.page.height / 3;
        doc.y = titleY;
        doc.fontSize(32).font('Helvetica-Bold').text(book.title, {
          align: 'center',
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });
        doc.moveDown(1.5);
        doc.fontSize(18).font('Helvetica-Oblique').text(`by ${book.author}`, { align: 'center' });
        
        // Description on title page if available
        if (book.description) {
          doc.moveDown(3);
          doc.fontSize(11).font('Helvetica').text(book.description, { 
            align: 'justify',
            lineGap: 4,
          });
        }
        
        // Add page number to title page
        this.addPageNumberToPDF(doc, currentPageNumber);

        // === LEGAL/COPYRIGHT PAGE ===
        doc.addPage();
        currentPageNumber++;
        doc.fontSize(11).font('Helvetica-Bold').text(book.title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`by ${book.author}`, { align: 'center' });
        doc.moveDown(2);
        
        doc.fontSize(9).font('Helvetica').text(
          `Copyright © ${new Date().getFullYear()} ${book.author}. All rights reserved.`,
          { align: 'center' }
        );
        doc.moveDown(2);
        
        doc.fontSize(9).font('Helvetica').text(
          'This book was created using PowerWrite, an AI-powered book writing platform developed by Dynamic Labs Media.',
          { align: 'left', lineGap: 3 }
        );
        doc.moveDown(1);
        
        doc.fontSize(9).font('Helvetica-Bold').text('Published by:', { align: 'left' });
        doc.fontSize(9).font('Helvetica').text('Dynamic Labs Media', { align: 'left' });
        doc.fontSize(9).font('Helvetica').text('Website: dlmworld.com', { align: 'left' });
        doc.fontSize(9).font('Helvetica').text('Email: info@dlmworld.com', { align: 'left' });
        doc.moveDown(2);
        
        doc.fontSize(8).font('Helvetica').text(
          'No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the copyright holder.',
          { align: 'justify', lineGap: 2 }
        );
        doc.moveDown(1);
        
        doc.fontSize(8).font('Helvetica-Oblique').text(
          'PowerWrite is a product of Dynamic Labs Media.',
          { align: 'center' }
        );
        
        // Add page number to legal page
        this.addPageNumberToPDF(doc, currentPageNumber);

        // === TABLE OF CONTENTS ===
        doc.addPage();
        currentPageNumber++;
        doc.fontSize(24).font('Helvetica-Bold').text('Table of Contents', { align: 'center' });
        doc.moveDown(2);
        
        // Pre-calculate chapter page numbers
        // TOC is page currentPageNumber, chapters start after that
        const firstChapterPage = currentPageNumber + 1;
        const tocEntries: Array<{ number: number; title: string; page: number }> = [];
        
        // Each chapter starts on a new page
        book.chapters.forEach((chapter, index) => {
          const chapterPage = firstChapterPage + index;
          tocEntries.push({ number: chapter.number, title: chapter.title, page: chapterPage });
          
          const entryText = `Chapter ${chapter.number}: ${chapter.title}`;
          const pageText = `${chapterPage}`;
          const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          
          // Save current Y position
          const startY = doc.y;
          
          // Draw chapter title on the left
          doc.fontSize(11).font('Helvetica').text(entryText, doc.page.margins.left, startY, {
            width: maxWidth - 50,
            continued: false,
            lineBreak: false,
          });
          
          // Draw page number on the right, aligned to the same line
          doc.fontSize(11).font('Helvetica').text(
            pageText,
            doc.page.width - doc.page.margins.right - 40,
            startY,
            { width: 40, align: 'right' }
          );
          
          // Add leader dots in the middle
          const titleWidth = doc.widthOfString(entryText);
          const pageNumWidth = doc.widthOfString(pageText);
          const dotsStartX = doc.page.margins.left + titleWidth + 5;
          const dotsEndX = doc.page.width - doc.page.margins.right - pageNumWidth - 10;
          const dotsWidth = dotsEndX - dotsStartX;
          
          if (dotsWidth > 10) {
            const dotString = ' . '.repeat(Math.floor(dotsWidth / (doc.widthOfString(' . '))));
            doc.fontSize(11).font('Helvetica').text(
              dotString,
              dotsStartX,
              startY,
              { width: dotsWidth, align: 'left', lineBreak: false }
            );
          }
          
          doc.moveDown(0.8);
        });
        
        // Add page number to TOC
        this.addPageNumberToPDF(doc, currentPageNumber);

        // === CHAPTERS ===
        book.chapters.forEach((chapter, chapterIndex) => {
          doc.addPage();
          currentPageNumber++;
          
          // Record this chapter's page number
          tocEntries[chapterIndex].page = currentPageNumber;

          // Chapter title (only once)
          doc.fontSize(20).font('Helvetica-Bold').text(`Chapter ${chapter.number}`, {
            underline: false,
          });
          doc.fontSize(18).font('Helvetica-Bold').text(chapter.title, {
            underline: false,
          });
          doc.moveDown(2);

          // Chapter content - handle paragraphs and remove duplicate titles
          const paragraphs = chapter.content.split(/\n\n+/).filter(p => p.trim());
          
          paragraphs.forEach((para, pIndex) => {
            // Clean the paragraph
            let cleanPara = para.trim().replace(/\n/g, ' ');
            
            // Remove multiple patterns of duplicate chapter titles (more aggressive)
            const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const patterns = [
              // Pattern: "Chapter 1: Title"
              new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.]*`, 'i'),
              // Pattern: "Chapter 1 - Title"
              new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.]*`, 'i'),
              // Pattern: "Chapter 1 Title" 
              new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.]*`, 'i'),
              // Pattern: Just "Chapter 1:"
              new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+`, 'i'),
              // Pattern: Just the title at the start (with optional colon/period)
              new RegExp(`^${escapedTitle}[:\\s\\.]*`, 'i'),
              // Pattern: Title repeated after newlines
              new RegExp(`\\n+${escapedTitle}[\\s\\.]*`, 'gi'),
            ];
            
            // Apply all patterns to remove duplicates
            for (const pattern of patterns) {
              cleanPara = cleanPara.replace(pattern, '').trim();
            }
            
            // Also remove if the first paragraph is ONLY the chapter title (case insensitive)
            if (pIndex === 0) {
              const titleLower = chapter.title.toLowerCase().trim();
              const paraLower = cleanPara.toLowerCase().trim();
              if (paraLower === titleLower || paraLower === `chapter ${chapter.number}` || paraLower === `chapter ${chapter.number}:`) {
                cleanPara = '';
              }
            }
            
            // Skip if paragraph is now empty
            if (!cleanPara) return;
            
            doc.fontSize(11).font('Helvetica').text(cleanPara, {
              align: 'justify',
              indent: 20,
              lineGap: 4,
            });
            
            if (pIndex < paragraphs.length - 1) {
              doc.moveDown(0.8);
            }
          });
          
          // Add page number to this chapter page
          this.addPageNumberToPDF(doc, currentPageNumber);
        });

        console.log(`Generated ${currentPageNumber} total pages. Creating TOC entries...`);
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error('PDF generation error:', error);
        reject(error);
      }
    });
  }

  /**
   * Export outline as DOCX
   */
  static async exportOutlineAsDOCX(outline: OutlineExport): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: outline.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `by ${outline.author}`, italics: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Description
            ...(outline.description ? [
              new Paragraph({
                text: 'Synopsis',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: outline.description,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 },
              }),
            ] : []),

            // Themes
            ...(outline.themes && outline.themes.length > 0 ? [
              new Paragraph({
                text: 'Themes',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              new Paragraph({
                text: outline.themes.join(', '),
                spacing: { after: 300 },
              }),
            ] : []),

            // Characters
            ...(outline.characters && outline.characters.length > 0 ? [
              new Paragraph({
                text: 'Main Characters',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...outline.characters.map(char =>
                new Paragraph({
                  text: `${char.name} - ${char.role}`,
                  bullet: { level: 0 },
                  spacing: { after: 100 },
                })
              ),
              new Paragraph({
                text: '',
                spacing: { after: 300 },
              }),
            ] : []),

            // Chapter Outline
            new Paragraph({
              text: 'Chapter Outline',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            ...outline.chapters.flatMap((chapter) => [
              new Paragraph({
                text: `Chapter ${chapter.number}: ${chapter.title}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 },
              }),
              new Paragraph({
                text: chapter.summary,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Target word count: ${chapter.wordCount.toLocaleString()} words`,
                    italics: true,
                  }),
                ],
                spacing: { after: 300 },
              }),
            ]),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Export outline as PDF
   */
  static async exportOutlineAsPDF(outline: OutlineExport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Dynamic import for pdfkit to avoid Next.js issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PDFDocument = require('pdfkit');
        
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 72, right: 72 },
          bufferPages: true,
          autoFirstPage: true,
          info: {
            Title: `${outline.title} - Outline`,
            Author: outline.author,
          },
        });

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => {
          console.error('PDFKit outline error:', err);
          reject(err);
        });

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text(outline.title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Oblique').text(`by ${outline.author}`, { align: 'center' });
        doc.moveDown(2);

        // Description
        if (outline.description) {
          doc.fontSize(16).font('Helvetica-Bold').text('Synopsis');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text(outline.description, { align: 'justify' });
          doc.moveDown(1.5);
        }

        // Themes
        if (outline.themes && outline.themes.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Themes');
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text(outline.themes.join(', '));
          doc.moveDown(1.5);
        }

        // Characters
        if (outline.characters && outline.characters.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Main Characters');
          doc.moveDown(0.5);
          outline.characters.forEach(char => {
            doc.fontSize(11).font('Helvetica').text(`• ${char.name} - ${char.role}`);
          });
          doc.moveDown(1.5);
        }

        // Chapter Outline
        doc.fontSize(18).font('Helvetica-Bold').text('Chapter Outline');
        doc.moveDown(1);

        outline.chapters.forEach((chapter, index) => {
          if (index > 0 && doc.y > 650) {
            doc.addPage();
          }

          doc.fontSize(13).font('Helvetica-Bold').text(`Chapter ${chapter.number}: ${chapter.title}`);
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').text(chapter.summary, { align: 'justify' });
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica-Oblique').text(`Target: ${chapter.wordCount.toLocaleString()} words`);
          doc.moveDown(1);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
