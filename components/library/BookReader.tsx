'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { AudioPlayer } from './AudioPlayer';
import { BibliographySection } from './BibliographySection';
import { ContentWithImages } from './ContentWithImages';
import { getDemoUserId } from '@/lib/services/demo-account';
import { Reference, BibliographyConfig } from '@/lib/types/bibliography';
import { BookImageType, ImagePlacement } from '@/lib/types/book-images';
import { sanitizeForReading } from '@/lib/utils/text-sanitizer';

interface ChapterImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  position: number;
  placement: ImagePlacement;
  caption?: string;
  altText?: string;
  chapterId?: number;
  metadata?: {
    size?: 'small' | 'medium' | 'large' | 'full';
    paragraphIndex?: number;
    [key: string]: unknown;
  };
}

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

interface BibliographyData {
  config: BibliographyConfig;
  references: Reference[];
}

interface BookReaderProps {
  bookTitle: string;
  author: string;
  bookId: number;
  chapters: Chapter[];
  initialChapterIndex?: number;
  bibliography?: BibliographyData;
  onClose?: () => void;
  onEdit?: () => void;
  onAudioGenerated?: (chapterNumber: number, audioUrl: string, duration: number) => void;
}

type VoiceType = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer' | 'verse';

interface VoiceInfo {
  id: VoiceType;
  name: string;
  title: string;
  description: string;
  expertise: string[];
  gender: 'neutral' | 'masculine' | 'feminine';
  style: string;
  gradient: string;
}

