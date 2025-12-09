// Font Mapping Utility
// Maps font IDs to CSS font-family values and Google Font URLs
// Used by both PDF export and preview components for consistency

export interface FontMapping {
  id: string;
  cssFamily: string;
  googleFontName?: string;
  googleFontUrl?: string;
  fallbackStack: string;
}

// Comprehensive font ID to CSS font-family mapping
export const FONT_MAPPINGS: Record<string, FontMapping> = {
  // Serif Fonts
  'garamond': {
    id: 'garamond',
    cssFamily: "'EB Garamond', Garamond, 'Times New Roman', serif",
    googleFontName: 'EB Garamond',
    googleFontUrl: 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
    fallbackStack: "Garamond, 'Times New Roman', serif",
  },
  'georgia': {
    id: 'georgia',
    cssFamily: "Georgia, 'Times New Roman', serif",
    fallbackStack: "'Times New Roman', serif",
  },
  'times-new-roman': {
    id: 'times-new-roman',
    cssFamily: "'Times New Roman', Times, serif",
    fallbackStack: 'Times, serif',
  },
  'palatino': {
    id: 'palatino',
    cssFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
    fallbackStack: "'Book Antiqua', serif",
  },
  'baskerville': {
    id: 'baskerville',
    cssFamily: "'Libre Baskerville', Baskerville, 'Times New Roman', serif",
    googleFontName: 'Libre Baskerville',
    googleFontUrl: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    fallbackStack: "Baskerville, 'Times New Roman', serif",
  },
  'caslon': {
    id: 'caslon',
    cssFamily: "'Libre Caslon Text', 'Adobe Caslon Pro', Caslon, serif",
    googleFontName: 'Libre Caslon Text',
    googleFontUrl: 'Libre+Caslon+Text:ital,wght@0,400;0,700;1,400',
    fallbackStack: 'Caslon, Georgia, serif',
  },
  'minion': {
    id: 'minion',
    cssFamily: "'Minion Pro', Georgia, serif",
    fallbackStack: 'Georgia, serif',
  },
  'sabon': {
    id: 'sabon',
    cssFamily: "Sabon, Garamond, serif",
    fallbackStack: 'Garamond, serif',
  },
  'bembo': {
    id: 'bembo',
    cssFamily: "Bembo, Garamond, serif",
    fallbackStack: 'Garamond, serif',
  },
  'libre-baskerville': {
    id: 'libre-baskerville',
    cssFamily: "'Libre Baskerville', Baskerville, serif",
    googleFontName: 'Libre Baskerville',
    googleFontUrl: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    fallbackStack: 'Baskerville, serif',
  },
  'merriweather': {
    id: 'merriweather',
    cssFamily: "Merriweather, Georgia, serif",
    googleFontName: 'Merriweather',
    googleFontUrl: 'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
    fallbackStack: 'Georgia, serif',
  },
  'source-serif': {
    id: 'source-serif',
    cssFamily: "'Source Serif 4', 'Source Serif Pro', Georgia, serif",
    googleFontName: 'Source Serif 4',
    googleFontUrl: 'Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600',
    fallbackStack: 'Georgia, serif',
  },
  'lora': {
    id: 'lora',
    cssFamily: "Lora, Georgia, serif",
    googleFontName: 'Lora',
    googleFontUrl: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
    fallbackStack: 'Georgia, serif',
  },
  'crimson-pro': {
    id: 'crimson-pro',
    cssFamily: "'Crimson Pro', Georgia, serif",
    googleFontName: 'Crimson Pro',
    googleFontUrl: 'Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
    fallbackStack: 'Georgia, serif',
  },
  'cormorant': {
    id: 'cormorant',
    cssFamily: "'Cormorant Garamond', Garamond, serif",
    googleFontName: 'Cormorant Garamond',
    googleFontUrl: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700',
    fallbackStack: 'Garamond, serif',
  },

  // Sans-Serif Fonts
  'helvetica': {
    id: 'helvetica',
    cssFamily: "Helvetica, Arial, sans-serif",
    fallbackStack: 'Arial, sans-serif',
  },
  'arial': {
    id: 'arial',
    cssFamily: "Arial, Helvetica, sans-serif",
    fallbackStack: 'Helvetica, sans-serif',
  },
  'open-sans': {
    id: 'open-sans',
    cssFamily: "'Open Sans', Arial, sans-serif",
    googleFontName: 'Open Sans',
    googleFontUrl: 'Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
    fallbackStack: 'Arial, sans-serif',
  },
  'roboto': {
    id: 'roboto',
    cssFamily: "Roboto, Arial, sans-serif",
    googleFontName: 'Roboto',
    googleFontUrl: 'Roboto:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700',
    fallbackStack: 'Arial, sans-serif',
  },
  'lato': {
    id: 'lato',
    cssFamily: "Lato, Arial, sans-serif",
    googleFontName: 'Lato',
    googleFontUrl: 'Lato:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700',
    fallbackStack: 'Arial, sans-serif',
  },
  'montserrat': {
    id: 'montserrat',
    cssFamily: "Montserrat, Arial, sans-serif",
    googleFontName: 'Montserrat',
    googleFontUrl: 'Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
    fallbackStack: 'Arial, sans-serif',
  },

  // Display Fonts
  'playfair': {
    id: 'playfair',
    cssFamily: "'Playfair Display', Georgia, serif",
    googleFontName: 'Playfair Display',
    googleFontUrl: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900',
    fallbackStack: 'Georgia, serif',
  },
  'cinzel': {
    id: 'cinzel',
    cssFamily: "Cinzel, 'Times New Roman', serif",
    googleFontName: 'Cinzel',
    googleFontUrl: 'Cinzel:wght@400;500;600;700;800;900',
    fallbackStack: "'Times New Roman', serif",
  },
  'philosopher': {
    id: 'philosopher',
    cssFamily: "Philosopher, Georgia, serif",
    googleFontName: 'Philosopher',
    googleFontUrl: 'Philosopher:ital,wght@0,400;0,700;1,400;1,700',
    fallbackStack: 'Georgia, serif',
  },
  'spectral': {
    id: 'spectral',
    cssFamily: "Spectral, Georgia, serif",
    googleFontName: 'Spectral',
    googleFontUrl: 'Spectral:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700',
    fallbackStack: 'Georgia, serif',
  },

  // Special case for inherit
  'inherit': {
    id: 'inherit',
    cssFamily: 'inherit',
    fallbackStack: 'inherit',
  },
};

