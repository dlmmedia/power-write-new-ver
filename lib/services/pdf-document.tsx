// Professional PDF Document Component using React-PDF
// Production-ready layout with proper page numbering and premium typography
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { FontFamilies } from './pdf-fonts';
import { Reference, BibliographyConfig, ChapterReferences } from '@/lib/types/bibliography';
import { CitationService } from './citation-service';

// Use Google Fonts with built-in fallback
const BODY_FONT = FontFamilies.primary;      // EBGaramond - elegant book serif
const HEADING_FONT = FontFamilies.primary;   // EBGaramond for consistency
const SANS_FONT = FontFamilies.sansSerif;    // Helvetica for labels

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
  bibliography?: {
    config: BibliographyConfig;
    references: Reference[];
    chapterReferences?: ChapterReferences[];
  };
}

interface PDFDocumentProps {
  book: BookExport;
}

// Professional publishing-quality color palette
const colors = {
  primary: '#1a1a1a',        // Rich black for main text
  secondary: '#3d3d3d',      // Dark gray for secondary text
  accent: '#2c2c2c',         // Darker accent
  muted: '#666666',          // Muted gray for subtle elements
  light: '#888888',          // Light gray for decorative elements
  divider: '#cccccc',        // Very light for divider lines
  pageNum: '#555555',        // Page number color
  background: '#ffffff',      // Clean white background
};

