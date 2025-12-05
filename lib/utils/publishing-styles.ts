// Utility to generate export styles from publishing settings
import { 
  PublishingSettings, 
  TRIM_SIZES, 
  BODY_FONTS,
  DEFAULT_PUBLISHING_SETTINGS 
} from '@/lib/types/publishing';

/**
 * Get font family string for a font ID
 */
export function getFontFamily(fontId: string): string {
  const fontMap: Record<string, string> = {
    'garamond': '"EB Garamond", Garamond, "Times New Roman", serif',
    'georgia': 'Georgia, "Times New Roman", serif',
    'times-new-roman': '"Times New Roman", Times, serif',
    'palatino': 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    'baskerville': 'Baskerville, "Libre Baskerville", Georgia, serif',
    'caslon': '"Adobe Caslon Pro", Garamond, serif',
    'minion': '"Minion Pro", Georgia, serif',
    'sabon': 'Sabon, Garamond, serif',
    'bembo': 'Bembo, Georgia, serif',
    'libre-baskerville': '"Libre Baskerville", Baskerville, Georgia, serif',
    'merriweather': 'Merriweather, Georgia, serif',
    'source-serif': '"Source Serif Pro", Georgia, serif',
    'lora': 'Lora, Georgia, serif',
    'helvetica': 'Helvetica, Arial, sans-serif',
    'arial': 'Arial, Helvetica, sans-serif',
    'open-sans': '"Open Sans", Arial, sans-serif',
    'roboto': 'Roboto, Arial, sans-serif',
    'lato': 'Lato, Arial, sans-serif',
    'montserrat': 'Montserrat, Arial, sans-serif',
    'playfair': '"Playfair Display", Georgia, serif',
    'cormorant': '"Cormorant Garamond", Garamond, serif',
    'cinzel': 'Cinzel, Georgia, serif',
    'philosopher': 'Philosopher, Georgia, serif',
    'spectral': 'Spectral, Georgia, serif',
    'inherit': 'inherit',
  };
  
  return fontMap[fontId] || fontMap['georgia'];
}

/**
 * Get trim size dimensions
 */
export function getTrimSizeDimensions(trimSizeId: string): { width: number; height: number } {
  const size = TRIM_SIZES.find(s => s.id === trimSizeId);
  return size ? { width: size.width, height: size.height } : { width: 5.5, height: 8.5 };
}

/**
 * Convert inches to points (72 points per inch)
 */
export function inchesToPoints(inches: number): number {
  return Math.round(inches * 72);
}

/**
 * Convert inches to millimeters
 */
export function inchesToMm(inches: number): number {
  return Math.round(inches * 25.4 * 100) / 100;
}

/**
 * Get paragraph spacing in points based on setting
 */
export function getParagraphSpacing(setting: string): number {
  const spacingMap: Record<string, number> = {
    'none': 0,
    'small': 4,
    'medium': 8,
    'large': 12,
  };
  return spacingMap[setting] || 0;
}

/**
 * Convert chapter number to display format
 */
export function formatChapterNumber(
  number: number, 
  style: 'numeric' | 'roman' | 'word' | 'ordinal'
): string {
  switch (style) {
    case 'numeric':
      return String(number);
    case 'roman':
      return toRoman(number);
    case 'word':
      return toWord(number);
    case 'ordinal':
      return toOrdinal(number);
    default:
      return String(number);
  }
}

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function toWord(num: number): string {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
    'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 
    'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight',
    'Twenty-Nine', 'Thirty'
  ];
  return num <= 30 ? words[num] : String(num);
}

function toOrdinal(num: number): string {
  const ordinals = [
    '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 
    'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 
    'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
    'Nineteenth', 'Twentieth'
  ];
  return num <= 20 ? ordinals[num] : String(num) + (num % 10 === 1 && num !== 11 ? 'st' : 
                                                    num % 10 === 2 && num !== 12 ? 'nd' :
                                                    num % 10 === 3 && num !== 13 ? 'rd' : 'th');
}

/**
 * Generate CSS styles for HTML export based on publishing settings
 */
