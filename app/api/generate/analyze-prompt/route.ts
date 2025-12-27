import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Initialize providers
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
export const maxDuration = 30;

interface ReferenceBook {
  title: string;
  authors?: string[];
  genre?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, referenceBooks } = body as {
      prompt: string;
      referenceBooks?: ReferenceBook[];
    };

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Determine which model to use
    const model = openrouter
      ? openrouter('openai/gpt-4o-mini') // Use fast model for analysis
      : openai
      ? openai('gpt-4o-mini')
      : null;

    if (!model) {
      // Fall back to local parsing if no API available
      return NextResponse.json({
        success: true,
        analysis: parsePromptLocally(prompt),
        method: 'local',
      });
    }

    // Build context from reference books
    const referenceContext = referenceBooks?.length
      ? `\n\nReference Books Provided:\n${referenceBooks.map(b => 
          `- "${b.title}"${b.authors?.length ? ` by ${b.authors.join(', ')}` : ''}${b.genre ? ` (${b.genre})` : ''}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are an expert book analyst. Analyze the user's book prompt and extract configuration settings.

Return ONLY valid JSON with these fields:
{
  "title": "suggested book title (optional, only if clearly implied)",
  "genre": "one of: fiction, non-fiction, fantasy, science fiction, romance, thriller, mystery, horror, historical fiction, contemporary, young adult, literary fiction, biography, memoir, self-help, business, technical, academic",
  "description": "expanded, detailed book description based on the prompt (2-3 sentences)",
  "tone": "one of: serious, humorous, dark, light-hearted, inspirational, satirical, neutral",
  "audience": "one of: children, young-adult, adult, academic, professional",
  "wordCount": "number: 10000-150000 based on implied length",
  "chapters": "number: 5-40 based on implied structure",
  "themes": ["array", "of", "main", "themes"],
  "pov": "one of: first-person, second-person, third-person-limited, third-person-omniscient",
  "setting": "time period and location description",
  "isNonFiction": "boolean: true if non-fiction, false otherwise",
  "customInstructions": "any specific writing instructions from the prompt",
  "confidence": "number 0-1: how confident you are in these extractions"
}

If a field cannot be determined, omit it. Be conservative with confidence scores.`;

    const userPrompt = `Analyze this book prompt and extract configuration:

"${prompt}"${referenceContext}

Remember to return ONLY valid JSON.`;

    console.log('Analyzing prompt with AI...');

    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for consistent structured output
    });

    // Parse the JSON response
    let analysis;
    try {
      let jsonText = result.text.trim();
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      // Fall back to local parsing
      analysis = parsePromptLocally(prompt);
    }

    console.log('Prompt analysis complete:', analysis);

    return NextResponse.json({
      success: true,
      analysis,
      method: 'ai',
    });
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    
    // Return local parsing as fallback
    try {
      const body = await request.clone().json();
      return NextResponse.json({
        success: true,
        analysis: parsePromptLocally(body.prompt || ''),
        method: 'local',
        warning: 'AI analysis failed, using local parsing',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to analyze prompt' },
        { status: 500 }
      );
    }
  }
}

// Local parsing fallback function
function parsePromptLocally(text: string): Record<string, any> {
  const lowerText = text.toLowerCase();
  const result: Record<string, any> = {
    confidence: 0.5,
    description: text,
  };

  // Genre detection
  const genrePatterns: Record<string, string[]> = {
    'fantasy': ['fantasy', 'magic', 'dragon', 'wizard', 'enchanted', 'mythical', 'sword', 'elf', 'dwarf'],
    'science fiction': ['sci-fi', 'science fiction', 'space', 'future', 'alien', 'robot', 'dystopia', 'cyberpunk', 'technology'],
    'romance': ['romance', 'love story', 'romantic', 'love interest', 'relationship', 'passion'],
    'mystery': ['mystery', 'detective', 'crime', 'murder', 'solve', 'investigation', 'clue'],
    'thriller': ['thriller', 'suspense', 'chase', 'danger', 'conspiracy', 'spy', 'action'],
    'horror': ['horror', 'scary', 'terrifying', 'haunted', 'nightmare', 'ghost', 'monster'],
    'non-fiction': ['non-fiction', 'guide', 'how to', 'learn', 'understand', 'comprehensive', 'practical', 'educational'],
    'biography': ['biography', 'life story', 'memoir', 'autobiography'],
    'self-help': ['self-help', 'improve', 'success', 'motivation', 'personal development', 'habits'],
    'historical fiction': ['historical', 'century', 'era', 'period', 'medieval', 'victorian', 'war', 'ancient'],
    'young adult': ['young adult', 'ya', 'teenager', 'teen', 'coming of age', 'high school'],
    'literary fiction': ['literary', 'profound', 'introspective', 'character study'],
  };

  for (const [genre, patterns] of Object.entries(genrePatterns)) {
    if (patterns.some(p => lowerText.includes(p))) {
      result.genre = genre;
      result.isNonFiction = ['non-fiction', 'biography', 'self-help'].includes(genre);
      break;
    }
  }

  // Tone detection
  const tonePatterns: Record<string, string[]> = {
    'dark': ['dark', 'grim', 'bleak', 'tragic', 'gritty'],
    'humorous': ['funny', 'humor', 'comedy', 'witty', 'light-hearted', 'comedic'],
    'serious': ['serious', 'profound', 'thoughtful', 'deep', 'philosophical'],
    'inspirational': ['inspirational', 'uplifting', 'motivating', 'hope', 'positive'],
    'satirical': ['satire', 'satirical', 'ironic', 'parody'],
  };

  for (const [tone, patterns] of Object.entries(tonePatterns)) {
    if (patterns.some(p => lowerText.includes(p))) {
      result.tone = tone;
      break;
    }
  }

  // Audience detection
  if (lowerText.includes('children') || lowerText.includes('kids') || lowerText.includes('child')) {
    result.audience = 'children';
  } else if (lowerText.includes('young adult') || lowerText.includes('teenager') || lowerText.includes('teen') || lowerText.includes('ya ')) {
    result.audience = 'young-adult';
  } else if (lowerText.includes('adult') || lowerText.includes('mature')) {
    result.audience = 'adult';
  } else if (lowerText.includes('academic') || lowerText.includes('scholarly')) {
    result.audience = 'academic';
  }

  // Length detection
  if (lowerText.includes('short') || lowerText.includes('novella') || lowerText.includes('brief') || lowerText.includes('quick')) {
    result.wordCount = 30000;
    result.chapters = 10;
  } else if (lowerText.includes('long') || lowerText.includes('epic') || lowerText.includes('comprehensive') || lowerText.includes('detailed')) {
    result.wordCount = 120000;
    result.chapters = 25;
  } else if (lowerText.includes('medium') || lowerText.includes('standard')) {
    result.wordCount = 80000;
    result.chapters = 15;
  } else {
    // Default
    result.wordCount = 80000;
    result.chapters = 15;
  }

  // POV detection
  if (lowerText.includes('first person') || lowerText.includes('first-person')) {
    result.pov = 'first-person';
  } else if (lowerText.includes('third person') || lowerText.includes('third-person')) {
    result.pov = 'third-person-limited';
  } else if (lowerText.includes('omniscient')) {
    result.pov = 'third-person-omniscient';
  }

  // Theme extraction
  const themeWords = ['love', 'betrayal', 'redemption', 'power', 'family', 'identity', 'survival', 'friendship', 'revenge', 'justice', 'freedom', 'sacrifice', 'courage', 'hope', 'loss', 'growth'];
  result.themes = themeWords.filter(t => lowerText.includes(t));

  return result;
}




















