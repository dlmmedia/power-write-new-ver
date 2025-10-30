interface BookExport {
  title: string;
  author: string;
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
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Main export functions
  static exportBook(book: BookExport, format: 'txt' | 'md' | 'html') {
    const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    
    switch (format) {
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