export function generateHTMLStyles(settings: PublishingSettings): string {
  const trimSize = getTrimSizeDimensions(settings.trimSize);
  const bodyFont = getFontFamily(settings.typography.bodyFont);
  const headingFont = settings.typography.headingFont === 'inherit' 
    ? bodyFont 
    : getFontFamily(settings.typography.headingFont);
  
  const paragraphSpacing = getParagraphSpacing(settings.typography.paragraphSpacing);
  const indentValue = settings.typography.paragraphIndent;
  const indentUnit = settings.typography.paragraphIndentUnit;
  
  return `
    /* ============================================= */
    /* GENERATED PUBLISHING STYLES */
    /* Book: ${settings.bookType} | Trim: ${trimSize.width}" x ${trimSize.height}" */
    /* ============================================= */
    
    :root {
      --body-font: ${bodyFont};
      --heading-font: ${headingFont};
      --body-size: ${settings.typography.bodyFontSize}pt;
      --body-line-height: ${settings.typography.bodyLineHeight};
      --chapter-title-size: ${settings.typography.chapterTitleSize}pt;
      --page-width: ${trimSize.width}in;
      --page-height: ${trimSize.height}in;
      --margin-top: ${settings.margins.top}in;
      --margin-bottom: ${settings.margins.bottom}in;
      --margin-inside: ${settings.margins.inside}in;
      --margin-outside: ${settings.margins.outside}in;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--body-font);
      font-size: var(--body-size);
      line-height: var(--body-line-height);
      color: #1a1a1a;
      background: #fff;
      max-width: var(--page-width);
      margin: 0 auto;
      padding: var(--margin-top) var(--margin-outside) var(--margin-bottom) var(--margin-inside);
    }
    
    /* ============================================= */
    /* TYPOGRAPHY */
    /* ============================================= */
    
    p {
      margin: 0 0 ${paragraphSpacing}pt 0;
      text-indent: ${settings.typography.firstParagraphIndent ? 0 : `${indentValue}${indentUnit}`};
      text-align: ${settings.typography.bodyAlignment};
      ${settings.typography.hyphenation ? 'hyphens: auto;' : ''}
      ${settings.typography.widowControl ? 'widows: 2;' : ''}
      ${settings.typography.orphanControl ? 'orphans: 2;' : ''}
    }
    
    p + p {
      text-indent: ${indentValue}${indentUnit};
    }
    
    h1 + p, h2 + p, h3 + p, .chapter-start p:first-of-type {
      text-indent: ${settings.typography.firstParagraphIndent ? `${indentValue}${indentUnit}` : '0'};
    }
    
    ${settings.typography.dropCapEnabled ? `
    .chapter-start p:first-of-type::first-letter {
      float: left;
      font-family: ${settings.typography.dropCapFont === 'inherit' ? 'var(--heading-font)' : getFontFamily(settings.typography.dropCapFont)};
      font-size: ${settings.typography.bodyFontSize * settings.typography.dropCapLines * 0.9}pt;
      line-height: 0.8;
      padding-right: 8px;
      margin-top: 4px;
    }
    ` : ''}
    
    /* ============================================= */
    /* CHAPTER STYLING */
    /* ============================================= */
    
    .chapter {
      page-break-before: ${settings.chapters.startOnOddPage ? 'right' : 'always'};
      padding-top: ${settings.chapters.chapterDropFromTop}in;
    }
    
    .chapter:first-of-type {
      page-break-before: auto;
    }
    
    .chapter-header {
      text-align: ${settings.chapters.chapterTitlePosition};
      margin-bottom: ${settings.chapters.afterChapterTitleSpace}in;
    }
    
    .chapter-number-label {
      font-family: var(--heading-font);
      font-size: ${Math.round(settings.typography.chapterTitleSize * 0.5)}pt;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 0.25em;
    }
    
    .chapter-number {
      font-family: var(--heading-font);
      font-size: ${Math.round(settings.typography.chapterTitleSize * 1.2)}pt;
      margin-bottom: 0.5em;
    }
    
    .chapter-title {
      font-family: var(--heading-font);
      font-size: var(--chapter-title-size);
      text-transform: ${settings.chapters.chapterTitleCase === 'uppercase' ? 'uppercase' : 
                        settings.chapters.chapterTitleCase === 'lowercase' ? 'lowercase' : 'none'};
      font-weight: normal;
      font-style: ${settings.chapters.chapterOpeningStyle === 'elegant' ? 'italic' : 'normal'};
      margin: 0;
    }
    
    .chapter-ornament {
      text-align: center;
      color: #888;
      margin: 0.5em 0;
    }
    
    /* ============================================= */
    /* SCENE BREAKS */
    /* ============================================= */
    
    .scene-break {
      text-align: center;
      margin: 1.5em 0;
      color: #888;
    }
    
    ${settings.chapters.sceneBreakStyle === 'blank-line' ? `
    .scene-break {
      height: 1.5em;
      visibility: hidden;
    }
    ` : ''}
    
    /* ============================================= */
    /* HEADERS & FOOTERS */
    /* ============================================= */
    
    .running-header {
      position: fixed;
      top: ${settings.margins.headerSpace}in;
      left: var(--margin-inside);
      right: var(--margin-outside);
      font-size: ${settings.headerFooter.headerFontSize}pt;
      font-family: var(--${settings.headerFooter.headerFont === 'inherit' ? 'body' : 'heading'}-font);
      ${settings.headerFooter.headerStyle === 'small-caps' ? 'font-variant: small-caps;' : ''}
      ${settings.headerFooter.headerStyle === 'italic' ? 'font-style: italic;' : ''}
      ${settings.headerFooter.headerStyle === 'uppercase' ? 'text-transform: uppercase;' : ''}
      ${settings.headerFooter.headerLine ? 'border-bottom: 1px solid #ccc; padding-bottom: 4px;' : ''}
    }
    
    .page-footer {
      position: fixed;
      bottom: ${settings.margins.footerSpace}in;
      left: var(--margin-inside);
      right: var(--margin-outside);
      font-size: ${settings.headerFooter.footerFontSize}pt;
      ${settings.headerFooter.footerLine ? 'border-top: 1px solid #ccc; padding-top: 4px;' : ''}
    }
    
    /* ============================================= */
    /* FRONT & BACK MATTER */
    /* ============================================= */
    
    .title-page, .copyright-page, .toc-page, .dedication-page {
      page-break-after: always;
      text-align: center;
    }
    
    .title-page {
      padding-top: 30%;
    }
    
    .book-title {
      font-family: var(--heading-font);
      font-size: ${Math.round(settings.typography.chapterTitleSize * 1.5)}pt;
      margin-bottom: 1em;
    }
    
    .book-author {
      font-size: ${Math.round(settings.typography.bodyFontSize * 1.2)}pt;
      font-style: italic;
    }
    
    /* ============================================= */
    /* PRINT STYLES */
    /* ============================================= */
    
    @page {
      size: ${trimSize.width}in ${trimSize.height}in;
      margin: ${settings.margins.top}in ${settings.margins.outside}in ${settings.margins.bottom}in ${settings.margins.inside}in;
    }
    
    @page :left {
      margin-left: ${settings.margins.outside}in;
      margin-right: ${settings.margins.inside}in;
    }
    
    @page :right {
      margin-left: ${settings.margins.inside}in;
      margin-right: ${settings.margins.outside}in;
    }
    
    @media print {
      body {
        max-width: 100%;
        padding: 0;
      }
      
      .chapter {
        page-break-before: ${settings.chapters.startOnOddPage ? 'right' : 'always'};
      }
      
      .chapter-header {
        page-break-after: avoid;
      }
      
      p {
        orphans: ${settings.typography.orphanControl ? '2' : '1'};
        widows: ${settings.typography.widowControl ? '2' : '1'};
      }
    }
  `;
}