// Premium publishing-quality styles with professional typography
// Using Google Fonts (EBGaramond) with built-in fallbacks (Times-Roman, Helvetica)
const styles = StyleSheet.create({
  // =============================================
  // COVER PAGE - Full bleed, dramatic presence
  // =============================================
  coverPage: {
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTextContainer: {
    padding: 72,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 48,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#bbbbbb',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  coverAuthor: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 3,
  },
  coverDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#555555',
    marginVertical: 30,
  },

  // =============================================
  // TITLE PAGE - Elegant and centered
  // =============================================
  titlePage: {
    padding: 72,
    paddingBottom: 72,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleMain: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 38,
    textAlign: 'center',
    marginBottom: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  titleDivider: {
    width: 80,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 24,
  },
  titleAuthorLabel: {
    fontFamily: SANS_FONT,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
    color: colors.muted,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  titleAuthor: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 48,
    color: colors.secondary,
  },
  titleDescription: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 1.8,
    marginTop: 32,
    paddingHorizontal: 48,
    color: colors.secondary,
  },
  titleGenre: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
    color: colors.muted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // =============================================
  // COPYRIGHT PAGE - Legal but elegant
  // =============================================
  copyrightPage: {
    padding: 72,
    paddingTop: 180,
    paddingBottom: 100,
    fontSize: 9,
    lineHeight: 1.6,
    backgroundColor: colors.background,
  },
  copyrightTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    color: colors.primary,
  },
  copyrightAuthorLine: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 28,
    color: colors.secondary,
  },
  copyrightNotice: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 8,
    color: colors.secondary,
  },
  copyrightDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginVertical: 20,
  },
  copyrightBody: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 1.7,
    marginBottom: 12,
    color: colors.muted,
    paddingHorizontal: 32,
  },
  publisherSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  publisherTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 8,
    marginBottom: 8,
    color: colors.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  publisherInfo: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 4,
    color: colors.muted,
  },
  poweredBy: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 32,
    color: colors.light,
  },

  // =============================================
  // TABLE OF CONTENTS - Clean and navigable
  // =============================================
  tocPage: {
    padding: 72,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  tocHeader: {
    marginBottom: 40,
  },
  tocTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 24,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tocDivider: {
    width: 50,
    height: 1,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginTop: 20,
  },
  tocEntry: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  tocChapterNum: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.muted,
    width: 80,
  },
  tocChapterTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.primary,
    flex: 1,
  },
  tocPageNum: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.muted,
    width: 30,
    textAlign: 'right',
  },

  // =============================================
  // CHAPTER PAGES - The heart of the book
  // =============================================
  chapterOpeningPage: {
    padding: 72,
    paddingTop: 120,
    paddingBottom: 100,
    fontFamily: BODY_FONT,
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.primary,
    backgroundColor: colors.background,
  },
  chapterHeader: {
    marginBottom: 48,
    alignItems: 'center',
  },
  chapterNumberLabel: {
    fontFamily: SANS_FONT,
    fontSize: 9,
    textAlign: 'center',
    color: colors.muted,
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chapterNumber: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 32,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 14,
  },
  chapterTitleDivider: {
    width: 36,
    height: 1,
    backgroundColor: colors.muted,
    marginBottom: 16,
  },
  chapterTitle: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 18,
    textAlign: 'center',
    color: colors.secondary,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },

  // Paragraph styles
  paragraphContainer: {
    marginTop: 0,
  },
  firstParagraph: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'justify',
    lineHeight: 1.8,
    marginBottom: 14,
    textIndent: 0,
    color: colors.primary,
  },
  paragraph: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 11,
    textAlign: 'justify',
    lineHeight: 1.8,
    marginBottom: 12,
    textIndent: 28,
    color: colors.primary,
  },
  
  // Scene break - using simple asterisks
  sceneBreak: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 12,
    textAlign: 'center',
    color: colors.muted,
    marginVertical: 24,
    letterSpacing: 6,
  },

  // =============================================
  // PAGE NUMBERS - Fixed at bottom center
  // =============================================
  pageNumberContainer: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
  },
  pageNumberText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.pageNum,
    textAlign: 'center',
  },
  
  // Front matter page number (roman numerals)
  frontMatterPageNumText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  
  // Running header for continuation pages
  runningHeader: {
    position: 'absolute',
    top: 40,
    left: 72,
    right: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runningHeaderLeft: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    color: colors.light,
    letterSpacing: 1,
  },
  runningHeaderRight: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 8,
    color: colors.light,
    letterSpacing: 1,
  },

  // =============================================
  // BIBLIOGRAPHY STYLES
  // =============================================
  bibliographyPage: {
    padding: 72,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  bibliographyHeader: {
    marginBottom: 40,
    alignItems: 'center',
  },
  bibliographyTitle: {
    fontFamily: SANS_FONT,
    fontWeight: 700,
    fontSize: 24,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  bibliographyDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  bibliographyTypeHeading: {
    fontFamily: BODY_FONT,
    fontWeight: 700,
    fontSize: 14,
    color: colors.primary,
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  referenceEntry: {
    marginBottom: 10,
    paddingLeft: 24,
    textIndent: -24, // Hanging indent
  },
  referenceText: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontSize: 10,
    color: colors.primary,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  referenceTextItalic: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.primary,
    lineHeight: 1.6,
  },
  bibliographyNote: {
    fontFamily: BODY_FONT,
    fontWeight: 400,
    fontStyle: 'italic',
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 30,
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

// Helper to detect scene breaks in text
const isSceneBreak = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed === '***' || 
         trimmed === '* * *' || 
         trimmed === '---' || 
         trimmed === '- - -' ||
         (trimmed.length <= 5 && /^[*\-]+$/.test(trimmed.replace(/\s/g, '')));
};

// Convert number to Roman numerals (lowercase)
const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
};

const PDFDocument: React.FC<PDFDocumentProps> = ({ book }) => {
  const currentYear = new Date().getFullYear();
  
  // Front matter pages: cover (1) + title (1) + copyright (1) + TOC (1) = 4 pages
  // These don't get Arabic page numbers
  const FRONT_MATTER_PAGES = 4;

  return (
    <Document
      title={book.title}
      author={book.author}
      creator="PowerWrite by Dynamic Labs Media"
      producer="React-PDF"
      subject={book.genre || 'Book'}
    >
      {/* ========================================== */}
      {/* COVER PAGE - No page number */}
      {/* ========================================== */}
      <Page size="A4" style={styles.coverPage}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} style={styles.coverImage} />
        ) : (
          <View style={styles.coverTextContainer}>
            <Text style={styles.coverTitle}>{book.title}</Text>
            {book.genre && (
              <Text style={styles.coverSubtitle}>{book.genre}</Text>
            )}
            <View style={styles.coverDivider} />
            <Text style={styles.coverAuthor}>{book.author}</Text>
          </View>
        )}
      </Page>

      {/* ========================================== */}
      {/* TITLE PAGE - Roman numeral i */}
      {/* ========================================== */}
      <Page size="A4" style={styles.titlePage}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>{book.title}</Text>
          <View style={styles.titleDivider} />
          <Text style={styles.titleAuthorLabel}>A Novel By</Text>
          <Text style={styles.titleAuthor}>{book.author}</Text>
          {book.description && (
            <Text style={styles.titleDescription}>{book.description}</Text>
          )}
          {book.genre && (
            <Text style={styles.titleGenre}>{book.genre}</Text>
          )}
        </View>
        {/* Page number at bottom */}
        <View style={styles.pageNumberContainer} fixed>
          <Text
            style={styles.frontMatterPageNumText}
            render={({ pageNumber }) => {
              const displayNum = pageNumber - 1; // Title is page 2, display as i
              return displayNum > 0 ? toRoman(displayNum) : '';
            }}
          />
        </View>
      </Page>

      {/* ========================================== */}
      {/* COPYRIGHT PAGE - Roman numeral ii */}
      {/* ========================================== */}
      <Page size="A4" style={styles.copyrightPage}>
        <Text style={styles.copyrightTitle}>{book.title}</Text>
        <Text style={styles.copyrightAuthorLine}>by {book.author}</Text>
        
        <Text style={styles.copyrightNotice}>
          Copyright {currentYear} {book.author}
        </Text>
        <Text style={styles.copyrightNotice}>
          All rights reserved.
        </Text>
        
        <View style={styles.copyrightDivider} />
        
        <Text style={styles.copyrightBody}>
          No part of this publication may be reproduced, stored in a retrieval system, 
          or transmitted in any form or by any means - electronic, mechanical, photocopying, 
          recording, or otherwise - without the prior written permission of the copyright holder.
        </Text>
        
        <View style={styles.publisherSection}>
          <Text style={styles.publisherTitle}>Published By</Text>
          <Text style={styles.publisherInfo}>Dynamic Labs Media</Text>
          <Text style={styles.publisherInfo}>dlmworld.com</Text>
        </View>
        
        <Text style={styles.poweredBy}>
          Created with PowerWrite
        </Text>
        
        {/* Page number at bottom */}
        <View style={styles.pageNumberContainer} fixed>
          <Text
            style={styles.frontMatterPageNumText}
            render={({ pageNumber }) => {
              const displayNum = pageNumber - 1;
              return displayNum > 0 ? toRoman(displayNum) : '';
            }}
          />
        </View>
      </Page>

      {/* ========================================== */}
      {/* TABLE OF CONTENTS - Roman numeral iii */}
      {/* ========================================== */}
      <Page size="A4" style={styles.tocPage} wrap>
        <View style={styles.tocHeader}>
          <Text style={styles.tocTitle}>Contents</Text>
          <View style={styles.tocDivider} />
        </View>
        
        {book.chapters.map((chapter, index) => (
          <View key={chapter.number} style={styles.tocEntry} wrap={false}>
            <Text style={styles.tocChapterNum}>Chapter {chapter.number}</Text>
            <Text style={styles.tocChapterTitle}>{chapter.title}</Text>
            <Text style={styles.tocPageNum}>{index + 1}</Text>
          </View>
        ))}
        
        {/* Page number at bottom */}
        <View style={styles.pageNumberContainer} fixed>
          <Text
            style={styles.frontMatterPageNumText}
            render={({ pageNumber }) => {
              const displayNum = pageNumber - 1;
              return displayNum > 0 ? toRoman(displayNum) : '';
            }}
          />
        </View>
      </Page>

      {/* ========================================== */}
      {/* CHAPTERS - Arabic numerals starting at 1 */}
      {/* ========================================== */}
      {book.chapters.map((chapter, chapterIndex) => {
        const sanitizedContent = sanitizeChapterContent(chapter);
        const paragraphs = sanitizedContent.split(/\n\n+/).filter(p => p.trim());

        return (
          <Page 
            key={chapter.number} 
            size="A4" 
            style={styles.chapterOpeningPage}
            wrap
          >
            {/* Running header - shows book title and chapter on continuation pages */}
            <View style={styles.runningHeader} fixed>
              <Text
                style={styles.runningHeaderLeft}
                render={({ pageNumber }) => {
                  const chapterStartPage = FRONT_MATTER_PAGES + chapterIndex + 1;
                  const isFirstPage = pageNumber === chapterStartPage;
                  return !isFirstPage ? book.title.toUpperCase() : '';
                }}
              />
              <Text
                style={styles.runningHeaderRight}
                render={({ pageNumber }) => {
                  const chapterStartPage = FRONT_MATTER_PAGES + chapterIndex + 1;
                  const isFirstPage = pageNumber === chapterStartPage;
                  return !isFirstPage ? `Chapter ${chapter.number}` : '';
                }}
              />
            </View>
            
            {/* Chapter header - clean and professional */}
            <View style={styles.chapterHeader} wrap={false}>
              <Text style={styles.chapterNumberLabel}>Chapter</Text>
              <Text style={styles.chapterNumber}>{chapter.number}</Text>
              <View style={styles.chapterTitleDivider} />
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>
            
            {/* Chapter content */}
            <View style={styles.paragraphContainer}>
              {paragraphs.map((para, paraIndex) => {
                const trimmedPara = para.trim();
                
                // Handle scene breaks - using simple asterisks
                if (isSceneBreak(trimmedPara)) {
                  return (
                    <Text key={paraIndex} style={styles.sceneBreak}>
                      * * *
                    </Text>
                  );
                }
                
                // First paragraph - no indent
                if (paraIndex === 0) {
                  return (
                    <Text key={paraIndex} style={styles.firstParagraph}>
                      {trimmedPara}
                    </Text>
                  );
                }
                
                // Regular paragraphs with indent
                return (
                  <Text key={paraIndex} style={styles.paragraph}>
                    {trimmedPara}
                  </Text>
                );
              })}
            </View>
            
            {/* Page number - FIXED at bottom center for ALL chapter pages */}
            <View style={styles.pageNumberContainer} fixed>
              <Text
                style={styles.pageNumberText}
                render={({ pageNumber }) => {
                  // Calculate page number relative to chapter start
                  const contentPageNumber = pageNumber - FRONT_MATTER_PAGES;
                  return contentPageNumber > 0 ? String(contentPageNumber) : '';
                }}
              />
            </View>
          </Page>
        );
      })}

      {/* ========================================== */}
      {/* BIBLIOGRAPHY - Professional Reference List */}
      {/* ========================================== */}
      {book.bibliography?.config.enabled && book.bibliography.references.length > 0 && (
        <BibliographySection 
          bibliography={book.bibliography} 
          frontMatterPages={FRONT_MATTER_PAGES}
          totalChapters={book.chapters.length}
        />
      )}
    </Document>
  );
};

