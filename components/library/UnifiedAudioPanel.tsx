'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Check, 
  Loader2, 
  Volume2,
  ChevronDown,
  Settings,
  Zap,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import JSZip from 'jszip';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioMetadata?: any;
}

interface AudioPreferences {
  provider: 'openai' | 'gemini';
  voice: string | null;
  speed: number;
  quality: 'standard' | 'hd';
}

interface UnifiedAudioPanelProps {
  bookId: number;
  bookTitle: string;
  chapters: Chapter[];
  onAudioGenerated?: (audioData: any) => void;
  preferences?: AudioPreferences;
  onPreferencesChange?: (prefs: AudioPreferences) => void;
}

// Default preferences
const defaultPreferences: AudioPreferences = {
  provider: 'openai',
  voice: null,
  speed: 1.0,
  quality: 'hd',
};

// Voice options per provider
const voiceOptions = {
  openai: [
    { id: 'nova', name: 'Nova', gender: 'female', style: 'Warm & Professional' },
    { id: 'alloy', name: 'Alloy', gender: 'neutral', style: 'Balanced & Clear' },
    { id: 'echo', name: 'Echo', gender: 'male', style: 'Deep & Resonant' },
    { id: 'fable', name: 'Fable', gender: 'male', style: 'British Storyteller' },
    { id: 'onyx', name: 'Onyx', gender: 'male', style: 'Authoritative' },
    { id: 'shimmer', name: 'Shimmer', gender: 'female', style: 'Light & Expressive' },
  ],
  gemini: [
    { id: 'Zephyr', name: 'Zephyr', gender: 'female', style: 'Warm & Confident' },
    { id: 'Puck', name: 'Puck', gender: 'male', style: 'Playful & Energetic' },
    { id: 'Charon', name: 'Charon', gender: 'male', style: 'Deep & Mystical' },
    { id: 'Kore', name: 'Kore', gender: 'female', style: 'Clear & Nurturing' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'male', style: 'Intense & Dramatic' },
    { id: 'Aoede', name: 'Aoede', gender: 'female', style: 'Musical & Melodic' },
  ],
};

const speedOptions = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5];

