import { NextRequest, NextResponse } from 'next/server';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';

export const maxDuration = 600; // 10 minutes - Railway supports up to 15 min HTTP timeout
export const runtime = 'nodejs';

interface ChapterGenerationRequest {
  bookId: number;
  bookTitle: string;
  bookGenre: string;
  bookAuthor: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  customInstructions?: string;
  targetWordCount: number;
  previousChaptersContext?: string;
  outline?: {
    title: string;
    summary: string;
    keyPoints?: string[];
    estimatedWordCount: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check for API keys
    if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'AI API key is not configured. Please set OPENAI_API_KEY or OPENROUTER_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json() as ChapterGenerationRequest;
    const {
      bookTitle,
      bookGenre,
      bookAuthor,
      chapterNumber,
      chapterTitle,
      chapterSummary,
      customInstructions,
      targetWordCount,
      previousChaptersContext,
      outline,
    } = body;

    console.log(`Generating chapter ${chapterNumber}: "${chapterTitle}" for "${bookTitle}"`);
    console.log(`Target word count: ${targetWordCount}`);

    // Build the chapter generation prompt
    const keyPointsText = outline?.keyPoints?.length 
      ? `\n\nKey events/points to include:\n${outline.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '';

    const prompt = `Write Chapter ${chapterNumber} of the book "${bookTitle}" by ${bookAuthor}.

CHAPTER DETAILS:
- Title: ${chapterTitle}
- Summary: ${chapterSummary}
- Genre: ${bookGenre}
- Target Word Count: ${targetWordCount} words (minimum ${Math.floor(targetWordCount * 0.8)} words)
${keyPointsText}

${previousChaptersContext ? `\n\nPREVIOUS CHAPTERS CONTEXT (maintain continuity and story flow):\n${previousChaptersContext}\n` : ''}

${customInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${customInstructions}\n` : ''}

WRITING GUIDELINES:
1. Write a COMPLETE chapter with substantial content
2. Create well-developed paragraphs (6-10 sentences each)
3. Include vivid descriptions, engaging dialogue where appropriate
4. Maintain consistent tone and style with the book's genre
5. Use double line breaks between paragraphs
6. NO markdown formatting - write in plain prose
7. Ensure smooth transitions between scenes
8. End the chapter at a natural conclusion point

${previousChaptersContext ? 'IMPORTANT: This chapter MUST flow naturally from where the previous chapters left off. Maintain character consistency and story continuity.' : ''}

Begin writing the chapter now. Write at least ${targetWordCount} words of engaging, well-crafted prose.`;

    // Use the AI service directly for text generation
    const { generateText } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');

    const openrouter = process.env.OPENROUTER_API_KEY
      ? createOpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
        })
      : null;

    const openai = process.env.OPENAI_API_KEY
      ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    // Use a capable model for chapter generation
    const model = openrouter 
      ? openrouter('anthropic/claude-sonnet-4')
      : openai!('gpt-4o');

    console.log('Calling AI model for chapter generation...');

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a master novelist and storyteller specializing in ${bookGenre}. Write compelling, engaging chapters with rich detail, authentic dialogue, and strong narrative flow. Your writing should captivate readers and maintain perfect continuity with the existing story.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
    });

    // Sanitize and process the content
    let content = result.text;
    
    // Remove any end markers
    content = content.replace(/\n?\[END CHAPTER\]\s*$/i, '').trim();
    content = content.replace(/\n?---\s*END\s*---\s*$/i, '').trim();
    
    // Sanitize the chapter
    content = sanitizeChapter(content);
    
    const wordCount = countWords(content);

    console.log(`Chapter ${chapterNumber} generated: ${wordCount} words`);

    // Warn if significantly under target
    if (wordCount < targetWordCount * 0.7) {
      console.warn(`Warning: Generated chapter is shorter than expected (${wordCount}/${targetWordCount} words)`);
    }

    return NextResponse.json({
      success: true,
      content,
      wordCount,
      title: chapterTitle,
      chapterNumber,
    });
  } catch (error) {
    console.error('Error generating chapter:', error);
    
    let errorMessage = 'Failed to generate chapter';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded';
        errorDetails = 'Please check your API billing and usage limits.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded';
        errorDetails = 'Too many requests. Please wait a few minutes and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API key error';
        errorDetails = 'Invalid or missing API key.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Generation timeout';
        errorDetails = 'Chapter generation took too long. Try reducing the target word count.';
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

