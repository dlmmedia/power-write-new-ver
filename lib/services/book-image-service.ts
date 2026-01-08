/**
 * Book Image Service
 * 
 * Handles generation, analysis, and management of in-book images.
 * Supports multiple image types (illustrations, diagrams, infographics, etc.)
 * with smart prompting based on book genre and context.
 */

import {
  BookImageType,
  ImageStyle,
  BookImageConfig,
  GenerateBookImageRequest,
  GenerateBookImageResponse,
  ImageSuggestion,
  ChapterImageAnalysis,
  GENRE_IMAGE_STYLES,
  IMAGE_TYPE_INFO,
  ASPECT_RATIOS,
  BookImageMetadata,
} from '../types/book-images';
import { DEFAULT_IMAGE_MODEL, getImageModelById } from '../types/models';

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Style guidelines for different image types
 */
const IMAGE_TYPE_PROMPTS: Record<BookImageType, {
  prefix: string;
  styleHints: string;
  avoidance: string;
}> = {
  illustration: {
    prefix: 'Create a beautiful illustration showing',
    styleHints: 'artistic, hand-crafted look, expressive, detailed',
    avoidance: 'Avoid: text, labels, watermarks, borders, frames',
  },
  diagram: {
    prefix: 'Create a clean technical diagram illustrating',
    styleHints: 'clear lines, organized layout, professional appearance, labeled components',
    avoidance: 'Avoid: excessive decoration, photorealistic elements',
  },
  infographic: {
    prefix: 'Create an informative infographic about',
    styleHints: 'data visualization, clear hierarchy, modern design, easy to read',
    avoidance: 'Avoid: clutter, too many colors, small text',
  },
  chart: {
    prefix: 'Create a professional chart/graph showing',
    styleHints: 'clean data presentation, clear labels, modern styling, easy to interpret',
    avoidance: 'Avoid: 3D effects, excessive decoration, confusing layouts',
  },
  photo: {
    prefix: 'Create a photorealistic image depicting',
    styleHints: 'high quality, professional photography, realistic lighting, sharp focus',
    avoidance: 'Avoid: artificial effects, unnatural poses, stock photo clichés',
  },
  scene: {
    prefix: 'Create an atmospheric scene showing',
    styleHints: 'mood-setting, environmental storytelling, depth and atmosphere',
    avoidance: 'Avoid: characters as main focus, text overlays',
  },
  concept: {
    prefix: 'Create a conceptual visualization representing',
    styleHints: 'abstract, symbolic, thought-provoking, artistic interpretation',
    avoidance: 'Avoid: literal representations, text descriptions',
  },
};

/**
 * Style modifiers for different visual styles
 */
const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  realistic: 'photorealistic, highly detailed, natural lighting, professional photography style',
  illustrated: 'hand-drawn illustration style, artistic, expressive brushstrokes, book illustration quality',
  minimal: 'minimalist design, clean lines, simple composition, limited color palette, whitespace',
  vintage: 'vintage aesthetic, aged appearance, retro color grading, nostalgic feel, classic design',
  modern: 'contemporary design, sleek, clean, modern color palette, professional',
  watercolor: 'watercolor painting style, soft colors, flowing brushstrokes, artistic, delicate',
  'digital-art': 'digital art, CGI quality, polished, vibrant colors, high-quality rendering',
  'line-art': 'line drawing, sketch style, clean lines, black and white or limited colors',
  technical: 'technical drawing, blueprint style, precise, engineering quality, schematic',
};

/**
 * Genre-specific prompt enhancements
 */
const GENRE_PROMPT_ENHANCEMENTS: Record<string, string> = {
  'Fantasy': 'magical atmosphere, epic fantasy style, mystical elements, rich colors',
  'Science Fiction': 'futuristic, sci-fi aesthetic, advanced technology, sleek design',
  'Romance': 'soft, warm tones, romantic atmosphere, emotional depth',
  'Thriller': 'dark, suspenseful mood, high contrast, dramatic lighting',
  'Mystery': 'atmospheric, noir influence, shadowy, intriguing',
  'Horror': 'dark, unsettling, atmospheric horror, subtle dread',
  'Non-Fiction': 'professional, informative, clean, authoritative',
  'Technical': 'precise, clear, educational, professional technical illustration',
  'Business': 'corporate style, professional, modern business aesthetic',
  'Self-Help': 'uplifting, positive, motivational imagery, bright',
  'Biography': 'documentary style, authentic, historical accuracy where relevant',
  'Children': 'colorful, friendly, engaging, age-appropriate, whimsical',
  'Young Adult': 'dynamic, contemporary, engaging, relatable themes',
};

