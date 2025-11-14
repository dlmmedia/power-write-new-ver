import jsPDF from 'jspdf';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string; // URL to cover image
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  bibliography?: {
    config: BibliographyConfig;
    references: Reference[];
    chapterReferences?: ChapterReferences[];
  };
}

export class ExportService {
  // Helper to sanitize chapter content (remove duplicate chapter titles)
  private static sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
    let cleaned = chapter.content.trim();
    
    // Remove multiple patterns of duplicate chapter titles (more aggressive)
    const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
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
      // Pattern: "Chapter 1:" followed by newlines and then title
      new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*\\n+${escapedTitle}[\\s\\.]*`, 'i'),
      // Pattern: Title repeated after newlines
      new RegExp(`\\n+${escapedTitle}[\\s\\.]*`, 'gi'),
    ];
    
    // Apply all patterns to remove duplicates
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // Also check if content is ONLY the chapter title (case insensitive)
    const titleLower = chapter.title.toLowerCase().trim();
    const cleanedLower = cleaned.toLowerCase().trim();
    if (cleanedLower === titleLower || cleanedLower === `chapter ${chapter.number}` || cleanedLower === `chapter ${chapter.number}:`) {
      cleaned = '';
    }
    
    return cleaned;
  }

  // Export as plain text
  static exportAsText(book: BookExport): string {
    let content = `${book.title}\nby ${book.author}\n\n${'='.repeat(50)}\n\n`;
    
    book.chapters.forEach(chapter => {
      content += `\nChapter ${chapter.number}: ${chapter.title}\n\n`;
      content += this.sanitizeChapterContent(chapter) + '\n\n';
      content += '-'.repeat(50) + '\n';
    });
    
    return content;
  }

  // Export as Markdown
  static exportAsMarkdown(book: BookExport): string {
    let content = `# ${book.title}\n### by ${book.author}\n\n---\n\n`;
    
    book.chapters.forEach(chapter => {
      content += `## Chapter ${chapter.number}: ${chapter.title}\n\n`;
      content += this.sanitizeChapterContent(chapter) + '\n\n';
    });
    