export function UnifiedAudioPanel({
  bookId,
  bookTitle,
  chapters,
  onAudioGenerated,
  preferences: externalPrefs,
  onPreferencesChange,
}: UnifiedAudioPanelProps) {
  const [preferences, setPreferences] = useState<AudioPreferences>(externalPrefs || defaultPreferences);
  const [showSettings, setShowSettings] = useState(false);
  const [generatingChapters, setGeneratingChapters] = useState<Set<number>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [playingChapter, setPlayingChapter] = useState<number | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});

  // Initialize audio URLs from chapters
  useEffect(() => {
    const urls: Record<number, string> = {};
    chapters.forEach(ch => {
      if (ch.audioUrl) {
        urls[ch.number] = ch.audioUrl;
      }
    });
    setAudioUrls(urls);
  }, [chapters]);

  // Sync preferences with external state
  useEffect(() => {
    if (externalPrefs) {
      setPreferences(externalPrefs);
    }
  }, [externalPrefs]);

  const handlePreferencesChange = (newPrefs: Partial<AudioPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    onPreferencesChange?.(updated);
  };

  // Generate audio for a single chapter
  const generateChapterAudio = async (chapter: Chapter) => {
    if (!preferences.voice) {
      alert('Please select a voice first');
      setShowSettings(true);
      return;
    }
    setGeneratingChapters(prev => new Set(prev).add(chapter.number));
    
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          chapterId: chapter.id,
          chapterNumber: chapter.number,
          text: chapter.content,
          voice: preferences.voice,
          provider: preferences.provider,
          speed: preferences.speed,
          quality: preferences.quality,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        setAudioUrls(prev => ({ ...prev, [chapter.number]: data.audioUrl }));
        onAudioGenerated?.(data);
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setGeneratingChapters(prev => {
        const next = new Set(prev);
        next.delete(chapter.number);
        return next;
      });
    }
  };

  // Generate all missing audio
  const generateAllMissing = async () => {
    if (!preferences.voice) {
      alert('Please select a voice first');
      setShowSettings(true);
      return;
    }
    const missingChapters = chapters.filter(ch => !audioUrls[ch.number]);
    if (missingChapters.length === 0) return;

    setGeneratingAll(true);
    
    for (const chapter of missingChapters) {
      await generateChapterAudio(chapter);
    }
    
    setGeneratingAll(false);
  };

  // Download all audio as ZIP
  const downloadAllAsZip = async () => {
    const chaptersWithAudio = chapters.filter(ch => audioUrls[ch.number]);
    if (chaptersWithAudio.length === 0) return;

    setDownloadingZip(true);
    
    try {
      const zip = new JSZip();
      
      for (const chapter of chaptersWithAudio) {
        const url = audioUrls[chapter.number];
        if (!url) continue;
        
        const response = await fetch(url);
        const blob = await response.blob();
        const fileName = `${String(chapter.number).padStart(2, '0')}_${chapter.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
        zip.file(fileName, blob);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_audiobook.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error creating ZIP:', error);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Stats
  const totalChapters = chapters.length;
  const chaptersWithAudio = Object.keys(audioUrls).length;
  const missingCount = totalChapters - chaptersWithAudio;
  const currentVoice = voiceOptions[preferences.provider].find(v => v.id === preferences.voice);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Audiobook</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chaptersWithAudio}/{totalChapters} chapters generated
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {missingCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={generateAllMissing}
              disabled={generatingAll || !preferences.voice}
              className="flex items-center gap-1.5"
            >
              {generatingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate All ({missingCount})
                </>
              )}
            </Button>
          )}
          {chaptersWithAudio > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAllAsZip}
              disabled={downloadingZip}
              className="flex items-center gap-1.5"
            >
              {downloadingZip ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              Download ZIP
            </Button>
          )}
        </div>
      </div>

      {/* Settings Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          {/* Provider & Voice Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Narrator:</span>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                  !preferences.voice 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Volume2 className="w-4 h-4 text-purple-500" />
                <span>{currentVoice?.name || 'Select Voice'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Provider</div>
                    <div className="flex gap-2">
                      {(['openai', 'gemini'] as const).map(provider => (
                        <button
                          key={provider}
                          onClick={() => {
                            handlePreferencesChange({ 
                              provider, 
                              voice: null 
                            });
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            preferences.provider === provider
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent'
                          }`}
                        >
                          {provider === 'openai' ? 'OpenAI' : 'Gemini'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Voice</div>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                      {voiceOptions[preferences.provider].map(voice => (
                        <button
                          key={voice.id}
                          onClick={() => handlePreferencesChange({ voice: voice.id })}
                          className={`px-2 py-1.5 rounded text-xs text-left transition-colors ${
                            preferences.voice === voice.id
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-gray-500 dark:text-gray-500 truncate">{voice.style}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Speed</div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{preferences.speed}x</span>
                    </div>
                    <div className="flex gap-1">
                      {speedOptions.map(speed => (
                        <button
                          key={speed}
                          onClick={() => handlePreferencesChange({ speed })}
                          className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            preferences.speed === speed
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quality Badge */}
          <Badge variant="default" size="sm" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            HD Quality
          </Badge>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Chapters List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
        {chapters.map(chapter => {
          const hasAudio = !!audioUrls[chapter.number];
          const isGenerating = generatingChapters.has(chapter.number);
          const isPlaying = playingChapter === chapter.number;
          
          return (
            <div
              key={chapter.id}
              className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                isPlaying ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isGenerating ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  hasAudio ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                  ) : hasAudio ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Chapter Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Ch {chapter.number}</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate">{chapter.title}</span>
                  </div>
                  {hasAudio && chapter.audioDuration && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.floor(chapter.audioDuration / 60)}:{String(chapter.audioDuration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                {hasAudio ? (
                  <>
                    <button
                      onClick={() => setPlayingChapter(isPlaying ? null : chapter.number)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => generateChapterAudio(chapter)}
                      disabled={isGenerating || !preferences.voice}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                      title="Regenerate"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                    <a
                      href={audioUrls[chapter.number]}
                      download={`${chapter.title}.mp3`}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <button
                    onClick={() => generateChapterAudio(chapter)}
                    disabled={isGenerating || !preferences.voice}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Generate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Playing Audio */}
      {playingChapter && audioUrls[playingChapter] && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {chapters.find(ch => ch.number === playingChapter)?.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chapter {playingChapter}</p>
            </div>
          </div>
          <audio
            src={audioUrls[playingChapter]}
            controls
            autoPlay
            className="w-full"
            onEnded={() => setPlayingChapter(null)}
          />
        </div>
      )}
    </div>
  );
}
