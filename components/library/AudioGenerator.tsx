'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AudioPlayer } from './AudioPlayer';

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

interface AudioGeneratorProps {
  bookId: number;
  bookTitle: string;
  chapters: Chapter[];
  userId: string;
  onAudioGenerated?: (audioData: any) => void;
}

interface GeneratedAudio {
  chapterNumber: number;
  audioUrl: string;
  duration: number;
}

type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export function AudioGenerator({
  bookId,
  bookTitle,
  chapters,
  userId,
  onAudioGenerated,
}: AudioGeneratorProps) {
  const [generationMode, setGenerationMode] = useState<'full' | 'chapters'>('full');
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [showAudioStatus, setShowAudioStatus] = useState(true);
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('alloy');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<'tts-1' | 'tts-1-hd'>('tts-1');

  const voices: { id: VoiceType; name: string; description: string }[] = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
    { id: 'echo', name: 'Echo', description: 'Calm and smooth' },
    { id: 'fable', name: 'Fable', description: 'Warm and expressive' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
    { id: 'nova', name: 'Nova', description: 'Energetic and bright' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' },
  ];

  const toggleChapterSelection = (chapterNumber: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterNumber)
        ? prev.filter((n) => n !== chapterNumber)
        : [...prev, chapterNumber]
    );
  };

  const selectAllChapters = () => {
    setSelectedChapters(chapters.map((ch) => ch.number));
  };

  const clearSelection = () => {
    setSelectedChapters([]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress({ current: 0, total: 0 });
    setGeneratedAudios([]);
    setFullAudioUrl(null);

    try {
      const requestBody = {
        userId,
        bookId: bookId.toString(),
        voice: selectedVoice,
        speed: selectedSpeed,
        model: selectedQuality,
        ...(generationMode === 'chapters' && { chapterNumbers: selectedChapters }),
      };

      console.log('[AudioGenerator] Starting audio generation:', requestBody);

      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        const errorMessage = data.error || data.details || `Server error: ${response.status}`;
        const hint = data.hint ? `\n\nHint: ${data.hint}` : '';
        throw new Error(errorMessage + hint);
      }

      const data = await response.json();
      console.log('[AudioGenerator] API response:', data);

      if (!data.success) {
        throw new Error(data.error || data.details || 'API returned success:false');
      }

      if (data.type === 'full') {
        console.log('[AudioGenerator] Full audiobook generated:', data.audioUrl);
        setFullAudioUrl(data.audioUrl);
        if (onAudioGenerated) {
          onAudioGenerated({ type: 'full', audioUrl: data.audioUrl });
        }
      } else if (data.type === 'chapters') {
        console.log('[AudioGenerator] Chapter audio generated:', data.chapters?.length, 'chapters');
        setGeneratedAudios(data.chapters);
        if (onAudioGenerated) {
          onAudioGenerated({ type: 'chapters', chapters: data.chapters });
        }
      }
    } catch (error) {
      console.error('[AudioGenerator] Audio generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio';
      alert(`Audio Generation Failed\n\n${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatedDuration = () => {
    if (generationMode === 'full') {
      const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      return Math.ceil(totalWords / 150);
    } else {
      const selectedWords = chapters
        .filter((ch) => selectedChapters.includes(ch.number))
        .reduce((sum, ch) => sum + ch.wordCount, 0);
      return Math.ceil(selectedWords / 150);
    }
  };

  const canGenerate =
    generationMode === 'full' || (generationMode === 'chapters' && selectedChapters.length > 0);

  // Calculate audio statistics
  const chaptersWithAudio = chapters.filter(ch => ch.audioUrl).length;
  const totalChapters = chapters.length;
  const audioCompletionPercent = totalChapters > 0 ? (chaptersWithAudio / totalChapters) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Audio Status Overview */}
      {showAudioStatus && (
        <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 rounded-lg border border-yellow-400/30 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎧</div>
              <div>
                <h3 className="text-xl font-bold">Audiobook Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track your chapter audio generation progress</p>
              </div>
            </div>
            <button
              onClick={() => setShowAudioStatus(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">{chaptersWithAudio}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Chapters with Audio</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">{totalChapters - chaptersWithAudio}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Chapters Remaining</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">{audioCompletionPercent.toFixed(0)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${audioCompletionPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {chaptersWithAudio < totalChapters && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGenerationMode('chapters');
                  const chaptersWithoutAudio = chapters
                    .filter(ch => !ch.audioUrl)
                    .map(ch => ch.number);
                  setSelectedChapters(chaptersWithoutAudio);
                }}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded font-medium transition-colors text-sm"
              >
                Generate Missing Chapters ({totalChapters - chaptersWithAudio})
              </button>
            </div>
          )}
        </div>
      )}
      {/* Mode Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-xl font-bold mb-4">Generation Mode</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setGenerationMode('full')}
            className={`p-4 rounded-lg border-2 transition-all ${
              generationMode === 'full'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">📖</div>
            <div className="font-semibold mb-1">Full Book</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Generate complete audiobook</div>
          </button>
          <button
            onClick={() => setGenerationMode('chapters')}
            className={`p-4 rounded-lg border-2 transition-all ${
              generationMode === 'chapters'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">📑</div>
            <div className="font-semibold mb-1">Select Chapters</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Choose specific chapters</div>
          </button>
        </div>
      </div>

      {/* Chapter Selection */}
      {generationMode === 'chapters' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Select Chapters</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllChapters}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chapters.map((chapter) => {
              const isSelected = selectedChapters.includes(chapter.number);
              return (
                <button
                  key={chapter.id}
                  onClick={() => toggleChapterSelection(chapter.number)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-yellow-400 border-yellow-400'
                              : 'border-gray-400 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && <span className="text-black text-xs">✓</span>}
                        </div>
                        <span className="text-gray-500 dark:text-gray-500 text-sm">Chapter {chapter.number}</span>
                        <h4 className="font-semibold">{chapter.title}</h4>
                        {chapter.audioUrl && (
                          <span className="ml-2 text-green-400" title="Audio already generated">
                            🎧✓
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-8 mt-1">
                        {chapter.wordCount.toLocaleString()} words • ~
                        {Math.ceil(chapter.wordCount / 150)} min
                        {chapter.audioUrl && chapter.audioDuration && (
                          <span className="ml-2 text-green-400">
                            • Audio: {Math.floor(chapter.audioDuration / 60)}:{(chapter.audioDuration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChapters.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Selected: </span>
                <span className="font-semibold text-yellow-400">
                  {selectedChapters.length} chapter{selectedChapters.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-xl font-bold mb-4">Voice Settings</h3>
        
        {/* Voice Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Voice</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedVoice === voice.id
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-semibold text-sm">{voice.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{voice.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Speed: {selectedSpeed}x
          </label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={selectedSpeed}
            onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>0.25x (Very Slow)</span>
            <span>1x (Normal)</span>
            <span>4x (Very Fast)</span>
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium mb-2">Quality</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedQuality('tts-1')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedQuality === 'tts-1'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-sm">Standard</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Faster, lower cost</div>
            </button>
            <button
              onClick={() => setSelectedQuality('tts-1-hd')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedQuality === 'tts-1-hd'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-sm">HD</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Higher quality</div>
            </button>
          </div>
        </div>
      </div>

      {/* Generation Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Estimated Duration:</span>
            <p className="font-medium text-lg">~{estimatedDuration()} minutes</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">File Format:</span>
            <p className="font-medium text-lg">MP3</p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        variant="primary"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full py-4 text-lg"
      >
        {isGenerating ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Generating Audio...
          </>
        ) : (
          <>🎙️ Generate Audiobook</>
        )}
      </Button>

      {isGenerating && (
        <div className="bg-yellow-400/10 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            ⏱ This may take several minutes. Please don't close this page.
          </p>
        </div>
      )}

      {/* Generated Audio Results */}
      {fullAudioUrl && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">🎧</div>
              <div className="flex-1">
                <h4 className="font-semibold">Full Audiobook Ready</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your complete audiobook has been generated</p>
              </div>
              <Badge variant="success">Available</Badge>
            </div>
          </div>

          <AudioPlayer
            audioUrl={fullAudioUrl}
            title={`${bookTitle} - Full Audiobook`}
          />

          <a
            href={fullAudioUrl}
            download
            className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-medium rounded transition-colors w-full justify-center"
          >
            ⬇ Download Full Audiobook
          </a>
        </div>
      )}

      {generatedAudios.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-yellow-400">🎧</span>
            Generated Chapter Audio ({generatedAudios.length})
          </h4>
          <div className="space-y-4">
            {generatedAudios.map((audio) => {
              const chapter = chapters.find((ch) => ch.number === audio.chapterNumber);
              return (
                <div
                  key={audio.chapterNumber}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold">
                        Chapter {audio.chapterNumber}
                        {chapter && `: ${chapter.title}`}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Duration: {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">
                      ✓ Ready
                    </Badge>
                  </div>

                  <AudioPlayer
                    audioUrl={audio.audioUrl}
                    showMiniControls={true}
                    className="mb-3"
                  />

                  <a
                    href={audio.audioUrl}
                    download
                    className="inline-flex items-center text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    ⬇ Download Chapter {audio.chapterNumber}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