/**
 * Get CSS font-family value for a font ID
 */
export function getFontFamily(fontId: string): string {
  const mapping = FONT_MAPPINGS[fontId];
  if (mapping) {
    return mapping.cssFamily;
  }
  // Fallback: convert ID to readable name and use as font-family
  const fallbackName = fontId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return `'${fallbackName}', Georgia, serif`;
}

/**
 * Get Google Font import URL for a font ID
 */
export function getGoogleFontUrl(fontId: string): string | null {
  const mapping = FONT_MAPPINGS[fontId];
  return mapping?.googleFontUrl || null;
}

/**
 * Generate Google Font import statement for multiple font IDs
 */
export function generateGoogleFontImport(fontIds: string[]): string {
  const googleFonts = fontIds
    .map(id => FONT_MAPPINGS[id]?.googleFontUrl)
    .filter((url): url is string => url !== null && url !== undefined);

  if (googleFonts.length === 0) {
    return '';
  }

  const familyParams = googleFonts.join('&family=');
  return `@import url('https://fonts.googleapis.com/css2?family=${familyParams}&display=swap');`;
}

/**
 * Get Google Fonts link element for embedding in HTML head
 */
export function getGoogleFontsLinkElement(fontIds: string[]): string {
  const googleFonts = fontIds
    .map(id => FONT_MAPPINGS[id]?.googleFontUrl)
    .filter((url): url is string => url !== null && url !== undefined);

  if (googleFonts.length === 0) {
    return '';
  }

  const familyParams = googleFonts.join('&family=');
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${familyParams}&display=swap" rel="stylesheet">`;
}

/**
 * Convert font ID to displayable name
 */
export function getFontDisplayName(fontId: string): string {
  const mapping = FONT_MAPPINGS[fontId];
  if (mapping?.googleFontName) {
    return mapping.googleFontName;
  }
  // Convert ID to readable name
  return fontId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a font has Google Font support (for previews)
 */
export function hasGoogleFontSupport(fontId: string): boolean {
  return FONT_MAPPINGS[fontId]?.googleFontUrl !== undefined;
}

/**
 * Get all unique Google Font URLs needed for a set of publishing settings
 */
export function getRequiredFontsForSettings(settings: {
  bodyFont: string;
  headingFont: string;
  dropCapFont?: string;
  headerFont?: string;
  footerFont?: string;
}): string[] {
  const fonts = new Set<string>();
  
  if (settings.bodyFont && settings.bodyFont !== 'inherit') {
    fonts.add(settings.bodyFont);
  }
  if (settings.headingFont && settings.headingFont !== 'inherit') {
    fonts.add(settings.headingFont);
  }
  if (settings.dropCapFont && settings.dropCapFont !== 'inherit') {
    fonts.add(settings.dropCapFont);
  }
  if (settings.headerFont && settings.headerFont !== 'inherit') {
    fonts.add(settings.headerFont);
  }
  if (settings.footerFont && settings.footerFont !== 'inherit') {
    fonts.add(settings.footerFont);
  }
  
  return Array.from(fonts);
}