    return content;
  }

  // Export as HTML
  static exportAsHTML(book: BookExport): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        h1 {
            text-align: center;
            margin-bottom: 10px;
        }
        .author {
            text-align: center;
            font-style: italic;
            margin-bottom: 40px;
            color: #666;
        }
        ${book.coverUrl ? `
        .cover-page {
            page-break-after: always;
            text-align: center;
            margin: 100px 0;
        }
        .cover-page img {
            max-width: 100%;
            height: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }` : ''}
        .chapter {
            page-break-before: always;
            margin-top: 60px;
        }
        .chapter-title {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .chapter-content {
            text-align: justify;
            white-space: pre-line;
        }
        @media print {
            .page-number {
                position: fixed;
                bottom: 10px;
                right: 10px;
            }
        }
    </style>
</head>
<body>
`;
    
    // Add cover page if cover URL exists
    if (book.coverUrl) {
      html += `
    <div class="cover-page">
        <img src="${book.coverUrl}" alt="${book.title} Cover" />
    </div>`;
    }
    
    html += `
    <h1>${book.title}</h1>
    <p class="author">by ${book.author}</p>
    <hr>
`;
    
    book.chapters.forEach(chapter => {
      const sanitizedContent = this.sanitizeChapterContent(chapter);
      html += `
    <div class="chapter">
        <h2 class="chapter-title">Chapter ${chapter.number}: ${chapter.title}</h2>
        <div class="chapter-content">${sanitizedContent}</div>
    </div>`;
    });
    
    html += `
</body>
</html>`;
    
    return html;
  }

  // Trigger download
  static downloadFile(content: string, filename: string, mimeType: string, blobOverride?: Blob) {
    const blob = blobOverride || new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export as PDF
  static async exportAsPDF(book: BookExport): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = margin;
    let pageNumber = 0;

    // Add cover page if cover URL is provided
    if (book.coverUrl) {
      try {
        console.log('Adding cover page to PDF...');
        
        // Add cover image to fill the entire first page
        // Use A4 dimensions: 210mm x 297mm
        const coverWidth = pageWidth;
        const coverHeight = pageHeight;
        
        // Try to load and add the cover image
        await this.addImageToPDF(doc, book.coverUrl, 0, 0, coverWidth, coverHeight);
        
        // Add a new page after the cover
        doc.addPage();
        pageNumber++;
        currentY = margin;
      } catch (error) {
        console.error('Failed to add cover to PDF:', error);
        // Continue without cover if it fails
      }
    }

    // Helper function to add page numbers
    const addPageNumber = () => {
      if (pageNumber > 0) { // Don't add page number on cover
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(pageNumber.toString(), pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset to black
      }
    };

    // Helper function to add text with page breaks
    const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (currentY + fontSize / 2 > pageHeight - margin - 15) { // Leave space for page number
          addPageNumber();
          doc.addPage();
          pageNumber++;
          currentY = margin;
        }
        
        if (align === 'center') {
          const textWidth = doc.getTextWidth(line);
          doc.text(line, (pageWidth - textWidth) / 2, currentY);
        } else {
          doc.text(line, margin, currentY);
        }
        currentY += fontSize / 2 + 2;
      }
    };

    // Only add title page if no cover was added
    if (!book.coverUrl) {
      currentY = pageHeight / 3;
      addText(book.title, 24, true, 'center');
      currentY += 10;
      addText(`by ${book.author}`, 16, false, 'center');
      
      // Add page break after title
      addPageNumber();
      doc.addPage();
      pageNumber++;
      currentY = margin;
    }

    // Chapters
    book.chapters.forEach((chapter, index) => {
      // Chapter title
      if (index > 0) {
        addPageNumber();
        doc.addPage();
        pageNumber++;
        currentY = margin;
      }
      
      addText(`Chapter ${chapter.number}: ${chapter.title}`, 18, true);
      currentY += 5;
      
      // Add a separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Sanitize and add chapter content
      const sanitizedContent = this.sanitizeChapterContent(chapter);
      addText(sanitizedContent, 12, false);
      currentY += 10;

      // Add chapter-end references if configured
      if (book.bibliography?.config.enabled && 
          book.bibliography.config.location.includes('endnote') &&
          book.bibliography.chapterReferences) {
        const bibliography = book.bibliography;
        const chapterRefs = bibliography.chapterReferences?.find(
          cr => cr.chapterNumber === chapter.number
        );
        
        if (chapterRefs && chapterRefs.references.length > 0) {
          currentY += 10;
          addText(`Notes for Chapter ${chapter.number}`, 14, true);
          currentY += 5;
          
          const sortedRefs = CitationService.sortReferences(
            chapterRefs.references,
            bibliography.config.sortBy,
            bibliography.config.sortDirection
          );
          
          sortedRefs.forEach((ref, refIndex) => {
            const formatted = CitationService.formatReference(
              ref,
              bibliography.config.citationStyle,
              refIndex + 1
            );
            // Remove HTML tags for PDF
            const plainText = formatted.replace(/<[^>]*>/g, '');
            addText(`${refIndex + 1}. ${plainText}`, 10, false);
            currentY += 2;
          });
        }
      }
    });

    // Add comprehensive bibliography section at the end
    if (book.bibliography?.config.enabled && 
        book.bibliography.references.length > 0 &&
        book.bibliography.config.location.includes('bibliography')) {
      
      // Store bibliography reference for type safety
      const bibliography = book.bibliography;
      
      // Start new page for bibliography
      addPageNumber();
      doc.addPage();
      pageNumber++;
      currentY = margin;
      
      // Bibliography title
      addText('Bibliography', 20, true, 'center');
      currentY += 10;
      
      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Sort references
      const sortedReferences = CitationService.sortReferences(
        bibliography.references,
        bibliography.config.sortBy,
        bibliography.config.sortDirection
      );
      
      // Group by type if configured
      if (bibliography.config.groupByType) {
        const grouped: Record<string, Reference[]> = {};
        sortedReferences.forEach(ref => {
          const type = ref.type;
          if (!grouped[type]) grouped[type] = [];
          grouped[type].push(ref);
        });
        
        Object.entries(grouped).forEach(([type, refs]) => {
          // Type heading
          const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + 's';
          addText(typeLabel, 14, true);
          currentY += 5;
          
          refs.forEach((ref, index) => {
            const formatted = CitationService.formatReference(
              ref,
              bibliography.config.citationStyle,
              index + 1
            );
            // Remove HTML tags for PDF
            const plainText = formatted.replace(/<[^>]*>/g, '');
            
            // Add numbering if configured
            let refText = plainText;
            if (bibliography.config.numberingStyle === 'numeric') {
              refText = `${index + 1}. ${plainText}`;
            } else if (bibliography.config.numberingStyle === 'alphabetic') {
              refText = `${String.fromCharCode(65 + index)}. ${plainText}`;
            }
            
            // Apply hanging indent if configured
            if (bibliography.config.hangingIndent) {
              const lines = doc.splitTextToSize(refText, maxWidth - 10);
              lines.forEach((line: string, lineIndex: number) => {
                if (currentY + 10 > pageHeight - margin - 15) {
                  addPageNumber();
                  doc.addPage();
                  pageNumber++;
                  currentY = margin;
                }
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(line, lineIndex === 0 ? margin : margin + 10, currentY);
                currentY += 5;
              });
            } else {
              addText(refText, 10, false);
            }
            currentY += 3;
          });
          
          currentY += 5; // Space between groups
        });
      } else {
        // Single list
        sortedReferences.forEach((ref, index) => {
          const formatted = CitationService.formatReference(
            ref,
            bibliography.config.citationStyle,
            index + 1
          );
          // Remove HTML tags for PDF
          const plainText = formatted.replace(/<[^>]*>/g, '');
          
          // Add numbering if configured
          let refText = plainText;
          if (bibliography.config.numberingStyle === 'numeric') {
            refText = `${index + 1}. ${plainText}`;
          } else if (bibliography.config.numberingStyle === 'alphabetic') {
            refText = `${String.fromCharCode(65 + index)}. ${plainText}`;
          }
          
          // Apply hanging indent if configured
          if (bibliography.config.hangingIndent) {
            const lines = doc.splitTextToSize(refText, maxWidth - 10);
            lines.forEach((line: string, lineIndex: number) => {
              if (currentY + 10 > pageHeight - margin - 15) {
                addPageNumber();
                doc.addPage();
                pageNumber++;
                currentY = margin;
              }
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(line, lineIndex === 0 ? margin : margin + 10, currentY);
              currentY += 5;
            });
          } else {
            addText(refText, 10, false);
          }
          currentY += 3;
        });
      }
      
      // Add citation style note
      currentY += 10;
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      addText(`References formatted in ${bibliography.config.citationStyle} style.`, 9, false);
      doc.setTextColor(0, 0, 0);
    }

    // Add page number to last page
    addPageNumber();

    return doc.output('blob');
  }

  // Helper to add image to PDF (handles cross-origin and data URLs)
  private static async addImageToPDF(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Determine image format
          const format = imageUrl.includes('.png') || imageUrl.includes('data:image/png') ? 'PNG' : 'JPEG';
          
          // Add image to PDF
          doc.addImage(img, format, x, y, width, height, undefined, 'FAST');
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load cover image'));
      };
      
      // Handle both URLs and data URLs
      if (imageUrl.startsWith('data:')) {
        img.src = imageUrl;
      } else {
        // For external URLs, we might need a proxy or CORS-enabled source
        img.src = imageUrl;
      }
    });
  }

  // Main export functions
  static async exportBook(book: BookExport, format: 'txt' | 'md' | 'html' | 'pdf') {
    const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    
    switch (format) {
      case 'pdf':
        const pdfBlob = await this.exportAsPDF(book);
        this.downloadFile(
          '',
          `${filename}.pdf`,
          'application/pdf',
          pdfBlob
        );
        break;
      
      case 'txt':
        this.downloadFile(
          this.exportAsText(book),
          `${filename}.txt`,
          'text/plain'
        );
        break;
      
      case 'md':
        this.downloadFile(
          this.exportAsMarkdown(book),
          `${filename}.md`,
          'text/markdown'
        );
        break;
      
      case 'html':
        this.downloadFile(
          this.exportAsHTML(book),
          `${filename}.html`,
          'text/html'
        );
        break;
    }
  }
}
