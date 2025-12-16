'use client';

import { useState, useCallback } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { useBookStore } from '@/lib/store/book-store';
import { Button } from '@/components/ui/Button';
import { BookConfiguration, GENRE_OPTIONS } from '@/lib/types/studio';

interface ParsedPrompt {
  title?: string;
  genre?: string;
  description?: string;
  tone?: string;
  audience?: string;
  wordCount?: number;
  chapters?: number;
  themes?: string[];
  pov?: string;
  setting?: string;
  isNonFiction?: boolean;
  customInstructions?: string;
  confidence: number;
}

interface SuggestionChip {
  label: string;
  prompt: string;
}

const QUICK_SUGGESTIONS: SuggestionChip[] = [
  { label: '📚 Non-Fiction Guide', prompt: 'Write a comprehensive guide about' },
  { label: '🔮 Fantasy Epic', prompt: 'Write an epic fantasy novel with magic, dragons, and a hero\'s journey' },
  { label: '💔 Romance Novel', prompt: 'Write a contemporary romance about two people who' },
  { label: '🔍 Mystery Thriller', prompt: 'Write a gripping mystery thriller where a detective must solve' },
  { label: '🚀 Sci-Fi Adventure', prompt: 'Write a science fiction story set in a future where' },
  { label: '👻 Horror Story', prompt: 'Write a psychological horror novel about' },
  { label: '📖 Literary Fiction', prompt: 'Write a literary fiction exploring themes of' },
  { label: '🧒 Children\'s Book', prompt: 'Write a children\'s story about' },
];

