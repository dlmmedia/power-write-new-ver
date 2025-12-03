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
    modelId?: string
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

      const prompt = isNonFiction
        ? `Write Chapter ${chapter.number} of the NON-FICTION book "${outline.title}" by ${outline.author}.

Chapter Details:
- Title: ${chapter.title}
- Summary: ${chapter.summary}
- Target Word Count: ${chapter.wordCount} words
- Genre: ${outline.genre}

Themes: ${outline.themes?.join(', ') || 'General themes'}
${contextPrompt}

Write a complete, informative chapter targeting ${chapter.wordCount} words (minimum 1500 words). 
- Create well-developed paragraphs (6-10 sentences each)
- Include clear explanations, examples, and facts
- Use double line breaks between paragraphs
- NO markdown formatting
- Write in plain text
- Focus on educational and informative content
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
        ? `You are a master non-fiction writer specializing in ${outline.genre}. Write clear, informative chapters with well-researched content, practical examples, and engaging explanations.`
        : `You are a master novelist writing in the ${outline.genre} genre. Write compelling chapters with rich detail, character development, and engaging prose.`;

      console.log(`Generating chapter ${chapterNumber} with model: ${model}`);

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
    imageModelId?: string
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

      let imageUrl: string;

      if (provider === 'dalle') {
        // Use DALL-E 3 via OpenAI
        imageUrl = await this.generateWithDallE(title, author, genre, description, style);
      } else {
        // Use Nano Banana / Nano Banana Pro via OpenRouter (Gemini image models)
        imageUrl = await this.generateWithNanoBanana(title, author, genre, description, style, modelId);
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
    style: string
  ): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for DALL-E image generation');
    }

    const prompt = `A professional book cover for "${title}" by ${author}. Genre: ${genre}. ${description.substring(0, 200)}. Style: ${style}, premium publishing quality, eye-catching design, portrait orientation.`;
    
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
    modelId: string
  ): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required for Nano Banana Pro image generation. Set it in your environment variables.');
    }

    // Build a detailed prompt for book cover generation
    const prompt = `Generate a stunning professional book cover image for a ${genre} book.

Title: "${title}"
Author: ${author}
Description: ${description.substring(0, 300)}
Style: ${style}, premium publishing quality

Requirements:
- Create a visually striking book cover background image
- Portrait orientation (2:3 aspect ratio suitable for book covers)
- High quality, eye-catching design appropriate for ${genre}
- DO NOT include any text, titles, or author names in the image
- Focus on mood, atmosphere, and visual storytelling
- Professional publishing quality suitable for commercial use

Generate only the background artwork/imagery for a book cover.`;

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

  async generateFullBook(
    outline: BookOutline,
    onProgress?: (chapter: number, total: number) => void,
    modelId?: string
  ): Promise<{ chapters: Array<{ title: string; content: string; wordCount: number }> }> {
    const chapters = [];
    let previousChapters = '';

    for (let i = 0; i < outline.chapters.length; i++) {
      const chapterNum = i + 1;
      console.log(`Generating chapter ${chapterNum}/${outline.chapters.length}`);

      if (onProgress) {
        onProgress(chapterNum, outline.chapters.length);
      }

      const chapter = await this.generateChapter(outline, chapterNum, previousChapters, modelId);
      chapters.push(chapter);

      const recentChapters = chapters.slice(-2);
      previousChapters = recentChapters
        .map((ch) => `Chapter ${ch.title}: ${ch.content.substring(0, 500)}...`)
        .join('\n\n');
    }

    return { chapters };
  }
}

export const aiService = new AIService();
