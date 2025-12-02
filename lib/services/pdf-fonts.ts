// Premium font registration for React-PDF
// Professional typography for production-ready PDF output
import { Font } from '@react-pdf/renderer';

// Register fonts only once and handle errors gracefully
let fontsRegistered = false;

// Google Fonts TTF URLs - These are direct links to TTF files which React-PDF supports
// The format is: https://fonts.gstatic.com/s/[fontname]/[version]/[filename].ttf
const GOOGLE_FONTS = {
  // EB Garamond - Beautiful classic serif (like Garamond)
  EBGaramond: {
    regular: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.ttf',
    italic: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QI96WamXgXFI.ttf',
    medium: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUA4V-e6yHgQ.ttf',
    semibold: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-NfNUA4V-e6yHgQ.ttf',
    bold: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-DPNUA4V-e6yHgQ.ttf',
  },
  // Lora - Beautiful reading font
  Lora: {
    regular: 'https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787weuxJGmZs.ttf',
    italic: 'https://fonts.gstatic.com/s/lora/v32/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq12nA.ttf',
    medium: 'https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787wsuxJGmZs.ttf',
    semibold: 'https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787zAvBJGmZs.ttf',
    bold: 'https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJGmZs.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/lora/v32/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-OICpK12nA.ttf',
  },
  // Crimson Pro - Elegant serif for body text
  CrimsonPro: {
    regular: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZzm18OJk.ttf',
    italic: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uSsoa5M_tv7IihmnkabC5XiXCAlXGks1WZzm1MO5s4d9s.ttf',
    medium: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZkGx8OJk.ttf',
    semibold: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZ_Gt8OJk.ttf',
    bold: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZ0Gt8OJk.ttf',
    boldItalic: 'https://fonts.gstatic.com/s/crimsonpro/v24/q5uSsoa5M_tv7IihmnkabC5XiXCAlXGks1WZkm5MO5s4d9s.ttf',
  },
};

export const registerFonts = () => {
  if (fontsRegistered) {
    return;
  }

  try {
    // Register EB Garamond - Premium book serif font
    Font.register({
      family: 'EBGaramond',
      fonts: [
        { src: GOOGLE_FONTS.EBGaramond.regular, fontWeight: 400, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.EBGaramond.italic, fontWeight: 400, fontStyle: 'italic' },
        { src: GOOGLE_FONTS.EBGaramond.medium, fontWeight: 500, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.EBGaramond.semibold, fontWeight: 600, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.EBGaramond.bold, fontWeight: 700, fontStyle: 'normal' },
      ],
    });

    // Register Lora - Reading-friendly serif
    Font.register({
      family: 'Lora',
      fonts: [
        { src: GOOGLE_FONTS.Lora.regular, fontWeight: 400, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.Lora.italic, fontWeight: 400, fontStyle: 'italic' },
        { src: GOOGLE_FONTS.Lora.medium, fontWeight: 500, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.Lora.semibold, fontWeight: 600, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.Lora.bold, fontWeight: 700, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.Lora.boldItalic, fontWeight: 700, fontStyle: 'italic' },
      ],
    });

    // Register Crimson Pro - Elegant serif
    Font.register({
      family: 'CrimsonPro',
      fonts: [
        { src: GOOGLE_FONTS.CrimsonPro.regular, fontWeight: 400, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.CrimsonPro.italic, fontWeight: 400, fontStyle: 'italic' },
        { src: GOOGLE_FONTS.CrimsonPro.medium, fontWeight: 500, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.CrimsonPro.semibold, fontWeight: 600, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.CrimsonPro.bold, fontWeight: 700, fontStyle: 'normal' },
        { src: GOOGLE_FONTS.CrimsonPro.boldItalic, fontWeight: 700, fontStyle: 'italic' },
      ],
    });

    // Configure hyphenation for better text flow in justified text
    Font.registerHyphenationCallback((word) => {
      // Simple hyphenation for long words
      if (word.length > 14) {
        const middle = Math.floor(word.length / 2);
        return [word.slice(0, middle), word.slice(middle)];
      }
      return [word];
    });

    console.log('Google Fonts registered successfully (EB Garamond, Lora, Crimson Pro)');
    fontsRegistered = true;
  } catch (error) {
    console.error('Error registering Google Fonts:', error);
    console.log('Falling back to built-in PDF fonts');
    fontsRegistered = true;
  }
};

// Export font family names for use in styles
// Primary: EBGaramond for elegant book typography
// Fallback: Built-in Times-Roman if fonts fail to load
export const FontFamilies = {
  // Primary book font - elegant serif
  primary: 'EBGaramond',
  // Alternative reading font
  reading: 'Lora',
  // Alternative elegant font
  elegant: 'CrimsonPro',
  // Built-in fallbacks
  serif: 'Times-Roman',
  serifBold: 'Times-Bold',
  serifItalic: 'Times-Italic',
  sansSerif: 'Helvetica',
  sansSerifBold: 'Helvetica-Bold',
} as const;
