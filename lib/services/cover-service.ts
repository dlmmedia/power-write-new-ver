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
   * Generate AI prompt for DALL-E based on book details and design options
   */
  static generateAIPrompt(request: CoverGenerationRequest, options: CoverDesignOptions): string {
    const { title, genre, description, themes = [], mood } = request;
    const { style, colorScheme } = options;

    // Extract key visual elements from description
    const visualKeywords = this.extractVisualKeywords(description, genre);
    
    // Build comprehensive prompt
    let prompt = `Professional book cover design, ${style} style, ${colorScheme || 'balanced'} color palette. `;
    
    // Genre-specific details
    prompt += `Genre: ${genre}. `;
    
    // Add mood and themes
    if (mood) {
      prompt += `Mood: ${mood}. `;
    }
    if (themes.length > 0) {
      prompt += `Themes: ${themes.join(', ')}. `;
    }
    
    // Add visual keywords
    if (visualKeywords.length > 0) {
      prompt += `Visual elements: ${visualKeywords.join(', ')}. `;
    }
    
    // Style-specific instructions
    switch (style) {
      case 'minimalist':
        prompt += 'Clean, simple composition with lots of negative space. Focus on essential elements only. ';
        break;
      case 'illustrative':
        prompt += 'Rich, detailed illustration with artistic flair. Hand-drawn or painted aesthetic. ';
        break;
      case 'photographic':
        prompt += 'Realistic photographic imagery, professional photography style. High quality, editorial look. ';
        break;
      case 'abstract':
        prompt += 'Abstract, conceptual design with symbolic elements. Non-literal interpretation. ';
        break;
      case 'typographic':
        prompt += 'Typography-focused design with bold, creative text treatment as the main visual element. ';
        break;
    }
    
    // Technical requirements
    prompt += 'High resolution, professional book cover quality. No text or titles in the image. ';
    prompt += 'Suitable for book cover background. Vertical orientation, 2:3 aspect ratio.';
    
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
   * Build cover HTML template for server-side rendering
   * This generates an HTML/CSS cover that can be converted to image
   */
  static buildCoverHTML(
    request: CoverGenerationRequest,
    options: CoverDesignOptions,
    backgroundImageUrl?: string,
    dimensionPreset: CoverDimensionPreset = 'ebook'
  ): string {
    const { title, author } = request;
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
    const colors = customColors || colorSchemes[scheme as keyof typeof colorSchemes];

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
      ${typography.alignment === 'top' || typography.alignment === 'center' ? `<div class="author">${author}</div>` : ''}
      ${layout === 'elegant' || layout === 'classic' ? '<div class="decorative-line"></div>' : ''}
      <h1 class="title">${title}</h1>
      ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
      ${layout === 'elegant' || layout === 'classic' ? '<div class="decorative-line"></div>' : ''}
      ${typography.alignment === 'bottom' ? `<div class="author">${author}</div>` : ''}
      ${options.tagline ? `<div class="tagline">${options.tagline}</div>` : ''}
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate simplified cover data URL for client-side preview (using canvas)
   * This is used when a full server-side render is not available
   */
  static generatePreviewDataURL(
    title: string,
    author: string,
    backgroundColor: string = '#2C2C2C',
    textColor: string = '#FFFFFF'
  ): string {
    // This would be implemented on the client side using Canvas API
    // For now, return a placeholder that can be generated client-side
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <rect width="400" height="600" fill="${backgroundColor}"/>
        <text x="200" y="250" text-anchor="middle" fill="${textColor}" font-size="32" font-family="serif" font-weight="bold">
          ${title.substring(0, 30)}
        </text>
        <text x="200" y="350" text-anchor="middle" fill="${textColor}" font-size="18" font-family="sans-serif">
          ${author}
        </text>
      </svg>
    `)}`;
  }
}
