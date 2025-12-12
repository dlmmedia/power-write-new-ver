import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { 
  AIProvider, 
  AIModel, 
  getModelById, 
  ALL_MODELS,
  DEFAULT_OUTLINE_MODEL,
  DEFAULT_CHAPTER_MODEL,
  DEFAULT_IMAGE_MODEL,
  getImageModelById,
  ImageProvider 
} from '@/lib/types/models';

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Validate at least one API key exists
if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
  console.warn('⚠️ No AI API keys configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.');
}

// Initialize OpenAI provider
const openai = OPENAI_API_KEY 
  ? createOpenAI({ apiKey: OPENAI_API_KEY })
  : null;

// Initialize OpenRouter provider (OpenAI-compatible)
const openrouter = OPENROUTER_API_KEY
  ? createOpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PowerWrite Book Studio',
      },
    })
  : null;

// Log available providers
if (OPENAI_API_KEY) {
  console.log('✓ AI Service: OpenAI provider initialized');
}
if (OPENROUTER_API_KEY) {
  console.log('✓ AI Service: OpenRouter provider initialized');
  console.log('  Available models:', ALL_MODELS.filter(m => m.provider === 'openrouter').length);
}

// Get the language model for a given model ID
function getModel(modelId: string) {
  const modelInfo = getModelById(modelId);
  
  if (!modelInfo) {
    console.warn(`Model ${modelId} not found, falling back to default`);
    // Fall back to available provider
    if (openrouter) {
      return openrouter(DEFAULT_CHAPTER_MODEL);
    }
    if (openai) {
      return openai('gpt-4o');
    }
    throw new Error('No AI provider available');
  }
  
  if (modelInfo.provider === 'openrouter') {
    if (!openrouter) {
      throw new Error('OpenRouter is not configured. Please set OPENROUTER_API_KEY.');
    }
    return openrouter(modelId);
  }
  
  if (modelInfo.provider === 'openai') {
    if (!openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY.');
    }
    return openai(modelId);
  }
  
  throw new Error(`Unknown provider for model ${modelId}`);
}

// Check provider availability
export function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === 'openai') return !!openai;
  if (provider === 'openrouter') return !!openrouter;
  return false;
}

// Get available models
export function getAvailableModels(): AIModel[] {
  return ALL_MODELS.filter(m => isProviderAvailable(m.provider));
}

export interface BookOutline {
  title: string;
  author: string;
  genre: string;
  description: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    wordCount: number;
  }>;
  themes?: string[];
  characters?: Array<{
    name: string;
    role: string;
    description: string;
  }>;
}

// Bibliography configuration for chapter generation
export interface BibliographyGenerationConfig {
  enabled: boolean;
  citationStyle: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver' | 'AMA';
  sourceVerification?: 'strict' | 'moderate' | 'relaxed';
}

// Generated reference structure
export interface GeneratedReference {
  id: string;
  type: 'book' | 'journal' | 'website' | 'report' | 'conference';
  title: string;
  authors: Array<{ firstName?: string; lastName: string }>;
  year?: number;
  publisher?: string;
  url?: string;
  doi?: string;
  journalTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  accessDate?: string;
}

export interface BookGenerationConfig {
  title?: string;
  author: string;
  genre: string;
  tone: string;
  audience: string;
  description: string;
  chapters: number;
  length: string;
  customInstructions?: string;
  isNonFiction?: boolean;
  customCharacters?: Array<{
    id: string;
    name: string;
    role: string;
    description: string;
    traits: string;
  }>;
  sourceBook?: {
    title: string;
    author: string;
    description: string;
  };
  // Model selection
  outlineModel?: string;
  chapterModel?: string;
}

export class AIService {
  private outlineModel: string;
  private chapterModel: string;

  constructor(
    outlineModel: string = DEFAULT_OUTLINE_MODEL,
    chapterModel: string = DEFAULT_CHAPTER_MODEL
  ) {
    // Use defaults or fall back to OpenAI if OpenRouter not available
    this.outlineModel = openrouter ? outlineModel : 'gpt-4o-mini';
    this.chapterModel = openrouter ? chapterModel : 'gpt-4o';
  }

  setModels(outlineModel?: string, chapterModel?: string) {
    if (outlineModel) this.outlineModel = outlineModel;
    if (chapterModel) this.chapterModel = chapterModel;
  }

