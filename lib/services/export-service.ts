import jsPDF from 'jspdf';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string; // URL to cover image
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
}

export class ExportService {
  // Export as plain text
  static exportAsText(book: BookExport): string {
    let content = `${book.title}\nby ${book.author}\n\n${'='.repeat(50)}\n\n`;
    
    book.chapters.forEach(chapter => {
      content += `\nChapter ${chapter.number}: ${chapter.title}\n\n`;
      content += chapter.content + '\n\n';
      content += '-'.repeat(50) + '\n';
    });
    
    return content;
  }

  // Export as Markdown
  static exportAsMarkdown(book: BookExport): string {
    let content = `# ${book.title}\n### by ${book.author}\n\n---\n\n`;
    
    book.chapters.forEach(chapter => {
      content += `## Chapter ${chapter.number}: ${chapter.title}\n\n`;
      content += chapter.content + '\n\n';
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
    </style>
</head>
<body>
    <h1>${book.title}</h1>
    <p class="author">by ${book.author}</p>
    <hr>
`;
    
    book.chapters.forEach(chapter => {
      html += `
    <div class="chapter">
        <h2 class="chapter-title">Chapter ${chapter.number}: ${chapter.title}</h2>
        <div class="chapter-content">${chapter.content}</div>
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
        currentY = margin;
      } catch (error) {
        console.error('Failed to add cover to PDF:', error);
        // Continue without cover if it fails
      }
    }

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
        if (currentY + fontSize / 2 > pageHeight - margin) {
          doc.addPage();
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
      doc.addPage();
      currentY = margin;
    }

    // Chapters
    book.chapters.forEach((chapter, index) => {
      // Chapter title
      if (index > 0) {
        doc.addPage();
        currentY = margin;
      }
      
      addText(`Chapter ${chapter.number}: ${chapter.title}`, 18, true);
      currentY += 5;
      
      // Add a separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Chapter content
      addText(chapter.content, 12, false);
      currentY += 10;
    });

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
