import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { sanitizeChapter, countWords } from '@/lib/utils/text-sanitizer';
import { DEFAULT_CHAPTER_MODEL } from '@/lib/types/models';
import { getLanguageModel, isOpenRouterAvailable, resolveOpenRouterModelId } from '@/lib/ai/openrouter';
import { ApiErrors, apiError } from '@/lib/api/error';

export const runtime = 'nodejs';

const ChapterRequestSchema = z.object({
  bookId: z.number().int().positive(),
  bookTitle: z.string().min(1),
  bookGenre: z.string().min(1),
  bookAuthor: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().min(1),
  chapterSummary: z.string().min(1),
  customInstructions: z.string().optional(),
  targetWordCount: z.number().int().min(100).max(50_000),
  previousChaptersContext: z.string().optional(),
  outline: z
    .object({
      title: z.string(),
      summary: z.string(),
      keyPoints: z.array(z.string()).optional(),
      estimatedWordCount: z.number(),
    })
    .optional(),
  modelId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!isOpenRouterAvailable()) {
      throw ApiErrors.serverError('OPENROUTER_API_KEY is not configured.');
    }

    const body = ChapterRequestSchema.parse(await request.json());
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
      modelId,
    } = body;

    console.log(`Generating chapter ${chapterNumber}: "${chapterTitle}" for "${bookTitle}"`);
    console.log(`Target word count: ${targetWordCount}`);

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

    const selectedModelId = modelId || DEFAULT_CHAPTER_MODEL;
    console.log(`[Chapter Generation] Using model: ${resolveOpenRouterModelId(selectedModelId)}`);
    const model = getLanguageModel(selectedModelId);

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

    let content = result.text;
    content = content.replace(/\n?\[END CHAPTER\]\s*$/i, '').trim();
    content = content.replace(/\n?---\s*END\s*---\s*$/i, '').trim();
    content = sanitizeChapter(content);

    const wordCount = countWords(content);
    console.log(`Chapter ${chapterNumber} generated: ${wordCount} words`);

    if (wordCount < targetWordCount * 0.7) {
      console.warn(`Warning: Generated chapter is shorter than expected (${wordCount}/${targetWordCount} words)`);
    }

    return NextResponse.json({
      success: true,
      content,
      wordCount,
      title: chapterTitle,
      chapterNumber,
      modelUsed: selectedModelId,
    });
  } catch (error) {
    return apiError(error);
  }
}