/**
 * Generate EPUB CSS styles
 */
export function generateEPUBStyles(settings: PublishingSettings): string {
  const bodyFont = getFontFamily(settings.typography.bodyFont);
  const headingFont = settings.typography.headingFont === 'inherit' 
    ? bodyFont 
    : getFontFamily(settings.typography.headingFont);
  
  const paragraphSpacing = getParagraphSpacing(settings.typography.paragraphSpacing);
  const indentValue = settings.typography.paragraphIndent;
  const indentUnit = settings.typography.paragraphIndentUnit === 'inches' ? 'em' : settings.typography.paragraphIndentUnit;
  const convertedIndent = settings.typography.paragraphIndentUnit === 'inches' 
    ? settings.typography.paragraphIndent * 2 
    : settings.typography.paragraphIndent;
  
  return `
    /* EPUB Styles - Generated from Publishing Settings */
    
    body {
      font-family: ${bodyFont};
      font-size: 1em;
      line-height: ${settings.typography.bodyLineHeight};
      text-align: ${settings.typography.bodyAlignment};
      margin: 0;
      padding: 0;
    }
    
    p {
      text-indent: ${convertedIndent}${indentUnit};
      margin: 0 0 ${paragraphSpacing > 0 ? `${paragraphSpacing / settings.typography.bodyFontSize}em` : '0'} 0;
      ${settings.typography.hyphenation ? '-webkit-hyphens: auto; hyphens: auto;' : ''}
      orphans: ${settings.typography.orphanControl ? '2' : '1'};
      widows: ${settings.typography.widowControl ? '2' : '1'};
    }
    
    h1 + p, h2 + p, h3 + p, .chapter-start p:first-of-type {
      text-indent: ${settings.typography.firstParagraphIndent ? `${convertedIndent}${indentUnit}` : '0'};
    }
    
    h1 {
      font-family: ${headingFont};
      font-size: 1.8em;
      text-align: ${settings.chapters.chapterTitlePosition};
      text-transform: ${settings.chapters.chapterTitleCase === 'uppercase' ? 'uppercase' : 
                        settings.chapters.chapterTitleCase === 'lowercase' ? 'lowercase' : 'none'};
      margin: 2em 0 1em 0;
      page-break-before: always;
      page-break-after: avoid;
    }
    
    .chapter-number {
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #666;
      display: block;
      margin-bottom: 0.5em;
    }
    
    .chapter-title {
      font-style: ${settings.chapters.chapterOpeningStyle === 'decorated' ? 'italic' : 'normal'};
    }
    
    .scene-break {
      text-align: center;
      margin: 1.5em 0;
      color: #888;
    }
    
    ${settings.chapters.sceneBreakStyle === 'blank-line' ? `
    .scene-break {
      height: 1.5em;
      visibility: hidden;
    }
    ` : ''}
    
    .title-page {
      text-align: center;
      margin-top: 30%;
    }
    
    .book-title {
      font-family: ${headingFont};
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 0.5em;
    }
    
    .book-author {
      font-size: 1.5em;
      font-style: italic;
    }
    
    .copyright-page {
      text-align: center;
      font-size: 0.9em;
      margin-top: 30%;
    }
    
    .toc-entry {
      text-indent: 0;
      margin: 0.7em 0;
    }
    
    .toc-entry a {
      text-decoration: none;
      color: inherit;
    }
    
    ${settings.typography.dropCapEnabled ? `
    .chapter-start p:first-of-type::first-letter {
      float: left;
      font-family: ${settings.typography.dropCapFont === 'inherit' ? headingFont : getFontFamily(settings.typography.dropCapFont)};
      font-size: ${settings.typography.dropCapLines}em;
      line-height: 0.8;
      padding-right: 0.1em;
      margin-top: 0.1em;
    }
    ` : ''}
  `;
}

/**
 * Get scene break symbol based on settings
 */
export function getSceneBreakSymbol(settings: PublishingSettings): string {
  switch (settings.chapters.sceneBreakStyle) {
    case 'blank-line':
      return '';
    case 'asterisks':
      return '* * *';
    case 'ornament':
      return '❦';
    case 'number':
      return '§';
    case 'custom':
      return settings.chapters.sceneBreakSymbol || '* * *';
    default:
      return '* * *';
  }
}

/**
 * Get chapter ornament based on settings
 */
export function getChapterOrnament(settings: PublishingSettings): string {
  switch (settings.chapters.chapterOrnament) {
    case 'none':
      return '';
    case 'line':
      return '━━━━━━━━━━━';
    case 'flourish':
      return '❧';
    case 'stars':
      return '✦ ✦ ✦';
    case 'dots':
      return '• • •';
    case 'custom':
      return '❖';
    default:
      return '';
  }
}

export { DEFAULT_PUBLISHING_SETTINGS };

