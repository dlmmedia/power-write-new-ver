'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, 
  Mic, 
  Download, 
  Play, 
  Pause, 
  Square,
  Check, 
  Clock, 
  BarChart3, 
  Zap, 
  Sparkles,
  Book, 
  FileAudio,
  Archive,
  Volume2,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Music,
  Radio,
  User,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  Star,
  Package,
  Globe,
  Feather,
  Compass,
  Moon,
  Sun,
  Wind,
  Flame,
  Cloud,
  Leaf,
  Waves,
  Mountain,
  Cpu,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CollapsibleSection, CollapsibleItem } from '@/components/ui/CollapsibleSection';
import { AudioPlayer } from './AudioPlayer';
import JSZip from 'jszip';
import type { TTSProvider, GeminiVoiceId, OpenAIVoiceId } from '@/lib/services/tts-service';

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

interface AudioGeneratorCompactProps {
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

type VoiceType = OpenAIVoiceId | GeminiVoiceId;

interface VoiceInfo {
  id: VoiceType;
  name: string;
  title: string;
  description: string;
  expertise: string[];
  gender: 'neutral' | 'masculine' | 'feminine';
  style: string;
  icon: React.ElementType;
  gradient: string;
  provider: TTSProvider;
}

export function AudioGeneratorCompact({
  bookId,
  bookTitle,
  chapters,
  userId,
  onAudioGenerated,
}: AudioGeneratorCompactProps) {
  const [generationMode, setGenerationMode] = useState<'full' | 'chapters'>('chapters');
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [chaptersData, setChaptersData] = useState<Chapter[]>(chapters);
  const [playingVoiceSample, setPlayingVoiceSample] = useState<VoiceType | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const voiceSampleRef = useRef<HTMLAudioElement | null>(null);
  
  // Voice settings
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>('openai');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('nova');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<'tts-1' | 'tts-1-hd'>('tts-1');

  // Dropdown states
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [voicePreviewUrls, setVoicePreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState<VoiceType | null>(null);

  // OpenAI voice definitions
  const openaiVoices: VoiceInfo[] = [
    { id: 'nova', name: 'Nova', title: 'Professional', description: 'Warm & Professional', expertise: ['Business', 'Leadership'], gender: 'feminine', style: 'Warm & Professional', icon: Briefcase, gradient: 'from-rose-500 to-pink-600', provider: 'openai' },
    { id: 'alloy', name: 'Alloy', title: 'Versatile', description: 'Balanced & Clear', expertise: ['Education', 'Training'], gender: 'neutral', style: 'Clear & Articulate', icon: GraduationCap, gradient: 'from-violet-500 to-purple-600', provider: 'openai' },
    { id: 'ash', name: 'Ash', title: 'Senior', description: 'Deep & Commanding', expertise: ['Drama', 'Thriller'], gender: 'masculine', style: 'Deep & Commanding', icon: Shield, gradient: 'from-stone-500 to-zinc-700', provider: 'openai' },
    { id: 'ballad', name: 'Ballad', title: 'Story Weaver', description: 'Melodic & Emotive', expertise: ['Romance', 'Drama'], gender: 'feminine', style: 'Melodic & Emotive', icon: Heart, gradient: 'from-pink-400 to-rose-600', provider: 'openai' },
    { id: 'coral', name: 'Coral', title: 'Dynamic', description: 'Warm & Energetic', expertise: ['Adventure', 'Memoir'], gender: 'feminine', style: 'Warm & Energetic', icon: Star, gradient: 'from-orange-500 to-red-500', provider: 'openai' },
    { id: 'echo', name: 'Echo', title: 'Scholar', description: 'Thoughtful & Measured', expertise: ['Philosophy', 'Academic'], gender: 'masculine', style: 'Thoughtful & Measured', icon: Book, gradient: 'from-slate-500 to-gray-600', provider: 'openai' },
    { id: 'fable', name: 'Fable', title: 'Creative', description: 'Dynamic & Expressive', expertise: ['Fantasy', 'Adventure'], gender: 'neutral', style: 'Dynamic & Expressive', icon: Sparkles, gradient: 'from-amber-500 to-orange-600', provider: 'openai' },
    { id: 'onyx', name: 'Onyx', title: 'Authoritative', description: 'Bold & Commanding', expertise: ['Mystery', 'History'], gender: 'masculine', style: 'Authoritative & Bold', icon: Shield, gradient: 'from-emerald-500 to-teal-600', provider: 'openai' },
    { id: 'sage', name: 'Sage', title: 'Guide', description: 'Patient & Wise', expertise: ['Education', 'Science'], gender: 'feminine', style: 'Patient & Wise', icon: GraduationCap, gradient: 'from-indigo-500 to-purple-600', provider: 'openai' },
    { id: 'shimmer', name: 'Shimmer', title: 'Calming', description: 'Gentle & Soothing', expertise: ['Wellness', 'Self-Help'], gender: 'feminine', style: 'Calming & Intimate', icon: Heart, gradient: 'from-cyan-500 to-blue-600', provider: 'openai' },
    { id: 'verse', name: 'Verse', title: 'Literary', description: 'Poetic & Lyrical', expertise: ['Poetry', 'Literature'], gender: 'masculine', style: 'Poetic & Lyrical', icon: Feather, gradient: 'from-fuchsia-500 to-purple-600', provider: 'openai' },
  ];

  // Gemini voice definitions (condensed)
  const geminiVoices: VoiceInfo[] = [
    { id: 'Zephyr', name: 'Zephyr', title: 'Host', description: 'Friendly & Approachable', expertise: ['Podcast', 'Interview'], gender: 'neutral', style: 'Friendly', icon: Wind, gradient: 'from-sky-400 to-blue-500', provider: 'gemini' },
    { id: 'Puck', name: 'Puck', title: 'Energetic', description: 'Upbeat & Fun', expertise: ['Entertainment', 'Youth'], gender: 'neutral', style: 'Upbeat', icon: Sparkles, gradient: 'from-green-400 to-emerald-500', provider: 'gemini' },
    { id: 'Charon', name: 'Charon', title: 'Authoritative', description: 'Deep & Commanding', expertise: ['Documentary', 'Drama'], gender: 'masculine', style: 'Authoritative', icon: Shield, gradient: 'from-slate-600 to-gray-800', provider: 'gemini' },
    { id: 'Kore', name: 'Kore', title: 'Professional', description: 'Balanced & Clear', expertise: ['Business', 'Technical'], gender: 'neutral', style: 'Professional', icon: Briefcase, gradient: 'from-blue-500 to-indigo-600', provider: 'gemini' },
    { id: 'Fenrir', name: 'Fenrir', title: 'Storyteller', description: 'Warm & Approachable', expertise: ['Audiobooks', 'Tutorials'], gender: 'masculine', style: 'Warm', icon: Book, gradient: 'from-orange-500 to-red-600', provider: 'gemini' },
    { id: 'Leda', name: 'Leda', title: 'Elegant', description: 'Sophisticated', expertise: ['Literature', 'Poetry'], gender: 'feminine', style: 'Elegant', icon: Feather, gradient: 'from-purple-500 to-pink-500', provider: 'gemini' },
    { id: 'Orus', name: 'Orus', title: 'Technical', description: 'Clear & Articulate', expertise: ['Technical', 'Science'], gender: 'masculine', style: 'Clear', icon: Cpu, gradient: 'from-teal-500 to-cyan-600', provider: 'gemini' },
    { id: 'Aoede', name: 'Aoede', title: 'Creative', description: 'Dynamic & Expressive', expertise: ['Creative', 'Art'], gender: 'feminine', style: 'Dynamic', icon: Music, gradient: 'from-fuchsia-500 to-purple-600', provider: 'gemini' },
    { id: 'Callirrhoe', name: 'Callirrhoe', title: 'Poetic', description: 'Graceful & Flowing', expertise: ['Poetry', 'Romance'], gender: 'feminine', style: 'Graceful', icon: Feather, gradient: 'from-rose-400 to-pink-500', provider: 'gemini' },
    { id: 'Umbriel', name: 'Umbriel', title: 'Mysterious', description: 'Atmospheric', expertise: ['Fantasy', 'Thriller'], gender: 'neutral', style: 'Mysterious', icon: Moon, gradient: 'from-violet-600 to-purple-800', provider: 'gemini' },
  ];

  const voices = selectedProvider === 'gemini' ? geminiVoices : openaiVoices;
  const selectedVoiceInfo = voices.find(v => v.id === selectedVoice);

  useEffect(() => {
    setChaptersData(chapters);
  }, [chapters]);

  // Voice preview functionality
  const playVoiceSample = async (voiceId: VoiceType) => {
    if (voiceSampleRef.current) {
      voiceSampleRef.current.pause();
      voiceSampleRef.current.currentTime = 0;
    }

    if (playingVoiceSample === voiceId) {
      setPlayingVoiceSample(null);
      return;
    }

    let audioUrl = voicePreviewUrls[voiceId];
    
    if (!audioUrl) {
      setLoadingPreview(voiceId);
      try {
        const response = await fetch(`/api/generate/voice-preview?voice=${voiceId}&provider=${selectedProvider}`);
        if (!response.ok) {
          setLoadingPreview(null);
          return;
        }
        const data = await response.json();
        if (data.success && data.audioUrl) {
          audioUrl = data.audioUrl;
          setVoicePreviewUrls(prev => ({ ...prev, [voiceId]: audioUrl }));
        }
      } catch {
        setLoadingPreview(null);
        return;
      }
      setLoadingPreview(null);
    }

    setPlayingVoiceSample(voiceId);
    const audio = new Audio(audioUrl);
    voiceSampleRef.current = audio;
    audio.onended = () => setPlayingVoiceSample(null);
    audio.onerror = () => setPlayingVoiceSample(null);
    audio.play().catch(() => setPlayingVoiceSample(null));
  };

  const stopVoiceSample = () => {
    if (voiceSampleRef.current) {
      voiceSampleRef.current.pause();
    }
    setPlayingVoiceSample(null);
  };

  const toggleChapterSelection = (chapterNumber: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterNumber)
        ? prev.filter((n) => n !== chapterNumber)
        : [...prev, chapterNumber]
    );
  };

