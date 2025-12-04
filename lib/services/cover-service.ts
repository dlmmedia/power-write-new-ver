import { 
  CoverDesignOptions, 
  CoverMetadata, 
  CoverGenerationRequest,
  GENRE_COVER_DEFAULTS,
  COVER_DIMENSIONS,
  CoverDimensionPreset 
} from '../types/cover';

export class CoverService {
  /**
   * Generate AI prompt for professional FRONT book cover
   * Creates covers with title, "Written by PowerWrite", and DLM Media publisher branding
   */
  static generateAIPrompt(request: CoverGenerationRequest, options: CoverDesignOptions): string {
    const { title, genre, description, themes = [], mood } = request;
    const { style, colorScheme } = options;

    // Extract key visual elements from description
    const visualKeywords = this.extractVisualKeywords(description, genre);
    
    // Genre-specific design characteristics
    const genreCharacteristics: Record<string, { typography: string; atmosphere: string }> = {
      'Fantasy': { typography: 'ornate serif or elegant display fonts', atmosphere: 'magical and epic' },
      'Science Fiction': { typography: 'modern sans-serif or futuristic fonts', atmosphere: 'sleek and technological' },
      'Romance': { typography: 'elegant script or refined serif fonts', atmosphere: 'warm and passionate' },
      'Thriller': { typography: 'bold sans-serif or impactful display fonts', atmosphere: 'tense and gripping' },
      'Mystery': { typography: 'classic serif or noir-style fonts', atmosphere: 'intriguing and shadowy' },
      'Horror': { typography: 'distressed or gothic display fonts', atmosphere: 'dark and unsettling' },
      'Literary Fiction': { typography: 'sophisticated serif fonts', atmosphere: 'artistic and thoughtful' },
      'Non-Fiction': { typography: 'clean professional sans-serif fonts', atmosphere: 'authoritative and clear' },
      'Biography': { typography: 'classic elegant serif fonts', atmosphere: 'dignified and personal' },
      'Self-Help': { typography: 'modern uplifting sans-serif fonts', atmosphere: 'inspiring and positive' },
      'Young Adult': { typography: 'contemporary bold display fonts', atmosphere: 'dynamic and trendy' }
    };

    const genreStyle = genreCharacteristics[genre] || genreCharacteristics['Literary Fiction'];
    
    // Build comprehensive professional book cover prompt
    let prompt = `Create a COMPLETE professional FRONT book cover ready for publication.

=== FRONT COVER TEXT LAYOUT (TOP TO BOTTOM) ===
Display EXACTLY these text elements in this order:

1. BOOK TITLE (TOP/CENTER - LARGEST): "${title}"
   - Main focal point of the cover
   - Use ${genreStyle.typography}
   - Large, bold, perfectly legible

2. "Written by PowerWrite" (BELOW TITLE):
   - Smaller, elegant font below the title
   - Complementary style

3. "DLM Media" (BOTTOM - SMALLEST):
   - Small publisher text at the bottom edge
   - Professional publisher placement
   - Display ONLY ONCE

=== IMPORTANT ===
- Do NOT duplicate any text
- Only show "DLM Media" ONCE at the bottom
- Hierarchy: TITLE (biggest) → "Written by PowerWrite" (medium) → "DLM Media" (smallest)

=== DESIGN STYLE ===
- Visual Style: ${style}
- Color Palette: ${colorScheme || 'balanced'}
- Atmosphere: ${genreStyle.atmosphere}
- Genre: ${genre}
`;

    // Add mood if provided
    if (mood) {
      prompt += `- Mood: ${mood}\n`;
    }
    
    // Add themes if provided
    if (themes.length > 0) {
      prompt += `- Themes: ${themes.join(', ')}\n`;
    }
    
    // Add visual keywords
    if (visualKeywords.length > 0) {
      prompt += `- Visual Elements: ${visualKeywords.join(', ')}\n`;
    }

    // Style-specific instructions
    prompt += '\n=== STYLE GUIDELINES ===\n';
    switch (style) {
      case 'minimalist':
        prompt += 'Clean, elegant composition with sophisticated negative space. Typography as design element. Premium minimalist aesthetic.\n';
        break;
      case 'illustrative':
        prompt += 'Rich, detailed illustrated artwork. Artistic hand-crafted feel. Beautiful integration of art and typography.\n';
        break;
      case 'photographic':
        prompt += 'Professional photographic imagery. Editorial quality. Sophisticated text overlay with strong readability.\n';
        break;
      case 'abstract':
        prompt += 'Abstract conceptual design with symbolic visual elements. Artistic and unique composition.\n';
        break;
      case 'typographic':
        prompt += 'Typography-driven design where the title treatment IS the main visual. Creative, bold text as art.\n';
        break;
    }
    
    // Technical requirements for professional output
    prompt += `
=== TECHNICAL REQUIREMENTS ===
- Aspect Ratio: Portrait 2:3 (standard book cover)
- Quality: Professional bookstore-ready quality
- Text: All text perfectly legible with proper contrast
- Composition: Balanced visual hierarchy
- Standard: Comparable to bestselling books at major retailers

Create a complete, professional front cover with all three text elements beautifully integrated.`;
    
    return prompt;
  }