export const BookReader: React.FC<BookReaderProps> = ({
  bookTitle,
  author,
  bookId,
  chapters,
  initialChapterIndex = 0,
  bibliography,
  onClose,
  onEdit,
  onAudioGenerated,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showChapterList, setShowChapterList] = useState(false);
  const [chaptersData, setChaptersData] = useState<Chapter[]>(chapters);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [showBibliography, setShowBibliography] = useState(false);
  
  // Chapter images state
  const [allBookImages, setAllBookImages] = useState<ChapterImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Check if bibliography should be available (after last chapter or explicit view)
  const hasBibliography = bibliography?.config?.enabled && bibliography?.references?.length > 0;

  const currentChapter = chaptersData[currentChapterIndex];
  
  // Filter images for current chapter
  const currentChapterImages = useMemo(() => {
    if (!currentChapter) return [];
    return allBookImages.filter(img => img.chapterId === currentChapter.id);
  }, [allBookImages, currentChapter]);

  // Fetch all book images on mount
  useEffect(() => {
    const fetchImages = async () => {
      if (!bookId) return;
      
      setIsLoadingImages(true);
      try {
        const response = await fetch(`/api/books/${bookId}/images`);
        const data = await response.json();
        
        if (data.success && data.images) {
          setAllBookImages(data.images);
        }
      } catch (error) {
        console.error('[BookReader] Error fetching images:', error);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchImages();
  }, [bookId]);

  // Professional voice definitions - All 11 OpenAI voices
  const voices: VoiceInfo[] = [
    { 
      id: 'nova', 
      name: 'Victoria Sterling',
      title: 'Executive Narrator',
      description: 'Polished and professional with excellent pacing.',
      expertise: ['Business', 'Leadership', 'Biography'],
      gender: 'feminine',
      style: 'Warm & Professional',
      gradient: 'from-rose-500 to-pink-600',
    },
    { 
      id: 'alloy', 
      name: 'Morgan Blake',
      title: 'Versatile Presenter',
      description: 'Balanced and adaptable, delivering content with clarity.',
      expertise: ['Education', 'Training', 'Corporate'],
      gender: 'neutral',
      style: 'Clear & Articulate',
      gradient: 'from-violet-500 to-purple-600',
    },
    { 
      id: 'ash', 
      name: 'Alexander Grey',
      title: 'Senior Narrator',
      description: 'Deep and resonant voice with gravitas.',
      expertise: ['Drama', 'Thriller', 'Documentary'],
      gender: 'masculine',
      style: 'Deep & Commanding',
      gradient: 'from-stone-500 to-zinc-700',
    },
    { 
      id: 'ballad', 
      name: 'Sophia Nightingale',
      title: 'Story Weaver',
      description: 'Melodic and emotive voice that brings stories to life.',
      expertise: ['Romance', 'Drama', 'Literary Fiction'],
      gender: 'feminine',
      style: 'Melodic & Emotive',
      gradient: 'from-pink-400 to-rose-600',
    },
    { 
      id: 'coral', 
      name: 'Camille Rose',
      title: 'Dynamic Host',
      description: 'Warm and energetic with infectious enthusiasm.',
      expertise: ['Adventure', 'Lifestyle', 'Memoir'],
      gender: 'feminine',
      style: 'Warm & Energetic',
      gradient: 'from-orange-400 to-red-500',
    },
    { 
      id: 'echo', 
      name: 'Sebastian Cross',
      title: 'Distinguished Scholar',
      description: 'Refined and contemplative with intellectual depth.',
      expertise: ['Philosophy', 'Academic', 'Documentary'],
      gender: 'masculine',
      style: 'Thoughtful & Measured',
      gradient: 'from-slate-500 to-gray-600',
    },
    { 
      id: 'fable', 
      name: 'Aurora Winters',
      title: 'Creative Director',
      description: 'Expressive and dynamic with exceptional range.',
      expertise: ['Fantasy', 'Children\'s', 'Adventure'],
      gender: 'neutral',
      style: 'Dynamic & Expressive',
      gradient: 'from-amber-500 to-orange-600',
    },
    { 
      id: 'onyx', 
      name: 'Marcus Ashford',
      title: 'Senior Correspondent',
      description: 'Commanding presence with authoritative delivery.',
      expertise: ['Journalism', 'Mystery', 'History'],
      gender: 'masculine',
      style: 'Authoritative & Bold',
      gradient: 'from-emerald-500 to-teal-600',
    },
    { 
      id: 'sage', 
      name: 'Professor Elena Sage',
      title: 'Knowledge Guide',
      description: 'Patient and wise with a natural teaching quality.',
      expertise: ['Education', 'Science', 'How-To'],
      gender: 'feminine',
      style: 'Patient & Wise',
      gradient: 'from-indigo-500 to-purple-600',
    },
    { 
      id: 'shimmer', 
      name: 'Isabella Chen',
      title: 'Wellness Director',
      description: 'Gentle and soothing with a calming presence.',
      expertise: ['Wellness', 'Meditation', 'Self-Help'],
      gender: 'feminine',
      style: 'Calming & Intimate',
      gradient: 'from-cyan-500 to-blue-600',
    },
    { 
      id: 'verse', 
      name: 'Julian Verse',
      title: 'Literary Artist',
      description: 'Poetic and artistic with a lyrical quality.',
      expertise: ['Poetry', 'Literature', 'Arts'],
      gender: 'masculine',
      style: 'Poetic & Lyrical',
      gradient: 'from-fuchsia-500 to-purple-600',
    },
  ];

  // Sync chapters data when prop changes
  useEffect(() => {
    setChaptersData(chapters);
  }, [chapters]);

  const goToNextChapter = () => {
    if (showBibliography) {
      // Already on bibliography, can't go further
      return;
    }
    if (currentChapterIndex < chaptersData.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false);
    } else if (hasBibliography) {
      // On last chapter, go to bibliography
      setShowBibliography(true);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false);
    }
  };

  const goToPreviousChapter = () => {
    if (showBibliography) {
      // On bibliography, go back to last chapter
      setShowBibliography(false);
      setCurrentChapterIndex(chaptersData.length - 1);
      window.scrollTo(0, 0);
      return;
    }
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
      setShowAudioPlayer(false);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    setShowBibliography(false);
    window.scrollTo(0, 0);
    setShowAudioPlayer(false);
  };

  const goToBibliography = () => {
    setShowBibliography(true);
    setShowChapterList(false);
    window.scrollTo(0, 0);
    setShowAudioPlayer(false);
  };

  const handleGenerateChapterAudio = async (voice: VoiceType | null = selectedVoice) => {
    if (!voice) {
      alert('Please select a voice first');
      return;
    }
    setIsGeneratingAudio(true);
    setShowVoiceSelector(false);
    
    console.log(`[BookReader] Generating audio for Chapter ${currentChapter.number} with voice: ${voice}`);
    
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: bookId.toString(),
          provider: 'openai', // BookReader uses OpenAI voices
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
    if (currentChapter.audioUrl && !showAudioPlayer) {
      // If audio exists and player is hidden, show the player
      setShowAudioPlayer(true);
    } else if (currentChapter.audioUrl && showAudioPlayer) {
      // If audio exists and player is shown, hide it
      setShowAudioPlayer(false);
    } else {
      // If no audio, show voice selector to generate
      setShowVoiceSelector(true);
    }
  };

  const handleRegenerateAudio = () => {
    // Allow regeneration even when audio exists
    setShowVoiceSelector(true);
  };

  const handleDownloadAudio = async () => {
    if (!currentChapter.audioUrl) return;
    
    try {
      // Fetch the file as a blob to force download (cross-origin URLs won't download directly)
      const response = await fetch(currentChapter.audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Chapter_${currentChapter.number}_${currentChapter.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after download starts
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab where user can manually save
      window.open(currentChapter.audioUrl, '_blank');
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
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
                Back
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
                    <span className="text-sm">Generating Ch. {currentChapter.number}...</span>
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
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">🎙️</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {currentChapter.audioUrl ? 'Regenerate Audio' : 'Choose Voice'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Chapter {currentChapter.number}: {currentChapter.title}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {voices.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`w-full p-3 text-left transition-all border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                            selectedVoice === voice.id
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${voice.gradient} shadow-md`}>
                              <span className="text-white text-lg">
                                {voice.gender === 'feminine' ? '👩' : voice.gender === 'masculine' ? '👨' : '🎭'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">{voice.name}</span>
                                {selectedVoice === voice.id && (
                                  <span className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs text-black font-bold">✓</span>
                                )}
                              </div>
                              <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{voice.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{voice.style}</div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {voice.expertise.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Selected Voice Preview */}
                    {selectedVoiceInfo ? (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedVoiceInfo.gradient} shadow-md`}>
                            <span className="text-white">
                              {selectedVoiceInfo.gender === 'feminine' ? '👩' : selectedVoiceInfo.gender === 'masculine' ? '👨' : '🎭'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{selectedVoiceInfo.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{selectedVoiceInfo.style}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-500">{selectedSpeed}x</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">speed</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 text-center animate-pulse">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">Please select a voice to generate audio</span>
                      </div>
                    )}

                    {/* Speed Control */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Narration Speed</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedSpeed < 0.8 ? 'Slower' : selectedSpeed > 1.2 ? 'Faster' : 'Normal'}
                        </span>
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
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>0.5x</span>
                        <span>1.0x</span>
                        <span>2.0x</span>
                      </div>
                    </div>

                    {/* Generate/Regenerate Button */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      {currentChapter.audioUrl && (
                        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>This will replace the existing audio with the new voice.</span>
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleGenerateChapterAudio(selectedVoice)}
                        disabled={!selectedVoice}
                        className={`w-full py-3.5 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                          !selectedVoice 
                            ? 'bg-gray-300 cursor-not-allowed opacity-50' 
                            : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 shadow-yellow-500/20 hover:shadow-yellow-500/30'
                        }`}
                      >
                        <span>🎙️</span>
                        <span>{currentChapter.audioUrl ? 'Regenerate' : 'Generate'} {selectedVoiceInfo ? `with ${selectedVoiceInfo.name}` : ''}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
                title="Edit this book"
              >
                <span>✏️</span>
                <span className="text-sm">Edit</span>
              </button>
            )}

            {/* Chapter Navigator */}
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 px-3 py-2 rounded transition-colors text-gray-900 dark:text-white"
            >
              <span className="text-sm">
                {showBibliography 
                  ? `📚 Bibliography` 
                  : `Chapter ${currentChapter.number} of ${chaptersData.length}${hasBibliography ? ' (+📚)' : ''}`
                }
              </span>
              <span className="text-xs">{showChapterList ? '▲' : '▼'}</span>
            </button>

            <Badge variant="info">
              {showBibliography 
                ? `${bibliography?.references?.length || 0} references` 
                : `${currentChapter.wordCount.toLocaleString()} words`
              }
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
                    index === currentChapterIndex && !showBibliography ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : ''
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
                    {index === currentChapterIndex && !showBibliography && (
                      <Badge variant="success" size="sm">Reading</Badge>
                    )}
                  </div>
                </button>
              ))}
              
              {/* Bibliography option in chapter list */}
              {hasBibliography && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  <button
                    onClick={goToBibliography}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white ${
                      showBibliography ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          <span>📚</span> Bibliography
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {bibliography?.references?.length || 0} references
                        </div>
                      </div>
                      {showBibliography && (
                        <Badge variant="success" size="sm">Viewing</Badge>
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Bibliography View */}
          {showBibliography && hasBibliography ? (
            <>
              {/* Bibliography Content */}
              <BibliographySection
                references={bibliography!.references}
                config={bibliography!.config}
                title="Bibliography"
              />

              {/* Bibliography Navigation */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousChapter}
                >
                  ← Back to Last Chapter
                </Button>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 justify-center">
                    <span>📚</span> Bibliography
                  </div>
                  <div className="text-xs mt-1">
                    {bibliography?.references?.length || 0} references • {bibliography?.config?.citationStyle} style
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={onClose}
                >
                  Finish Reading
                </Button>
              </div>
            </>
          ) : (
            <>
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
                </div>
              </div>

              {/* Chapter Content - With Images */}
              <div 
                className={`prose prose-gray dark:prose-invert max-w-none ${fontSizeClasses[fontSize]} ${lineHeightClasses[fontSize]}`}
                style={{
                  fontFamily: 'Georgia, serif',
                }}
              >
                {currentChapterImages.length > 0 ? (
                  <ContentWithImages
                    content={sanitizeForReading(currentChapter.content)}
                    images={currentChapterImages}
                    fontSize={fontSize}
                    isEditing={false}
                  />
                ) : (
                  // Fallback to simple paragraph rendering when no images
                  sanitizeForReading(currentChapter.content).split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-800 dark:text-gray-200 text-justify">
                      {paragraph}
                    </p>
                  ))
                )}
              </div>
              
              {/* Images indicator */}
              {currentChapterImages.length > 0 && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  🖼️ {currentChapterImages.length} image{currentChapterImages.length !== 1 ? 's' : ''} in this chapter
                </div>
              )}

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
                  variant={currentChapterIndex === chaptersData.length - 1 && hasBibliography ? 'primary' : 'outline'}
                  onClick={goToNextChapter}
                  disabled={currentChapterIndex === chaptersData.length - 1 && !hasBibliography}
                >
                  {currentChapterIndex === chaptersData.length - 1 && hasBibliography 
                    ? 'View Bibliography →' 
                    : 'Next Chapter →'
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Navigation Bar (bottom) */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {showBibliography ? (
                <>Viewing: <span className="text-gray-900 dark:text-white font-medium">📚 Bibliography</span></>
              ) : (
                <>Reading: <span className="text-gray-900 dark:text-white font-medium">{currentChapter.title}</span></>
              )}
            </span>
            {!showBibliography && currentChapter.audioUrl && (
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
              disabled={currentChapterIndex === 0 && !showBibliography}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
              title="Previous"
            >
              ◀
            </button>
            
            <div className="w-64 bg-gray-200 dark:bg-gray-800 rounded-full h-2 mx-4">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ 
                  width: showBibliography 
                    ? '100%' 
                    : `${((currentChapterIndex + 1) / (chaptersData.length + (hasBibliography ? 1 : 0))) * 100}%` 
                }}
              />
            </div>

            <button
              onClick={goToNextChapter}
              disabled={(currentChapterIndex === chaptersData.length - 1 && !hasBibliography) || showBibliography}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-900 dark:text-white"
              title="Next"
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
