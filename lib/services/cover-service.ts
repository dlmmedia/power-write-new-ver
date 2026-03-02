import { 
  CoverDesignOptions, 
  CoverMetadata, 
  CoverGenerationRequest,
  GENRE_COVER_DEFAULTS,
  COVER_DIMENSIONS,
  CoverDimensionPreset,
  CoverTextCustomization,
  CoverTypographyOptions,
  CoverLayoutOptions,
  CoverVisualOptions,
  COLOR_PALETTES,
} from '../types/cover';

export class CoverService {
  /**
   * Generate ENHANCED AI prompt for professional FRONT book cover
   * Now supports full customization of text, typography, layout, and visuals
   */
  static generateEnhancedAIPrompt(request: CoverGenerationRequest): string {
    const { 
      title, 
      author,
      genre, 
      description, 
      themes = [], 
      mood,
      textCustomization,
      typographyOptions,
      layoutOptions,
      visualOptions,
      customPrompt,
      referenceStyle,
      showPowerWriteBranding = true,
      hideAuthorName = false,
    } = request;
    
    const displayTitle = textCustomization?.customTitle || title;
    const displayAuthor = hideAuthorName 
      ? ''
      : (showPowerWriteBranding 
        ? (textCustomization?.customAuthor || 'PowerWrite')
        : (textCustomization?.customAuthor || author || ''));
    const subtitle = textCustomization?.subtitle;
    const tagline = textCustomization?.tagline;
    const publisherName = textCustomization?.publisherName || 'DLM Media';
    const seriesInfo = textCustomization?.seriesName 
      ? `${textCustomization.seriesName}${textCustomization.seriesNumber ? ` Book ${textCustomization.seriesNumber}` : ''}` 
      : null;
    const awardBadge = textCustomization?.awardBadge;
    
    const fontDescriptions: Record<string, string> = {
      'serif': 'refined serif typeface like Garamond or Baskerville',
      'sans-serif': 'clean modern sans-serif typeface like Helvetica Neue or Futura',
      'display': 'bold impactful display typeface with strong presence',
      'script': 'elegant flowing calligraphic script',
      'gothic': 'gothic blackletter or dark ornamental typeface',
      'modern': 'contemporary geometric sans-serif with sharp lines',
      'handwritten': 'organic hand-lettered brush typeface',
    };
    
    const weightDescriptions: Record<string, string> = {
      'light': 'delicate light weight',
      'normal': 'regular weight',
      'bold': 'bold and commanding',
      'black': 'ultra-heavy black weight',
    };
    
    const styleDescriptions: Record<string, string> = {
      'normal': '',
      'italic': 'set in italics',
      'uppercase': 'rendered in all capitals',
      'small-caps': 'set in elegant small capitals',
    };
    
    const effectDescriptions: Record<string, string> = {
      'none': '',
      'shadow': 'with a subtle drop shadow for depth',
      'outline': 'with clean outlined strokes',
      'glow': 'with a soft luminous glow',
      'embossed': 'with a tactile embossed appearance',
      '3d': 'with dimensional perspective',
    };

    const genreNarratives: Record<string, { visual: string; typography: string; lighting: string }> = {
      'Fantasy': { visual: 'rich illustrated artwork evoking an epic magical world', typography: 'ornate serif or elegant display typeface', lighting: 'dramatic golden-hour illumination with ethereal highlights' },
      'Science Fiction': { visual: 'sleek futuristic imagery with technological elements', typography: 'modern geometric sans-serif typeface', lighting: 'cool neon-tinged lighting with metallic reflections' },
      'Romance': { visual: 'warm inviting composition with soft romantic tones', typography: 'elegant flowing script or refined serif', lighting: 'soft diffused warmth with gentle bokeh' },
      'Thriller': { visual: 'high-tension cinematic composition with shadows', typography: 'bold impactful sans-serif with sharp edges', lighting: 'high-contrast chiaroscuro with dramatic spotlighting' },
      'Mystery': { visual: 'atmospheric noir-inspired scene with intrigue', typography: 'classic serif with understated elegance', lighting: 'moody low-key lighting with deep shadows' },
      'Horror': { visual: 'unsettling dark imagery that evokes dread', typography: 'distressed gothic or fractured display typeface', lighting: 'harsh underlit shadows with sickly color casts' },
      'Literary Fiction': { visual: 'sophisticated minimalist composition with artistic restraint', typography: 'refined serif typeface with generous spacing', lighting: 'natural diffused studio lighting' },
      'Non-Fiction': { visual: 'clean professional design with authoritative presence', typography: 'modern sans-serif with clean readability', lighting: 'even professional studio illumination' },
      'Biography': { visual: 'dignified portraiture-inspired composition', typography: 'classic elegant serif with timeless appeal', lighting: 'warm Rembrandt-style portrait lighting' },
      'Self-Help': { visual: 'uplifting bright design with positive energy', typography: 'modern bold sans-serif conveying confidence', lighting: 'bright optimistic lighting with warm tones' },
      'Young Adult': { visual: 'dynamic bold design with contemporary edge', typography: 'trendy display typeface with personality', lighting: 'vibrant colorful lighting with energy' },
    };

    const genreInfo = genreNarratives[genre] || genreNarratives['Literary Fiction'];
    const visualKeywords = this.extractVisualKeywords(description, genre);
    
    // --- Build narrative style description ---
    const styleNarrative: Record<string, string> = {
      'minimalist': 'a clean minimalist composition with sophisticated negative space and restrained elegance',
      'illustrative': 'a richly illustrated artwork with hand-crafted detail and artistic depth',
      'photographic': 'a photorealistic studio-quality composition captured with a professional 85mm lens',
      'abstract': 'an abstract conceptual design using symbolic shapes, textures, and color fields',
      'typographic': 'a typography-driven design where the title treatment itself serves as the primary visual element',
      'cinematic': 'a cinematic widescreen composition reminiscent of a Hollywood movie poster',
      'vintage': 'a vintage aesthetic with aged paper textures, retro color grading, and nostalgic warmth',
      'retro': 'a bold retro design inspired by 1970s and 1980s graphic art with saturated colors',
      'futuristic': 'a futuristic high-tech design with holographic elements and sharp geometric forms',
    };

    const colorNarrative: Record<string, string> = {
      'warm': 'a warm rich palette of golds, burnt oranges, deep reds, and amber tones',
      'cool': 'a cool-toned palette of steel blues, silvers, teals, and icy grays',
      'monochrome': 'a sophisticated monochromatic palette with rich tonal depth—charcoals, silvers, and one elegant metallic accent',
      'vibrant': 'vivid saturated colors with bold contrast and eye-catching intensity',
      'pastel': 'soft pastel tones of lavender, blush pink, mint, and cream',
      'dark': 'a deep moody palette of midnight blacks, dark navy, and rich shadows with selective highlights',
      'complementary': 'complementary color harmony creating bold visual tension and energy',
      'analogous': 'analogous color harmony with smooth gradual transitions between related hues',
    };

    const layoutNarrative: Record<string, string> = {
      'classic': 'a balanced centered composition with traditional publishing proportions',
      'modern': 'a contemporary asymmetrical layout with creative off-center text placement',
      'bold': 'a high-impact layout dominated by oversized typography and dramatic contrast',
      'elegant': 'a refined sophisticated layout with graceful spacing and delicate proportions',
      'dramatic': 'a cinematic high-drama composition with dynamic diagonal energy',
      'minimalist': 'a sparse clean layout with generous white space and minimal elements',
      'split': 'a divided composition separating the image and text into distinct zones',
      'border': 'a framed design with decorative border elements creating structure',
      'full-bleed': 'an edge-to-edge full-bleed image with floating text integrated into the scene',
    };

    // --- Compose the narrative prompt ---
    const chosenStyle = visualOptions?.style || 'photographic';
    const chosenColor = visualOptions?.colorScheme || 'vibrant';
    const chosenLayout = layoutOptions?.layout || 'classic';
    const chosenAtmosphere = visualOptions?.atmosphere || 'dramatic';

    let prompt = `Design a publication-ready front book cover for a ${genre} novel. `;

    // Scene and visual description (narrative, not bullet points)
    prompt += `The cover uses ${styleNarrative[chosenStyle] || genreInfo.visual}. `;

    if (visualOptions?.mainSubject) {
      prompt += `The central imagery features ${visualOptions.mainSubject}. `;
    } else if (visualKeywords.length > 0) {
      prompt += `The visual composition evokes ${visualKeywords.join(', ')}. `;
    }

    if (visualOptions?.backgroundDescription) {
      prompt += `The background depicts ${visualOptions.backgroundDescription}. `;
    }

    // Atmosphere and lighting
    prompt += `The overall atmosphere is ${chosenAtmosphere} and ${mood || genreInfo.lighting}. `;

    // Color palette
    if (visualOptions?.colorScheme === 'custom' && visualOptions?.customColors) {
      const c = visualOptions.customColors;
      prompt += `The color palette centers on ${c.primary} as the primary tone, ${c.secondary} as secondary, with ${c.accent} accents and ${c.text} text${c.background ? ` against a ${c.background} background` : ''}. `;
    } else {
      prompt += `The color palette uses ${colorNarrative[chosenColor] || 'balanced genre-appropriate colors'}. `;
    }

    // Layout
    prompt += `The composition follows ${layoutNarrative[chosenLayout] || 'a balanced professional layout'}. `;

    if (layoutOptions?.borderStyle && layoutOptions.borderStyle !== 'none') {
      prompt += `A ${layoutOptions.borderStyle} decorative border frames the design. `;
    }
    if (layoutOptions?.overlayType && layoutOptions.overlayType !== 'none') {
      prompt += `A ${layoutOptions.overlayType} overlay at ${layoutOptions.overlayOpacity || 50}% opacity blends text into the imagery. `;
    }

    // --- Typography as narrative ---
    prompt += `\n\nThe title "${displayTitle}" is rendered in `;
    if (typographyOptions) {
      const font = fontDescriptions[typographyOptions.titleFont] || genreInfo.typography;
      const weight = weightDescriptions[typographyOptions.titleWeight] || 'bold';
      const style = styleDescriptions[typographyOptions.titleStyle] || '';
      const effect = typographyOptions.titleEffect ? effectDescriptions[typographyOptions.titleEffect] : '';
      prompt += `a ${weight} ${font}${style ? `, ${style}` : ''}${effect ? `, ${effect}` : ''}`;
      prompt += `, sized ${typographyOptions.titleSize || 'large'} as the dominant visual element, ${typographyOptions.alignment || 'center'}-aligned and positioned at the ${typographyOptions.verticalPosition || 'center'} of the cover. `;
    } else {
      prompt += `${genreInfo.typography}, large and commanding as the dominant focal point. `;
    }

    if (subtitle) {
      prompt += `Below the title, the subtitle "${subtitle}" appears in a smaller complementary typeface. `;
    }

    if (displayAuthor) {
      const authorPrefix = showPowerWriteBranding ? 'Written by ' : '';
      if (typographyOptions) {
        const authorFont = fontDescriptions[typographyOptions.authorFont] || 'clean sans-serif';
        const authorStyle = styleDescriptions[typographyOptions.authorStyle] || '';
        prompt += `The author credit "${authorPrefix}${displayAuthor}" is set in a ${authorFont}${authorStyle ? `, ${authorStyle}` : ''}, clearly readable but secondary to the title. `;
      } else {
        prompt += `The author credit "${authorPrefix}${displayAuthor}" appears in elegant professional styling below the title. `;
      }
    }

    if (tagline) {
      prompt += `A tagline reading "${tagline}" is set in an italicized accent style. `;
    }

    if (seriesInfo) {
      prompt += `The series designation "${seriesInfo}" appears as subtle small text at the top of the cover. `;
    }

    if (awardBadge) {
      prompt += `A gold metallic award seal reading "${awardBadge}" is placed in the upper corner. `;
    }

    prompt += `The publisher name "${publisherName}" is rendered in small professional text at the bottom edge.`;

    // Visual elements to include/avoid
    if (visualOptions?.visualElements && visualOptions.visualElements.length > 0) {
      prompt += ` The design incorporates ${visualOptions.visualElements.join(', ')}.`;
    }
    if (visualOptions?.avoidElements && visualOptions.avoidElements.length > 0) {
      prompt += ` The design should not contain ${visualOptions.avoidElements.join(', ')}.`;
    }

    // Themes
    if (themes.length > 0) {
      prompt += ` Thematic elements of ${themes.join(', ')} are woven into the visual language.`;
    }

    // Reference style
    if (referenceStyle) {
      prompt += `\n\nStyle reference: design this in the spirit of ${referenceStyle}, matching that level of professional quality and aesthetic sensibility.`;
    }

    // Custom instructions
    if (customPrompt) {
      prompt += `\n\nAdditional design direction: ${customPrompt}`;
    }

    // Technical requirements (concise)
    prompt += `\n\nTechnical specifications: portrait orientation at 2:3 aspect ratio, print-ready resolution, all text rendered with crystal-clear legibility and strong contrast against the background. Each text element appears exactly once with a clear visual hierarchy—title largest, author mid-size, publisher smallest. The finished cover should be indistinguishable from a bestselling book at a major retailer.`;
    
    return prompt;
  }

