'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { AudioPlayer } from './AudioPlayer';
import { getDemoUserId } from '@/lib/services/demo-account';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioMetadata?: any;
}

interface BookReaderProps {
  bookTitle: string;
  author: string;
  bookId: number;
  chapters: Chapter[];
  onClose?: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({
  bookTitle,
  author,
  bookId,
  chapters,
  onClose,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showChapterList, setShowChapterList] = useState(false);
  const [chaptersData, setChaptersData] = useState<Chapter[]>(chapters);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const currentChapter = chaptersData[currentChapterIndex];

  const goToNextChapter = () => {
    if (currentChapterIndex < chaptersData.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false); // Hide audio player when changing chapters
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false); // Hide audio player when changing chapters
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
    setShowAudioPlayer(false); // Hide audio player when changing chapters
  };

  const handleGenerateChapterAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: bookId.toString(),
          chapterNumbers: [currentChapter.number],
          voice: 'alloy',
          speed: 1.0,
          model: 'tts-1',
        }),
      });

      const data = await response.json();
      if (data.success && data.type === 'chapters' && data.chapters.length > 0) {
        const audioData = data.chapters[0];
        // Update current chapter with audio URL
        const updatedChapters = [...chaptersData];
        updatedChapters[currentChapterIndex] = {
          ...updatedChapters[currentChapterIndex],
          audioUrl: audioData.audioUrl,
          audioDuration: audioData.duration,
        };
        setChaptersData(updatedChapters);
        setShowAudioPlayer(true);
      } else {
        alert('Failed to generate audio: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Failed to generate chapter audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const toggleAudioPlayer = () => {
    if (currentChapter.audioUrl) {
      setShowAudioPlayer(!showAudioPlayer);
    } else {
      // If no audio exists, ask to generate
      if (confirm('Generate audio for this chapter?')) {
        handleGenerateChapterAudio();
      }
    }
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const lineHeightClasses = {
    sm: 'leading-relaxed',
    base: 'leading-relaxed',
    lg: 'leading-loose',
    xl: 'leading-loose',
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 overflow-hidden flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-white dark:bg-black px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">{bookTitle}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">by {author}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded px-2 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Font:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs rounded ${fontSize === 'sm' ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-2 py-1 text-sm rounded ${fontSize === 'base' ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-base rounded ${fontSize === 'lg' ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-2 py-1 text-lg rounded ${fontSize === 'xl' ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                A
              </button>
            </div>

            {/* Chapter Navigator */}
            {/* Read Aloud Button */}
            <button
              onClick={toggleAudioPlayer}
              disabled={isGeneratingAudio}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-2 rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={currentChapter.audioUrl ? 'Toggle audio player' : 'Generate & play audio'}
            >
              {isGeneratingAudio ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span className="text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <span>🎧</span>
                  <span className="text-sm">Read Aloud</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 px-3 py-2 rounded transition-colors text-gray-900 dark:text-white"
            >
              <span className="text-sm">
                Chapter {currentChapter.number} of {chaptersData.length}
              </span>
              <span className="text-xs">{showChapterList ? '▲' : '▼'}</span>
            </button>

            <Badge variant="info">
              {currentChapter.wordCount.toLocaleString()} words
            </Badge>
          </div>
        </div>

        {/* Chapter List Dropdown */}
        {showChapterList && (
          <div className="absolute right-4 top-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto w-80 z-50">
            <div className="p-2">
              <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 px-2 py-1">Chapters</h3>
              {chaptersData.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white ${
                    index === currentChapterIndex ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        Chapter {chapter.number}: {chapter.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                        {chapter.wordCount.toLocaleString()} words
                        {chapter.audioUrl && <span title="Audio available">🎧</span>}
                      </div>
                    </div>
                    {index === currentChapterIndex && (
                      <Badge variant="success" size="sm">Reading</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Audio Player (sticky) */}
          {showAudioPlayer && currentChapter.audioUrl && (
            <div className="mb-6 sticky top-0 z-10">
              <AudioPlayer
                audioUrl={currentChapter.audioUrl}
                title={`Chapter ${currentChapter.number}: ${currentChapter.title}`}
                showMiniControls={true}
                onEnded={() => {
                  // Auto-advance to next chapter when audio ends
                  if (currentChapterIndex < chaptersData.length - 1) {
                    goToNextChapter();
                  }
                }}
              />
            </div>
          )}
          {/* Chapter Header */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
            <Badge variant="warning" size="sm" className="mb-2">
              Chapter {currentChapter.number}
            </Badge>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{currentChapter.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{currentChapter.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>~{Math.ceil(currentChapter.wordCount / 200)} min read</span>
              {currentChapter.status === 'draft' && (
                <>
                  <span>•</span>
                  <Badge variant="default" size="sm">Draft</Badge>
                </>
              )}
            </div>
          </div>

          {/* Chapter Content */}
          <div 
            className={`prose prose-gray dark:prose-invert max-w-none ${fontSizeClasses[fontSize]} ${lineHeightClasses[fontSize]}`}
            style={{
              fontFamily: 'Georgia, serif',
            }}
          >
            {currentChapter.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-800 dark:text-gray-200 text-justify">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Chapter Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
            >
              ← Previous Chapter
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <div>Chapter {currentChapter.number} of {chaptersData.length}</div>
              <div className="text-xs mt-1">
                Progress: {Math.round(((currentChapterIndex + 1) / chaptersData.length) * 100)}%
              </div>
            </div>

            <Button
              variant="outline"
              onClick={goToNextChapter}
              disabled={currentChapterIndex === chaptersData.length - 1}
            >
              Next Chapter →
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Navigation Bar (bottom) */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Reading: <span className="text-gray-900 dark:text-white font-medium">{currentChapter.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
              title="Previous Chapter"
            >
              ◀
            </button>
            
            <div className="w-64 bg-gray-200 dark:bg-gray-800 rounded-full h-2 mx-4">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${((currentChapterIndex + 1) / chaptersData.length) * 100}%` }}
              />
            </div>

            <button
              onClick={goToNextChapter}
              disabled={currentChapterIndex === chaptersData.length - 1}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
              title="Next Chapter"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
