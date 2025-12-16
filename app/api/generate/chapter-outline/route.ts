import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { getModelById, DEFAULT_OUTLINE_MODEL } from '@/lib/types/models';

export const maxDuration = 60; // 1 minute for outline generation
export const runtime = 'nodejs';

interface ChapterOutlineRequest {
  bookId: number;
  bookTitle: string;
  bookGenre: string;
  bookAuthor: string;
  chapterNumber: number;
  suggestedTitle?: string;
  suggestedSummary?: string;
  customInstructions?: string;
  targetWordCount: number;
  previousChaptersContext?: string;
  modelId?: string; // User-selected model
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

    const body = await request.json() as ChapterOutlineRequest;
    const {
      bookTitle,
      bookGenre,
      bookAuthor,
      chapterNumber,
      suggestedTitle,
      suggestedSummary,
      customInstructions,
      targetWordCount,
      previousChaptersContext,
      modelId,
    } = body;

    console.log(`Generating chapter outline for: ${bookTitle}, Chapter ${chapterNumber}`);

    const aiService = new AIService();

    // Build the outline generation prompt
    const prompt = `Generate an outline for Chapter ${chapterNumber} of the book "${bookTitle}" by ${bookAuthor}.

Book Genre: ${bookGenre}

${previousChaptersContext ? `PREVIOUS CHAPTERS CONTEXT (maintain continuity):\n${previousChaptersContext}\n\n` : ''}

${suggestedTitle ? `Suggested Chapter Title: ${suggestedTitle}` : 'Please suggest an appropriate chapter title.'}

${suggestedSummary ? `Author's Direction: ${suggestedSummary}` : 'Create a chapter that naturally follows from the previous content.'}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Target Word Count: approximately ${targetWordCount} words

Generate a detailed chapter outline with:
1. A compelling chapter title
2. A clear summary of what happens (2-3 sentences)
3. 3-5 key points or events that will occur in this chapter
4. Estimated word count

IMPORTANT: Ensure continuity with previous chapters. The new chapter should flow naturally from where the story left off.

Return ONLY valid JSON in this exact format:
{
  "title": "Chapter title",
  "summary": "Brief summary of the chapter",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "estimatedWordCount": ${targetWordCount}
}`;

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

    // Use user-selected model or fall back to default
    const selectedModelId = modelId || DEFAULT_OUTLINE_MODEL;
    const modelInfo = getModelById(selectedModelId);
    
    console.log(`[Chapter Outline] Using model: ${selectedModelId} (provider: ${modelInfo?.provider || 'unknown'})`);
    
    // Get the appropriate model based on provider
    let model;
    if (modelInfo?.provider === 'openrouter' && openrouter) {
      model = openrouter(selectedModelId);
    } else if (modelInfo?.provider === 'openai' && openai) {
      model = openai(selectedModelId);
    } else if (openrouter) {
      // Fallback: use OpenRouter with the selected model ID
      model = openrouter(selectedModelId);
    } else if (openai) {
      // Fallback: use OpenAI with gpt-4o-mini
      model = openai('gpt-4o-mini');
    } else {
      throw new Error('No AI provider available');
    }

    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert author helping to plan book chapters. Generate creative, engaging chapter outlines that maintain story continuity. Always respond with valid JSON only.`,
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

    const outline = JSON.parse(jsonText);

    console.log(`Chapter outline generated: ${outline.title}`);

    return NextResponse.json({
      success: true,
      outline,
    });
  } catch (error) {
    console.error('Error generating chapter outline:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate chapter outline',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}