  /**
   * Generate AI prompt for professional FRONT book cover (Legacy method)
   * Creates covers with title, "Produced by PowerWrite", and DLM Media publisher branding
   */
  static generateAIPrompt(request: CoverGenerationRequest, options: CoverDesignOptions): string {
    // If new customization options are provided, use enhanced method
    if (request.textCustomization || request.typographyOptions || request.layoutOptions || request.visualOptions || request.customPrompt) {
      return this.generateEnhancedAIPrompt(request);
    }
    
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

2. "Produced by PowerWrite" (BELOW TITLE):
   - Smaller, elegant font below the title
   - Complementary style

3. "DLM Media" (BOTTOM - SMALLEST):
   - Small publisher text at the bottom edge
   - Professional publisher placement
   - Display ONLY ONCE

=== IMPORTANT ===
- Do NOT duplicate any text
- Only show "DLM Media" ONCE at the bottom
- Hierarchy: TITLE (biggest) → "Produced by PowerWrite" (medium) → "DLM Media" (smallest)

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
   "Produced by PowerWrite"
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
    author: string,
    backgroundColor: string = '#2C2C2C',
    textColor: string = '#FFFFFF',
    showPowerWriteBranding: boolean = true,
    hideAuthorName: boolean = false
  ): string {
    const accentColor = textColor === '#FFFFFF' ? '#FFD700' : '#4A4A4A';
    
    const authorLine = hideAuthorName
      ? ''
      : author 
        ? (showPowerWriteBranding ? `Produced by ${author}` : author)
        : (showPowerWriteBranding ? 'Produced by PowerWrite' : '');
    
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
        ${authorLine ? `<text x="200" y="340" text-anchor="middle" fill="${accentColor}" font-size="14" font-family="Arial, sans-serif" font-style="italic">${authorLine}</text>` : ''}
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
    textColor: string = '#FFFFFF',
    options?: {
      showPowerWriteBranding?: boolean;
      hideAuthorName?: boolean;
      barcodeType?: 'isbn' | 'qr' | 'none';
      showWebsite?: boolean;
      showTagline?: boolean;
      author?: string;
    }
  ): string {
    const accentColor = textColor === '#FFFFFF' ? '#FFD700' : '#4A4A4A';
    const shortDesc = description.substring(0, 150) + (description.length > 150 ? '...' : '');
    
    const showPowerWriteBranding = options?.showPowerWriteBranding !== false;
    const hideAuthorName = options?.hideAuthorName === true;
    const barcodeType = options?.barcodeType || 'isbn';
    const showWebsite = options?.showWebsite !== false;
    const showTagline = options?.showTagline !== false && showPowerWriteBranding;
    
    const authorLine = hideAuthorName
      ? ''
      : (() => {
          const authorName = options?.author || (showPowerWriteBranding ? 'PowerWrite' : '');
          return authorName
            ? (showPowerWriteBranding ? `Written by ${authorName}` : authorName)
            : '';
        })();
    
    // Build barcode/QR code element
    let barcodeElement = '';
    if (barcodeType === 'isbn') {
      barcodeElement = `
        <rect x="280" y="540" width="100" height="50" fill="white" rx="2"/>
        <text x="330" y="565" text-anchor="middle" fill="#333" font-size="7" font-family="Arial, sans-serif">ISBN BARCODE</text>
        <rect x="290" y="545" width="2" height="30" fill="#333"/>
        <rect x="295" y="545" width="1" height="30" fill="#333"/>
        <rect x="299" y="545" width="3" height="30" fill="#333"/>
        <rect x="305" y="545" width="1" height="30" fill="#333"/>
        <rect x="309" y="545" width="2" height="30" fill="#333"/>
        <rect x="314" y="545" width="1" height="30" fill="#333"/>
        <rect x="318" y="545" width="3" height="30" fill="#333"/>
        <rect x="324" y="545" width="1" height="30" fill="#333"/>
        <rect x="328" y="545" width="2" height="30" fill="#333"/>
        <rect x="333" y="545" width="1" height="30" fill="#333"/>
        <rect x="337" y="545" width="3" height="30" fill="#333"/>
        <rect x="343" y="545" width="2" height="30" fill="#333"/>
        <rect x="348" y="545" width="1" height="30" fill="#333"/>
        <rect x="352" y="545" width="2" height="30" fill="#333"/>
        <rect x="357" y="545" width="1" height="30" fill="#333"/>
        <rect x="361" y="545" width="3" height="30" fill="#333"/>
        <rect x="367" y="545" width="1" height="30" fill="#333"/>
      `;
    } else if (barcodeType === 'qr') {
      barcodeElement = `
        <rect x="310" y="530" width="60" height="60" fill="white" rx="2"/>
        <text x="340" y="600" text-anchor="middle" fill="#333" font-size="6" font-family="Arial, sans-serif">SCAN ME</text>
        <!-- QR Code pattern -->
        <rect x="315" y="535" width="8" height="8" fill="#333"/>
        <rect x="325" y="535" width="4" height="4" fill="#333"/>
        <rect x="335" y="535" width="8" height="8" fill="#333"/>
        <rect x="357" y="535" width="8" height="8" fill="#333"/>
        <rect x="315" y="545" width="4" height="4" fill="#333"/>
        <rect x="325" y="545" width="8" height="4" fill="#333"/>
        <rect x="340" y="545" width="4" height="4" fill="#333"/>
        <rect x="350" y="545" width="4" height="4" fill="#333"/>
        <rect x="360" y="545" width="4" height="4" fill="#333"/>
        <rect x="315" y="555" width="8" height="8" fill="#333"/>
        <rect x="330" y="555" width="4" height="4" fill="#333"/>
        <rect x="345" y="555" width="4" height="4" fill="#333"/>
        <rect x="357" y="555" width="8" height="8" fill="#333"/>
        <rect x="315" y="570" width="4" height="4" fill="#333"/>
        <rect x="325" y="570" width="8" height="4" fill="#333"/>
        <rect x="340" y="570" width="4" height="4" fill="#333"/>
        <rect x="350" y="575" width="4" height="4" fill="#333"/>
        <rect x="315" y="580" width="8" height="8" fill="#333"/>
        <rect x="330" y="580" width="4" height="4" fill="#333"/>
        <rect x="357" y="575" width="8" height="8" fill="#333"/>
      `;
    }
    
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
        
        <!-- Author line -->
        ${authorLine ? `<text x="200" y="320" text-anchor="middle" fill="${accentColor}" font-size="12" font-family="Arial, sans-serif" font-style="italic">${authorLine}</text>` : ''}
        
        <!-- Publisher info -->
        <text x="200" y="480" text-anchor="middle" fill="${textColor}" font-size="14" font-family="Arial, sans-serif" font-weight="bold" opacity="0.9">
          DLM Media
        </text>
        ${showWebsite ? `<text x="200" y="500" text-anchor="middle" fill="${textColor}" font-size="10" font-family="Arial, sans-serif" opacity="0.7">www.dlmworld.com</text>` : ''}
        ${showTagline ? `<text x="200" y="520" text-anchor="middle" fill="${textColor}" font-size="9" font-family="Arial, sans-serif" font-style="italic" opacity="0.5">Created with PowerWrite</text>` : ''}
        
        <!-- Barcode/QR Code -->
        ${barcodeElement}
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
      <div class="author-credit">Produced by PowerWrite</div>
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
