import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';
import { ensureDemoUser } from '@/lib/db/operations';
import { BookConfiguration } from '@/lib/types/studio';
import { sanitizeTitle } from '@/lib/utils/text-sanitizer';
import { isNonFiction } from '@/lib/utils/book-type';

export const maxDuration = 300; // 5 minutes max duration for Vercel
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check for OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Request body received:', { userId: body.userId, hasConfig: !!body.config });
    
    interface ReferenceBook {
      title: string;
      authors: string[];
      categories?: string[];
      genre?: string;
    }
    
    const { userId, config, referenceBooks } = body as {
      userId: string;
      config: BookConfiguration;
      referenceBooks?: ReferenceBook[];
    };

    // Validate required fields
    if (!userId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, config' },
        { status: 400 }
      );
    }

    if (!config.basicInfo?.title || !config.basicInfo?.author) {
      console.error('Missing basicInfo fields:', config.basicInfo);
      return NextResponse.json(
        { error: 'Missing required fields: title, author' },
        { status: 400 }
      );
    }

    // Ensure demo user exists in database
    await ensureDemoUser(userId);

    console.log('Generating outline for:', config.basicInfo.title);

    // Detect if it's non-fiction based on genre or reference books
    const bookIsNonFiction = config.basicInfo.genre.toLowerCase().includes('non-fiction') ||
                             (referenceBooks && referenceBooks.length > 0 && referenceBooks.some(b => isNonFiction(b)));

    console.log(`Book type detected: ${bookIsNonFiction ? 'Non-Fiction' : 'Fiction'}`);

    // Extract custom characters from config
    const customCharacters = (config as any).characterList || [];
    const charactersInstruction = customCharacters.length > 0
      ? `Custom Characters:\n${customCharacters.map((c: any) => 
          `- ${c.name} (${c.role}): ${c.description || 'No description'}${c.traits ? ` | Traits: ${c.traits}` : ''}`
        ).join('\n')}`
      : '';

    // Map word count to length category
    const getLength = (wordCount: number): string => {
      if (wordCount <= 10000) return 'micro';
      if (wordCount <= 20000) return 'novella';
      if (wordCount <= 40000) return 'short-novel';
      if (wordCount <= 60000) return 'short';
      if (wordCount <= 90000) return 'medium';
      if (wordCount <= 130000) return 'long';
      return 'epic';
    };

    // Prepare generation config with full studio settings
    const outline = await aiService.generateBookOutline({
      title: sanitizeTitle(config.basicInfo.title),
      author: config.basicInfo.author,
      genre: config.basicInfo.genre,
      tone: config.writingStyle.tone,
      audience: config.audience.targetAudience,
      description: config.content.description,
      chapters: config.content.numChapters,
      length: getLength(config.content.targetWordCount),
      isNonFiction: bookIsNonFiction,
      customCharacters: customCharacters,
      customInstructions: [
        `Writing Style: ${config.writingStyle.style}`,
        `Point of View: ${config.writingStyle.pov}`,
        `Tense: ${config.writingStyle.tense}`,
        `Narrative Voice: ${config.writingStyle.narrativeVoice}`,
        `Book Structure: ${config.content.bookStructure}`,
        `Narrative Structure: ${config.plot.narrativeStructure}`,
        `Pacing: ${config.plot.pacing}`,
        charactersInstruction,
        referenceBooks && referenceBooks.length > 0
          ? `Reference Books: ${referenceBooks.map(b => `\"${b.title}\" by ${b.authors.join(', ')}`).join(', ')}`
          : '',
        config.customInstructions || '',
      ].filter(Boolean).join('\n'),
    });

    console.log('Outline generated successfully:', outline.title);

    return NextResponse.json({
      success: true,
      outline,
    });
  } catch (error) {
    console.error('Error generating outline:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate outline', 
        details: errorMessage,
        hint: errorMessage.includes('API key') ? 'Check your OpenAI API key configuration in Vercel environment variables' : undefined
      },
      { status: 500 }
    );
  }
}
