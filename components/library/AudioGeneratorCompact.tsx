'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive,
  Book,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileAudio,
  Headphones,
  Loader2,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  X,
  Zap,
  Briefcase,
  Cloud,
  Compass,
  Cpu,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  Leaf,
  Moon,
  Mountain,
  Music,
  Shield,
  Star,
  Sun,
  Users,
  User,
  Waves,
  Wind,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CollapsibleSection, CollapsibleItem } from '@/components/ui/CollapsibleSection';
import { AudioPlayer } from './AudioPlayer';
import JSZip from 'jszip';
import type { TTSProvider, VoiceId } from '@/lib/services/tts-service';
import { VOICE_PREVIEW_URLS, preloadVoicePreviews, playVoicePreview as getPreviewAudio } from '@/lib/voice-previews';
import { getVoices, isVoiceForProvider, type VoiceGender, type VoiceIconKey, type VoiceMeta } from '@/lib/tts-voices';

const VOICE_ICON_COMPONENTS: Record<VoiceIconKey, React.ElementType> = {
  Briefcase,
  GraduationCap,
  Shield,
  Star,
  Book,
  Sparkles,
  Heart,
  Wind,
  Cpu,
  Music,
  Users,
  Cloud,
  Moon,
  Sun,
  Flame,
  Compass,
  Mountain,
  Globe,
  Leaf,
  Waves,
  User,
};

type VoiceWithIcon = VoiceMeta & { icon: React.ElementType };

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

