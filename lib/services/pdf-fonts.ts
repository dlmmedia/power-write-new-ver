// Premium font registration for React-PDF
import { Font } from '@react-pdf/renderer';

// Register fonts only once and handle errors gracefully
let fontsRegistered = false;

export const registerFonts = () => {
  if (fontsRegistered) {
    return;
  }

  try {
    // Use Helvetica and Times-Roman (built-in PDF fonts) for reliability
    // These are standard PDF fonts that don't require external loading
    
    console.log('Using built-in PDF fonts for maximum compatibility');
    fontsRegistered = true;
  } catch (error) {
    console.error('Error registering fonts:', error);
    // Continue anyway - React-PDF will fall back to default fonts
  }
};

// Don't auto-register on import to avoid server-side issues
// Fonts will be registered when exportBookAsPDF is called

