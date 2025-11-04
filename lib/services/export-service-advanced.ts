// Advanced Export Service with PDF and DOCX support
import React from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Footer, PageNumber, ImageRun } from 'docx';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from './pdf-document';
import { registerFonts } from './pdf-fonts';

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
   * Fetch image from URL and convert to Buffer
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
   * Helper to aggressively remove duplicate chapter titles from content
   */
  private static sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
    let cleaned = chapter.content.trim();
    
    // Escape special regex characters in title
    const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Comprehensive patterns to catch all possible duplicates
    const patterns = [
      // At start: "Chapter X: Title"
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: "Chapter X - Title"  
      new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: "Chapter X Title"
      new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // At start: Just "Chapter X:" or "Chapter X"
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*[\\s\\.,:;!?]*`, 'im'),
      // At start: Just the title with optional punctuation
      new RegExp(`^${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
      // After newlines: Chapter title repeated
      new RegExp(`\\n+\\s*Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'gim'),
      new RegExp(`\\n+\\s*${escapedTitle}[\\s\\.,:;!?]*\\n`, 'gim'),
      // Standalone chapter title on its own line
      new RegExp(`^\\s*${escapedTitle}\\s*$`, 'im'),
      // Chapter number standalone
      new RegExp(`^\\s*Chapter\\s+${chapter.number}\\s*$`, 'im'),
    ];
    
    // Apply all patterns
    for (const pattern of patterns) {
      const before = cleaned;
      cleaned = cleaned.replace(pattern, '').trim();
      // If we removed something, clean up any resulting double newlines
      if (before !== cleaned) {
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      }
    }
    
    // Split into paragraphs and check first few
    const paragraphs = cleaned.split(/\n\n+/);
    const titleLower = chapter.title.toLowerCase().trim();
    
    // Remove first paragraph if it's just the title or chapter number
    if (paragraphs.length > 0) {
      const firstParaLower = paragraphs[0].toLowerCase().trim();
      if (
        firstParaLower === titleLower ||
        firstParaLower === `chapter ${chapter.number}` ||
        firstParaLower === `chapter ${chapter.number}:` ||
        firstParaLower === `chapter ${chapter.number} - ${titleLower}` ||
        firstParaLower === `chapter ${chapter.number}: ${titleLower}`
      ) {
        paragraphs.shift();
      }
    }
    
    // Rejoin and final cleanup
    cleaned = paragraphs.join('\n\n').trim();
    
    // Remove any leading/trailing whitespace and normalize line breaks
    cleaned = cleaned.replace(/^\s+|\s+$/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  /**
   * Export book as DOCX with professional formatting
   */
  static async exportBookAsDOCX(book: BookExport): Promise<Buffer> {
    // Fetch cover image if available
    let coverImageBuffer: Buffer | null = null;
    if (book.coverUrl) {
      try {
        console.log('Fetching cover image for DOCX:', book.coverUrl);
        coverImageBuffer = await this.fetchImageAsBuffer(book.coverUrl);
        console.log('Cover image fetched successfully for DOCX');
      } catch (error) {
        console.error('Error fetching cover image for DOCX:', error);
        // Continue without image
      }
    }

    const coverPageChildren = [];
    
    // Add spacing before content
    coverPageChildren.push(
      new Paragraph({
        text: '',
        spacing: { before: 3000 },
      })
    );
    
    // If we have a cover image, add it
    if (coverImageBuffer) {
      coverPageChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: coverImageBuffer as any,
              transformation: {
                width: 400,
                height: 600,
              },
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }
    
    // Add title
    coverPageChildren.push(
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
      })
    );

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
            ...coverPageChildren,

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
              // Use sanitization helper to remove all duplicates
              const sanitizedContent = this.sanitizeChapterContent(chapter);
              const paragraphs = sanitizedContent.split('\n\n').filter(p => p.trim());

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
   * Export book as PDF with professional formatting using React-PDF
   */
  static async exportBookAsPDF(book: BookExport): Promise<Buffer> {
    try {
      console.log(`Generating professional PDF for: ${book.title}`);
      console.log(`PDF has ${book.chapters?.length || 0} chapters`);
      
      // Ensure fonts are registered
      try {
        registerFonts();
        console.log('Fonts registered successfully');
      } catch (fontError) {
        console.warn('Font registration failed, continuing with defaults:', fontError);
      }
      
      // Create the PDF document component using React.createElement
      console.log('Creating PDF document component...');
      const doc = React.createElement(PDFDocument, { book });
      
      // Generate PDF blob
      console.log('Generating PDF blob...');
      const pdfBlob = await pdf(doc).toBlob();
      
      // Convert blob to buffer
      console.log('Converting to buffer...');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`PDF generated successfully. Size: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