export class BookImageService {
  private imageModel: string;

  constructor(imageModel: string = DEFAULT_IMAGE_MODEL) {
    this.imageModel = imageModel;
  }

  /**
   * Build an optimized prompt for image generation
   */
  buildImagePrompt(request: GenerateBookImageRequest): string {
    const {
      bookTitle,
      bookGenre,
      chapterTitle,
      chapterContent,
      imageType,
      style,
      customPrompt,
      contextBefore,
      contextAfter,
    } = request;

    // If user provides custom prompt, enhance it with style guidance
    if (customPrompt) {
      return this.enhanceCustomPrompt(customPrompt, imageType, style || 'illustrated', bookGenre);
    }

    // Get type-specific prompt structure
    const typePrompt = IMAGE_TYPE_PROMPTS[imageType];
    
    // Determine style (from request, or genre default)
    const genreConfig = GENRE_IMAGE_STYLES[bookGenre] || GENRE_IMAGE_STYLES['Fiction'];
    const effectiveStyle = style || genreConfig.primary;
    const styleModifier = STYLE_MODIFIERS[effectiveStyle];
    
    // Get genre enhancement
    const genreEnhancement = GENRE_PROMPT_ENHANCEMENTS[bookGenre] || '';

    // Build context description
    let contextDescription = '';
    if (chapterContent) {
      contextDescription = this.extractVisualContext(chapterContent, imageType);
    } else if (contextBefore || contextAfter) {
      const combinedContext = [contextBefore, contextAfter].filter(Boolean).join(' ');
      contextDescription = this.extractVisualContext(combinedContext, imageType);
    }

    // If no context, use chapter title
    if (!contextDescription && chapterTitle) {
      contextDescription = `a scene or concept related to "${chapterTitle}"`;
    }

    // Build the complete prompt
    let prompt = `${typePrompt.prefix} ${contextDescription}.

=== STYLE REQUIREMENTS ===
- Visual Style: ${styleModifier}
${genreEnhancement ? `- Genre Aesthetic: ${genreEnhancement}` : ''}
- ${typePrompt.styleHints}

=== QUALITY REQUIREMENTS ===
- High resolution, professional quality
- Suitable for book publication
- ${typePrompt.avoidance}
- No text, watermarks, or logos unless specifically requested

=== CONTEXT ===
- Book: "${bookTitle}"
- Genre: ${bookGenre}
${chapterTitle ? `- Chapter: "${chapterTitle}"` : ''}

Generate a visually compelling image that enhances the reader's understanding and engagement.`;

    return prompt;
  }

  /**
   * Enhance a custom prompt with style and quality guidance
   */
  private enhanceCustomPrompt(
    customPrompt: string,
    imageType: BookImageType,
    style: ImageStyle,
    genre: string
  ): string {
    const typePrompt = IMAGE_TYPE_PROMPTS[imageType];
    const styleModifier = STYLE_MODIFIERS[style];
    const genreEnhancement = GENRE_PROMPT_ENHANCEMENTS[genre] || '';

    return `${customPrompt}

=== STYLE GUIDANCE ===
- Image Type: ${IMAGE_TYPE_INFO[imageType].name} - ${IMAGE_TYPE_INFO[imageType].description}
- Visual Style: ${styleModifier}
${genreEnhancement ? `- Genre Aesthetic: ${genreEnhancement}` : ''}
- ${typePrompt.styleHints}
- ${typePrompt.avoidance}

=== QUALITY ===
- High resolution, professional book illustration quality
- No watermarks, no text overlays unless essential`;
  }

  /**
   * Extract visual context from chapter content
   */
  private extractVisualContext(content: string, imageType: BookImageType): string {
    // Clean and truncate content
    const cleanContent = content
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);

