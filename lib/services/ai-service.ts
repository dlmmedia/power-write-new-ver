import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

// Validate OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Please add it to your .env.local file.');
}

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

console.log('✓ AI Service initialized with OpenAI');
console.log('✓ API Key:', OPENAI_API_KEY.substring(0, 20) + '...');

// Model configurations - Using OpenAI for all operations
const MODELS = {
  // Text generation models
  OUTLINE: 'gpt-4o-mini',           // Fast structured output for outlines
  CHAPTER: 'gpt-4o',                // High quality for creative writing
  
  // Image generation
  COVER: 'dall-e-3',                // DALL-E 3 for book covers
  
  // Audio generation  
  AUDIO: 'tts-1',
  AUDIO_HD: 'tts-1-hd',
} as const;

// Model selection helpers
function getTextModel(type: 'outline' | 'chapter' = 'chapter') {
  if (type === 'outline') {
    return openai(MODELS.OUTLINE);
  }
  return openai(MODELS.CHAPTER);  // Use GPT-4o for chapters
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
}

export class AIService {
  async generateBookOutline(config: BookGenerationConfig): Promise<BookOutline> {
    try {
      console.log('Starting outline generation with config:', {
        title: config.title,
        genre: config.genre,
        chapters: config.chapters,
        length: config.length
      });

      const numChapters = config.chapters || 10;
      const lengthMapping: Record<string, number> = {
        'micro': 10000,      // Micro/flash fiction
        'novella': 20000,    // Novella
        'short-novel': 30000,  // Short novel
        'short': 50000,      // Short novel
        'medium': 80000,     // Standard novel
        'long': 120000,      // Long novel
        'epic': 150000,      // Epic novel
      };
      
      const targetWords = lengthMapping[config.length] || 80000;
      const wordsPerChapter = Math.floor(targetWords / numChapters);

      const sourceContext = config.sourceBook 
        ? `\n\nSource Book for Inspiration: "${config.sourceBook.title}" by ${config.sourceBook.author}\nDescription: ${config.sourceBook.description}\n\nNote: Create something entirely original inspired by this work, not a copy.`
        : '';

      const isNonFiction = config.isNonFiction || false;

      // Build character context if custom characters are provided
      const hasCustomCharacters = config.customCharacters && config.customCharacters.length > 0;
      const characterContext = hasCustomCharacters
        ? `\n\nIMPORTANT - Use these EXACT characters in the outline:\n${config.customCharacters!.map(c => 
            `- ${c.name} (${c.role}): ${c.description}${c.traits ? ` | Key traits: ${c.traits}` : ''}`
          ).join('\n')}\n\nDo NOT create new main characters. Use the characters listed above.`
        : '';

      // Determine if we should use custom title or let AI generate one
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

      console.log('Calling OpenAI API for outline generation...');
      
      const systemPrompt = isNonFiction
        ? 'You are an expert non-fiction author and educator. Generate informative, well-researched book outlines as valid JSON only. Focus on educational content, clear structure, and factual information.'
        : 'You are an expert fiction author. Generate compelling story outlines as valid JSON only. Focus on character development, plot structure, and engaging narratives.';

      const result = await generateText({
        model: getTextModel('outline'), // Use GPT-4o-mini for fast structured outlines
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });
      
      console.log('OpenAI API response received, parsing JSON...');

      // Clean the response - remove markdown code blocks if present
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const outline = JSON.parse(jsonText);
      
      // If custom title was provided, ensure it's in the outline
      if (hasCustomTitle) {
        outline.title = config.title;
        console.log('Custom title applied to outline:', outline.title);
      }
      
      // If custom characters were provided, ensure they're in the outline
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
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid or missing OpenAI API key. Please check your environment variables.');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your usage limits.');
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
    previousChapters?: string
  ): Promise<{ title: string; content: string; wordCount: number }> {
    try {
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

      const result = await generateText({
        model: getTextModel('chapter'),
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
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

  // Streaming version for real-time generation
  async *generateChapterStream(
    outline: BookOutline,
    chapterNumber: number,
    previousChapters?: string
  ) {
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
      model: getTextModel('chapter'), // Use GPT-4o for streaming
      messages: [
        {
          role: 'system',
          content: `You are a master novelist. Write compelling chapters with rich detail and character development.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.85,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  // Generate cover image using DALL-E 3
  async generateCoverImage(
    title: string,
    author: string,
    genre: string,
    description: string,
    style: string = 'vivid'
  ): Promise<string> {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for image generation');
      }

      // Validate blob token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is required for image storage. Set it in Vercel project settings.');
      }

      // Create a detailed, professional book cover prompt
      const prompt = `A professional book cover for "${title}" by ${author}. Genre: ${genre}. ${description.substring(0, 200)}. Style: ${style}, premium publishing quality, eye-catching design, portrait orientation.`;
      
      console.log('Generating cover with DALL-E 3...');
      
      // Use OpenAI's DALL-E 3 API
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
            size: '1024x1792', // Portrait for book cover
            quality: 'hd',
            style: style,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DALL-E 3 image generation error:', errorText);
        throw new Error(`Image generation failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No images generated');
      }

      // Get the temporary DALL-E URL
      const temporaryUrl = data.data[0].url;
      console.log('DALL-E image generated, downloading and uploading to blob storage...');

      // Download the image from DALL-E
      const imageResponse = await fetch(temporaryUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from DALL-E: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      // Upload to Vercel Blob storage for permanent access
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

  // Generate full book with progress tracking
  async generateFullBook(
    outline: BookOutline,
    onProgress?: (chapter: number, total: number) => void
  ): Promise<{ chapters: Array<{ title: string; content: string; wordCount: number }> }> {
    const chapters = [];
    let previousChapters = '';

    for (let i = 0; i < outline.chapters.length; i++) {
      const chapterNum = i + 1;
      console.log(`Generating chapter ${chapterNum}/${outline.chapters.length}`);

      if (onProgress) {
        onProgress(chapterNum, outline.chapters.length);
      }

      const chapter = await this.generateChapter(outline, chapterNum, previousChapters);
      chapters.push(chapter);

      // Add to context for next chapters (limited to last 2 chapters)
      const recentChapters = chapters.slice(-2);
      previousChapters = recentChapters
        .map((ch) => `Chapter ${ch.title}: ${ch.content.substring(0, 500)}...`)
        .join('\n\n');
    }

    return { chapters };
  }
}

export const aiService = new AIService();
