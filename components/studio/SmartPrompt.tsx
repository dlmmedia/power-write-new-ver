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
  tense?: string;
  writingStyle?: string;
  narrativeVoice?: string;
  narrativeStructure?: string;
  pacing?: string;
  bookStructure?: string;
  setting?: string;
  isNonFiction?: boolean;
  customInstructions?: string;
  confidence: number;
}

interface MagicFillResult extends ParsedPrompt {
  subGenre?: string;
  author?: string;
  includeBibliography?: boolean;
  bibliographyCitationStyle?: string;
  bibliographyReferenceFormat?: string;
  chapterOutlines?: Array<{
    number: number;
    title: string;
    summary: string;
    estimatedWords: number;
  }>;
  characters?: Array<{
    name: string;
    role: string;
    description: string;
  }>;
}

interface SuggestionTab {
  id: string;
  label: string;
  shortLabel: string;
  prompt: string;
}

const GENRE_TABS: SuggestionTab[] = [
  { 
    id: 'nonfiction',
    label: 'Non-Fiction Guide', 
    shortLabel: 'Non-Fiction',
    prompt: `Write a comprehensive non-fiction guide that teaches readers practical skills and insights.

Topic: [Your subject area]
Approach: Well-researched, accessible, with real-world examples and actionable advice.
Structure: Progressive chapters that build knowledge from fundamentals to advanced concepts.
Tone: Authoritative yet conversational, making complex topics easy to understand.` 
  },
  { 
    id: 'fantasy',
    label: 'Fantasy Epic', 
    shortLabel: 'Fantasy',
    prompt: `Write an epic fantasy novel set in a richly imagined world with its own magic system, cultures, and history.

Setting: A world where [describe your world's unique elements]
Protagonist: A hero who discovers [their special ability/destiny]
Plot: An epic journey involving [quests, battles, ancient prophecies]
Themes: Good vs evil, the hero's journey, power and its consequences, found family.
Tone: Grand in scope, with moments of wonder and high stakes adventure.` 
  },
  { 
    id: 'romance',
    label: 'Romance', 
    shortLabel: 'Romance',
    prompt: `Write a contemporary romance novel with emotional depth and satisfying relationship development.

Setting: [Modern city, small town, workplace, etc.]
Main characters: Two compelling individuals whose lives intersect unexpectedly
Conflict: Internal and external obstacles keeping them apart before their happy ending
Themes: Second chances, self-discovery through love, vulnerability and trust.
Tone: Emotionally engaging with moments of tension, humor, and heartfelt connection.` 
  },
  { 
    id: 'mystery',
    label: 'Mystery', 
    shortLabel: 'Mystery',
    prompt: `Write a gripping mystery thriller that keeps readers guessing until the final reveal.

Setting: [City, small town, isolated location]
Detective/Protagonist: A sharp investigator with [unique skills/personal stakes]
The Crime: A complex case involving [murder, disappearance, conspiracy]
Suspects: Multiple characters with motives, secrets, and alibis
Tone: Suspenseful pacing with clever misdirection, building to a satisfying revelation.` 
  },
  { 
    id: 'scifi',
    label: 'Sci-Fi', 
    shortLabel: 'Sci-Fi',
    prompt: `Write a science fiction adventure exploring the frontiers of technology and humanity.

Setting: A future where [technological or societal changes have transformed life]
Protagonist: Someone who [discovers, challenges, or must adapt to] this world
Central conflict: [AI, space exploration, dystopia, first contact, etc.]
Themes: What it means to be human, the ethics of progress, hope for the future.
Tone: Thought-provoking yet action-packed, blending big ideas with personal stakes.` 
  },
  { 
    id: 'horror',
    label: 'Horror', 
    shortLabel: 'Horror',
    prompt: `Write a psychological horror novel that builds dread and lingers in the reader's mind.

Setting: [Haunted house, isolated town, seemingly normal suburb with dark secrets]
Protagonist: Someone whose past or choices make them vulnerable to [the horror]
The Threat: Something that preys on [specific fears, guilt, or human weakness]
Themes: The monsters we create, confronting trauma, the thin line between sanity and madness.
Tone: Atmospheric and unsettling, with escalating tension and visceral scares.` 
  },
  { 
    id: 'literary',
    label: 'Literary', 
    shortLabel: 'Literary',
    prompt: `Write a literary fiction novel with beautiful prose and profound character exploration.

Setting: [Grounded, realistic world that reflects contemporary or historical life]
Protagonist: A complex individual navigating [a pivotal life moment or internal struggle]
Narrative focus: Character development, relationships, and emotional truth over plot
Themes: Identity, memory, family, mortality, the human condition.
Tone: Introspective and lyrical, with moments of quiet revelation.` 
  },
  { 
    id: 'childrens',
    label: 'Children\'s', 
    shortLabel: 'Kids',
    prompt: `Write an engaging children's story with memorable characters and a meaningful message.

Age range: [Picture book 3-6, Early reader 6-8, Middle grade 8-12]
Main character: A relatable young protagonist who [faces a challenge]
Adventure: [A fun journey, magical discovery, or everyday problem to solve]
Themes: Friendship, bravery, kindness, being yourself, trying new things.
Tone: Warm, imaginative, and age-appropriate with gentle humor and heart.` 
  },
];

