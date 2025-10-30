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
  sourceBook?: {
    title: string;
    author: string;
    description: string;
  };
}

export class AIService {
  async generateBookOutline(config: BookGenerationConfig): Promise<BookOutline> {
    try {
      const numChapters = config.chapters || 10;
      const lengthMapping: Record<string, number> = {
        'short': 50000,
        'medium': 80000,
        'long': 120000,
      };
      
      const targetWords = lengthMapping[config.length] || 80000;
      const wordsPerChapter = Math.floor(targetWords / numChapters);

      const sourceContext = config.sourceBook 
        ? `\n\nSource Book for Inspiration: "${config.sourceBook.title}" by ${config.sourceBook.author}\nDescription: ${config.sourceBook.description}\n\nNote: Create something entirely original inspired by this work, not a copy.`
        : '';

      const prompt = `Create a ${config.genre} book outline with ${numChapters} chapters.

Author: ${config.author}
Genre: ${config.genre}
Tone: ${config.tone}
Audience: ${config.audience}
Description: ${config.description}
${sourceContext}
${config.customInstructions ? `\nInstructions: ${config.customInstructions}` : ''}

Generate a compelling book outline with:
- An engaging title
- ${numChapters} well-structured chapters (approximately ${wordsPerChapter} words each)
- Brief chapter summaries (2-3 sentences each)
- 3-5 key themes
- Main characters (name, role, brief description)

Return ONLY valid JSON in this format:
{
  "title": "book title",
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

      const result = await generateText({
        model: getTextModel('outline'), // Use GPT-4o-mini for fast structured outlines
        messages: [
          {
            role: 'system',
            content: 'You are an expert book author. Generate book outlines as valid JSON only. Be concise.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      // Clean the response - remove markdown code blocks if present
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const outline = JSON.parse(jsonText);
      console.log('Generated outline:', outline.title);
      return outline;
    } catch (error) {
      console.error('Error generating book outline:', error);
      throw new Error('Failed to generate book outline');
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

      const prompt = `Write Chapter ${chapter.number} of "${outline.title}" by ${outline.author}.

Chapter Details:
- Title: ${chapter.title}
- Summary: ${chapter.summary}
- Target Word Count: ${chapter.wordCount} words
- Genre: ${outline.genre}

Characters: ${outline.characters?.map(c => `${c.name} (${c.role})`).join(', ') || 'None specified'}
Themes: ${outline.themes?.join(', ') || 'General themes'}
${contextPrompt}

Write a complete, engaging chapter targeting ${chapter.wordCount} words (minimum 1500 words). 
- Create well-developed paragraphs (6-10 sentences each)
- Include vivid descriptions and engaging dialogue
- Use double line breaks between paragraphs
- NO markdown formatting
- Write in plain text
- End with [END CHAPTER] on a new line`;

      const result = await generateText({
        model: getTextModel('chapter'), // Use Claude Sonnet 4 for best creative writing
        messages: [
          {
            role: 'system',
            content: `You are a master novelist writing in the ${outline.genre} genre. Write compelling chapters with rich detail, character development, and engaging prose.`,
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

    const prompt = `Write Chapter ${chapter.number} of "${outline.title}".

Chapter: ${chapter.title}
Summary: ${chapter.summary}
Target: ${chapter.wordCount} words

${contextPrompt}

Write a complete chapter with well-developed paragraphs. Use double line breaks between paragraphs. NO markdown.`;

    const result = streamText({
      model: getTextModel('chapter'), // Use GPT-4o for streaming
      messages: [
        {
          role: 'system',
          content: `You are a master novelist. Write compelling chapters with rich detail.`,
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

      // Return the image URL
      const imageUrl = data.data[0].url;
      
      console.log('Cover generated successfully with DALL-E 3');
      return imageUrl;
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