export function AudioGeneratorCompact({
  bookId,
  bookTitle,
  chapters,
  userId,
  onAudioGenerated,
}: AudioGeneratorCompactProps) {
  const CHAPTER_TABLE_GRID = 'grid-cols-[44px,1fr,120px,132px]';
  const [generationMode, setGenerationMode] = useState<'full' | 'chapters'>('chapters');
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [chaptersData, setChaptersData] = useState<Chapter[]>(chapters);
  const [playingVoiceSample, setPlayingVoiceSample] = useState<VoiceId | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const voiceSampleRef = useRef<HTMLAudioElement | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  
  // Voice settings
  const [selectedProvider, setSelectedProvider] = useState<TTSProvider>('openai');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<'tts-1' | 'tts-1-hd'>('tts-1');

  // UI state
  const [voiceSearch, setVoiceSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<VoiceGender | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [banner, setBanner] = useState<
    | { type: 'success' | 'info' | 'warning' | 'error'; title: string; message?: string }
    | null
  >(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  const [voicePreviewUrls, setVoicePreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState<VoiceId | null>(null);

  const voices: VoiceWithIcon[] = useMemo(() => {
    return getVoices(selectedProvider).map((v) => ({
      ...v,
      icon: VOICE_ICON_COMPONENTS[v.iconKey],
    }));
  }, [selectedProvider]);

  const selectedVoiceInfo = useMemo(() => {
    if (!selectedVoice) return undefined;
    return voices.find(v => v.id === selectedVoice);
  }, [voices, selectedVoice]);

  const prefsStorageKey = useMemo(() => `audioStudioPrefs:${bookId}`, [bookId]);

  // Load saved preferences per-book
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(prefsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        provider: TTSProvider;
        voice: VoiceId | null;
        speed: number;
        quality: 'tts-1' | 'tts-1-hd';
      }>;

      if (parsed.provider === 'openai' || parsed.provider === 'gemini') {
        setSelectedProvider(parsed.provider);
      }
      if (typeof parsed.speed === 'number' && parsed.speed >= 0.5 && parsed.speed <= 2) {
        setSelectedSpeed(parsed.speed);
      }
      if (parsed.quality === 'tts-1' || parsed.quality === 'tts-1-hd') {
        setSelectedQuality(parsed.quality);
      }
      if (parsed.voice) {
        // We'll validate against provider in the provider/voice sync effect below
        setSelectedVoice(parsed.voice);
      }
    } catch {
      // Ignore malformed localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsStorageKey]);

  // Keep selected voice valid when provider changes
  useEffect(() => {
    if (!selectedVoice) return;
    if (!isVoiceForProvider(selectedVoice, selectedProvider)) {
      setSelectedVoice(null);
    }
  }, [selectedProvider, selectedVoice]);

  // Persist preferences per-book
  useEffect(() => {
    try {
      window.localStorage.setItem(
        prefsStorageKey,
        JSON.stringify({
          provider: selectedProvider,
          voice: selectedVoice,
          speed: selectedSpeed,
          quality: selectedQuality,
        })
      );
    } catch {
      // Ignore storage failures (private mode, etc.)
    }
  }, [prefsStorageKey, selectedProvider, selectedVoice, selectedSpeed, selectedQuality]);

  useEffect(() => {
    setChaptersData(chapters);
  }, [chapters]);

  // Preload voice previews on mount for instant playback
  useEffect(() => {
    const voiceIds = voices.map(v => v.id);
    preloadVoicePreviews(voiceIds).catch(() => {
      // Silent fail - will fallback to API on play
    });
  }, [selectedProvider]); // Re-preload when provider changes

  // Voice preview functionality - uses static files first, then API fallback
  const playVoiceSample = async (voiceId: VoiceId) => {
    if (voiceSampleRef.current) {
      voiceSampleRef.current.pause();
      voiceSampleRef.current.currentTime = 0;
    }

    if (playingVoiceSample === voiceId) {
      setPlayingVoiceSample(null);
      return;
    }

    // First try static preview file
    const staticUrl = VOICE_PREVIEW_URLS[voiceId];
    if (staticUrl) {
      const audio = getPreviewAudio(voiceId);
      if (audio) {
        setPlayingVoiceSample(voiceId);
        voiceSampleRef.current = audio;
        audio.onended = () => setPlayingVoiceSample(null);
        audio.onerror = async () => {
          // Static file failed, fallback to API
          setPlayingVoiceSample(null);
          await playVoiceSampleFromApi(voiceId);
        };
        audio.play().catch(async () => {
          setPlayingVoiceSample(null);
          await playVoiceSampleFromApi(voiceId);
        });
        return;
      }
    }

    // Fallback to API
    await playVoiceSampleFromApi(voiceId);
  };

  // Fallback: Play voice sample from API (for when static files don't exist)
  const playVoiceSampleFromApi = async (voiceId: VoiceId) => {
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

    if (!audioUrl) return;

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

  const cancelGeneration = () => {
    if (!isGenerating) return;
    generationAbortRef.current?.abort();
  };

  const upsertChaptersAudio = (audios: GeneratedAudio[]) => {
    setChaptersData((prev) => {
      const updated = [...prev];
      audios.forEach((audio) => {
        const idx = updated.findIndex((ch) => ch.number === audio.chapterNumber);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            audioUrl: audio.audioUrl,
            audioDuration: audio.duration,
          };
        }
      });
      return updated;
    });
  };

  const generateSelectedChaptersSequentially = async (chapterNumbers: number[]) => {
    if (!selectedVoice) {
      setBanner({ type: 'error', title: 'Select a voice first', message: 'Choose a narrator in the sidebar to continue.' });
      return;
    }

    const sorted = Array.from(new Set(chapterNumbers)).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setBanner({ type: 'error', title: 'No chapters selected', message: 'Select at least one chapter to generate.' });
      return;
    }

    setBanner(null);
    setIsGenerating(true);
    setGeneratedAudios([]);
    setFullAudioUrl(null);
    setGenerationProgress(`Generating ${sorted.length} chapter${sorted.length !== 1 ? 's' : ''}...`);

    const results: GeneratedAudio[] = [];

    try {
      for (let i = 0; i < sorted.length; i++) {
        const chapterNumber = sorted[i];
        setGeneratingChapter(chapterNumber);
        setGenerationProgress(`Generating Chapter ${chapterNumber} (${i + 1}/${sorted.length})...`);

        const controller = new AbortController();
        generationAbortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 720000); // 12 minutes safety

        let response: Response;
        try {
          response = await fetch('/api/generate/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              bookId: bookId.toString(),
              provider: selectedProvider,
              voice: selectedVoice,
              speed: selectedSpeed,
              model: selectedQuality,
              chapterNumbers: [chapterNumber],
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed' }));
          throw new Error(data.error || `Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || data.type !== 'chapters' || !Array.isArray(data.chapters) || data.chapters.length === 0) {
          throw new Error(data.error || 'Generation failed');
        }

        const audio: GeneratedAudio = data.chapters[0];
        results.push(audio);
        setGeneratedAudios((prev) => [...prev, audio]);
        upsertChaptersAudio([audio]);
      }

      setBanner({ type: 'success', title: 'Audio generated', message: `Generated ${results.length} chapter${results.length !== 1 ? 's' : ''}.` });
      onAudioGenerated?.({ type: 'chapters', chapters: results });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setBanner({ type: 'info', title: 'Generation cancelled', message: 'No worries — you can resume anytime.' });
        return;
      }
      const msg = error instanceof Error ? error.message : 'Failed';
      setBanner({ type: 'error', title: 'Audio generation failed', message: msg });
    } finally {
      setIsGenerating(false);
      setGeneratingChapter(null);
      setGenerationProgress('');
      generationAbortRef.current = null;
    }
  };

  const generateFullAudiobook = async () => {
    if (!selectedVoice) {
      setBanner({ type: 'error', title: 'Select a voice first', message: 'Choose a narrator in the sidebar to continue.' });
      return;
    }

    setBanner(null);
    setIsGenerating(true);
    setGeneratedAudios([]);
    setFullAudioUrl(null);
    setGeneratingChapter(null);
    setGenerationProgress('Generating full audiobook...');

    try {
      const controller = new AbortController();
      generationAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 720000);

      let response: Response;
      try {
        response = await fetch('/api/generate/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            bookId: bookId.toString(),
            provider: selectedProvider,
            voice: selectedVoice,
            speed: selectedSpeed,
            model: selectedQuality,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(data.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || data.type !== 'full' || !data.audioUrl) {
        throw new Error(data.error || 'Generation failed');
      }

      setFullAudioUrl(data.audioUrl);
      setBanner({ type: 'success', title: 'Full audiobook ready', message: 'Your audiobook has been generated.' });
      onAudioGenerated?.({ type: 'full', audioUrl: data.audioUrl });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setBanner({ type: 'info', title: 'Generation cancelled', message: 'No worries — you can resume anytime.' });
        return;
      }
      const msg = error instanceof Error ? error.message : 'Failed';
      setBanner({ type: 'error', title: 'Audio generation failed', message: msg });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
      generationAbortRef.current = null;
    }
  };

  const handleGenerate = async () => {
    if (generationMode === 'full') {
      await generateFullAudiobook();
      return;
    }
    await generateSelectedChaptersSequentially(selectedChapters);
  };

  const handleGenerateSingleChapter = async (chapterNumber: number) => {
    await generateSelectedChaptersSequentially([chapterNumber]);
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
      setBanner({
        type: 'error',
        title: 'Download failed',
        message: 'Could not create ZIP archive. Try downloading chapters individually.',
      });
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

  const canGenerate = selectedVoice !== null && (generationMode === 'full' || (generationMode === 'chapters' && selectedChapters.length > 0));
  const chaptersWithAudio = chaptersData.filter(ch => ch.audioUrl).length;
  const totalChapters = chaptersData.length;
  const audioCompletionPercent = totalChapters > 0 ? (chaptersWithAudio / totalChapters) * 100 : 0;
  const totalAudioDuration = chaptersData.reduce((sum, ch) => sum + (ch.audioDuration || 0), 0);
  const selectedChaptersWithAudioCount =
    generationMode === 'chapters'
      ? selectedChapters.filter((num) => {
          const ch = chaptersData.find((c) => c.number === num);
          return !!ch?.audioUrl;
        }).length
      : 0;

  const allChapterNumbers = useMemo(() => chaptersData.map((c) => c.number), [chaptersData]);
  const isAllSelected = useMemo(
    () => generationMode === 'chapters' && allChapterNumbers.length > 0 && selectedChapters.length === allChapterNumbers.length,
    [generationMode, allChapterNumbers.length, selectedChapters.length]
  );
  const isSomeSelected = useMemo(
    () => generationMode === 'chapters' && selectedChapters.length > 0 && !isAllSelected,
    [generationMode, selectedChapters.length, isAllSelected]
  );

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = isSomeSelected;
  }, [isSomeSelected]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    voices.forEach(v => v.expertise.forEach(tag => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [voices]);

  const filteredVoices = useMemo(() => {
    const q = voiceSearch.trim().toLowerCase();
    return voices.filter((v) => {
      const matchesSearch =
        q.length === 0 ||
        v.name.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q) ||
        v.expertise.some((t) => t.toLowerCase().includes(q));

      const matchesGender = genderFilter === 'all' ? true : v.gender === genderFilter;
      const matchesTag = tagFilter === 'all' ? true : v.expertise.includes(tagFilter);

      return matchesSearch && matchesGender && matchesTag;
    });
  }, [voices, voiceSearch, genderFilter, tagFilter]);

  return (
    <div className="space-y-5 lg:space-y-0 lg:flex lg:items-start lg:gap-6">
      {/* Sidebar */}
      <aside className="lg:w-[360px] lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-3 h-fit space-y-4">
      <CollapsibleSection
        title="Narrator & Settings"
        subtitle={selectedVoiceInfo ? `${selectedVoiceInfo.name} • ${selectedSpeed}x • ${selectedQuality === 'tts-1-hd' ? 'HD' : 'Standard'}` : 'Select a voice to continue'}
        icon={<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Mic className="w-4 h-4 text-white" /></div>}
        badge={selectedVoiceInfo ? <Badge variant="success" size="sm">{selectedVoiceInfo.name}</Badge> : <Badge variant="error" size="sm">Action Required</Badge>}
        defaultOpen={!selectedVoice}
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
                  setSelectedVoice(null);
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

        {/* Search + Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={voiceSearch}
              onChange={(e) => setVoiceSearch(e.target.value)}
              placeholder="Search voices (name, style, tags)"
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
            />
            {voiceSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setVoiceSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Gender
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as VoiceGender | 'all')}
                className="mt-1 w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="feminine">Feminine</option>
                <option value="masculine">Masculine</option>
                <option value="neutral">Neutral</option>
              </select>
            </label>

            <label className="text-xs text-gray-500 dark:text-gray-400">
              Best for
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="mt-1 w-full px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Selected Voice (Pinned) */}
        {selectedVoiceInfo && (
          <div className="mb-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-900/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">Selected narrator</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedVoiceInfo.gradient} flex items-center justify-center flex-shrink-0`}>
                    <selectedVoiceInfo.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{selectedVoiceInfo.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{selectedVoiceInfo.style}</div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoice(null)}
                className="p-1.5 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-600 dark:text-gray-300"
                aria-label="Clear selected voice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (playingVoiceSample === selectedVoiceInfo.id ? stopVoiceSample() : playVoiceSample(selectedVoiceInfo.id))}
                disabled={loadingPreview === selectedVoiceInfo.id}
                className="w-full flex items-center justify-center gap-2"
              >
                {loadingPreview === selectedVoiceInfo.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : playingVoiceSample === selectedVoiceInfo.id ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {playingVoiceSample === selectedVoiceInfo.id ? 'Stop preview' : 'Preview voice'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voices</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{filteredVoices.length} shown</span>
        </div>

        {/* Voice Grid - Filtered */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 mb-4">
          {filteredVoices
            .filter(v => (selectedVoiceInfo ? v.id !== selectedVoiceInfo.id : true))
            .map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoiceSample === voice.id;
            const VoiceIcon = voice.icon;
            
            return (
              <div
                key={voice.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedVoice(voice.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedVoice(voice.id);
                  }
                }}
                className={`relative p-3 rounded-lg border-2 transition-all text-left cursor-pointer ${
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
                
                {/* Preview */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlaying ? stopVoiceSample() : playVoiceSample(voice.id);
                  }}
                  className={`absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isPlaying ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label={isPlaying ? `Stop preview for ${voice.name}` : `Play preview for ${voice.name}`}
                >
                  {loadingPreview === voice.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isPlaying ? (
                    <Square className="w-2.5 h-2.5" />
                  ) : (
                    <Play className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {filteredVoices.filter(v => (selectedVoiceInfo ? v.id !== selectedVoiceInfo.id : true)).length === 0 && (
          <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3 text-sm text-gray-600 dark:text-gray-300">
            No voices match your search/filters. Try clearing the filters.
          </div>
        )}

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
      </aside>

      {/* Main */}
      <main className="flex-1 space-y-4">
      {/* Compact Status Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-orange-500/10 dark:from-amber-900/20 dark:via-yellow-800/15 dark:to-orange-900/20 rounded-xl border border-yellow-400/30 p-5">
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
        <div className="mt-4 h-2.5 bg-white/60 dark:bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${audioCompletionPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-xl border p-4 ${
            banner.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : banner.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : banner.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white">{banner.title}</div>
              {banner.message && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">{banner.message}</div>}
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generation Mode & Chapters */}
      <CollapsibleSection
        title="Chapters to Generate"
        subtitle={generationMode === 'full' ? 'Full audiobook' : `${selectedChapters.length} chapters selected`}
        icon={<div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm"><Book className="w-4.5 h-4.5 text-white" /></div>}
        headerRight={
          generationMode === 'chapters' && selectedChapters.length > 0 && (
            <Badge variant="warning" size="sm">{selectedChapters.length}</Badge>
          )
        }
        defaultOpen={true}
        variant="card"
        contentClassName="pt-1"
      >
        {/* Mode Toggle - Compact inline */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mode:</span>
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
              <button
                onClick={() => setGenerationMode('full')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  generationMode === 'full'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Book className="w-3.5 h-3.5" />
                Full Book
              </button>
              <button
                onClick={() => setGenerationMode('chapters')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  generationMode === 'chapters'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileAudio className="w-3.5 h-3.5" />
                By Chapter
              </button>
            </div>
          </div>
          {generationMode === 'chapters' && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalChapters} chapters • <span className="text-green-600 dark:text-green-400">{chaptersWithAudio} with audio</span>
            </div>
          )}
        </div>

        {/* Chapter Selection */}
        {generationMode === 'chapters' && (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Table Header with integrated selection controls */}
              <div className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                {/* Selection toolbar row */}
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-gray-200/60 dark:border-gray-700/60">
                  <div className="flex items-center gap-2">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => (isAllSelected ? clearSelection() : setSelectedChapters(allChapterNumbers))}
                      className="h-4 w-4 accent-yellow-500 rounded"
                      aria-label="Select all chapters"
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {isAllSelected ? 'All selected' : isSomeSelected ? `${selectedChapters.length} selected` : 'Select:'}
                    </span>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={selectAllChapters}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        All
                      </button>
                      <button
                        onClick={selectMissingAudio}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        Missing ({totalChapters - chaptersWithAudio})
                      </button>
                      <button
                        onClick={() => setSelectedChapters(chaptersData.filter(ch => ch.audioUrl).map(ch => ch.number))}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        Ready ({chaptersWithAudio})
                      </button>
                    </div>
                  </div>
                  {selectedChapters.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {/* Column headers row */}
                <div className={`grid ${CHAPTER_TABLE_GRID} items-center gap-3 px-3 h-9 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                  <span></span>
                  <span>Chapter</span>
                  <span>Status</span>
                  <span className="text-right pr-1">Actions</span>
                </div>
              </div>

              {/* Chapter rows */}
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {chaptersData.map((chapter) => {
                  const isSelected = selectedChapters.includes(chapter.number);
                  const hasAudio = !!chapter.audioUrl;
                  const isExpanded = expandedChapter === chapter.number;
                  const estMinutes = Math.ceil(chapter.wordCount / 150);

                  return (
                    <div
                      key={chapter.id}
                      className={`transition-colors ${isSelected ? 'bg-yellow-50/80 dark:bg-yellow-900/15' : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                    >
                      <div className={`grid ${CHAPTER_TABLE_GRID} gap-3 items-center px-3 py-2.5`}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleChapterSelection(chapter.number)}
                            className="h-4 w-4 accent-yellow-500 rounded"
                            aria-label={`Select Chapter ${chapter.number}`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleChapterSelection(chapter.number)}
                          className="min-w-0 text-left group"
                          aria-label={`Toggle selection for Chapter ${chapter.number}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                              {chapter.number}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {chapter.title}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {chapter.wordCount.toLocaleString()} words
                            {chapter.audioDuration && (
                              <span className="text-green-600 dark:text-green-400 ml-2">
                                {formatDuration(chapter.audioDuration)}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center">
                          {hasAudio ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          {hasAudio && (
                            <button
                              type="button"
                              onClick={() => setExpandedChapter(isExpanded ? null : chapter.number)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                              aria-label={isExpanded ? `Hide player` : `Play`}
                              title={isExpanded ? 'Hide player' : 'Play'}
                            >
                              {isExpanded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleGenerateSingleChapter(chapter.number)}
                            disabled={isGenerating || !selectedVoice}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                              hasAudio
                                ? 'hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            }`}
                            aria-label={hasAudio ? `Regenerate` : `Generate`}
                            title={hasAudio ? 'Regenerate' : 'Generate'}
                          >
                            {hasAudio ? (
                              <RefreshCw className={`w-4 h-4 ${isGenerating && generatingChapter === chapter.number ? 'animate-spin' : ''}`} />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </button>

                          {hasAudio && (
                            <button
                              type="button"
                              onClick={() => handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                              aria-label={`Download`}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {hasAudio && isExpanded && chapter.audioUrl && (
                        <div className="px-3 pb-3 pt-1 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700">
                          <AudioPlayer audioUrl={chapter.audioUrl} showMiniControls={true} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 mt-2">
        <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-[2px] shadow-xl shadow-yellow-500/15">
          <div className="bg-white dark:bg-gray-900 rounded-[14px] p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {generationMode === 'full' ? 'Full audiobook' : `${selectedChapters.length} chapter${selectedChapters.length !== 1 ? 's' : ''} selected`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedVoiceInfo ? (
                    <>Narrator: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedVoiceInfo.name}</span> • {selectedSpeed}x • {selectedQuality === 'tts-1-hd' ? 'HD' : 'Standard'}</>
                  ) : (
                    <>Narrator: <span className="font-medium text-red-600 dark:text-red-400">Select a voice</span></>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-500">~{estimatedDuration()} min</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">estimated duration</div>
              </div>
            </div>

            {generationMode === 'chapters' && !isGenerating && selectedChaptersWithAudioCount > 0 && (
              <div className="mb-4 text-sm rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2.5 text-yellow-800 dark:text-yellow-200">
                <span className="font-medium">Overwrite notice:</span> {selectedChaptersWithAudioCount} selected chapter{selectedChaptersWithAudioCount !== 1 ? 's' : ''} already have audio and will be replaced.
              </div>
            )}

            {isGenerating && (
              <div className="mb-4 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-gray-700 dark:text-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-yellow-500" />
                    <span className="truncate">{generationProgress || 'Generating...'}</span>
                  </div>
                  {generatingChapter && (
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">Ch. {generatingChapter}</span>
                  )}
                </div>
              </div>
            )}

            <div className={`grid gap-3 ${isGenerating ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="w-full py-3.5 font-bold text-base"
              >
                <span className="flex items-center justify-center gap-2.5">
                  <Mic className="w-5 h-5" />
                  {generationMode === 'full' ? 'Generate Full Audiobook' : 'Generate Selected Chapters'}
                </span>
              </Button>

              {isGenerating && (
                <Button
                  variant="outline"
                  onClick={cancelGeneration}
                  className="w-full py-3.5 font-bold text-base"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
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
      </main>
    </div>
  );
}