export function SmartPrompt() {
  const { config, updateConfig, setConfig } = useStudioStore();
  const { selectedBooks } = useBookStore();
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAppliedNotification, setShowAppliedNotification] = useState(false);

  // Analyze prompt and extract configuration
  const analyzePrompt = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing your book');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setParsedResult(null);

    try {
      const response = await fetch('/api/generate/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceBooks: selectedBooks.map(b => ({
            title: b.title,
            authors: b.authors,
            genre: b.genre,
            description: b.description,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze prompt');
      }

      const data = await response.json();
      setParsedResult(data.analysis);
    } catch (err) {
      console.error('Error analyzing prompt:', err);
      // Fallback to local parsing if API fails
      const localParsed = parsePromptLocally(prompt);
      setParsedResult(localParsed);
    } finally {
      setIsAnalyzing(false);
    }
  }, [prompt, selectedBooks]);

  // Local parsing fallback
  const parsePromptLocally = (text: string): ParsedPrompt => {
    const lowerText = text.toLowerCase();
    const result: ParsedPrompt = {
      confidence: 0.6,
      description: text,
    };

    // Detect genre
    const genrePatterns: Record<string, string[]> = {
      'fantasy': ['fantasy', 'magic', 'dragon', 'wizard', 'enchanted', 'mythical'],
      'science fiction': ['sci-fi', 'science fiction', 'space', 'future', 'alien', 'robot', 'dystopia', 'cyberpunk'],
      'romance': ['romance', 'love story', 'romantic', 'love interest', 'relationship'],
      'mystery': ['mystery', 'detective', 'crime', 'murder', 'solve', 'investigation'],
      'thriller': ['thriller', 'suspense', 'chase', 'danger', 'conspiracy'],
      'horror': ['horror', 'scary', 'terrifying', 'haunted', 'nightmare', 'ghost'],
      'non-fiction': ['non-fiction', 'guide', 'how to', 'learn', 'understand', 'comprehensive', 'practical'],
      'biography': ['biography', 'life story', 'memoir', 'autobiography'],
      'self-help': ['self-help', 'improve', 'success', 'motivation', 'personal development'],
      'historical fiction': ['historical', 'century', 'era', 'period', 'medieval', 'victorian', 'war'],
      'young adult': ['young adult', 'ya', 'teenager', 'teen', 'coming of age'],
    };

    for (const [genre, patterns] of Object.entries(genrePatterns)) {
      if (patterns.some(p => lowerText.includes(p))) {
        result.genre = genre;
        result.isNonFiction = ['non-fiction', 'biography', 'self-help'].includes(genre);
        break;
      }
    }

    // Detect tone
    const tonePatterns: Record<string, string[]> = {
      'dark': ['dark', 'grim', 'bleak', 'tragic'],
      'humorous': ['funny', 'humor', 'comedy', 'witty', 'light-hearted'],
      'serious': ['serious', 'profound', 'thoughtful', 'deep'],
      'inspirational': ['inspirational', 'uplifting', 'motivating', 'hope'],
    };

    for (const [tone, patterns] of Object.entries(tonePatterns)) {
      if (patterns.some(p => lowerText.includes(p))) {
        result.tone = tone;
        break;
      }
    }

    // Detect audience
    if (lowerText.includes('children') || lowerText.includes('kids')) {
      result.audience = 'children';
    } else if (lowerText.includes('young adult') || lowerText.includes('teenager') || lowerText.includes('teen')) {
      result.audience = 'young-adult';
    } else if (lowerText.includes('adult')) {
      result.audience = 'adult';
    }

    // Detect length preferences
    if (lowerText.includes('short') || lowerText.includes('novella') || lowerText.includes('brief')) {
      result.wordCount = 30000;
      result.chapters = 10;
    } else if (lowerText.includes('long') || lowerText.includes('epic') || lowerText.includes('comprehensive')) {
      result.wordCount = 120000;
      result.chapters = 25;
    } else {
      result.wordCount = 80000;
      result.chapters = 15;
    }

    // Detect POV
    if (lowerText.includes('first person') || lowerText.includes('i ')) {
      result.pov = 'first-person';
    } else if (lowerText.includes('third person')) {
      result.pov = 'third-person-limited';
    }

    // Extract potential themes
    const themeWords = ['love', 'betrayal', 'redemption', 'power', 'family', 'identity', 'survival', 'friendship', 'revenge', 'justice'];
    result.themes = themeWords.filter(t => lowerText.includes(t));

    return result;
  };

  // Apply parsed configuration
  const applyConfiguration = () => {
    if (!parsedResult) return;

    const newConfig: Partial<BookConfiguration> = {
      basicInfo: {
        ...config.basicInfo,
        title: parsedResult.title || config.basicInfo.title,
        genre: parsedResult.genre || config.basicInfo.genre,
      },
      content: {
        ...config.content,
        description: parsedResult.description || config.content.description,
        targetWordCount: parsedResult.wordCount || config.content.targetWordCount,
        numChapters: parsedResult.chapters || config.content.numChapters,
      },
      writingStyle: {
        ...config.writingStyle,
        tone: (parsedResult.tone as any) || config.writingStyle.tone,
        pov: (parsedResult.pov as any) || config.writingStyle.pov,
      },
      audience: {
        ...config.audience,
        targetAudience: (parsedResult.audience as any) || config.audience.targetAudience,
      },
      themes: {
        ...config.themes,
        primary: parsedResult.themes?.length ? parsedResult.themes : config.themes.primary,
      },
      customInstructions: parsedResult.customInstructions || prompt,
    };

    setConfig({ ...config, ...newConfig } as BookConfiguration);
    
    // Show success notification
    setShowAppliedNotification(true);
    setTimeout(() => setShowAppliedNotification(false), 3000);
  };

  const handleSuggestionClick = (suggestion: SuggestionChip) => {
    setPrompt(suggestion.prompt + ' ');
  };

  return (
    <div className="space-y-4 relative">
      {/* Success Notification */}
      {showAppliedNotification && (
        <div 
          className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out"
          style={{
            animation: 'slideInFadeIn 0.3s ease-out forwards'
          }}
        >
          <div className="flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg border border-green-400">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-semibold">Configuration Applied!</p>
              <p className="text-sm opacity-90">Your settings have been updated</p>
            </div>
          </div>
          <style jsx>{`
            @keyframes slideInFadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">✨</span> Smart Book Prompt
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe your book idea and we&apos;ll auto-configure the settings
          </p>
        </div>
        {selectedBooks.length > 0 && (
          <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
            📎 {selectedBooks.length} reference book{selectedBooks.length > 1 ? 's' : ''} attached
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      {/* Main Prompt Input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your book idea in detail...&#10;&#10;Example: Write a fantasy novel about a young blacksmith who discovers they can forge magical weapons. The story should follow their journey from a small village to becoming a legendary weapon smith, exploring themes of destiny, craftsmanship, and the true meaning of power. Make it a medium-length novel with vivid descriptions and complex characters."
          rows={6}
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          suppressHydrationWarning
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
          {prompt.length} characters
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={analyzePrompt}
          isLoading={isAnalyzing}
          disabled={!prompt.trim()}
          className="flex-shrink-0"
        >
          {isAnalyzing ? 'Analyzing...' : '🔮 Analyze & Configure'}
        </Button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Parsed Results */}
      {parsedResult && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
              <span>✅</span> Analysis Complete
            </h4>
            <span className="text-xs bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              {Math.round(parsedResult.confidence * 100)}% confidence
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {parsedResult.genre && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Genre</span>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{parsedResult.genre}</p>
              </div>
            )}
            {parsedResult.tone && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Tone</span>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{parsedResult.tone}</p>
              </div>
            )}
            {parsedResult.audience && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Audience</span>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{parsedResult.audience}</p>
              </div>
            )}
            {parsedResult.wordCount && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Word Count</span>
                <p className="font-semibold text-gray-900 dark:text-white">{parsedResult.wordCount.toLocaleString()}</p>
              </div>
            )}
            {parsedResult.chapters && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Chapters</span>
                <p className="font-semibold text-gray-900 dark:text-white">{parsedResult.chapters}</p>
              </div>
            )}
            {parsedResult.pov && (
              <div className="bg-white dark:bg-gray-900 rounded p-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">POV</span>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{parsedResult.pov.replace('-', ' ')}</p>
              </div>
            )}
          </div>

          {parsedResult.themes && parsedResult.themes.length > 0 && (
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Detected Themes</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {parsedResult.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs capitalize"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={applyConfiguration}
            className="w-full"
          >
            ✨ Apply Configuration
          </Button>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Advanced Prompt Options</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Override Genre</label>
              <select
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white"
                onChange={(e) => {
                  if (parsedResult && e.target.value) {
                    setParsedResult({ ...parsedResult, genre: e.target.value });
                  }
                }}
              >
                <option value="">Auto-detect</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre.toLowerCase()}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Override Length</label>
              <select
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white"
                onChange={(e) => {
                  if (parsedResult && e.target.value) {
                    const [words, chapters] = e.target.value.split(',').map(Number);
                    setParsedResult({ ...parsedResult, wordCount: words, chapters });
                  }
                }}
              >
                <option value="">Auto-detect</option>
                <option value="20000,8">Short (~20K words, 8 chapters)</option>
                <option value="50000,12">Medium (~50K words, 12 chapters)</option>
                <option value="80000,20">Standard (~80K words, 20 chapters)</option>
                <option value="120000,30">Long (~120K words, 30 chapters)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
        <strong className="text-gray-900 dark:text-white">💡 Tips for better results:</strong>
        <ul className="mt-1 space-y-0.5 list-disc list-inside">
          <li>Be specific about genre, tone, and themes</li>
          <li>Mention target audience (children, young adult, adult)</li>
          <li>Include desired length (short story, novella, epic)</li>
          <li>Add reference books for style inspiration</li>
        </ul>
      </div>
    </div>
  );
}



