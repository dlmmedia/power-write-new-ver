// Professional PDF Document Component using React-PDF
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

interface BookExport {
  title: string;
  author: string;
  coverUrl?: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  description?: string;
  genre?: string;
}

interface PDFDocumentProps {
  book: BookExport;
}

// Premium publishing-quality styles
const styles = StyleSheet.create({
  // Cover page - full bleed, no padding
  coverPage: {
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTextContainer: {
    padding: '2in',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  coverAuthor: {
    fontFamily: 'Times-Roman',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },

  // Standard page layout
  page: {
    padding: '1in',
    paddingBottom: '1.25in',
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },

  // Title page
  titlePage: {
    padding: '1in',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  author: {
    fontFamily: 'Times-Italic',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 32,
    color: '#333333',
  },
  description: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    textAlign: 'justify',
    lineHeight: 1.6,
    marginTop: 48,
    maxWidth: '80%',
  },

  // Copyright page
  copyrightPage: {
    padding: '1in',
    fontSize: 10,
    lineHeight: 1.5,
  },
  copyrightTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  copyrightText: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 24,
  },
  copyrightBody: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    textAlign: 'left',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  publisherInfo: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    marginBottom: 4,
  },

  // Table of Contents
  tocTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 32,
  },
  tocEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontSize: 11,
  },
  tocChapter: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  tocPageNumber: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },

  // Chapter pages
  chapterNumber: {
    fontFamily: 'Times-Roman',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  chapterTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
    color: '#1a1a1a',
  },
  paragraph: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    textAlign: 'justify',
    lineHeight: 1.65,
    marginBottom: 14,
    textIndent: 24,
  },
  firstParagraph: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    textAlign: 'justify',
    lineHeight: 1.65,
    marginBottom: 14,
    textIndent: 0, // No indent for first paragraph
  },

  // Page numbers (only on chapter pages)
  pageNumber: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#666666',
  },
});

// Helper to sanitize chapter content (remove duplicate titles)
const sanitizeChapterContent = (chapter: { number: number; title: string; content: string }): string => {
  let cleaned = chapter.content.trim();
  
  const escapedTitle = chapter.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const patterns = [
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}\\s*[-–—]\\s*${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}\\s+${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^Chapter\\s+${chapter.number}[:\\s-]*[\\s\\.,:;!?]*`, 'im'),
    new RegExp(`^${escapedTitle}[\\s\\.,:;!?]*`, 'im'),
  ];
  
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
};

const PDFDocument: React.FC<PDFDocumentProps> = ({ book }) => {
  const currentYear = new Date().getFullYear();
  
  // Calculate how many pages the TOC will need
  // Rough estimate: ~25 chapters per page
  const tocPages = Math.ceil(book.chapters.length / 25);
  // Total front matter pages: cover (1) + title (1) + copyright (1) + TOC (tocPages)
  const frontMatterPages = 3 + tocPages;

  return (
    <Document
      title={book.title}
      author={book.author}
      creator="PowerWrite by Dynamic Labs Media"
    >
      {/* COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} style={styles.coverImage} />
        ) : (
          <View style={styles.coverTextContainer}>
            <Text style={styles.coverTitle}>{book.title}</Text>
            <Text style={styles.coverAuthor}>by {book.author}</Text>
          </View>
        )}
      </Page>

      {/* TITLE PAGE */}
      <Page size="A4" style={styles.titlePage}>
        <View>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          {book.description && (
            <Text style={styles.description}>{book.description}</Text>
          )}
        </View>
      </Page>

      {/* COPYRIGHT PAGE */}
      <Page size="A4" style={styles.copyrightPage}>
        <Text style={styles.copyrightTitle}>{book.title}</Text>
        <Text style={styles.copyrightText}>by {book.author}</Text>
        
        <Text style={styles.copyrightText}>
          Copyright © {currentYear} {book.author}. All rights reserved.
        </Text>
        
        <Text style={styles.copyrightBody}>
          This book was created using PowerWrite, an AI-powered book writing platform developed by Dynamic Labs Media.
        </Text>
        
        <Text style={styles.publisherInfo}>Published by:</Text>
        <Text style={styles.copyrightBody}>Dynamic Labs Media</Text>
        <Text style={styles.copyrightBody}>Website: dlmworld.com</Text>
        <Text style={styles.copyrightBody}>Email: info@dlmworld.com</Text>
        
        <Text style={styles.copyrightBody}>
          No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means, electronic, mechanical, photocopying, recording, or otherwise, without the prior written permission of the copyright holder.
        </Text>
        
        <Text style={[styles.copyrightBody, { fontFamily: 'Times-Italic', textAlign: 'center', marginTop: 24 }]}>
          PowerWrite is a product of Dynamic Labs Media.
        </Text>
      </Page>

      {/* TABLE OF CONTENTS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {book.chapters.map((chapter, index) => (
          <View key={chapter.number} style={styles.tocEntry}>
            <Text style={styles.tocChapter}>
              Chapter {chapter.number}: {chapter.title}
            </Text>
            <Text style={styles.tocPageNumber}>{index + 1}</Text>
          </View>
        ))}
      </Page>

      {/* CHAPTERS */}
      {book.chapters.map((chapter, chapterIndex) => {
        const sanitizedContent = sanitizeChapterContent(chapter);
        const paragraphs = sanitizedContent.split(/\n\n+/).filter(p => p.trim());

        return (
          <Page key={chapter.number} size="A4" style={styles.page}>
            <Text style={styles.chapterNumber}>Chapter {chapter.number}</Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            
            {paragraphs.map((para, paraIndex) => (
              <Text
                key={paraIndex}
                style={paraIndex === 0 ? styles.firstParagraph : styles.paragraph}
              >
                {para.trim()}
              </Text>
            ))}
            
            {/* Page number - starts at 1 for first chapter page */}
            <Text 
              style={styles.pageNumber} 
              render={({ pageNumber }) => {
                // Calculate page number relative to start of chapters
                // pageNumber is 1-based absolute page number
                const relativePageNumber = pageNumber - frontMatterPages;
                return relativePageNumber > 0 ? `${relativePageNumber}` : '';
              }} 
              fixed 
            />
          </Page>
        );
      })}
    </Document>
  );
};

export default PDFDocument;