// Bibliography Section Component
const BibliographySection: React.FC<{
  bibliography: {
    config: BibliographyConfig;
    references: Reference[];
  };
  frontMatterPages: number;
  totalChapters: number;
}> = ({ bibliography, frontMatterPages, totalChapters }) => {
  const { config, references } = bibliography;
  
  // Sort references
  const sortedReferences = CitationService.sortReferences(
    references,
    config.sortBy,
    config.sortDirection
  );

  // Format references for display (remove HTML tags)
  const formatRefText = (ref: Reference, index: number): string => {
    const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
    // Remove HTML tags and decode entities
    let plainText = formatted
      .replace(/<em>/g, '')
      .replace(/<\/em>/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    // Add numbering if configured
    if (config.numberingStyle === 'numeric') {
      plainText = `${index + 1}. ${plainText}`;
    } else if (config.numberingStyle === 'alphabetic') {
      plainText = `${String.fromCharCode(65 + (index % 26))}. ${plainText}`;
    }
    
    return plainText;
  };

  // Group references by type if configured
  const groupedRefs = config.groupByType
    ? sortedReferences.reduce((acc, ref) => {
        const type = ref.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(ref);
        return acc;
      }, {} as Record<string, Reference[]>)
    : null;

  return (
    <Page size="A4" style={styles.bibliographyPage} wrap>
      {/* Bibliography Header */}
      <View style={styles.bibliographyHeader} wrap={false}>
        <Text style={styles.bibliographyTitle}>Bibliography</Text>
        <View style={styles.bibliographyDivider} />
      </View>

      {/* References List */}
      {groupedRefs ? (
        // Grouped by type
        Object.entries(groupedRefs).map(([type, refs]) => (
          <View key={type} wrap={false}>
            <Text style={styles.bibliographyTypeHeading}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </Text>
            {refs.map((ref, index) => (
              <View key={ref.id} style={styles.referenceEntry} wrap={false}>
                <Text style={styles.referenceText}>
                  {formatRefText(ref, index)}
                </Text>
              </View>
            ))}
          </View>
        ))
      ) : (
        // Single list
        sortedReferences.map((ref, index) => (
          <View key={ref.id} style={styles.referenceEntry} wrap={false}>
            <Text style={styles.referenceText}>
              {formatRefText(ref, index)}
            </Text>
          </View>
        ))
      )}

      {/* Citation style note */}
      <Text style={styles.bibliographyNote}>
        References formatted in {config.citationStyle} style.
      </Text>

      {/* Page number */}
      <View style={styles.pageNumberContainer} fixed>
        <Text
          style={styles.pageNumberText}
          render={({ pageNumber }) => {
            const contentPageNumber = pageNumber - frontMatterPages;
            return contentPageNumber > 0 ? String(contentPageNumber) : '';
          }}
        />
      </View>
    </Page>
  );
};

export default PDFDocument;