    // Different extraction strategies based on image type
    switch (imageType) {
      case 'illustration':
      case 'scene':
        return this.extractSceneDescription(cleanContent);
      case 'diagram':
      case 'infographic':
        return this.extractConceptDescription(cleanContent);
      case 'chart':
        return this.extractDataDescription(cleanContent);
      case 'photo':
        return this.extractPhotoSubject(cleanContent);
      case 'concept':
        return this.extractAbstractConcept(cleanContent);
      default:
        return cleanContent.substring(0, 200);
    }
  }

  private extractSceneDescription(content: string): string {
    // Look for setting, character, and action descriptions
    const settingKeywords = ['stood', 'walked', 'entered', 'looked', 'saw', 'appeared', 'revealed'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Find sentences with scene-setting language
    const sceneSentences = sentences.filter(s => 
      settingKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    
    if (sceneSentences.length > 0) {
      return sceneSentences[0].trim().substring(0, 300);
    }
    
    return sentences[0]?.trim().substring(0, 300) || content.substring(0, 200);
  }

  private extractConceptDescription(content: string): string {
    // Look for explanatory language
    const conceptKeywords = ['how', 'why', 'what', 'process', 'system', 'method', 'approach', 'steps'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const conceptSentences = sentences.filter(s => 
      conceptKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    
    if (conceptSentences.length > 0) {
      return `the concept of ${conceptSentences[0].trim().substring(0, 250)}`;
    }
    
    return `the concept explained: ${sentences[0]?.trim().substring(0, 200) || content.substring(0, 150)}`;
  }

  private extractDataDescription(content: string): string {
    // Look for numerical or comparative content
    const dataKeywords = ['percent', '%', 'increase', 'decrease', 'growth', 'comparison', 'versus', 'vs', 'data', 'statistics'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const dataSentences = sentences.filter(s => 
      dataKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    
    if (dataSentences.length > 0) {
      return `data visualization showing ${dataSentences[0].trim().substring(0, 250)}`;
    }
    
    return `chart representing ${sentences[0]?.trim().substring(0, 200) || content.substring(0, 150)}`;
  }

  private extractPhotoSubject(content: string): string {
    // Extract main subjects for realistic photo
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences[0]?.trim().substring(0, 250) || content.substring(0, 200);
  }

  private extractAbstractConcept(content: string): string {
    // Extract abstract/conceptual elements
    const abstractKeywords = ['idea', 'concept', 'theme', 'meaning', 'symbolize', 'represent', 'essence'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const abstractSentences = sentences.filter(s => 
      abstractKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    
    if (abstractSentences.length > 0) {
      return `abstract visualization of ${abstractSentences[0].trim().substring(0, 250)}`;
    }
    
    return `conceptual representation of ${sentences[0]?.trim().substring(0, 200) || content.substring(0, 150)}`;
  }

  /**
   * Generate an image for a book chapter
   */
  async generateImage(request: GenerateBookImageRequest): Promise<GenerateBookImageResponse> {
    try {
      const prompt = this.buildImagePrompt(request);
      const aspectRatio = request.aspectRatio || '16:9';
      const dimensions = ASPECT_RATIOS[aspectRatio];

      console.log(`[BookImage] Generating ${request.imageType} image for book: ${request.bookTitle}`);
      console.log(`[BookImage] Using model: ${this.imageModel}`);

      // Get image model info
      const imageModel = getImageModelById(this.imageModel);
      const provider = imageModel?.provider || 'nanobanana-pro';

      let imageUrl: string;

      if (provider === 'dalle') {
        imageUrl = await this.generateWithDallE(prompt, aspectRatio);
      } else {
        imageUrl = await this.generateWithNanoBanana(prompt, aspectRatio);
      }

      // Upload to blob storage
      const storedUrl = await this.uploadToBlob(imageUrl, request.bookId, request.imageType);

      // Generate caption if needed
      const caption = await this.generateCaption(request);
      const altText = await this.generateAltText(request);

      const metadata: BookImageMetadata = {
        width: dimensions.width,
        height: dimensions.height,
        style: request.style || 'illustrated',
        generationModel: this.imageModel,
        generatedAt: new Date().toISOString(),
        format: 'png',
        aspectRatio,
      };

      return {
        success: true,
        imageUrl: storedUrl,
        prompt,
        caption,
        altText,
        metadata,
      };
    } catch (error) {
      console.error('[BookImage] Error generating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating image',
      };
    }
  }

  /**
   * Generate image using DALL-E 3
   */
  private async generateWithDallE(prompt: string, aspectRatio: string): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for DALL-E image generation');
    }

    // Map aspect ratio to DALL-E sizes
    const sizeMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '4:3': '1792x1024', // Closest available
      '3:2': '1792x1024', // Closest available
      '2:3': '1024x1792',
    };

    const size = sizeMap[aspectRatio] || '1792x1024';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'hd',
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BookImage] DALL-E error:', errorText);
      throw new Error(`DALL-E generation failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      throw new Error('No image generated by DALL-E');
    }

    return data.data[0].url;
  }

  /**
   * Generate image using Nano Banana Pro (Gemini) via OpenRouter
   */
  private async generateWithNanoBanana(prompt: string, aspectRatio: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required for Nano Banana Pro image generation');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PowerWrite Book Studio',
      },
      body: JSON.stringify({
        model: this.imageModel,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BookImage] Nano Banana error:', errorText);
      
      // Fall back to DALL-E if available for common errors including 402 (payment required)
      if (OPENAI_API_KEY && (response.status === 400 || response.status === 402 || response.status === 422 || response.status === 429)) {
        console.log(`[BookImage] OpenRouter error ${response.status}, falling back to DALL-E...`);
        return this.generateWithDallE(prompt, aspectRatio);
      }
      
      // Provide helpful error message for payment issues
      if (response.status === 402) {
        throw new Error('OpenRouter credits exhausted. Please add credits to your OpenRouter account or set OPENAI_API_KEY for DALL-E fallback.');
      }
      
      throw new Error(`Nano Banana generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response for image URL (same logic as cover generation)
    if (data.choices?.[0]?.message) {
      const message = data.choices[0].message;
      
      if (message.images && Array.isArray(message.images)) {
        for (const img of message.images) {
          if (img.image_url?.url) return img.image_url.url;
          if (img.url) return img.url;
          if (img.b64_json) return `data:image/png;base64,${img.b64_json}`;
        }
      }
      
      if (message.content) {
        const content = message.content;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === 'image_url' && part.image_url?.url) return part.image_url.url;
            if (part.type === 'image' && part.image_url?.url) return part.image_url.url;
            if (part.type === 'image' && part.data) return `data:image/png;base64,${part.data}`;
          }
        }
        if (typeof content === 'string' && content.startsWith('http')) return content;
      }
      
      if (message.image_url?.url) return message.image_url.url;
    }

    // Fall back to DALL-E if response format is unexpected
    if (OPENAI_API_KEY) {
      console.log('[BookImage] Unexpected response format, falling back to DALL-E...');
      return this.generateWithDallE(prompt, aspectRatio);
    }

    throw new Error('Could not extract image from OpenRouter response');
  }

  /**
   * Upload generated image to Vercel Blob storage
   */
  private async uploadToBlob(imageUrl: string, bookId: number, imageType: BookImageType): Promise<string> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('[BookImage] BLOB_READ_WRITE_TOKEN not set, returning original URL');
      return imageUrl;
    }

    try {
      // Download image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      // Upload to blob
      const { put } = await import('@vercel/blob');
      const filename = `book-images/${bookId}/${imageType}-${Date.now()}.png`;

      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log(`[BookImage] Uploaded to blob: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error('[BookImage] Error uploading to blob:', error);
      return imageUrl; // Return original URL as fallback
    }
  }

  /**
   * Generate a caption for the image
   */
  private async generateCaption(request: GenerateBookImageRequest): Promise<string> {
    // Simple caption based on context
    if (request.chapterTitle) {
      const typeInfo = IMAGE_TYPE_INFO[request.imageType];
      return `${typeInfo.name}: ${request.chapterTitle}`;
    }
    return '';
  }

  /**
   * Generate alt text for accessibility
   */
  private async generateAltText(request: GenerateBookImageRequest): Promise<string> {
    const typeInfo = IMAGE_TYPE_INFO[request.imageType];
    const context = request.chapterTitle || request.bookTitle;
    return `${typeInfo.name} related to ${context}`;
  }

  /**
   * Analyze a chapter for image opportunities
   */
  async analyzeChapterForImages(
    chapterId: number,
    chapterTitle: string,
    chapterContent: string,
    bookGenre: string,
    config: BookImageConfig
  ): Promise<ChapterImageAnalysis> {
    const suggestions: ImageSuggestion[] = [];
    const genreConfig = GENRE_IMAGE_STYLES[bookGenre] || GENRE_IMAGE_STYLES['Fiction'];
    
    // Split content into sections
    const sections = chapterContent.split(/\n\n+/);
    let position = 0;

    // Strategy-based analysis
    if (config.autoPlacement === 'chapter-start') {
      // Single image at chapter start
      suggestions.push({
        position: 0,
        imageType: genreConfig.recommendedTypes[0] || 'illustration',
        description: `Opening visual for "${chapterTitle}"`,
        reasoning: 'Chapter header image to set the scene',
        priority: 'high',
      });
    } else if (config.autoPlacement === 'section-breaks') {
      // Find section breaks and suggest images
      sections.forEach((section, idx) => {
        if (idx > 0 && section.length > 200) {
          suggestions.push({
            position,
            imageType: genreConfig.recommendedTypes[0] || 'illustration',
            description: this.extractSceneDescription(section),
            reasoning: 'Section break - visual transition point',
            priority: 'medium',
          });
        }
        position += section.length + 2; // +2 for paragraph breaks
      });
    } else if (config.autoPlacement === 'smart' || config.autoPlacement === 'key-concepts') {
      // Smart analysis - look for visual opportunities
      const visualKeywords = [
        'appeared', 'saw', 'looked', 'stood', 'entered', 'revealed',
        'beautiful', 'massive', 'tiny', 'colorful', 'dark', 'bright',
        'diagram', 'chart', 'process', 'system', 'steps', 'method',
      ];

      sections.forEach((section, idx) => {
        const hasVisualOpportunity = visualKeywords.some(kw => 
          section.toLowerCase().includes(kw)
        );
        
        if (hasVisualOpportunity && section.length > 150) {
          const isDescriptive = section.length > 300;
          suggestions.push({
            position,
            imageType: this.determineImageType(section, genreConfig.recommendedTypes),
            description: this.extractSceneDescription(section),
            reasoning: isDescriptive ? 'Rich descriptive passage' : 'Visual opportunity detected',
            priority: isDescriptive ? 'high' : 'medium',
          });
        }
        position += section.length + 2;
      });
    }

    // Limit suggestions based on config
    const limitedSuggestions = suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, config.imagesPerChapter);

    return {
      chapterId,
      chapterTitle,
      suggestions: limitedSuggestions,
      recommendedCount: Math.min(suggestions.length, config.imagesPerChapter),
    };
  }

  /**
   * Determine the best image type for a piece of content
   */
  private determineImageType(content: string, recommendedTypes: BookImageType[]): BookImageType {
    const lower = content.toLowerCase();
    
    // Check for specific content types
    if (lower.includes('data') || lower.includes('percent') || lower.includes('statistic')) {
      return recommendedTypes.includes('chart') ? 'chart' : 
             recommendedTypes.includes('infographic') ? 'infographic' : recommendedTypes[0];
    }
    
    if (lower.includes('process') || lower.includes('system') || lower.includes('flow')) {
      return recommendedTypes.includes('diagram') ? 'diagram' : recommendedTypes[0];
    }
    
    if (lower.includes('landscape') || lower.includes('room') || lower.includes('building')) {
      return recommendedTypes.includes('scene') ? 'scene' : recommendedTypes[0];
    }
    
    return recommendedTypes[0] || 'illustration';
  }

  /**
   * Generate multiple images for a chapter based on analysis
   */
  async generateChapterImages(
    analysis: ChapterImageAnalysis,
    request: Omit<GenerateBookImageRequest, 'imageType' | 'chapterContent'>
  ): Promise<GenerateBookImageResponse[]> {
    const results: GenerateBookImageResponse[] = [];
    
    for (const suggestion of analysis.suggestions) {
      const result = await this.generateImage({
        ...request,
        chapterId: analysis.chapterId,
        chapterTitle: analysis.chapterTitle,
        imageType: suggestion.imageType,
        chapterContent: suggestion.description,
      });
      
      results.push(result);
      
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

// Export singleton instance
export const bookImageService = new BookImageService();
