import jsPDF from 'jspdf';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';
import { PublishingSettings, DEFAULT_PUBLISHING_SETTINGS } from '@/lib/types/publishing';
import { generateHTMLStyles, getSceneBreakSymbol, formatChapterNumber, getChapterOrnament } from '@/lib/utils/publishing-styles';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string; // URL to front cover image
  backCoverUrl?: string; // URL to back cover image
  description?: string;
  genre?: string;
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
  publishingSettings?: PublishingSettings;
}

export class ExportService {
  // Helper to sanitize chapter content (remove duplicate chapter titles + AI artifacts)
  private static sanitizeChapterContent(chapter: { number: number; title: string; content: string }): string {
    // First, apply the centralized sanitizer to remove AI artifacts
    let cleaned = sanitizeForExport(chapter.content.trim());
    
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

  // Export as HTML with professional print styling, TOC with page numbers
  // Now uses PublishingSettings for dynamic styling
  static exportAsHTML(book: BookExport): string {
    // Get publishing settings
    const settings = book.publishingSettings || DEFAULT_PUBLISHING_SETTINGS;
    
    // Generate dynamic CSS from publishing settings
    const dynamicStyles = generateHTMLStyles(settings);
    
    // Get scene break and chapter ornament symbols
    const sceneBreakSymbol = getSceneBreakSymbol(settings);
    const chapterOrnament = getChapterOrnament(settings);
    
    let html = `<!DOCTYPE html>
<html lang="${settings.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title}</title>
    ${settings.export.html.darkModeSupport ? '<meta name="color-scheme" content="light dark">' : ''}
    <style>
    /* Dynamic styles from publishing settings */
    ${dynamicStyles}
        /* ============================================= */
        /* BASE STYLES - Screen & Print */
        /* ============================================= */
        :root {
            --primary-color: #1a1a1a;
            --secondary-color: #444;
            --muted-color: #666;
            --light-color: #888;
            --border-color: #ccc;
            --bg-color: #fff;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: var(--primary-color);
            background: var(--bg-color);
        }
        
        /* ============================================= */
        /* COVER PAGE */
        /* ============================================= */
        .cover-page {
            page-break-after: always;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px 20px;
        }
        
        .cover-page img {
            max-width: 100%;
            max-height: 70vh;
            height: auto;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        
        .cover-text {
            text-align: center;
            padding: 100px 20px;
        }
        
        .cover-title {
            font-size: 3em;
            font-weight: normal;
            margin-bottom: 20px;
            letter-spacing: 2px;
        }
        
        .cover-author {
            font-size: 1.4em;
            font-style: italic;
            color: var(--secondary-color);
        }
        
        /* ============================================= */
        /* TITLE PAGE */
        /* ============================================= */
        .title-page {
            page-break-after: always;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 60px 20px;
        }
        
        .title-page h1 {
            font-size: 2.5em;
            margin-bottom: 30px;
            font-weight: normal;
            letter-spacing: 1px;
        }
        
        .title-divider {
            width: 80px;
            height: 2px;
            background: var(--primary-color);
            margin: 0 auto 30px;
        }
        
        .title-author-label {
            font-size: 0.8em;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: var(--muted-color);
            margin-bottom: 10px;
        }
        
        .title-author {
            font-size: 1.4em;
            font-style: italic;
            color: var(--secondary-color);
        }
        
        .title-description {
            margin-top: 40px;
            font-size: 0.95em;
            color: var(--secondary-color);
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* ============================================= */
        /* COPYRIGHT PAGE */
        /* ============================================= */
        .copyright-page {
            page-break-after: always;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            font-size: 0.85em;
            color: var(--muted-color);
            padding: 60px 20px;
        }
        
        .copyright-page h2 {
            font-size: 1.2em;
            margin-bottom: 5px;
            color: var(--primary-color);
        }
        
        .copyright-page .author-line {
            font-style: italic;
            margin-bottom: 30px;
        }
        
        .copyright-divider {
            width: 40px;
            height: 1px;
            background: var(--border-color);
            margin: 25px auto;
        }
        
        .copyright-notice {
            margin-bottom: 30px;
        }
        
        .publisher-info {
            margin-top: 30px;
        }
        
        .publisher-info strong {
            display: block;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-size: 0.8em;
            margin-bottom: 10px;
        }
        
        /* ============================================= */
        /* TABLE OF CONTENTS */
        /* ============================================= */
        .toc-page {
            page-break-after: always;
            padding: 60px 20px;
        }
        
        .toc-page h2 {
            text-align: center;
            font-size: 1.5em;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: normal;
        }
        
        .toc-divider {
            width: 50px;
            height: 1px;
            background: var(--primary-color);
            margin: 0 auto 40px;
        }
        
        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .toc-entry {
            display: flex;
            align-items: baseline;
            margin-bottom: 15px;
            padding: 5px 0;
        }
        
        .toc-entry a {
            color: inherit;
            text-decoration: none;
            display: flex;
            width: 100%;
            align-items: baseline;
        }
        
        .toc-entry a:hover {
            color: var(--secondary-color);
        }
        
        .toc-chapter-label {
            font-size: 0.85em;
            color: var(--muted-color);
            width: 80px;
            flex-shrink: 0;
        }
        
        .toc-chapter-title {
            flex-grow: 0;
            flex-shrink: 0;
            max-width: 400px;
        }
        
        .toc-dots {
            flex-grow: 1;
            border-bottom: 1px dotted var(--border-color);
            margin: 0 10px 5px;
            min-width: 30px;
        }
        
        .toc-page-num {
            font-weight: bold;
            color: var(--primary-color);
            flex-shrink: 0;
            width: 30px;
            text-align: right;
        }
        
        /* ============================================= */
        /* CHAPTER STYLES */
        /* ============================================= */
        .chapter {
            page-break-before: always;
            padding-top: 80px;
        }
        
        .chapter:first-of-type {
            page-break-before: auto;
        }
        
        .chapter-header {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .chapter-number-label {
            font-size: 0.75em;
            letter-spacing: 5px;
            text-transform: uppercase;
            color: var(--muted-color);
            margin-bottom: 8px;
        }
        
        .chapter-number {
            font-size: 2em;
            margin-bottom: 15px;
        }
        
        .chapter-title-divider {
            width: 36px;
            height: 1px;
            background: var(--muted-color);
            margin: 0 auto 15px;
        }
        
        .chapter-title {
            font-size: 1.3em;
            font-style: italic;
            font-weight: normal;
            color: var(--secondary-color);
            margin: 0;
        }
        
        .chapter-content {
            text-align: justify;
        }
        
        .chapter-content p {
            margin: 0 0 1em;
            text-indent: 1.5em;
        }
        
        .chapter-content p:first-of-type {
            text-indent: 0;
        }
        
        .chapter-content p.scene-break {
            text-align: center;
            text-indent: 0;
            color: var(--muted-color);
            letter-spacing: 6px;
            margin: 2em 0;
        }
        
        /* ============================================= */
        /* BIBLIOGRAPHY */
        /* ============================================= */
        .bibliography-page {
            page-break-before: always;
            padding-top: 60px;
        }
        
        .bibliography-page h2 {
            text-align: center;
            font-size: 1.5em;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-weight: normal;
        }
        
        .bibliography-divider {
            width: 60px;
            height: 2px;
            background: var(--primary-color);
            margin: 0 auto 40px;
        }
        
        .bibliography-entry {
            margin-bottom: 12px;
            padding-left: 30px;
            text-indent: -30px;
            font-size: 0.95em;
            text-align: justify;
        }
        
        /* ============================================= */
        /* PRINT STYLES - Perfect page numbers at bottom right */
        /* ============================================= */
        @media print {
            @page {
                size: A4;
                margin: 2.5cm 2cm;
            }
            
            /* Page numbering via CSS counters */
            body {
                counter-reset: page-counter;
            }
            
            .chapter {
                counter-increment: page-counter;
            }
            
            /* Footer with page numbers at bottom right */
            @page {
                @bottom-right {
                    content: counter(page);
                    font-family: Georgia, serif;
                    font-size: 10pt;
                    color: #555;
                }
            }
            
            /* No page number on cover */
            @page :first {
                @bottom-right {
                    content: none;
                }
            }
            
            /* Print-specific adjustments */
            body {
                max-width: 100%;
                padding: 0;
            }
            
            .cover-page,
            .title-page,
            .copyright-page,
            .toc-page {
                min-height: auto;
                height: auto;
            }
            
            .chapter {
                page-break-before: always;
                page-break-inside: avoid;
                padding-top: 60pt;
            }
            
            .chapter-header {
                page-break-after: avoid;
            }
            
            .chapter-content p {
                orphans: 3;
                widows: 3;
            }
            
            /* Hide screen-only elements */
            .no-print {
                display: none !important;
            }
            
            /* Links show as text */
            a {
                color: inherit;
                text-decoration: none;
            }
        }
        
        /* ============================================= */
        /* RESPONSIVE */
        /* ============================================= */
        @media (max-width: 600px) {
            .cover-title {
                font-size: 2em;
            }
            
            .title-page h1 {
                font-size: 1.8em;
            }
            
            .toc-entry {
                flex-wrap: wrap;
            }
            
            .toc-chapter-label {
                width: 100%;
                margin-bottom: 5px;
            }
            
            .toc-dots {
                display: none;
            }
        }
    </style>
</head>
<body>
`;
    
    // Add cover page
    if (book.coverUrl) {
      html += `
    <div class="cover-page">
        <img src="${book.coverUrl}" alt="${book.title} Cover" />
    </div>`;
    } else {
      html += `
    <div class="cover-page">
        <div class="cover-text">
            <h1 class="cover-title">${book.title}</h1>
            <p class="cover-author">by ${book.author}</p>
        </div>
    </div>`;
    }
    
    // Title page
    html += `
    <div class="title-page">
        <h1>${book.title}</h1>
        <div class="title-divider"></div>
        <p class="title-author-label">A Novel By</p>
        <p class="title-author">${book.author}</p>
        ${book.description ? `<p class="title-description">${book.description}</p>` : ''}
    </div>`;
    
    // Copyright page
    const currentYear = new Date().getFullYear();
    html += `
    <div class="copyright-page">
        <h2>${book.title}</h2>
        <p class="author-line">by ${book.author}</p>
        <p class="copyright-notice">Copyright © ${currentYear} ${book.author}<br>All rights reserved.</p>
        <div class="copyright-divider"></div>
        <p>No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the copyright holder.</p>
        <div class="publisher-info">
            <strong>Published By</strong>
            <p>Dynamic Labs Media<br>dlmworld.com</p>
        </div>
        <p style="margin-top: 30px; font-style: italic;">Created with PowerWrite</p>
    </div>`;
    
    // Table of Contents
    html += `
    <div class="toc-page">
        <h2>Contents</h2>
        <div class="toc-divider"></div>
        <ul class="toc-list">`;
    
    book.chapters.forEach((chapter, index) => {
      html += `
            <li class="toc-entry">
                <a href="#chapter-${chapter.number}">
                    <span class="toc-chapter-label">Chapter ${chapter.number}</span>
                    <span class="toc-chapter-title">${chapter.title}</span>
                    <span class="toc-dots"></span>
                    <span class="toc-page-num">${index + 1}</span>
                </a>
            </li>`;
    });
    
    // Add bibliography to TOC if exists
    if (book.bibliography?.config.enabled && book.bibliography.references.length > 0) {
      html += `
            <li class="toc-entry">
                <a href="#bibliography">
                    <span class="toc-chapter-label"></span>
                    <span class="toc-chapter-title">Bibliography</span>
                    <span class="toc-dots"></span>
                    <span class="toc-page-num">${book.chapters.length + 1}</span>
                </a>
            </li>`;
    }
    
    html += `
        </ul>
    </div>`;
    
    // Chapters - using publishing settings for formatting
    book.chapters.forEach(chapter => {
      const sanitizedContent = this.sanitizeChapterContent(chapter);
      // Split into paragraphs and handle scene breaks
      const paragraphs = sanitizedContent.split(/\n\n+/).filter(p => p.trim());
      
      // Format chapter number based on settings
      const chapterNumberText = formatChapterNumber(chapter.number, settings.chapters.chapterNumberStyle);
      
      // Apply title case transformation
      let displayTitle = chapter.title;
      if (settings.chapters.chapterTitleCase === 'uppercase') {
        displayTitle = chapter.title.toUpperCase();
      } else if (settings.chapters.chapterTitleCase === 'lowercase') {
        displayTitle = chapter.title.toLowerCase();
      }
      
      html += `
    <div class="chapter" id="chapter-${chapter.number}">
        <div class="chapter-header">`;
      
      // Add chapter number if enabled
      if (settings.chapters.showChapterNumber && settings.chapters.chapterNumberPosition !== 'hidden') {
        html += `
            <p class="chapter-number-label">${settings.chapters.chapterNumberLabel}</p>
            <p class="chapter-number">${chapterNumberText}</p>`;
      }
      
      // Add ornament between number and title if configured
      if (chapterOrnament && settings.chapters.chapterOrnamentPosition === 'between-number-title') {
        html += `
            <p class="chapter-ornament">${chapterOrnament}</p>`;
      } else {
        html += `
            <div class="chapter-title-divider"></div>`;
      }
      
      html += `
            <h2 class="chapter-title">${displayTitle}</h2>`;
      
      // Add ornament below title if configured
      if (chapterOrnament && settings.chapters.chapterOrnamentPosition === 'below-title') {
        html += `
            <p class="chapter-ornament">${chapterOrnament}</p>`;
      }
      
      html += `
        </div>
        <div class="chapter-content chapter-start">`;
      
      paragraphs.forEach((para, index) => {
        const trimmed = para.trim();
        // Check for scene breaks
        if (trimmed === '***' || trimmed === '* * *' || trimmed === '---' || trimmed === '- - -') {
          html += `
            <p class="scene-break">${sceneBreakSymbol || '* * *'}</p>`;
        } else {
          html += `
            <p>${trimmed}</p>`;
        }
      });
      
      html += `
        </div>
    </div>`;
    });
    
    // Bibliography if enabled
    if (book.bibliography?.config.enabled && book.bibliography.references.length > 0) {
      const sortedRefs = CitationService.sortReferences(
        book.bibliography.references,
        book.bibliography.config.sortBy,
        book.bibliography.config.sortDirection
      );
      
      html += `
    <div class="bibliography-page" id="bibliography">
        <h2>Bibliography</h2>
        <div class="bibliography-divider"></div>`;
      
      sortedRefs.forEach((ref, index) => {
        const formatted = CitationService.formatReference(
          ref,
          book.bibliography!.config.citationStyle,
          index + 1
        );
        // Keep em tags for italics but remove others
        const cleanFormatted = formatted.replace(/<(?!\/?(em)>)[^>]*>/g, '');
        
        let refText = cleanFormatted;
        if (book.bibliography!.config.numberingStyle === 'numeric') {
          refText = `${index + 1}. ${cleanFormatted}`;
        } else if (book.bibliography!.config.numberingStyle === 'alphabetic') {
          refText = `${String.fromCharCode(65 + (index % 26))}. ${cleanFormatted}`;
        }
        
        html += `
        <p class="bibliography-entry">${refText}</p>`;
      });
      
      html += `
        <p style="text-align: center; margin-top: 30px; font-style: italic; color: var(--muted-color); font-size: 0.85em;">
            References formatted in ${book.bibliography.config.citationStyle} style.
        </p>
    </div>`;
    }
    
    // Add back cover page at the end if available
    if (book.backCoverUrl) {
      html += `
    <div class="cover-page back-cover-page" style="page-break-before: always;">
        <img src="${book.backCoverUrl}" alt="${book.title} Back Cover" />
    </div>`;
    }
    
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

    // Helper function to add page numbers at bottom right
    const addPageNumber = () => {
      if (pageNumber > 0) { // Don't add page number on cover
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        // Position at bottom right (pageWidth - margin for right alignment)
        doc.text(pageNumber.toString(), pageWidth - margin, pageHeight - 15, { align: 'right' });
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

    // Add back cover as the last page if available
    if (book.backCoverUrl) {
      try {
        console.log('Adding back cover page to PDF...');
        doc.addPage();
        
        // Add back cover image to fill the entire last page
        const backCoverWidth = pageWidth;
        const backCoverHeight = pageHeight;
        
        await this.addImageToPDF(doc, book.backCoverUrl, 0, 0, backCoverWidth, backCoverHeight);
        console.log('Back cover added successfully');
      } catch (error) {
        console.error('Failed to add back cover to PDF:', error);
        // Continue without back cover if it fails
      }
    }

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