  /**
   * Generate AI prompt for professional BACK book cover
   * Creates back cover with synopsis, PowerWrite branding, and DLM Media publisher info
   */
  static generateBackCoverAIPrompt(request: CoverGenerationRequest, options: CoverDesignOptions): string {
    const { title, genre, description } = request;
    const { style, colorScheme } = options;

    // Clean the description for back cover blurb
    const cleanDescription = description.substring(0, 500).replace(/["\n\r]/g, ' ').trim();
    
    const prompt = `Create a professional BACK COVER design for a published book.

=== BACK COVER LAYOUT (TOP TO BOTTOM) ===

1. BOOK SYNOPSIS (TOP SECTION - 60% of space):
   Display this text in readable book typography:
   "${cleanDescription}"

2. AUTHOR CREDIT (MIDDLE):
   "Written by PowerWrite"
   - Elegant, professional styling
   - Decorative separator line above

3. PUBLISHER INFO (BOTTOM):
   - "DLM Media" prominently displayed
   - "www.dlmworld.com" below it
   - "Created with PowerWrite" tagline

4. BARCODE AREA (BOTTOM RIGHT):
   - White rectangular space (2" x 1.5")
   - Bottom right corner for ISBN barcode

=== DESIGN SPECIFICATIONS ===
- Aspect Ratio: Portrait 2:3 (same as front cover)
- Style: ${style} - MUST match front cover aesthetic
- Color Palette: ${colorScheme || 'balanced'} - consistent with front
- Genre: ${genre}
- Background: Subtle, doesn't compete with text

=== QUALITY STANDARDS ===
- Must look like the back of the same book
- Professional publishing quality
- Clean, organized layout
- Standard back cover conventions

Generate a complete, professional back cover design.`;
    
    return prompt;
  }

  /**
   * Extract visual keywords from description for AI prompt
   */
  private static extractVisualKeywords(description: string, genre: string): string[] {
    const keywords: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    // Visual elements
    const visualTerms = [
      'castle', 'forest', 'ocean', 'mountain', 'city', 'desert', 'space', 'stars',
      'dragon', 'sword', 'magic', 'portal', 'mansion', 'laboratory', 'battlefield',
      'ship', 'train', 'road', 'bridge', 'tower', 'island', 'cave', 'ruins',
      'sunset', 'storm', 'fog', 'snow', 'fire', 'water', 'sky', 'darkness'
    ];
    
    visualTerms.forEach(term => {
      if (lowerDesc.includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Generate cover design options based on book configuration
   */
  static getDesignOptions(request: CoverGenerationRequest): CoverDesignOptions {
    const { genre, designOptions } = request;
    
    // Get genre defaults
    const genreDefaults = GENRE_COVER_DEFAULTS[genre] || GENRE_COVER_DEFAULTS['Literary Fiction'];
    
    // Merge with custom options
    const options: CoverDesignOptions = {
      style: designOptions?.style || genreDefaults.style || 'photographic',
      colorScheme: designOptions?.colorScheme || genreDefaults.colorScheme,
      customColors: designOptions?.customColors,
      typography: {
        titleFont: designOptions?.typography?.titleFont || genreDefaults.typography?.titleFont || 'serif',
        authorFont: designOptions?.typography?.authorFont || genreDefaults.typography?.authorFont || 'serif',
        fontSize: designOptions?.typography?.fontSize || genreDefaults.typography?.fontSize || 'medium',
        alignment: designOptions?.typography?.alignment || genreDefaults.typography?.alignment || 'center',
      },
      layout: designOptions?.layout || genreDefaults.layout || 'classic',
      imagePosition: designOptions?.imagePosition || 'background',
      includeSubtitle: designOptions?.includeSubtitle || false,
      subtitle: designOptions?.subtitle,
      includeTagline: designOptions?.includeTagline || false,
      tagline: designOptions?.tagline,
      showAuthorPhoto: designOptions?.showAuthorPhoto || false,
      generationMethod: designOptions?.generationMethod || 'hybrid',
    };
    
    return options;
  }

  /**
   * Create cover metadata
   */
  static createMetadata(
    options: CoverDesignOptions, 
    imageUrl: string,
    aiPrompt?: string,
    dimensionPreset: CoverDimensionPreset = 'ebook'
  ): CoverMetadata {
    const dimensions = COVER_DIMENSIONS[dimensionPreset];
    
    return {
      designVersion: '1.0',
      generatedAt: new Date().toISOString(),
      options,
      aiPrompt,
      imageUrl,
      dimensions,
      format: 'png',
    };
  }

  /**
   * Build FRONT cover HTML template for server-side rendering
   * This generates an HTML/CSS cover that can be converted to image
   */
  static buildCoverHTML(
    request: CoverGenerationRequest,
    options: CoverDesignOptions,
    backgroundImageUrl?: string,
    dimensionPreset: CoverDimensionPreset = 'ebook'
  ): string {
    const { title } = request;
    const author = 'PowerWrite'; // Always use PowerWrite as the author
    const { width, height } = COVER_DIMENSIONS[dimensionPreset];
    const { typography, layout, colorScheme, customColors } = options;

    // Color schemes
    const colorSchemes = {
      warm: { bg: '#8B4513', overlay: 'rgba(210, 105, 30, 0.7)', text: '#FFF5E1', accent: '#FFD700' },
      cool: { bg: '#1a3a52', overlay: 'rgba(26, 58, 82, 0.7)', text: '#E0F4FF', accent: '#4FC3F7' },
      monochrome: { bg: '#2C2C2C', overlay: 'rgba(0, 0, 0, 0.6)', text: '#FFFFFF', accent: '#CCCCCC' },
      vibrant: { bg: '#FF6B6B', overlay: 'rgba(255, 107, 107, 0.7)', text: '#FFFFFF', accent: '#FFE66D' },
      pastel: { bg: '#FFC9DE', overlay: 'rgba(255, 201, 222, 0.7)', text: '#4A4A4A', accent: '#B5EAD7' },
      dark: { bg: '#0A0A0A', overlay: 'rgba(0, 0, 0, 0.8)', text: '#FFFFFF', accent: '#FF4444' },
    } as const;

    const scheme = colorScheme === 'custom' ? 'monochrome' : (colorScheme || 'monochrome');
    const normalizedCustomColors = customColors ? {
      bg: customColors.primary,
      overlay: customColors.secondary,
      text: customColors.text,
      accent: customColors.accent,
    } : null;
    const colors = normalizedCustomColors || colorSchemes[scheme as keyof typeof colorSchemes];

    // Font selections
    const fonts = {
      serif: "'Playfair Display', 'Georgia', serif",
      'sans-serif': "'Inter', 'Arial', sans-serif",
      display: "'Bebas Neue', 'Impact', sans-serif",
      script: "'Dancing Script', 'Brush Script MT', cursive",
    };

    // Font sizes based on title length and preference
    const titleLength = title.length;
    let titleFontSize = '72px';
    let authorFontSize = '32px';

    if (typography.fontSize === 'large') {
      titleFontSize = titleLength > 30 ? '64px' : '84px';
      authorFontSize = '36px';
    } else if (typography.fontSize === 'small') {
      titleFontSize = titleLength > 30 ? '48px' : '56px';
      authorFontSize = '24px';
    } else {
      titleFontSize = titleLength > 30 ? '56px' : '72px';
      authorFontSize = '28px';
    }

    // Layout positioning
    const alignmentStyles = {
      top: 'padding-top: 120px;',
      center: 'justify-content: center;',
      bottom: 'justify-content: flex-end; padding-bottom: 120px;',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&family=Bebas+Neue&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }
    
    .cover-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      ${alignmentStyles[typography.alignment]}
      background: ${colors.bg};
      ${backgroundImageUrl ? `background-image: url('${backgroundImageUrl}');` : ''}
      background-size: cover;
      background-position: center;
    }
    
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${colors.overlay};
      z-index: 1;
    }
    
    .content {
      position: relative;
      z-index: 2;
      padding: 80px;
      text-align: center;
    }
    
    .title {
      font-family: ${fonts[typography.titleFont]};
      font-size: ${titleFontSize};
      font-weight: 900;
      color: ${colors.text};
      line-height: 1.1;
      margin-bottom: 40px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      letter-spacing: ${typography.titleFont === 'display' ? '4px' : '1px'};
      ${layout === 'bold' ? 'text-transform: uppercase;' : ''}
    }
    
    ${options.subtitle ? `
    .subtitle {
      font-family: ${fonts[typography.titleFont]};
      font-size: 32px;
      font-weight: 400;
      color: ${colors.accent};
      margin-bottom: 60px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    ` : ''}
    
    .author {
      font-family: ${fonts[typography.authorFont]};
      font-size: ${authorFontSize};
      font-weight: 600;
      color: ${colors.accent};
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-top: ${typography.alignment === 'bottom' ? '0' : '60px'};
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    
    .publisher {
      font-family: ${fonts['sans-serif']};
      font-size: 16px;
      font-weight: 500;
      color: ${colors.text};
      letter-spacing: 3px;
      text-transform: uppercase;
      opacity: 0.8;
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
    }
    
    ${options.tagline ? `
    .tagline {
      font-family: ${fonts['sans-serif']};
      font-size: 24px;
      font-weight: 300;
      color: ${colors.text};
      font-style: italic;
      margin-top: 40px;
      opacity: 0.9;
    }
    ` : ''}
    
    .decorative-line {
      width: 200px;
      height: 4px;
      background: ${colors.accent};
      margin: 40px auto;
      ${layout === 'elegant' ? 'background: linear-gradient(90deg, transparent, ' + colors.accent + ', transparent);' : ''}
    }
  </style>
</head>
<body>
  <div class="cover-container">
    <div class="overlay"></div>
    <div class="content">
      <h1 class="title">${title}</h1>
      ${layout === 'elegant' || layout === 'classic' ? '<div class="decorative-line"></div>' : ''}
      <div class="author">Written by ${author}</div>
      ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
      ${options.tagline ? `<div class="tagline">${options.tagline}</div>` : ''}
    </div>
    <div class="publisher">DLM Media</div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate simplified FRONT cover data URL for client-side preview
   * This is used when a full server-side render is not available
   */
  static generatePreviewDataURL(
    title: string,
    _author: string, // Ignored - we always use PowerWrite
    backgroundColor: string = '#2C2C2C',
    textColor: string = '#FFFFFF'
  ): string {
    const accentColor = textColor === '#FFFFFF' ? '#FFD700' : '#4A4A4A';
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bgGrad)"/>
        <line x1="100" y1="160" x2="300" y2="160" stroke="${accentColor}" stroke-width="2" opacity="0.6"/>
        <text x="200" y="220" text-anchor="middle" fill="${textColor}" font-size="28" font-family="Georgia, serif" font-weight="bold">
          ${title.substring(0, 18)}
        </text>
        ${title.length > 18 ? `<text x="200" y="255" text-anchor="middle" fill="${textColor}" font-size="28" font-family="Georgia, serif" font-weight="bold">${title.substring(18, 36)}</text>` : ''}
        <line x1="100" y1="290" x2="300" y2="290" stroke="${accentColor}" stroke-width="2" opacity="0.6"/>
        <text x="200" y="340" text-anchor="middle" fill="${accentColor}" font-size="14" font-family="Arial, sans-serif" font-style="italic">
          Written by PowerWrite
        </text>
        <text x="200" y="560" text-anchor="middle" fill="${textColor}" font-size="11" font-family="Arial, sans-serif" letter-spacing="2" opacity="0.7">
          DLM MEDIA
        </text>
      </svg>
    `)}`;
  }

  /**
   * Generate simplified BACK cover data URL for client-side preview
   */
  static generateBackCoverPreviewDataURL(
    title: string,
    description: string,
    backgroundColor: string = '#2C2C2C',
    textColor: string = '#FFFFFF'
  ): string {
    const accentColor = textColor === '#FFFFFF' ? '#FFD700' : '#4A4A4A';
    const shortDesc = description.substring(0, 150) + (description.length > 150 ? '...' : '');
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <defs>
          <linearGradient id="bgGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bgGradBack)"/>
        
        <!-- Synopsis section -->
        <text x="40" y="80" fill="${textColor}" font-size="10" font-family="Georgia, serif" opacity="0.9">
          <tspan x="40" dy="0">${shortDesc.substring(0, 45)}</tspan>
          <tspan x="40" dy="16">${shortDesc.substring(45, 90)}</tspan>
          <tspan x="40" dy="16">${shortDesc.substring(90, 135)}</tspan>
          <tspan x="40" dy="16">${shortDesc.substring(135, 180)}</tspan>
        </text>
        
        <!-- Separator -->
        <line x1="100" y1="280" x2="300" y2="280" stroke="${accentColor}" stroke-width="1" opacity="0.5"/>
        
        <!-- Written by PowerWrite -->
        <text x="200" y="320" text-anchor="middle" fill="${accentColor}" font-size="12" font-family="Arial, sans-serif" font-style="italic">
          Written by PowerWrite
        </text>
        
        <!-- Publisher info -->
        <text x="200" y="480" text-anchor="middle" fill="${textColor}" font-size="14" font-family="Arial, sans-serif" font-weight="bold" opacity="0.9">
          DLM Media
        </text>
        <text x="200" y="500" text-anchor="middle" fill="${textColor}" font-size="10" font-family="Arial, sans-serif" opacity="0.7">
          www.dlmworld.com
        </text>
        <text x="200" y="530" text-anchor="middle" fill="${textColor}" font-size="9" font-family="Arial, sans-serif" font-style="italic" opacity="0.5">
          Created with PowerWrite
        </text>
        
        <!-- Barcode placeholder -->
        <rect x="280" y="540" width="100" height="50" fill="white" rx="2"/>
        <text x="330" y="570" text-anchor="middle" fill="#333" font-size="8" font-family="Arial, sans-serif">
          ISBN BARCODE
        </text>
      </svg>
    `)}`;
  }

  /**
   * Build BACK cover HTML template for server-side rendering
   */
  static buildBackCoverHTML(
    request: CoverGenerationRequest,
    options: CoverDesignOptions,
    backgroundImageUrl?: string,
    dimensionPreset: CoverDimensionPreset = 'ebook'
  ): string {
    const { title, description } = request;
    const { width, height } = COVER_DIMENSIONS[dimensionPreset];
    const { colorScheme, customColors } = options;

    // Color schemes
    const colorSchemes = {
      warm: { bg: '#8B4513', overlay: 'rgba(139, 69, 19, 0.85)', text: '#FFF5E1', accent: '#FFD700' },
      cool: { bg: '#1a3a52', overlay: 'rgba(26, 58, 82, 0.85)', text: '#E0F4FF', accent: '#4FC3F7' },
      monochrome: { bg: '#2C2C2C', overlay: 'rgba(44, 44, 44, 0.9)', text: '#FFFFFF', accent: '#CCCCCC' },
      vibrant: { bg: '#FF6B6B', overlay: 'rgba(255, 107, 107, 0.85)', text: '#FFFFFF', accent: '#FFE66D' },
      pastel: { bg: '#FFC9DE', overlay: 'rgba(255, 201, 222, 0.85)', text: '#4A4A4A', accent: '#B5EAD7' },
      dark: { bg: '#0A0A0A', overlay: 'rgba(10, 10, 10, 0.9)', text: '#FFFFFF', accent: '#FF4444' },
    } as const;

    const scheme = colorScheme === 'custom' ? 'monochrome' : (colorScheme || 'monochrome');
    const normalizedCustomColors = customColors ? {
      bg: customColors.primary,
      overlay: customColors.secondary,
      text: customColors.text,
      accent: customColors.accent,
    } : null;
    const colors = normalizedCustomColors || colorSchemes[scheme as keyof typeof colorSchemes];

    // Clean description for display
    const cleanDescription = description.substring(0, 600).trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }
    
    .back-cover {
      width: 100%;
      height: 100%;
      position: relative;
      background: ${colors.bg};
      ${backgroundImageUrl ? `background-image: url('${backgroundImageUrl}');` : ''}
      background-size: cover;
      background-position: center;
    }
    
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${colors.overlay};
      z-index: 1;
    }
    
    .content {
      position: relative;
      z-index: 2;
      padding: 80px 60px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .synopsis {
      flex: 1;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 22px;
      line-height: 1.7;
      color: ${colors.text};
      text-align: justify;
      margin-bottom: 40px;
    }
    
    .divider {
      width: 100px;
      height: 2px;
      background: ${colors.accent};
      margin: 30px auto;
    }
    
    .author-credit {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 18px;
      font-style: italic;
      color: ${colors.accent};
      text-align: center;
      margin-bottom: 40px;
    }
    
    .publisher-section {
      text-align: center;
      margin-bottom: 60px;
    }
    
    .publisher-name {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 24px;
      font-weight: 600;
      color: ${colors.text};
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    
    .publisher-url {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 14px;
      color: ${colors.text};
      opacity: 0.7;
      margin-bottom: 15px;
    }
    
    .created-with {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      font-style: italic;
      color: ${colors.text};
      opacity: 0.5;
    }
    
    .barcode-area {
      position: absolute;
      bottom: 50px;
      right: 50px;
      width: 150px;
      height: 80px;
      background: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="back-cover">
    <div class="overlay"></div>
    <div class="content">
      <div class="synopsis">${cleanDescription}</div>
      <div class="divider"></div>
      <div class="author-credit">Written by PowerWrite</div>
      <div class="publisher-section">
        <div class="publisher-name">DLM Media</div>
        <div class="publisher-url">www.dlmworld.com</div>
        <div class="created-with">Created with PowerWrite</div>
      </div>
    </div>
    <div class="barcode-area">ISBN BARCODE</div>
  </div>
</body>
</html>`;

    return html;
  }
}