const TONE_OPTIONS = ['serious', 'humorous', 'dark', 'light-hearted', 'inspirational', 'satirical', 'neutral'];
const AUDIENCE_OPTIONS = ['children', 'young-adult', 'adult', 'academic', 'professional'];
const POV_OPTIONS = ['first-person', 'second-person', 'third-person-limited', 'third-person-omniscient'];

export function SmartPrompt() {
  const { config, updateConfig, setConfig, setOutline, smartPromptText, setSmartPromptText, smartPromptParsedResult, setSmartPromptParsedResult } = useStudioStore();
  const { selectedBooks } = useBookStore();
  // Use store-persisted prompt and parsedResult so they survive navigation
  const prompt = smartPromptText;
  const setPrompt = setSmartPromptText;
  const parsedResult = smartPromptParsedResult as MagicFillResult | null;
  const setParsedResult = setSmartPromptParsedResult;
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChapters, setShowChapters] = useState(false);
  const [showAppliedNotification, setShowAppliedNotification] = useState(false);

  const referenceBookData = selectedBooks.map(b => ({
    title: b.title,
    authors: b.authors,
    genre: b.genre,
    description: b.description,
  }));

  // Analyze prompt (quick - extract basic settings)
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
        body: JSON.stringify({ prompt, referenceBooks: referenceBookData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze prompt');
      }

      const data = await response.json();
      setParsedResult({ ...data.analysis, confidence: data.analysis.confidence || 0.7 });
    } catch (err) {
      console.error('Error analyzing prompt:', err);
      setError('Analysis failed. Try Magic Fill for a more comprehensive result.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [prompt, referenceBookData]);

  // Magic fill (comprehensive - generates everything including chapters)
  const magicFill = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing your book');
      return;
    }

    setIsMagicFilling(true);
    setError(null);

    try {
      const response = await fetch('/api/generate/magic-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentSettings: parsedResult || undefined,
          referenceBooks: referenceBookData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate configuration');
      }

      const data = await response.json();
      setParsedResult({
        ...data.magicFill,
        confidence: data.magicFill.confidence || 0.9,
      });
      // Auto-expand chapters if they were generated
      if (data.magicFill.chapterOutlines?.length > 0) {
        setShowChapters(true);
      }
    } catch (err) {
      console.error('Error with magic fill:', err);
      setError('Magic fill failed. Please try again.');
    } finally {
      setIsMagicFilling(false);
    }
  }, [prompt, parsedResult, referenceBookData]);

  // Update a field in the parsed result
  const updateField = (field: string, value: any) => {
    if (!parsedResult) return;
    setParsedResult({ ...parsedResult, [field]: value });
  };

  // Update a chapter outline
  const updateChapter = (index: number, field: string, value: any) => {
    if (!parsedResult?.chapterOutlines) return;
    const updated = [...parsedResult.chapterOutlines];
    updated[index] = { ...updated[index], [field]: value };
    setParsedResult({ ...parsedResult, chapterOutlines: updated });
  };

  // Remove a chapter outline
  const removeChapter = (index: number) => {
    if (!parsedResult?.chapterOutlines || parsedResult.chapterOutlines.length <= 1) return;
    const updated = parsedResult.chapterOutlines
      .filter((_, i) => i !== index)
      .map((ch, i) => ({ ...ch, number: i + 1 }));
    setParsedResult({ ...parsedResult, chapterOutlines: updated, chapters: updated.length });
  };

  // Add a chapter outline
  const addChapter = () => {
    if (!parsedResult) return;
    const existing = parsedResult.chapterOutlines || [];
    const newNum = existing.length + 1;
    const updated = [...existing, {
      number: newNum,
      title: `Chapter ${newNum}`,
      summary: 'New chapter summary',
      estimatedWords: 5000,
    }];
    setParsedResult({ ...parsedResult, chapterOutlines: updated, chapters: updated.length });
  };

  // Apply all configuration
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
        bookStructure: (parsedResult.bookStructure as any) || config.content.bookStructure,
      },
      writingStyle: {
        ...config.writingStyle,
        style: (parsedResult.writingStyle as any) || config.writingStyle.style,
        tone: (parsedResult.tone as any) || config.writingStyle.tone,
        pov: (parsedResult.pov as any) || config.writingStyle.pov,
        tense: (parsedResult.tense as any) || config.writingStyle.tense,
        narrativeVoice: (parsedResult.narrativeVoice as any) || config.writingStyle.narrativeVoice,
      },
      audience: {
        ...config.audience,
        targetAudience: (parsedResult.audience as any) || config.audience.targetAudience,
      },
      themes: {
        ...config.themes,
        primary: parsedResult.themes?.length ? parsedResult.themes : config.themes.primary,
      },
      plot: {
        ...config.plot,
        narrativeStructure: (parsedResult.narrativeStructure as any) || config.plot.narrativeStructure,
        pacing: (parsedResult.pacing as any) || config.plot.pacing,
      },
      customInstructions: parsedResult.customInstructions || prompt,
    };

    // Apply bibliography settings for non-fiction
    if (parsedResult.isNonFiction && parsedResult.includeBibliography) {
      (newConfig as any).bibliography = {
        include: true,
        citationStyle: parsedResult.bibliographyCitationStyle || 'APA',
        referenceFormat: parsedResult.bibliographyReferenceFormat || 'bibliography',
        sourceVerification: 'moderate',
      };
    }

    setConfig({ ...config, ...newConfig } as BookConfiguration);

    // If chapter outlines were generated, also create an outline
    if (parsedResult.chapterOutlines && parsedResult.chapterOutlines.length > 0) {
      const outline = {
        title: parsedResult.title || config.basicInfo.title || 'Untitled Book',
        author: parsedResult.author || config.basicInfo.author || 'Author',
        genre: parsedResult.genre || config.basicInfo.genre || 'fiction',
        description: parsedResult.description || '',
        themes: parsedResult.themes || [],
        totalWordCount: parsedResult.wordCount || 80000,
        chapters: parsedResult.chapterOutlines.map(ch => ({
          number: ch.number,
          title: ch.title,
          summary: ch.summary,
          wordCount: ch.estimatedWords || 5000,
          scenes: [],
        })),
        characters: parsedResult.characters?.map(c => ({
          name: c.name,
          role: c.role as any,
          description: c.description,
        })) || [],
      };
      setOutline(outline as any);
    }

    setShowAppliedNotification(true);
    setTimeout(() => setShowAppliedNotification(false), 3000);
  };

  const handleTabClick = (tab: SuggestionTab) => {
    if (selectedTab === tab.id) {
      setSelectedTab(null);
      setPrompt('');
    } else {
      setSelectedTab(tab.id);
      setPrompt(tab.prompt);
    }
    setParsedResult(null);
    setError(null);
  };

  const isProcessing = isAnalyzing || isMagicFilling;

  return (
    <div className="space-y-5 relative">
      {/* Success Notification */}
      {showAppliedNotification && (
        <div 
          className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out"
          style={{ animation: 'slideInFadeIn 0.3s ease-out forwards' }}
        >
          <div className="flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#10003;</span>
            </div>
            <div>
              <p className="text-sm font-medium">Configuration Applied</p>
              <p className="text-xs opacity-80">Settings and outline have been updated</p>
            </div>
          </div>
          <style jsx>{`
            @keyframes slideInFadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Smart Book Prompt
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Describe your book idea, then analyze or use Magic Fill to configure everything
          </p>
        </div>
        {selectedBooks.length > 0 && (
          <div className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-200/50 dark:border-blue-800/30">
            {selectedBooks.length} reference{selectedBooks.length > 1 ? 's' : ''} attached
          </div>
        )}
      </div>

      {/* Genre Tabs */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick templates</p>
        <div className="flex flex-wrap gap-1.5">
          {GENRE_TABS.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-500/30' 
                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {isSelected && <span className="ml-1 text-yellow-600 dark:text-yellow-400">&#10003;</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Prompt Input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your book idea in detail...&#10;&#10;Example: Write a fantasy novel about a young blacksmith who discovers they can forge magical weapons. The story should follow their journey from a small village to becoming a legendary weapon smith, exploring themes of destiny, craftsmanship, and the true meaning of power."
          rows={6}
          className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 resize-none transition-shadow"
          suppressHydrationWarning
        />
        <div className="absolute bottom-3 right-3 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
          {prompt.length} chars
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={analyzePrompt}
          isLoading={isAnalyzing}
          disabled={!prompt.trim() || isProcessing}
          className="flex-shrink-0"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={magicFill}
          isLoading={isMagicFilling}
          disabled={!prompt.trim() || isProcessing}
          className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
        >
          {isMagicFilling ? 'Generating...' : 'Magic Fill'}
        </Button>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:block">
          Analyze extracts settings &middot; Magic Fill generates everything including chapters
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Editable Parsed Results */}
      {parsedResult && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/50">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Configuration Ready
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                {Math.round(parsedResult.confidence * 100)}% confidence
              </span>
              <span className="text-[11px] text-gray-400">Editable</span>
            </div>
          </div>

          {/* Title & Description */}
          {parsedResult.title && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 block">Title</label>
              <input
                type="text"
                value={parsedResult.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/40 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 focus:outline-none transition-shadow"
              />
            </div>
          )}

          {parsedResult.description && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 block">Description</label>
              <textarea
                value={parsedResult.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/40 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 focus:outline-none resize-none transition-shadow"
              />
            </div>
          )}

          {/* Editable Settings Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <EditableSelect
              label="Genre"
              value={parsedResult.genre || ''}
              options={GENRE_OPTIONS.map(g => g.toLowerCase())}
              onChange={(v) => updateField('genre', v)}
            />
            <EditableSelect
              label="Tone"
              value={parsedResult.tone || ''}
              options={TONE_OPTIONS}
              onChange={(v) => updateField('tone', v)}
            />
            <EditableSelect
              label="Audience"
              value={parsedResult.audience || ''}
              options={AUDIENCE_OPTIONS}
              onChange={(v) => updateField('audience', v)}
            />
            <EditableNumber
              label="Word Count"
              value={parsedResult.wordCount || 80000}
              onChange={(v) => updateField('wordCount', v)}
              min={5000}
              max={200000}
              step={5000}
            />
            <EditableNumber
              label="Chapters"
              value={parsedResult.chapters || 15}
              onChange={(v) => updateField('chapters', v)}
              min={3}
              max={50}
              step={1}
            />
            <EditableSelect
              label="POV"
              value={parsedResult.pov || ''}
              options={POV_OPTIONS}
              onChange={(v) => updateField('pov', v)}
            />
          </div>

          {/* Themes */}
          {parsedResult.themes && parsedResult.themes.length > 0 && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">Themes</label>
              <div className="flex flex-wrap gap-1.5">
                {parsedResult.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-md text-xs capitalize border border-gray-200/60 dark:border-gray-700/40"
                  >
                    {theme}
                    <button
                      onClick={() => {
                        const updated = parsedResult.themes!.filter((_, i) => i !== idx);
                        updateField('themes', updated);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Characters (for fiction) */}
          {parsedResult.characters && parsedResult.characters.length > 0 && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">Characters</label>
              <div className="space-y-1.5">
                {parsedResult.characters.map((char, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5 border border-gray-200/60 dark:border-gray-700/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => {
                            const updated = [...parsedResult.characters!];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            updateField('characters', updated);
                          }}
                          className="font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-yellow-500/50 focus:outline-none text-gray-900 dark:text-white"
                        />
                        <span className="text-[11px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded text-gray-500 dark:text-gray-400 font-medium">
                          {char.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{char.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Outlines */}
          {parsedResult.chapterOutlines && parsedResult.chapterOutlines.length > 0 && (
            <div>
              <button
                onClick={() => setShowChapters(!showChapters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="text-xs">{showChapters ? '&#9660;' : '&#9654;'}</span>
                Chapter Outlines ({parsedResult.chapterOutlines.length} chapters)
              </button>
              
              {showChapters && (
                <div className="mt-2.5 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {parsedResult.chapterOutlines.map((ch, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/60 dark:border-gray-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 w-6 tabular-nums">#{ch.number}</span>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                            className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-yellow-500/50 focus:outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 tabular-nums">{ch.estimatedWords?.toLocaleString()}w</span>
                          <button
                            onClick={() => removeChapter(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove chapter"
                          >
                            <span className="text-xs">&times;</span>
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={ch.summary}
                        onChange={(e) => updateChapter(idx, 'summary', e.target.value)}
                        rows={2}
                        className="w-full text-xs text-gray-500 dark:text-gray-400 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-yellow-500/40 focus:outline-none rounded px-1 py-0.5 resize-none transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addChapter}
                    className="w-full py-2 text-sm text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500/40 transition-colors"
                  >
                    + Add Chapter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Apply Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
            <Button
              variant="primary"
              size="md"
              onClick={applyConfiguration}
              className="flex-1"
            >
              Apply Configuration {parsedResult.chapterOutlines?.length ? '& Outline' : ''}
            </Button>
            {!parsedResult.chapterOutlines?.length && (
              <Button
                variant="outline"
                size="md"
                onClick={magicFill}
                isLoading={isMagicFilling}
                disabled={isProcessing}
              >
                Enhance with Magic Fill
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-lg p-3.5 border border-gray-200/40 dark:border-gray-700/20">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Tips for better results</p>
        <ul className="space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 list-disc list-inside">
          <li>Be specific about genre, tone, and themes</li>
          <li>Mention target audience and desired length</li>
          <li>Use <strong className="font-medium text-gray-600 dark:text-gray-300">Analyze</strong> for quick settings, <strong className="font-medium text-gray-600 dark:text-gray-300">Magic Fill</strong> for complete book planning</li>
          <li>All generated settings are editable before applying</li>
        </ul>
      </div>
    </div>
  );
}

// Helper components for editable fields
function EditableSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-200/60 dark:border-gray-700/30">
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white capitalize focus:outline-none cursor-pointer mt-0.5"
      >
        {value && !options.includes(value) && (
          <option value={value}>{value}</option>
        )}
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.replace(/-/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function EditableNumber({ label, value, onChange, min, max, step }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-200/60 dark:border-gray-700/30">
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none mt-0.5 tabular-nums"
      />
    </div>
  );
}
