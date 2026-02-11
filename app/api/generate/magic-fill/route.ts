import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = OPENAI_API_KEY
  ? createOpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const openrouter = OPENROUTER_API_KEY
  ? createOpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  : null;

export const runtime = 'nodejs';
export const maxDuration = 60;

interface MagicFillRequest {
  prompt: string;
  currentSettings?: Record<string, any>;
  referenceBooks?: Array<{
    title: string;
    authors?: string[];
    genre?: string;
    description?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, currentSettings, referenceBooks } = body as MagicFillRequest;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const model = openrouter
      ? openrouter('openai/gpt-4o-mini')
      : openai
      ? openai('gpt-4o-mini')
      : null;

    if (!model) {
      return NextResponse.json(
        { error: 'No AI provider configured' },
        { status: 500 }
      );
    }

    const referenceContext = referenceBooks?.length
      ? `\n\nReference Books for style inspiration:\n${referenceBooks.map(b =>
          `- "${b.title}"${b.authors?.length ? ` by ${b.authors.join(', ')}` : ''}${b.genre ? ` (${b.genre})` : ''}`
        ).join('\n')}`
      : '';

    const currentSettingsContext = currentSettings
      ? `\n\nUser has already configured some settings:\n${JSON.stringify(currentSettings, null, 2)}`
      : '';

    const systemPrompt = `You are an expert book planning assistant. Given a book idea prompt, generate a comprehensive and detailed book configuration.

Return ONLY valid JSON with ALL of the following fields filled in:

{
  "title": "A compelling book title",
  "author": "Author name (use a realistic pen name if not specified)",
  "genre": "one of: fiction, non-fiction, fantasy, science fiction, romance, thriller, mystery, horror, historical fiction, contemporary, young adult, literary fiction, biography, memoir, self-help, business, technical, academic",
  "subGenre": "specific sub-genre",
  "description": "A rich, detailed book description (3-4 paragraphs covering premise, themes, and what makes it unique)",
  "tone": "one of: serious, humorous, dark, light-hearted, inspirational, satirical, neutral",
  "audience": "one of: children, young-adult, adult, academic, professional",
  "wordCount": 80000,
  "chapters": 15,
  "themes": ["theme1", "theme2", "theme3", "theme4"],
  "pov": "one of: first-person, second-person, third-person-limited, third-person-omniscient",
  "tense": "one of: past, present, future, mixed",
  "writingStyle": "one of: formal, casual, academic, conversational, poetic, technical, journalistic",
  "narrativeVoice": "one of: active, passive, descriptive, dialogue-heavy",
  "narrativeStructure": "one of: three-act, hero-journey, five-act, freytag, circular, custom",
  "pacing": "one of: fast, moderate, slow, variable",
  "bookStructure": "one of: linear, non-linear, episodic, circular",
  "setting": "Time period and location description",
  "isNonFiction": false,
  "includeBibliography": false,
  "bibliographyCitationStyle": "APA",
  "bibliographyReferenceFormat": "bibliography",
  "chapterOutlines": [
    {
      "number": 1,
      "title": "Chapter Title",
      "summary": "2-3 sentence chapter summary describing key events/content",
      "estimatedWords": 5000
    }
  ],
  "characters": [
    {
      "name": "Character Name",
      "role": "protagonist/antagonist/supporting",
      "description": "Brief character description including personality and motivation"
    }
  ],
  "customInstructions": "Any specific writing guidance derived from the prompt",
  "confidence": 0.9
}

IMPORTANT RULES:
- Generate the EXACT number of chapters specified (or a reasonable amount if not specified)
- Each chapter summary should be detailed and specific, not generic
- For non-fiction: include bibliography settings, skip characters
- For fiction: include characters with rich descriptions, skip bibliography
- The description should be compelling enough to serve as a back-cover blurb
- All chapter summaries should form a coherent narrative arc
- Word count per chapter should vary naturally (not all the same)`;

    const userPrompt = `Generate a comprehensive book configuration for:

"${prompt}"${referenceContext}${currentSettingsContext}

Fill in EVERY field with thoughtful, specific content. Return ONLY valid JSON.`;

    console.log('[Magic Fill] Generating comprehensive configuration...');

    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    let magicFill;
    try {
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      magicFill = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Magic Fill] Failed to parse AI response:', result.text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    console.log('[Magic Fill] Configuration generated successfully:', magicFill.title);

    return NextResponse.json({
      success: true,
      magicFill,
    });
  } catch (error) {
    console.error('[Magic Fill] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate configuration' },
      { status: 500 }
    );
  }
}