  const selectAllChapters = () => setSelectedChapters(chapters.map((ch) => ch.number));
  const selectMissingAudio = () => setSelectedChapters(chaptersData.filter(ch => !ch.audioUrl).map(ch => ch.number));
  const clearSelection = () => setSelectedChapters([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedAudios([]);
    setFullAudioUrl(null);
    setGenerationProgress('Starting...');

    try {
      const requestBody = {
        userId,
        bookId: bookId.toString(),
        provider: selectedProvider,
        voice: selectedVoice,
        speed: selectedSpeed,
        model: selectedQuality,
        ...(generationMode === 'chapters' && { chapterNumbers: selectedChapters }),
      };

      const sortedChapters = [...selectedChapters].sort((a, b) => a - b);
      if (generationMode === 'chapters' && sortedChapters.length > 0) {
        setGeneratingChapter(sortedChapters[0]);
      }

      setGenerationProgress(
        generationMode === 'chapters' 
          ? `Generating ${selectedChapters.length} chapter${selectedChapters.length !== 1 ? 's' : ''}...`
          : 'Generating full audiobook...'
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 720000);

      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(data.error || `Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.type === 'full') {
        setFullAudioUrl(data.audioUrl);
        if (onAudioGenerated) onAudioGenerated({ type: 'full', audioUrl: data.audioUrl });
      } else if (data.type === 'chapters') {
        setGeneratedAudios(data.chapters);
        const updatedChapters = [...chaptersData];
        data.chapters.forEach((audio: GeneratedAudio) => {
          const idx = updatedChapters.findIndex(ch => ch.number === audio.chapterNumber);
          if (idx !== -1) {
            updatedChapters[idx] = { ...updatedChapters[idx], audioUrl: audio.audioUrl, audioDuration: audio.duration };
          }
        });
        setChaptersData(updatedChapters);
        if (onAudioGenerated) onAudioGenerated({ type: 'chapters', chapters: data.chapters });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed';
      alert(`Audio Generation Failed: ${msg}`);
    } finally {
      setIsGenerating(false);
      setGeneratingChapter(null);
      setGenerationProgress('');
    }
  };

  // Download functions
  const downloadAudioFile = async (audioUrl: string, filename: string): Promise<boolean> => {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      return true;
    } catch {
      window.open(audioUrl, '_blank');
      return false;
    }
  };

  const handleDownloadChapter = async (audioUrl: string, chapterNumber: number, chapterTitle: string) => {
    const filename = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Ch${chapterNumber}_${chapterTitle.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    await downloadAudioFile(audioUrl, filename);
  };

  const handleDownloadAllAudio = async () => {
    const chaptersWithAudioData = chaptersData.filter(ch => ch.audioUrl);
    if (chaptersWithAudioData.length === 0) return;
    if (chaptersWithAudioData.length === 1) {
      const chapter = chaptersWithAudioData[0];
      await handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title);
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      let completed = 0;
      const total = chaptersWithAudioData.length;

      for (const chapter of chaptersWithAudioData) {
        if (!chapter.audioUrl) continue;
        try {
          const response = await fetch(chapter.audioUrl);
          if (response.ok) {
            const blob = await response.blob();
            const filename = `${String(chapter.number).padStart(2, '0')}_${chapter.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
            zip.file(filename, blob);
          }
        } catch {}
        completed++;
        setDownloadProgress(Math.round((completed / total) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Audiobook.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      alert('Failed to create ZIP');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedDuration = () => {
    const words = generationMode === 'full'
      ? chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
      : chapters.filter((ch) => selectedChapters.includes(ch.number)).reduce((sum, ch) => sum + ch.wordCount, 0);
    return Math.ceil(words / 150);
  };

  const canGenerate = generationMode === 'full' || (generationMode === 'chapters' && selectedChapters.length > 0);
  const chaptersWithAudio = chaptersData.filter(ch => ch.audioUrl).length;
  const totalChapters = chaptersData.length;
  const audioCompletionPercent = totalChapters > 0 ? (chaptersWithAudio / totalChapters) * 100 : 0;
  const totalAudioDuration = chaptersData.reduce((sum, ch) => sum + (ch.audioDuration || 0), 0);

  return (
    <div className="space-y-3">
      {/* Compact Status Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-orange-500/10 dark:from-amber-900/20 dark:via-yellow-800/15 dark:to-orange-900/20 rounded-xl border border-yellow-400/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Audiobook Studio</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {chaptersWithAudio}/{totalChapters} chapters
                </span>
                {totalAudioDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(totalAudioDuration)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {chaptersWithAudio > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllAudio}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {downloadProgress}%
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Download All
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${audioCompletionPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Voice & Settings Section */}
      <CollapsibleSection
        title="Voice & Settings"
        subtitle={selectedVoiceInfo ? `${selectedVoiceInfo.name} • ${selectedSpeed}x • ${selectedQuality === 'tts-1-hd' ? 'HD' : 'Standard'}` : 'Configure narrator'}
        icon={<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Mic className="w-4 h-4 text-white" /></div>}
        badge={selectedVoiceInfo && <Badge variant="success" size="sm">{selectedVoiceInfo.name}</Badge>}
        defaultOpen={false}
        variant="card"
      >
        {/* Provider Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Engine:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {(['openai', 'gemini'] as const).map(provider => (
              <button
                key={provider}
                onClick={() => {
                  setSelectedProvider(provider);
                  setSelectedVoice(provider === 'gemini' ? 'Kore' : 'nova');
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedProvider === provider
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {provider === 'openai' ? 'OpenAI' : 'Gemini'}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Grid - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {voices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoiceSample === voice.id;
            const VoiceIcon = voice.icon;
            
            return (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${voice.gradient}`}>
                    <VoiceIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{voice.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{voice.style}</p>
                
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
                
                {/* Preview on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlaying ? stopVoiceSample() : playVoiceSample(voice.id);
                  }}
                  className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isPlaying ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {loadingPreview === voice.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isPlaying ? (
                    <Square className="w-2.5 h-2.5" />
                  ) : (
                    <Play className="w-2.5 h-2.5" />
                  )}
                </button>
              </button>
            );
          })}
        </div>

        {/* Speed & Quality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Speed</span>
              <span className="text-sm font-bold text-yellow-600">{selectedSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={selectedSpeed}
              onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Quality</span>
            <div className="flex gap-2">
              {(['tts-1', 'tts-1-hd'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedQuality === q
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {q === 'tts-1-hd' ? 'HD' : 'Standard'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Generation Mode & Chapters */}
      <CollapsibleSection
        title="Chapters to Generate"
        subtitle={generationMode === 'full' ? 'Full audiobook' : `${selectedChapters.length} chapters selected`}
        icon={<div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"><Book className="w-4 h-4 text-white" /></div>}
        headerRight={
          generationMode === 'chapters' && selectedChapters.length > 0 && (
            <Badge variant="warning" size="sm">{selectedChapters.length}</Badge>
          )
        }
        defaultOpen={true}
        variant="card"
      >
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setGenerationMode('full')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              generationMode === 'full'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Book className="w-4 h-4" />
            Full Book
          </button>
          <button
            onClick={() => setGenerationMode('chapters')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              generationMode === 'chapters'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            By Chapter
          </button>
        </div>

        {/* Chapter Selection */}
        {generationMode === 'chapters' && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={selectAllChapters}>All</Button>
              <Button variant="outline" size="sm" onClick={selectMissingAudio}>
                Missing ({totalChapters - chaptersWithAudio})
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {chaptersData.map((chapter) => {
                const isSelected = selectedChapters.includes(chapter.number);
                const hasAudio = !!chapter.audioUrl;
                
                return (
                  <button
                    key={chapter.id}
                    onClick={() => toggleChapterSelection(chapter.number)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400'
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-yellow-400' : 'border border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ch.{chapter.number}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{chapter.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasAudio ? (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">~{Math.ceil(chapter.wordCount / 150)}m</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Generate Button */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-xl p-0.5">
        <div className="bg-white dark:bg-gray-900 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {generationMode === 'full' ? 'Full audiobook' : `${selectedChapters.length} chapters`}
              </span>
              {selectedVoiceInfo && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  with {selectedVoiceInfo.name}
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-yellow-600">~{estimatedDuration()} min</span>
          </div>
          
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full py-3 font-bold"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {generationProgress || 'Generating...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Generate Audiobook
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Results */}
      <AnimatePresence>
        {fullAudioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CollapsibleSection
              title="Full Audiobook Ready!"
              icon={<div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
              badge={<Badge variant="success" size="sm">Complete</Badge>}
              defaultOpen={true}
              variant="card"
              className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
            >
              <AudioPlayer audioUrl={fullAudioUrl} title={`${bookTitle} - Full Audiobook`} />
              <Button
                variant="primary"
                onClick={() => downloadAudioFile(fullAudioUrl, `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Audiobook.mp3`)}
                className="w-full mt-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Full Audiobook
              </Button>
            </CollapsibleSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Chapters */}
      <AnimatePresence>
        {generatedAudios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CollapsibleSection
              title={`${generatedAudios.length} Chapters Generated!`}
              icon={<div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"><Headphones className="w-4 h-4 text-white" /></div>}
              headerRight={
                generatedAudios.length > 1 && (
                  <Button variant="outline" size="sm" onClick={handleDownloadAllAudio} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  </Button>
                )
              }
              defaultOpen={true}
              variant="card"
              className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
            >
              <div className="space-y-2">
                {generatedAudios.map((audio) => {
                  const chapter = chaptersData.find((ch) => ch.number === audio.chapterNumber);
                  return (
                    <CollapsibleItem
                      key={audio.chapterNumber}
                      defaultOpen={false}
                      header={
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-500">Ch.{audio.chapterNumber}</span>
                            <span className="font-medium text-sm truncate">{chapter?.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">{formatDuration(audio.duration)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadChapter(audio.audioUrl, audio.chapterNumber, chapter?.title || '');
                              }}
                              className="p-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-md"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <AudioPlayer audioUrl={audio.audioUrl} showMiniControls={true} />
                    </CollapsibleItem>
                  );
                })}
              </div>
            </CollapsibleSection>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Audio Library */}
      {chaptersWithAudio > 0 && generatedAudios.length === 0 && (
        <CollapsibleSection
          title="Your Audio Library"
          subtitle={`${chaptersWithAudio} chapters with audio`}
          icon={<div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"><FileAudio className="w-4 h-4 text-white" /></div>}
          headerRight={
            <Button variant="outline" size="sm" onClick={handleDownloadAllAudio} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  {downloadProgress}%
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-1" />
                  Download All
                </>
              )}
            </Button>
          }
          defaultOpen={false}
          variant="card"
        >
          <div className="space-y-2">
            {chaptersData.filter(ch => ch.audioUrl).map((chapter) => (
              <CollapsibleItem
                key={chapter.id}
                defaultOpen={false}
                header={
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center flex-shrink-0">
                        <Headphones className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs text-gray-500">Ch.{chapter.number}</span>
                      <span className="font-medium text-sm truncate">{chapter.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {chapter.audioDuration && (
                        <span className="text-xs text-gray-500">{formatDuration(chapter.audioDuration)}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title);
                        }}
                        className="p-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-md"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                }
              >
                <AudioPlayer audioUrl={chapter.audioUrl!} showMiniControls={true} />
              </CollapsibleItem>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
