'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  initialChapterIndex?: number;
  onClose?: () => void;
  onAudioGenerated?: (chapterNumber: number, audioUrl: string, duration: number) => void;
}

type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceInfo {
  id: VoiceType;
  name: string;
  character: string;
  tone: string;
  gender: 'neutral' | 'masculine' | 'feminine';
}

export const BookReader: React.FC<BookReaderProps> = ({
  bookTitle,
  author,
  bookId,
  chapters,
  initialChapterIndex = 0,
  onClose,
  onAudioGenerated,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showChapterList, setShowChapterList] = useState(false);
  const [chaptersData, setChaptersData] = useState<Chapter[]>(chapters);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('nova');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);

  const currentChapter = chaptersData[currentChapterIndex];

  // Voice options with descriptions
  const voices: VoiceInfo[] = [
    { id: 'nova', name: 'Nova', character: 'The Storyteller', tone: 'Warm & Engaging', gender: 'feminine' },
    { id: 'alloy', name: 'Alloy', character: 'The Versatile', tone: 'Clear & Balanced', gender: 'neutral' },
    { id: 'echo', name: 'Echo', character: 'The Philosopher', tone: 'Calm & Thoughtful', gender: 'masculine' },
    { id: 'fable', name: 'Fable', character: 'The Enchanter', tone: 'Expressive & Theatrical', gender: 'neutral' },
    { id: 'onyx', name: 'Onyx', character: 'The Commander', tone: 'Deep & Authoritative', gender: 'masculine' },
    { id: 'shimmer', name: 'Shimmer', character: 'The Gentle Guide', tone: 'Soft & Soothing', gender: 'feminine' },
  ];

  // Sync chapters data when prop changes
  useEffect(() => {
    setChaptersData(chapters);
  }, [chapters]);

  const goToNextChapter = () => {
    if (currentChapterIndex < chaptersData.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false);
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
    setShowAudioPlayer(false);
  };

  const handleGenerateChapterAudio = async (voice: VoiceType = selectedVoice) => {
    setIsGeneratingAudio(true);
    setShowVoiceSelector(false);
    
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: bookId.toString(),
          chapterNumbers: [currentChapter.number],
          voice: voice,
          speed: selectedSpeed,
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
          audioMetadata: {
            voice: voice,
            speed: selectedSpeed,
            generatedAt: new Date().toISOString(),
          },
        };
        setChaptersData(updatedChapters);
        setShowAudioPlayer(true);
        
        // Notify parent component about the new audio
        if (onAudioGenerated) {
          onAudioGenerated(currentChapter.number, audioData.audioUrl, audioData.duration);
        }
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
      setShowVoiceSelector(true);
    }
  };

  const handleDownloadAudio = () => {
    if (currentChapter.audioUrl) {
      const link = document.createElement('a');
      link.href = currentChapter.audioUrl;
      link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Chapter_${currentChapter.number}_${currentChapter.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  const selectedVoiceInfo = voices.find(v => v.id === selectedVoice);

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
              {(['sm', 'base', 'lg', 'xl'] as const).map((size, idx) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 rounded transition-all ${
                    fontSize === size 
                      ? 'bg-yellow-400 text-black' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={{ fontSize: `${0.75 + idx * 0.125}rem` }}
                >
                  A
                </button>
              ))}
            </div>

            {/* Read Aloud Button with Voice Indicator */}
            <div className="relative">
              <button
                onClick={toggleAudioPlayer}
                disabled={isGeneratingAudio}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentChapter.audioUrl
                    ? 'bg-green-500 hover:bg-green-400 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                }`}
                title={currentChapter.audioUrl ? 'Play audio / Show player' : 'Generate audio for this chapter'}
              >
                {isGeneratingAudio ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Generating...</span>
                  </>
                ) : currentChapter.audioUrl ? (
                  <>
                    <span>🎧</span>
                    <span className="text-sm">{showAudioPlayer ? 'Hide Player' : 'Play Audio'}</span>
                  </>
                ) : (
                  <>
                    <span>🎙️</span>
                    <span className="text-sm">Read Aloud</span>
                  </>
                )}
              </button>

              {/* Voice Selector Dropdown */}
              {showVoiceSelector && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowVoiceSelector(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <h3 className="font-bold text-gray-900 dark:text-white">Choose Voice</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Select a narrator for this chapter</p>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {voices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`w-full p-3 text-left transition-all border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                            selectedVoice === voice.id
                              ? 'bg-yellow-50 dark:bg-yellow-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                              voice.gender === 'feminine' 
                                ? 'bg-pink-100 dark:bg-pink-900/30' 
                                : voice.gender === 'masculine'
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-purple-100 dark:bg-purple-900/30'
                            }`}>
                              {voice.gender === 'feminine' ? '👩' : voice.gender === 'masculine' ? '👨' : '🎭'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">{voice.name}</span>
                                {selectedVoice === voice.id && (
                                  <span className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs text-black">✓</span>
                                )}
                              </div>
                              <div className="text-xs text-yellow-600 dark:text-yellow-400">{voice.character}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{voice.tone}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Speed Control */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speed</span>
                        <span className="text-sm font-bold text-yellow-500">{selectedSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={selectedSpeed}
                        onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-yellow-400"
                      />
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleGenerateChapterAudio(selectedVoice)}
                        className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <span>🎙️</span>
                        Generate with {selectedVoiceInfo?.name}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Download Button (if audio exists) */}
            {currentChapter.audioUrl && (
              <button
                onClick={handleDownloadAudio}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download audio"
              >
                <span>⬇️</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Download</span>
              </button>
            )}

            {/* Chapter Navigator */}
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
                        {chapter.audioUrl && (
                          <span className="text-green-500" title="Audio available">🎧 Audio</span>
                        )}
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                      🎧
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        Chapter {currentChapter.number}: {currentChapter.title}
                      </h4>
                      {currentChapter.audioMetadata?.voice && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Voice: {voices.find(v => v.id === currentChapter.audioMetadata.voice)?.name || currentChapter.audioMetadata.voice}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAudio}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      title="Download audio"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => setShowAudioPlayer(false)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                      title="Hide player"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <AudioPlayer
                  audioUrl={currentChapter.audioUrl}
                  showMiniControls={true}
                  onEnded={() => {
                    // Auto-advance to next chapter when audio ends
                    if (currentChapterIndex < chaptersData.length - 1) {
                      goToNextChapter();
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Chapter Header */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="warning" size="sm">
                Chapter {currentChapter.number}
              </Badge>
              {currentChapter.audioUrl && (
                <Badge variant="success" size="sm">
                  🎧 Audio Available
                </Badge>
              )}
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{currentChapter.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{currentChapter.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>~{Math.ceil(currentChapter.wordCount / 200)} min read</span>
              {currentChapter.audioDuration && (
                <>
                  <span>•</span>
                  <span>🎧 {Math.floor(currentChapter.audioDuration / 60)}:{(currentChapter.audioDuration % 60).toString().padStart(2, '0')} listen</span>
                </>
              )}
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
            {currentChapter.audioUrl && (
              <button
                onClick={() => setShowAudioPlayer(true)}
                className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1"
              >
                🎧 Play Audio
              </button>
            )}
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

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