  /**
   * Build a professional book cover prompt with proper text layout
   * Creates detailed instructions for generating covers with title, PowerWrite branding, and DLM Media publisher
   */
  private buildProfessionalCoverPrompt(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string
  ): string {
    // Genre-specific design guidelines
    const genreStyles: Record<string, { mood: string; colors: string; elements: string }> = {
      'Fantasy': {
        mood: 'magical, epic, mysterious',
        colors: 'rich golds, deep purples, mystical blues',
        elements: 'ornate borders, magical symbols, castle silhouettes, dragons'
      },
      'Science Fiction': {
        mood: 'futuristic, sleek, technological',
        colors: 'neon blues, silver metallics, deep space black',
        elements: 'geometric patterns, stars, planets, circuit designs'
      },
      'Romance': {
        mood: 'warm, passionate, elegant',
        colors: 'soft pinks, deep reds, warm golds',
        elements: 'flowing curves, floral accents, romantic scenery'
      },
      'Thriller': {
        mood: 'dark, intense, suspenseful',
        colors: 'high contrast black and red, silver',
        elements: 'sharp angles, shadows, urban silhouettes'
      },
      'Mystery': {
        mood: 'intriguing, shadowy, atmospheric',
        colors: 'noir palette, sepia tones, deep shadows',
        elements: 'fog, silhouettes, vintage textures'
      },
      'Horror': {
        mood: 'dark, foreboding, unsettling',
        colors: 'blood red, midnight black, sickly greens',
        elements: 'gothic elements, distorted shapes, eerie lighting'
      },
      'Literary Fiction': {
        mood: 'sophisticated, thoughtful, artistic',
        colors: 'muted earth tones, elegant neutrals',
        elements: 'abstract designs, artistic photography, minimalist composition'
      },
      'Non-Fiction': {
        mood: 'professional, authoritative, clean',
        colors: 'corporate blues, clean whites, accent colors',
        elements: 'clean typography focus, subtle imagery, professional layout'
      },
      'Biography': {
        mood: 'dignified, personal, historical',
        colors: 'warm sepia, classic black and white, rich browns',
        elements: 'portrait style, vintage textures, elegant frames'
      },
      'Self-Help': {
        mood: 'inspiring, positive, energetic',
        colors: 'bright yellows, vibrant oranges, sky blues',
        elements: 'uplifting imagery, clean modern design, motivational feel'
      },
      'Young Adult': {
        mood: 'dynamic, bold, contemporary',
        colors: 'vibrant and bold color combinations',
        elements: 'modern graphics, illustrated elements, trendy design'
      }
    };

    const genreStyle = genreStyles[genre] || genreStyles['Literary Fiction'];
    
    // Truncate and clean the description
    const cleanDescription = description.substring(0, 200).replace(/["\n\r]/g, ' ').trim();
    
    // Build a comprehensive, structured prompt for professional book cover
    const prompt = `Create a COMPLETE professional book cover design for publication.

=== BOOK INFORMATION ===
Title: "${title}"
Publisher: DLM Media
Genre: ${genre}

=== FRONT COVER LAYOUT (TOP TO BOTTOM) ===
This must be a COMPLETE, ready-to-print book cover with EXACTLY these text elements in this order:

1. BOOK TITLE (TOP/CENTER - LARGEST):
   - Display "${title}" as the main focal point
   - Use elegant, professional typography appropriate for ${genre}
   - Position prominently in the upper or center area
   - Make it the dominant visual element - large, bold, perfectly legible
   - Font style: ${style === 'photographic' ? 'clean sans-serif or elegant serif' : 'decorative font matching the genre'}

2. "DLM Media" PUBLISHER (BOTTOM):
   - Display "DLM Media" at the BOTTOM of the cover
   - Small, professional publisher text
   - Standard publisher position (bottom center, near the edge)
   - This should be the smallest text element

=== IMPORTANT: TEXT PLACEMENT ===
- Do NOT include any author name on the cover
- Do NOT duplicate any text
- Only show "DLM Media" ONCE at the bottom
- The hierarchy must be: TITLE (biggest) → "DLM Media" (smallest at bottom)

=== DESIGN SPECIFICATIONS ===
- Aspect Ratio: Portrait orientation (2:3 ratio for book covers)
- Style: ${style}, premium publishing quality
- Genre Mood: ${genreStyle.mood}
- Color Palette: ${genreStyle.colors}
- Visual Elements: ${genreStyle.elements}
- Background: Create compelling artwork that complements the text
  Based on: ${cleanDescription}

=== TYPOGRAPHY GUIDELINES ===
- All text must be PERFECTLY SPELLED and CLEARLY READABLE
- Professional kerning and spacing
- High contrast between text and background
- Text should look professionally designed
- Clear visual hierarchy between text elements

=== QUALITY STANDARDS ===
- Professional bookstore-quality cover design
- Commercial publishing standard
- Clean, crisp text rendering
- Balanced composition with proper visual hierarchy
- The cover should look like a bestselling book at Barnes & Noble

Generate a complete, professional book cover with the title and publisher perfectly integrated.`;

    return prompt;
  }

  /**
   * Build a professional BACK cover prompt
   * Creates detailed instructions for generating the back cover with synopsis, author bio, and publisher info
   */
  buildBackCoverPrompt(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string,
    options?: {
      showBarcode?: boolean;
      barcodeType?: 'isbn' | 'qr' | 'none';
      layout?: 'classic' | 'modern' | 'minimal' | 'editorial';
      showWebsite?: boolean;
      showTagline?: boolean;
      showPowerWriteBranding?: boolean;
      frontCoverStyle?: {
        colorScheme?: string;
        style?: string;
      };
    }
  ): string {
    // Genre-specific design guidelines (same as front cover for consistency)
    const genreStyles: Record<string, { mood: string; colors: string }> = {
      'Fantasy': { mood: 'magical, epic, mysterious', colors: 'rich golds, deep purples, mystical blues' },
      'Science Fiction': { mood: 'futuristic, sleek, technological', colors: 'neon blues, silver metallics, deep space black' },
      'Romance': { mood: 'warm, passionate, elegant', colors: 'soft pinks, deep reds, warm golds' },
      'Thriller': { mood: 'dark, intense, suspenseful', colors: 'high contrast black and red, silver' },
      'Mystery': { mood: 'intriguing, shadowy, atmospheric', colors: 'noir palette, sepia tones, deep shadows' },
      'Horror': { mood: 'dark, foreboding, unsettling', colors: 'blood red, midnight black, sickly greens' },
      'Literary Fiction': { mood: 'sophisticated, thoughtful, artistic', colors: 'muted earth tones, elegant neutrals' },
      'Non-Fiction': { mood: 'professional, authoritative, clean', colors: 'corporate blues, clean whites, accent colors' },
      'Biography': { mood: 'dignified, personal, historical', colors: 'warm sepia, classic black and white, rich browns' },
      'Self-Help': { mood: 'inspiring, positive, energetic', colors: 'bright yellows, vibrant oranges, sky blues' },
      'Young Adult': { mood: 'dynamic, bold, contemporary', colors: 'vibrant and bold color combinations' }
    };

    const genreStyle = genreStyles[genre] || genreStyles['Literary Fiction'];
    
    // Clean the description for back cover blurb
    const cleanDescription = description.substring(0, 500).replace(/["\n\r]/g, ' ').trim();
    
    // Extract options with defaults
    const showBarcode = options?.showBarcode !== false;
    const barcodeType = options?.barcodeType || 'isbn';
    const layout = options?.layout || 'classic';
    const showWebsite = options?.showWebsite !== false;
    const showTagline = options?.showTagline !== false;
    const showPowerWriteBranding = options?.showPowerWriteBranding !== false;
    const frontStyle = options?.frontCoverStyle?.style || style;
    const frontColorScheme = options?.frontCoverStyle?.colorScheme;
    
    // Layout-specific instructions
    const layoutInstructions: Record<string, string> = {
      'classic': 'Traditional centered layout with balanced composition',
      'modern': 'Contemporary asymmetrical design with creative text placement',
      'minimal': 'Clean, sparse design with maximum white space',
      'editorial': 'Magazine-style layout with distinct sections',
    };

    // Build author credit section based on branding
    const authorSection = showPowerWriteBranding 
      ? `2. AUTHOR CREDIT (MIDDLE):
   - Display "Written by ${author || 'PowerWrite'}" 
   - Elegant, professional styling
   - Can include a decorative separator line above`
      : author 
        ? `2. AUTHOR CREDIT (MIDDLE):
   - Display "Written by ${author}" 
   - Elegant, professional styling
   - Can include a decorative separator line above`
        : ''; // No author section if no branding and no author

    // Build publisher section
    let publisherSection = `3. PUBLISHER INFO (BOTTOM SECTION):
   - "DLM Media" prominently displayed`;
    
    if (showWebsite) {
      publisherSection += `
   - Include "www.dlmworld.com" below it`;
    }
    
    if (showTagline && showPowerWriteBranding) {
      publisherSection += `
   - Small "Created with PowerWrite" tagline`;
    }

    // Build barcode section
    let barcodeSection = '';
    if (showBarcode && barcodeType !== 'none') {
      if (barcodeType === 'isbn') {
        barcodeSection = `4. BARCODE AREA (BOTTOM RIGHT):
   - Leave a white rectangular space (approximately 2" x 1.5") 
   - Position in the bottom right corner
   - This is where the ISBN barcode would go
   - Can show placeholder barcode lines or just white space`;
      } else if (barcodeType === 'qr') {
        barcodeSection = `4. QR CODE AREA (BOTTOM RIGHT):
   - Leave a white square space (approximately 1.5" x 1.5") 
   - Position in the bottom right corner
   - This is where a QR code would go
   - Can show a placeholder QR code pattern or just white space`;
      }
    }
    
    const prompt = `Create a professional BACK COVER design for a published book.

=== BOOK INFORMATION ===
Title: "${title}"
${author ? `Author: ${author}` : ''}
Publisher: DLM Media
Genre: ${genre}

=== BACK COVER LAYOUT (${layout.toUpperCase()}) ===
${layoutInstructions[layout]}
Design a complete back cover with these elements in professional publishing layout:

1. BOOK SYNOPSIS/BLURB (TOP SECTION - 60% of space):
   - Display this synopsis text in an elegant, readable font:
   "${cleanDescription}"
   - Use professional book description typography
   - Left-aligned or justified text
   - Comfortable line spacing for readability
   - This is the main content area of the back cover

${authorSection}

${publisherSection}

${barcodeSection}

=== DESIGN SPECIFICATIONS ===
- Aspect Ratio: Portrait orientation (2:3 ratio, same as front cover)
- Style: ${frontStyle} - MUST match the front cover aesthetic
- Color Palette: ${frontColorScheme || genreStyle.colors} - consistent with front cover
- Background: Subtle, complementary design that doesn't compete with text
- Overall mood: ${genreStyle.mood}

=== TYPOGRAPHY GUIDELINES ===
- Synopsis text: Readable serif or sans-serif, 10-12pt equivalent
- All text PERFECTLY SPELLED and CLEARLY READABLE
- High contrast for readability
- Professional book back cover typography standards

=== QUALITY STANDARDS ===
- Must look like the back of the same book as the front cover
- Professional publishing quality
- Clean, organized layout
- The design should complement but not copy the front cover
- Standard back cover conventions followed

Generate a complete, professional back cover design.`;

    return prompt;
  }

  /**
   * Generate back cover image
   */
  async generateBackCoverImage(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string = 'vivid',
    imageModelId?: string,
    options?: {
      showBarcode?: boolean;
      barcodeType?: 'isbn' | 'qr' | 'none';
      layout?: 'classic' | 'modern' | 'minimal' | 'editorial';
      showWebsite?: boolean;
      showTagline?: boolean;
      showPowerWriteBranding?: boolean;
      frontCoverStyle?: {
        colorScheme?: string;
        style?: string;
      };
    }
  ): Promise<string> {
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is required for image storage. Set it in Vercel project settings.');
      }

      const modelId = imageModelId || DEFAULT_IMAGE_MODEL;
      const imageModel = getImageModelById(modelId);
      
      // Determine which provider to use
      const provider: ImageProvider = imageModel?.provider || 'nanobanana-pro';
      
      console.log(`Generating BACK cover with ${imageModel?.name || modelId}...`);
      console.log('Back cover options:', options);

      let imageUrl: string;

      if (provider === 'dalle') {
        // Use DALL-E 3 via OpenAI with back cover prompt
        imageUrl = await this.generateBackCoverWithDallE(title, author, genre, description, style, options);
      } else {
        // Use Nano Banana / Nano Banana Pro via OpenRouter
        imageUrl = await this.generateBackCoverWithNanoBanana(title, author, genre, description, style, modelId, options);
      }

      // Upload to blob storage
      console.log('Back cover image generated, downloading and uploading to blob storage...');

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download back cover image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      const { put } = await import('@vercel/blob');
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 50);
      const filename = `covers/${sanitizedTitle}-back-${Date.now()}.png`;
      
      console.log(`Uploading back cover image to blob storage: ${filename}`);
      
      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log('Back cover uploaded successfully to blob storage:', blob.url);
      return blob.url;
    } catch (error) {
      console.error('Error generating back cover:', error);
      throw new Error(`Failed to generate back cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateBackCoverWithDallE(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string,
    options?: {
      showBarcode?: boolean;
      barcodeType?: 'isbn' | 'qr' | 'none';
      layout?: 'classic' | 'modern' | 'minimal' | 'editorial';
      showWebsite?: boolean;
      showTagline?: boolean;
      showPowerWriteBranding?: boolean;
      frontCoverStyle?: {
        colorScheme?: string;
        style?: string;
      };
    }
  ): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for DALL-E image generation');
    }

    const prompt = this.buildBackCoverPrompt(title, author, genre, description, style, options);
    
    console.log('Using DALL-E 3 for back cover...');
    
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1792',
          quality: 'hd',
          style: style,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DALL-E 3 back cover generation error:', errorText);
      throw new Error(`DALL-E back cover generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No back cover images generated by DALL-E');
    }

    return data.data[0].url;
  }

  private async generateBackCoverWithNanoBanana(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string,
    modelId: string,
    options?: {
      showBarcode?: boolean;
      barcodeType?: 'isbn' | 'qr' | 'none';
      layout?: 'classic' | 'modern' | 'minimal' | 'editorial';
      showWebsite?: boolean;
      showTagline?: boolean;
      showPowerWriteBranding?: boolean;
      frontCoverStyle?: {
        colorScheme?: string;
        style?: string;
      };
    }
  ): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required for Nano Banana Pro image generation.');
    }

    const prompt = this.buildBackCoverPrompt(title, author, genre, description, style, options);

    console.log(`Using ${modelId} via OpenRouter for back cover generation...`);

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'PowerWrite Book Studio',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          modalities: ['image', 'text'],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nano Banana back cover generation error:', errorText);
      
      if (response.status === 400 || response.status === 422 || response.status === 404) {
        console.log('OpenRouter back cover generation not available, falling back to DALL-E...');
        if (OPENAI_API_KEY) {
          return await this.generateBackCoverWithDallE(title, author, genre, description, style);
        }
        throw new Error('Back cover generation failed and no fallback available.');
      }
      
      throw new Error(`Nano Banana back cover generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse the response - same format handling as front cover
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      const message = choice.message;
      
      if (message?.images && Array.isArray(message.images)) {
        for (const image of message.images) {
          if (image.image_url?.url) return image.image_url.url;
          if (image.url) return image.url;
          if (image.b64_json) return `data:image/png;base64,${image.b64_json}`;
        }
      }
      
      if (message?.content) {
        const content = message.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === 'image_url' && part.image_url?.url) return part.image_url.url;
            if (part.type === 'image' && part.image_url?.url) return part.image_url.url;
            if (part.type === 'image' && part.data) return `data:image/png;base64,${part.data}`;
            if (part.type === 'image_url' && part.image_url?.url?.startsWith('data:')) return part.image_url.url;
          }
        }
        if (typeof content === 'string') {
          if (content.startsWith('http')) return content;
          if (content.startsWith('data:image')) return content;
        }
      }
      
      if (message?.image_url?.url) return message.image_url.url;
      if (message?.image_url && typeof message.image_url === 'string') return message.image_url;
    }

    if (data.data && data.data[0]?.url) return data.data[0].url;

    // Fall back to DALL-E if available
    if (OPENAI_API_KEY) {
      console.log('Falling back to DALL-E for back cover...');
      return await this.generateBackCoverWithDallE(title, author, genre, description, style);
    }
    
    throw new Error('Could not extract back cover image URL from OpenRouter response.');
  }

  async generateBookOutline(config: BookGenerationConfig): Promise<BookOutline> {
    try {
      const modelId = config.outlineModel || this.outlineModel;
      console.log(`Starting outline generation with model: ${modelId}`);
      console.log('Config:', {
        title: config.title,
        genre: config.genre,
        chapters: config.chapters,
        length: config.length
      });

      const numChapters = config.chapters || 10;
      const lengthMapping: Record<string, number> = {
        'micro': 10000,
        'novella': 20000,
        'short-novel': 30000,
        'short': 50000,
        'medium': 80000,
        'long': 120000,
        'epic': 150000,
      };
      
      const targetWords = lengthMapping[config.length] || 80000;
      const wordsPerChapter = Math.floor(targetWords / numChapters);

      const sourceContext = config.sourceBook 
        ? `\n\nSource Book for Inspiration: "${config.sourceBook.title}" by ${config.sourceBook.author}\nDescription: ${config.sourceBook.description}\n\nNote: Create something entirely original inspired by this work, not a copy.`
        : '';

      const isNonFiction = config.isNonFiction || false;

      const hasCustomCharacters = config.customCharacters && config.customCharacters.length > 0;
      const characterContext = hasCustomCharacters
        ? `\n\nIMPORTANT - Use these EXACT characters in the outline:\n${config.customCharacters!.map(c => 
            `- ${c.name} (${c.role}): ${c.description}${c.traits ? ` | Key traits: ${c.traits}` : ''}`
          ).join('\n')}\n\nDo NOT create new main characters. Use the characters listed above.`
        : '';

      const hasCustomTitle = config.title && config.title.trim().length > 0;
      const titleInstruction = hasCustomTitle
        ? `\n\nIMPORTANT - Use this EXACT title: "${config.title}"\nDo NOT create a different title.`
        : '';

      const prompt = isNonFiction
        ? `Create a ${config.genre} NON-FICTION book outline with ${numChapters} chapters.

Author: ${config.author}
Genre: ${config.genre}
Tone: ${config.tone}
Audience: ${config.audience}
Description: ${config.description}
${sourceContext}
${titleInstruction}
${config.customInstructions ? `\nInstructions: ${config.customInstructions}` : ''}

Generate a compelling non-fiction book outline with:
${hasCustomTitle ? `- Use the exact title provided above: "${config.title}"` : '- An engaging, informative title'}
- ${numChapters} well-structured chapters (approximately ${wordsPerChapter} words each)
- Brief chapter summaries (2-3 sentences each) focusing on key concepts and information
- 3-5 key themes or main topics
- NO characters (this is non-fiction)

Return ONLY valid JSON in this format:
{
  "title": ${hasCustomTitle ? `"${config.title}"` : '"book title"'},
  "author": "${config.author}",
  "genre": "${config.genre}",
  "description": "compelling book description",
  "chapters": [
    {
      "number": 1,
      "title": "chapter title",
      "summary": "brief chapter summary (2-3 sentences)",
      "wordCount": ${wordsPerChapter}
    }
  ],
  "themes": ["theme1", "theme2", "theme3"]
}`
        : `Create a ${config.genre} FICTION book outline with ${numChapters} chapters.

Author: ${config.author}
Genre: ${config.genre}
Tone: ${config.tone}
Audience: ${config.audience}
Description: ${config.description}
${sourceContext}
${titleInstruction}
${characterContext}
${config.customInstructions ? `\nInstructions: ${config.customInstructions}` : ''}

Generate a compelling book outline with:
${hasCustomTitle ? `- Use the exact title provided above: "${config.title}"` : '- An engaging title'}
- ${numChapters} well-structured chapters (approximately ${wordsPerChapter} words each)
- Brief chapter summaries (2-3 sentences each)
- 3-5 key themes
${hasCustomCharacters ? '- Use the EXACT characters provided above (do not create new main characters)' : '- Main characters (name, role, brief description)'}

Return ONLY valid JSON in this format:
{
  "title": ${hasCustomTitle ? `"${config.title}"` : '"book title"'},
  "author": "${config.author}",
  "genre": "${config.genre}",
  "description": "compelling book description",
  "chapters": [
    {
      "number": 1,
      "title": "chapter title",
      "summary": "brief chapter summary (2-3 sentences)",
      "wordCount": ${wordsPerChapter}
    }
  ],
  "themes": ["theme1", "theme2", "theme3"],
  "characters": [
    {
      "name": "character name",
      "role": "protagonist/antagonist/supporting",
      "description": "brief description (1-2 sentences)"
    }
  ]
}`;

      console.log(`Calling ${modelId} for outline generation...`);
      
      const systemPrompt = isNonFiction
        ? 'You are an expert non-fiction author and educator. Generate informative, well-researched book outlines as valid JSON only. Focus on educational content, clear structure, and factual information.'
        : 'You are an expert fiction author. Generate compelling story outlines as valid JSON only. Focus on character development, plot structure, and engaging narratives.';

      const result = await generateText({
        model: getModel(modelId),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      });
      
      console.log('AI response received, parsing JSON...');

      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const outline = JSON.parse(jsonText);
      
      if (hasCustomTitle) {
        outline.title = config.title;
        console.log('Custom title applied to outline:', outline.title);
      }
      
      if (hasCustomCharacters && !isNonFiction) {
        outline.characters = config.customCharacters!.map(c => ({
          name: c.name,
          role: c.role,
          description: c.description + (c.traits ? ` | Key traits: ${c.traits}` : '')
        }));
        console.log('Custom characters applied to outline:', outline.characters.length);
      }
      
      console.log('Generated outline successfully:', outline.title);
      return outline;
    } catch (error) {
      console.error('Error generating book outline:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid or missing API key. Please check your environment variables.');
        }
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your usage limits.');
        }
        if (error.message.includes('JSON')) {
          throw new Error('Failed to parse AI response as JSON. Please try again.');
        }
      }
      
      throw new Error(`Failed to generate book outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChapter(
    outline: BookOutline,
    chapterNumber: number,
    previousChapters?: string,
    modelId?: string,
    bibliographyConfig?: BibliographyGenerationConfig
  ): Promise<{ title: string; content: string; wordCount: number }> {
    try {
      const model = modelId || this.chapterModel;
      const chapter = outline.chapters.find(ch => ch.number === chapterNumber);
      if (!chapter) {
        throw new Error(`Chapter ${chapterNumber} not found in outline`);
      }

      const contextPrompt = previousChapters
        ? `\n\nPrevious chapters summary:\n${previousChapters}\n\nMaintain continuity from previous chapters.`
        : '';

      const isNonFiction = !outline.characters || outline.characters.length === 0;

      // Build bibliography citation instructions if enabled
      const citationInstructions = bibliographyConfig?.enabled && isNonFiction
        ? this.buildCitationInstructions(bibliographyConfig.citationStyle)
        : '';

      const prompt = isNonFiction
        ? `Write Chapter ${chapter.number} of the NON-FICTION book "${outline.title}" by ${outline.author}.

Chapter Details:
- Title: ${chapter.title}
- Summary: ${chapter.summary}
- Target Word Count: ${chapter.wordCount} words
- Genre: ${outline.genre}

Themes: ${outline.themes?.join(', ') || 'General themes'}
${contextPrompt}
${citationInstructions}

Write a complete, informative chapter targeting ${chapter.wordCount} words (minimum 1500 words). 
- Create well-developed paragraphs (6-10 sentences each)
- Include clear explanations, examples, and facts
- Use double line breaks between paragraphs
- NO markdown formatting
- Write in plain text
- Focus on educational and informative content${bibliographyConfig?.enabled ? '\n- Include in-text citations using the specified format' : ''}
- End with [END CHAPTER] on a new line`
        : `Write Chapter ${chapter.number} of "${outline.title}" by ${outline.author}.

Chapter Details:
- Title: ${chapter.title}
- Summary: ${chapter.summary}
- Target Word Count: ${chapter.wordCount} words
- Genre: ${outline.genre}

Characters:
${outline.characters?.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n') || 'None specified'}

Themes: ${outline.themes?.join(', ') || 'General themes'}
${contextPrompt}

Write a complete, engaging chapter targeting ${chapter.wordCount} words (minimum 1500 words). 
- Create well-developed paragraphs (6-10 sentences each)
- Include vivid descriptions and engaging dialogue
- Develop the characters listed above with depth and authenticity
- Use double line breaks between paragraphs
- NO markdown formatting
- Write in plain text
- End with [END CHAPTER] on a new line`;

      const systemPrompt = isNonFiction
        ? `You are a master non-fiction writer specializing in ${outline.genre}. Write clear, informative chapters with well-researched content, practical examples, and engaging explanations.${bibliographyConfig?.enabled ? ' Include properly formatted in-text citations to support your points.' : ''}`
        : `You are a master novelist writing in the ${outline.genre} genre. Write compelling chapters with rich detail, character development, and engaging prose.`;

      console.log(`Generating chapter ${chapterNumber} with model: ${model}${bibliographyConfig?.enabled ? ' (with bibliography)' : ''}`);

      const result = await generateText({
        model: getModel(model),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
      });

      const content = result.text.replace(/\n?\[END CHAPTER\]\s*$/, '').trim();
      const wordCount = content.split(/\s+/).length;

      console.log(`Generated chapter ${chapterNumber}: ${wordCount} words`);

      return {
        title: chapter.title,
        content,
        wordCount,
      };
    } catch (error) {
      console.error('Error generating chapter:', error);
      throw new Error(`Failed to generate chapter ${chapterNumber}`);
    }
  }

  /**
   * Build citation instructions for the specified style
   */
  private buildCitationInstructions(style: string): string {
    const styleGuides: Record<string, string> = {
      'APA': `
CITATION REQUIREMENTS (APA 7th Edition):
- Include in-text citations for all factual claims, statistics, and expert opinions
- Format: (Author, Year) or (Author, Year, p. X) for direct quotes
- For multiple authors: (Author1 & Author2, Year) or (Author1 et al., Year) for 3+ authors
- When author is mentioned in text: Author (Year) states...
- Example: "Research shows that..." (Smith, 2023) or Smith (2023) found that...
- Use credible, realistic sources (academic journals, reputable publishers, established organizations)`,
      'MLA': `
CITATION REQUIREMENTS (MLA 9th Edition):
- Include in-text citations for all factual claims and quoted material
- Format: (Author Page) - no comma between author and page
- For multiple authors: (Author1 and Author2 Page) or (Author1 et al. Page) for 3+ authors
- Example: "Quote here" (Johnson 45) or According to Johnson, "..." (45)
- Use credible, realistic sources`,
      'Chicago': `
CITATION REQUIREMENTS (Chicago Manual of Style):
- Include footnote-style citations for important claims
- Format: (Author Year, Page) for author-date style
- Or use superscript numbers¹ referencing endnotes
- Example: (Williams 2022, 78) or Williams argues that...¹
- Use credible, realistic sources`,
      'Harvard': `
CITATION REQUIREMENTS (Harvard Style):
- Include in-text citations for all factual claims
- Format: (Author Year) or (Author Year, p. X) for specific pages
- Example: (Brown 2023) or Brown (2023) suggests that...
- Use credible, realistic sources`,
      'IEEE': `
CITATION REQUIREMENTS (IEEE Style):
- Include numbered citations in square brackets
- Format: [1], [2], [3-5] for ranges
- Example: According to recent studies [1], [2]...
- Use credible technical and academic sources`,
      'Vancouver': `
CITATION REQUIREMENTS (Vancouver Style):
- Include numbered citations in superscript or parentheses
- Format: text¹ or text (1)
- Example: Studies have shown¹⁻³ or Studies have shown (1-3)
- Use credible medical and scientific sources`,
      'AMA': `
CITATION REQUIREMENTS (AMA Style):
- Include numbered superscript citations
- Format: text¹ for single, text¹⁻³ for ranges
- Example: Recent findings¹ suggest...
- Use credible medical sources`
    };

    return styleGuides[style] || styleGuides['APA'];
  }

  /**
   * Generate bibliography references for a completed book
   * Analyzes the book content and generates appropriate academic references
   */
  async generateBibliographyReferences(
    outline: BookOutline,
    chapterContents: string[],
    bibliographyConfig: BibliographyGenerationConfig,
    modelId?: string
  ): Promise<GeneratedReference[]> {
    try {
      const model = modelId || this.outlineModel;
      const isNonFiction = !outline.characters || outline.characters.length === 0;
      
      if (!isNonFiction) {
        console.log('Bibliography generation skipped for fiction book');
        return [];
      }

      // Combine chapter summaries for context
      const bookContext = chapterContents.map((content, i) => 
        `Chapter ${i + 1}: ${content.substring(0, 500)}...`
      ).join('\n\n');

      const prompt = `Generate a realistic bibliography for the non-fiction book "${outline.title}" by ${outline.author}.

Book Topic: ${outline.description}
Genre: ${outline.genre}
Themes: ${outline.themes?.join(', ') || 'General themes'}

Sample Content from Chapters:
${bookContext}

Generate 8-15 realistic, credible references that would support this book's content.
Include a mix of:
- Books (3-5 references)
- Journal articles (3-5 references)
- Websites/online sources (2-3 references)
- Reports or conference papers (1-2 references)

IMPORTANT:
- Create realistic author names (mix of common and uncommon)
- Use plausible publication years (2010-2024 for most, some older classics)
- Generate believable titles that match the book's topics
- Include realistic publishers (academic presses, major publishers)
- For journals, use realistic journal names relevant to the field

Return ONLY valid JSON array in this exact format:
[
  {
    "type": "book",
    "title": "Book Title Here",
    "authors": [{"firstName": "John", "lastName": "Smith"}],
    "year": 2020,
    "publisher": "Publisher Name",
    "isbn": "978-0-000-00000-0"
  },
  {
    "type": "journal",
    "title": "Article Title",
    "authors": [{"firstName": "Jane", "lastName": "Doe"}, {"firstName": "Robert", "lastName": "Johnson"}],
    "year": 2022,
    "journalTitle": "Journal Name",
    "volume": "45",
    "issue": "3",
    "pages": "123-145",
    "doi": "10.1000/example.2022.001"
  },
  {
    "type": "website",
    "title": "Web Article Title",
    "authors": [{"lastName": "Organization Name"}],
    "year": 2023,
    "url": "https://example.org/article",
    "accessDate": "${new Date().toISOString().split('T')[0]}"
  }
]`;

      console.log('Generating bibliography references...');

      const result = await generateText({
        model: getModel(model),
        messages: [
          { 
            role: 'system', 
            content: `You are an expert academic researcher and librarian. Generate realistic, credible bibliography references that would support non-fiction books. Always return valid JSON array format.` 
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      // Parse the JSON response
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const references = JSON.parse(jsonText) as GeneratedReference[];
      
      // Add IDs to each reference
      const referencesWithIds = references.map((ref, index) => ({
        ...ref,
        id: `ref_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`
      }));

      console.log(`Generated ${referencesWithIds.length} bibliography references`);
      return referencesWithIds;
    } catch (error) {
      console.error('Error generating bibliography references:', error);
      // Return empty array on error - bibliography is not critical
      return [];
    }
  }

  async *generateChapterStream(
    outline: BookOutline,
    chapterNumber: number,
    previousChapters?: string,
    modelId?: string
  ) {
    const model = modelId || this.chapterModel;
    const chapter = outline.chapters.find(ch => ch.number === chapterNumber);
    if (!chapter) {
      throw new Error(`Chapter ${chapterNumber} not found in outline`);
    }

    const contextPrompt = previousChapters
      ? `\n\nPrevious chapters summary:\n${previousChapters}\n\nMaintain continuity.`
      : '';

    const charactersInfo = outline.characters && outline.characters.length > 0
      ? `\n\nCharacters:\n${outline.characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')}\n`
      : '';

    const prompt = `Write Chapter ${chapter.number} of "${outline.title}".

Chapter: ${chapter.title}
Summary: ${chapter.summary}
Target: ${chapter.wordCount} words
${charactersInfo}
${contextPrompt}

Write a complete chapter with well-developed paragraphs. Develop the characters with depth and authenticity. Use double line breaks between paragraphs. NO markdown.`;

    const result = streamText({
      model: getModel(model),
      messages: [
        {
          role: 'system',
          content: `You are a master novelist. Write compelling chapters with rich detail and character development.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  async generateCoverImage(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string = 'vivid',
    imageModelId?: string,
    customEnhancedPrompt?: string // New parameter for custom prompts from CoverService
  ): Promise<string> {
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is required for image storage. Set it in Vercel project settings.');
      }

      const modelId = imageModelId || DEFAULT_IMAGE_MODEL;
      const imageModel = getImageModelById(modelId);
      
      // Determine which provider to use
      const provider: ImageProvider = imageModel?.provider || 'nanobanana-pro';
      
      console.log(`Generating cover with ${imageModel?.name || modelId}...`);
      if (customEnhancedPrompt) {
        console.log('Using custom enhanced prompt for cover generation');
      }

      let imageUrl: string;

      if (provider === 'dalle') {
        // Use DALL-E 3 via OpenAI
        imageUrl = await this.generateWithDallE(title, author, genre, description, style, customEnhancedPrompt);
      } else {
        // Use Nano Banana / Nano Banana Pro via OpenRouter (Gemini image models)
        imageUrl = await this.generateWithNanoBanana(title, author, genre, description, style, modelId, customEnhancedPrompt);
      }

      // Upload to blob storage
      console.log('Image generated, downloading and uploading to blob storage...');

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      const { put } = await import('@vercel/blob');
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 50);
      const filename = `covers/${sanitizedTitle}-${Date.now()}.png`;
      
      console.log(`Uploading cover image to blob storage: ${filename}`);
      
      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log('Cover uploaded successfully to blob storage:', blob.url);
      return blob.url;
    } catch (error) {
      console.error('Error generating cover:', error);
      throw new Error(`Failed to generate cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithDallE(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string,
    customPrompt?: string
  ): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for DALL-E image generation');
    }

    // Use custom prompt if provided, otherwise build the standard one
    const prompt = customPrompt || this.buildProfessionalCoverPrompt(title, author, genre, description, style);
    
    console.log('Using DALL-E 3...');
    
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1792',
          quality: 'hd',
          style: style,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DALL-E 3 image generation error:', errorText);
      throw new Error(`DALL-E image generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No images generated by DALL-E');
    }

    return data.data[0].url;
  }

  private async generateWithNanoBanana(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string,
    modelId: string,
    customPrompt?: string
  ): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required for Nano Banana Pro image generation. Set it in your environment variables.');
    }

    // Use custom prompt if provided, otherwise build the standard one
    const prompt = customPrompt || this.buildProfessionalCoverPrompt(title, author, genre, description, style);

    // Use the model ID directly - it should be one of:
    // - google/gemini-3-pro-image-preview (Nano Banana Pro)
    // - google/gemini-2.5-flash-image (Nano Banana)
    console.log(`Using ${modelId} via OpenRouter for image generation...`);

    // Use OpenRouter's chat completions API with image generation capability
    // Models with output_modalities: ["image", "text"] support this
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'PowerWrite Book Studio',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          // Request image output - required for image generation models
          modalities: ['image', 'text'],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nano Banana image generation error:', errorText);
      
      // If this model doesn't support image generation, fall back to DALL-E
      if (response.status === 400 || response.status === 422 || response.status === 404) {
        console.log('OpenRouter image generation not available, falling back to DALL-E...');
        if (OPENAI_API_KEY) {
          return await this.generateWithDallE(title, author, genre, description, style);
        }
        throw new Error('Image generation failed and no fallback available. Please set OPENAI_API_KEY for DALL-E.');
      }
      
      throw new Error(`Nano Banana image generation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response structure:', Object.keys(data));
    
    // Parse the response - OpenRouter returns images in various formats
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      const message = choice.message;
      
      console.log('Message structure:', message ? Object.keys(message) : 'null');
      
      // Check for images array (OpenRouter multimodal format)
      if (message?.images && Array.isArray(message.images)) {
        for (const image of message.images) {
          if (image.image_url?.url) {
            console.log('Found image in images array (image_url.url)');
            return image.image_url.url;
          }
          if (image.url) {
            console.log('Found image in images array (url)');
            return image.url;
          }
          if (image.b64_json) {
            console.log('Found base64 image in images array');
            return `data:image/png;base64,${image.b64_json}`;
          }
        }
      }
      
      // Check content array (multimodal response format)
      if (message?.content) {
        const content = message.content;
        console.log('Content type:', typeof content, Array.isArray(content) ? `(array of ${content.length})` : '');
        
        if (Array.isArray(content)) {
          for (const part of content) {
            console.log('Content part type:', part.type);
            
            // Standard image_url format
            if (part.type === 'image_url' && part.image_url?.url) {
              console.log('Found image_url in content array');
              return part.image_url.url;
            }
            
            // Image with nested image_url
            if (part.type === 'image' && part.image_url?.url) {
              console.log('Found image with image_url in content array');
              return part.image_url.url;
            }
            
            // Base64 image data
            if (part.type === 'image' && part.data) {
              console.log('Found base64 image in content array');
              return `data:image/png;base64,${part.data}`;
            }
            
            // Inline base64 in image_url
            if (part.type === 'image_url' && part.image_url?.url?.startsWith('data:')) {
              console.log('Found inline base64 in image_url');
              return part.image_url.url;
            }
          }
        }
        
        // Check if content itself is a URL string
        if (typeof content === 'string') {
          if (content.startsWith('http')) {
            console.log('Content is a URL string');
            return content;
          }
          if (content.startsWith('data:image')) {
            console.log('Content is a data URL');
            return content;
          }
        }
      }
      
      // Check for direct image_url on message
      if (message?.image_url?.url) {
        console.log('Found image_url directly on message');
        return message.image_url.url;
      }
      if (message?.image_url && typeof message.image_url === 'string') {
        console.log('Found image_url string on message');
        return message.image_url;
      }
    }

    // Check top-level data array (DALL-E-like response)
    if (data.data && data.data[0]?.url) {
      console.log('Found image in data array');
      return data.data[0].url;
    }

    console.error('Could not extract image from OpenRouter response:', JSON.stringify(data, null, 2));
    
    // Fall back to DALL-E if available
    if (OPENAI_API_KEY) {
      console.log('Falling back to DALL-E due to unexpected response format...');
      return await this.generateWithDallE(title, author, genre, description, style);
    }
    
    throw new Error('Could not extract image URL from OpenRouter response. Full response logged above.');
  }

  /**
   * Generate multiple chapters in parallel for faster book generation
   * All chapters in the batch share the same previous context
   * This trades some inter-chapter coherence for significant speed improvement (~4x faster)
   */
  async generateChapterBatch(
    outline: BookOutline,
    chapterNumbers: number[],
    previousChaptersContext: string,
    modelId?: string,
    bibliographyConfig?: BibliographyGenerationConfig,
    onChapterComplete?: (chapterNum: number, chapter: { title: string; content: string; wordCount: number }) => void
  ): Promise<Array<{ title: string; content: string; wordCount: number; chapterNumber: number }>> {
    console.log(`[Parallel] Generating chapters ${chapterNumbers.join(', ')} in parallel...`);
    const startTime = Date.now();

    // Generate all chapters in the batch simultaneously
    const promises = chapterNumbers.map(async (num) => {
      try {
        const chapter = await this.generateChapter(
          outline,
          num,
          previousChaptersContext,
          modelId,
          bibliographyConfig
        );
        
        console.log(`[Parallel] Chapter ${num} completed: ${chapter.wordCount} words`);
        
        if (onChapterComplete) {
          onChapterComplete(num, chapter);
        }

        return {
          ...chapter,
          chapterNumber: num,
        };
      } catch (error) {
        console.error(`[Parallel] Error generating chapter ${num}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(promises);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Parallel] Batch of ${chapterNumbers.length} chapters completed in ${elapsed}s`);

    // Sort by chapter number to ensure correct order
    return results.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  /**
   * Build context string from completed chapters for continuity
   */
  buildChapterContext(
    chapters: Array<{ title: string; content: string; chapterNumber?: number }>,
    maxRecentChapters: number = 3
  ): string {
    if (chapters.length === 0) return '';

    // Get the most recent chapters for detailed context
    const recentChapters = chapters.slice(-maxRecentChapters);
    let context = recentChapters
      .map((ch, idx) => {
        const chapterNum = ch.chapterNumber || (chapters.length - recentChapters.length + idx + 1);
        return `Chapter ${chapterNum} - ${ch.title}:\n${ch.content.substring(0, 1500)}...`;
      })
      .join('\n\n---\n\n');

    // Add brief summary of older chapters for overall context
    if (chapters.length > maxRecentChapters) {
      const olderChaptersSummary = chapters.slice(0, -maxRecentChapters)
        .map((ch, idx) => `Ch ${ch.chapterNumber || idx + 1}: ${ch.title}`)
        .join(', ');
      context = `Story so far: ${olderChaptersSummary}\n\n=== Recent Chapters (maintain continuity) ===\n\n${context}`;
    }

    return context;
  }

  /**
   * Generate full book with parallel batch processing
   * Processes chapters in batches for speed while maintaining story continuity between batches
   */
  async generateFullBookParallel(
    outline: BookOutline,
    onProgress?: (completed: number, total: number, currentBatch?: number[]) => void,
    modelId?: string,
    bibliographyConfig?: BibliographyGenerationConfig,
    batchSize: number = 4
  ): Promise<{ chapters: Array<{ title: string; content: string; wordCount: number }>; references: GeneratedReference[] }> {
    const totalChapters = outline.chapters.length;
    const allChapters: Array<{ title: string; content: string; wordCount: number; chapterNumber: number }> = [];
    
    console.log(`[Parallel Book] Starting parallel generation: ${totalChapters} chapters, batch size ${batchSize}`);
    const startTime = Date.now();

    // Process chapters in batches
    for (let batchStart = 0; batchStart < totalChapters; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalChapters);
      const batchChapterNumbers: number[] = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        batchChapterNumbers.push(i + 1); // Chapter numbers are 1-indexed
      }

      console.log(`[Parallel Book] Processing batch: chapters ${batchChapterNumbers.join(', ')}`);

      // Build context from all previously completed chapters
      const previousContext = this.buildChapterContext(allChapters);

      // Generate this batch in parallel
      const batchChapters = await this.generateChapterBatch(
        outline,
        batchChapterNumbers,
        previousContext,
        modelId,
        bibliographyConfig,
        (chapterNum, chapter) => {
          // Report progress as each chapter completes
          if (onProgress) {
            onProgress(allChapters.length + 1, totalChapters, batchChapterNumbers);
          }
        }
      );

      // Add completed chapters
      allChapters.push(...batchChapters);

      // Report batch completion
      if (onProgress) {
        onProgress(allChapters.length, totalChapters);
      }

      console.log(`[Parallel Book] Batch complete. Total progress: ${allChapters.length}/${totalChapters}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Parallel Book] All chapters generated in ${elapsed}s`);

    // Generate bibliography references if enabled
    let references: GeneratedReference[] = [];
    if (bibliographyConfig?.enabled) {
      const chapterContents = allChapters.map(ch => ch.content);
      references = await this.generateBibliographyReferences(
        outline,
        chapterContents,
        bibliographyConfig,
        modelId
      );
    }

    // Return chapters without the chapterNumber field for compatibility
    return {
      chapters: allChapters.map(({ title, content, wordCount }) => ({ title, content, wordCount })),
      references,
    };
  }

  async generateFullBook(
    outline: BookOutline,
    onProgress?: (chapter: number, total: number) => void,
    modelId?: string,
    bibliographyConfig?: BibliographyGenerationConfig
  ): Promise<{ chapters: Array<{ title: string; content: string; wordCount: number }>; references: GeneratedReference[] }> {
    const chapters = [];
    let previousChapters = '';

    for (let i = 0; i < outline.chapters.length; i++) {
      const chapterNum = i + 1;
      console.log(`Generating chapter ${chapterNum}/${outline.chapters.length}${bibliographyConfig?.enabled ? ' (with citations)' : ''}`);

      if (onProgress) {
        onProgress(chapterNum, outline.chapters.length);
      }

      const chapter = await this.generateChapter(outline, chapterNum, previousChapters, modelId, bibliographyConfig);
      chapters.push(chapter);

      // Include more context for better story coherence
      const recentChapters = chapters.slice(-3);
      previousChapters = recentChapters
        .map((ch, idx) => `Chapter ${chapters.length - recentChapters.length + idx + 1} - ${ch.title}:\n${ch.content.substring(0, 1500)}...`)
        .join('\n\n---\n\n');
      
      // Also include brief summary of older chapters for overall context
      if (chapters.length > 3) {
        const olderChaptersSummary = chapters.slice(0, -3)
          .map((ch, idx) => `Ch ${idx + 1}: ${ch.title}`)
          .join(', ');
        previousChapters = `Story so far: ${olderChaptersSummary}\n\n=== Recent Chapters (maintain continuity) ===\n\n${previousChapters}`;
      }
    }

    // Generate bibliography references if enabled
    let references: GeneratedReference[] = [];
    if (bibliographyConfig?.enabled) {
      const chapterContents = chapters.map(ch => ch.content);
      references = await this.generateBibliographyReferences(
        outline,
        chapterContents,
        bibliographyConfig,
        modelId
      );
    }

    return { chapters, references };
  }
}

export const aiService = new AIService();
