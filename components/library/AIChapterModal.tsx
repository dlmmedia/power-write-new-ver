'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Sparkles, Lightbulb, PenTool, XCircle, BookOpen, FileText, RefreshCw, CheckCircle, X, Clipboard } from 'lucide-react';

interface AIChapterModalProps {
  bookId: number;
  bookTitle: string;
  bookGenre: string;
  bookAuthor: string;
  existingChapters: Array<{ number: number; title: string; content: string }>;
  nextChapterNumber: number;
  onClose: () => void;
  onChapterGenerated: (chapter: {
    id: number;
    number: number;
    title: string;
    content: string;
    wordCount: number;
    status: 'draft' | 'completed';
    isEdited: boolean;
  }) => void;
  modelId?: string; // User-selected model for generation
}

type GenerationStep = 'outline' | 'generating' | 'preview' | 'error';

interface ChapterOutline {
  title: string;
  summary: string;
  keyPoints: string[];
  estimatedWordCount: number;
}

export const AIChapterModal: React.FC<AIChapterModalProps> = ({
  bookId,
  bookTitle,
  bookGenre,
  bookAuthor,
  existingChapters,
  nextChapterNumber,
  onClose,
  onChapterGenerated,
  modelId,
}) => {
  const [step, setStep] = useState<GenerationStep>('outline');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterSummary, setChapterSummary] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(3000);
  const [generatedOutline, setGeneratedOutline] = useState<ChapterOutline | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  // Generate outline for the new chapter
  const generateOutline = async () => {
    setIsLoading(true);
    setError('');
    setProgress(10);

    try {
      // Build context from existing chapters
      const chapterContext = existingChapters
        .slice(-3) // Last 3 chapters for context
        .map(ch => `Chapter ${ch.number}: ${ch.title} - ${ch.content.substring(0, 300)}...`)
        .join('\n\n');

      const response = await fetch('/api/generate/chapter-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          bookTitle,
          bookGenre,
          bookAuthor,
          chapterNumber: nextChapterNumber,
          suggestedTitle: chapterTitle || undefined,
          suggestedSummary: chapterSummary || undefined,
          customInstructions,
          targetWordCount,
          previousChaptersContext: chapterContext,
          modelId, // Pass user-selected model
        }),
      });

      setProgress(50);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate chapter outline');
      }

      setGeneratedOutline(data.outline);
      setChapterTitle(data.outline.title);
      setChapterSummary(data.outline.summary);
      setProgress(100);
      setStep('outline');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outline');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the full chapter content
  const generateChapter = async () => {
    setIsLoading(true);
    setError('');
    setStep('generating');
    setProgress(10);

    try {
      // Build context from existing chapters
      const chapterContext = existingChapters
        .slice(-2) // Last 2 chapters for continuity
        .map(ch => `Chapter ${ch.number}: ${ch.title}\n${ch.content.substring(0, 500)}...`)
        .join('\n\n---\n\n');

      const response = await fetch('/api/generate/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          bookTitle,
          bookGenre,
          bookAuthor,
          chapterNumber: nextChapterNumber,
          chapterTitle: chapterTitle,
          chapterSummary: chapterSummary,
          customInstructions,
          targetWordCount,
          previousChaptersContext: chapterContext,
          outline: generatedOutline,
          modelId, // Pass user-selected model
        }),
      });

      setProgress(70);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate chapter');
      }

      setGeneratedContent(data.content);
      setProgress(100);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chapter');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept and save the generated chapter
  const acceptChapter = () => {
    const wordCount = generatedContent.trim().split(/\s+/).filter(Boolean).length;
    
    onChapterGenerated({
      id: Date.now(), // Temporary ID until saved
      number: nextChapterNumber,
      title: chapterTitle,
      content: generatedContent,
      wordCount,
      status: 'draft',
      isEdited: true,
    });

    onClose();
  };

  // Regenerate with modifications
  const regenerate = () => {
    setStep('outline');
    setGeneratedContent('');
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-yellow-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-6 py-4 border-b border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                AI Chapter Generator
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Chapter {nextChapterNumber} for &quot;{bookTitle}&quot;
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          {isLoading && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {step === 'generating' ? 'Generating chapter content...' : 'Creating outline...'}
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Outline Configuration */}
          {step === 'outline' && !isLoading && (
            <div className="space-y-5">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 inline" /> How it works
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  1. Provide optional guidance for your new chapter<br />
                  2. AI will generate an outline based on your book&apos;s context<br />
                  3. Review and approve before full chapter generation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Chapter Title (Optional)
                </label>
                <Input
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Leave empty for AI to suggest a title..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Chapter Summary/Direction (Optional)
                </label>
                <Textarea
                  value={chapterSummary}
                  onChange={(e) => setChapterSummary(e.target.value)}
                  placeholder="Describe what should happen in this chapter, key events, character developments..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Additional Instructions (Optional)
                </label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific writing style, tone, or elements to include..."
                  rows={2}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Target Word Count: {targetWordCount.toLocaleString()} words
                </label>
                <input
                  type="range"
                  min={1500}
                  max={8000}
                  step={500}
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1,500</span>
                  <span>4,500</span>
                  <span>8,000</span>
                </div>
              </div>

              {generatedOutline && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clipboard className="w-4 h-4 inline" /> Generated Outline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong className="text-gray-700 dark:text-gray-300">Title:</strong> <span className="text-gray-600 dark:text-gray-400">{generatedOutline.title}</span></p>
                    <p><strong className="text-gray-700 dark:text-gray-300">Summary:</strong> <span className="text-gray-600 dark:text-gray-400">{generatedOutline.summary}</span></p>
                    {generatedOutline.keyPoints && generatedOutline.keyPoints.length > 0 && (
                      <div>
                        <strong className="text-gray-700 dark:text-gray-300">Key Points:</strong>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                          {generatedOutline.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-200 dark:border-yellow-800 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-yellow-500 animate-bounce" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6">
                Writing Your Chapter...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2 max-w-md">
                AI is crafting Chapter {nextChapterNumber} based on your book&apos;s style and the previous chapters for continuity.
              </p>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 inline" /> Chapter Preview
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {generatedContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Chapter {nextChapterNumber}: {chapterTitle}
                </h4>
                <div className="prose dark:prose-invert max-w-none max-h-[400px] overflow-y-auto">
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-serif leading-relaxed">
                    {generatedContent}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong><Lightbulb className="w-4 h-4 inline mr-1" />Tip:</strong> After accepting, you can further edit the chapter in the book editor to make any adjustments.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                Generation Failed
              </h3>
              <p className="text-red-600 dark:text-red-400 text-center mt-2 max-w-md">
                {error}
              </p>
              <Button variant="outline" onClick={regenerate} className="mt-4">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex gap-3">
            {step === 'outline' && !isLoading && (
              <>
                {!generatedOutline ? (
                  <Button variant="primary" onClick={generateOutline}>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Outline
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={generateOutline}>
                      Regenerate Outline
                    </Button>
                    <Button variant="primary" onClick={generateChapter}>
                      <FileText className="w-4 h-4 mr-2" /> Generate Chapter
                    </Button>
                  </>
                )}
              </>
            )}

            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={regenerate}>
                  <RefreshCw className="w-4 h-4 inline mr-1" /> Start Over
                </Button>
                <Button variant="primary" onClick={acceptChapter}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Accept & Add Chapter
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
















