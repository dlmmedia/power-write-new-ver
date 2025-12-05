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
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AudioPlayer } from './AudioPlayer';
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

type VoiceType = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer' | 'verse';

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
}

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
} as const;

const slideUp = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  }
} as const;

export function AudioGenerator({
  bookId,
  bookTitle,
  chapters,
  userId,
  onAudioGenerated,
}: AudioGeneratorProps) {
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
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('nova');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<'tts-1' | 'tts-1-hd'>('tts-1');

  // Professional voice definitions with corporate naming - All 11 OpenAI voices
  const voices: VoiceInfo[] = [
    { 
      id: 'nova', 
      name: 'Victoria Sterling',
      title: 'Executive Narrator',
      description: 'Polished and professional with excellent pacing. Victoria brings authority and warmth to every narrative.',
      expertise: ['Business', 'Leadership', 'Biography'],
      gender: 'feminine',
      style: 'Warm & Professional',
      icon: Briefcase,
      gradient: 'from-rose-500 to-pink-600',
    },
    { 
      id: 'alloy', 
      name: 'Morgan Blake',
      title: 'Versatile Presenter',
      description: 'Balanced and adaptable, delivering content with clarity and precision. Ideal for educational materials.',
      expertise: ['Education', 'Training', 'Corporate'],
      gender: 'neutral',
      style: 'Clear & Articulate',
      icon: GraduationCap,
      gradient: 'from-violet-500 to-purple-600',
    },
    { 
      id: 'ash', 
      name: 'Alexander Grey',
      title: 'Senior Narrator',
      description: 'Deep and resonant voice with gravitas. Alexander commands attention for compelling narratives.',
      expertise: ['Drama', 'Thriller', 'Documentary'],
      gender: 'masculine',
      style: 'Deep & Commanding',
      icon: Shield,
      gradient: 'from-stone-500 to-zinc-700',
    },
    { 
      id: 'ballad', 
      name: 'Sophia Nightingale',
      title: 'Story Weaver',
      description: 'Melodic and emotive voice that brings stories to life. Perfect for romantic and emotional narratives.',
      expertise: ['Romance', 'Drama', 'Literary Fiction'],
      gender: 'feminine',
      style: 'Melodic & Emotive',
      icon: Heart,
      gradient: 'from-pink-400 to-rose-600',
    },
    { 
      id: 'coral', 
      name: 'Camille Rose',
      title: 'Dynamic Host',
      description: 'Warm and energetic with infectious enthusiasm. Camille brings life to adventure and lifestyle content.',
      expertise: ['Adventure', 'Lifestyle', 'Memoir'],
      gender: 'feminine',
      style: 'Warm & Energetic',
      icon: Star,
      gradient: 'from-coral-500 to-red-500',
    },
    { 
      id: 'echo', 
      name: 'Sebastian Cross',
      title: 'Distinguished Scholar',
      description: 'Refined and contemplative with intellectual depth. Sebastian excels at scholarly and philosophical works.',
      expertise: ['Philosophy', 'Academic', 'Documentary'],
      gender: 'masculine',
      style: 'Thoughtful & Measured',
      icon: Book,
      gradient: 'from-slate-500 to-gray-600',
    },
    { 
      id: 'fable', 
      name: 'Aurora Winters',
      title: 'Creative Director',
      description: 'Expressive and dynamic with exceptional range. Aurora transforms creative content into immersive experiences.',
      expertise: ['Fantasy', 'Children\'s', 'Adventure'],
      gender: 'neutral',
      style: 'Dynamic & Expressive',
      icon: Sparkles,
      gradient: 'from-amber-500 to-orange-600',
    },
    { 
      id: 'onyx', 
      name: 'Marcus Ashford',
      title: 'Senior Correspondent',
      description: 'Commanding presence with authoritative delivery. The voice of choice for investigative and historical content.',
      expertise: ['Journalism', 'Mystery', 'History'],
      gender: 'masculine',
      style: 'Authoritative & Bold',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-600',
    },
    { 
      id: 'sage', 
      name: 'Professor Elena Sage',
      title: 'Knowledge Guide',
      description: 'Patient and wise with a natural teaching quality. Perfect for educational and instructional content.',
      expertise: ['Education', 'Science', 'How-To'],
      gender: 'feminine',
      style: 'Patient & Wise',
      icon: GraduationCap,
      gradient: 'from-indigo-500 to-purple-600',
    },
    { 
      id: 'shimmer', 
      name: 'Isabella Chen',
      title: 'Wellness Director',
      description: 'Gentle and soothing with a calming presence. Isabella specializes in mindfulness and wellness content.',
      expertise: ['Wellness', 'Meditation', 'Self-Help'],
      gender: 'feminine',
      style: 'Calming & Intimate',
      icon: Heart,
      gradient: 'from-cyan-500 to-blue-600',
    },
    { 
      id: 'verse', 
      name: 'Julian Verse',
      title: 'Literary Artist',
      description: 'Poetic and artistic with a lyrical quality. Julian brings beauty to poetry, literature, and artistic works.',
      expertise: ['Poetry', 'Literature', 'Arts'],
      gender: 'masculine',
      style: 'Poetic & Lyrical',
      icon: Book,
      gradient: 'from-fuchsia-500 to-purple-600',
    },
  ];

  // Sync chapters data when prop changes
  useEffect(() => {
    setChaptersData(chapters);
  }, [chapters]);

  // Cache for voice preview URLs
  const [voicePreviewUrls, setVoicePreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState<VoiceType | null>(null);

  const playVoiceSample = async (voiceId: VoiceType) => {
    // Stop any currently playing audio
    if (voiceSampleRef.current) {
      voiceSampleRef.current.pause();
      voiceSampleRef.current.currentTime = 0;
    }

    // Toggle off if same voice
    if (playingVoiceSample === voiceId) {
      setPlayingVoiceSample(null);
      return;
    }

    // Check if we have a cached URL
    let audioUrl = voicePreviewUrls[voiceId];
    
    if (!audioUrl) {
      // Fetch the preview URL from our API
      setLoadingPreview(voiceId);
      try {
        const response = await fetch(`/api/generate/voice-preview?voice=${voiceId}`);
        const data = await response.json();
        
        if (data.success && data.audioUrl) {
          audioUrl = data.audioUrl;
          setVoicePreviewUrls(prev => ({ ...prev, [voiceId]: audioUrl }));
        } else {
          console.error('Failed to get voice preview:', data.error);
          setLoadingPreview(null);
          return;
        }
      } catch (error) {
        console.error('Error fetching voice preview:', error);
        setLoadingPreview(null);
        return;
      }
      setLoadingPreview(null);
    }

    // Play the audio
    setPlayingVoiceSample(voiceId);
    
    try {
      const audio = new Audio(audioUrl);
      voiceSampleRef.current = audio;
      
      audio.onended = () => {
        setPlayingVoiceSample(null);
      };
      
      audio.onerror = () => {
        console.error('Error playing audio');
        setPlayingVoiceSample(null);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing voice sample:', error);
      setPlayingVoiceSample(null);
    }
  };

  const stopVoiceSample = () => {
    if (voiceSampleRef.current) {
      voiceSampleRef.current.pause();
      voiceSampleRef.current.currentTime = 0;
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

  const selectAllChapters = () => {
    setSelectedChapters(chapters.map((ch) => ch.number));
  };

  const selectMissingAudio = () => {
    const chaptersWithoutAudio = chaptersData
      .filter(ch => !ch.audioUrl)
      .map(ch => ch.number);
    setSelectedChapters(chaptersWithoutAudio);
  };

  const clearSelection = () => {
    setSelectedChapters([]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedAudios([]);
    setFullAudioUrl(null);
    setGenerationProgress('Starting audio generation...');

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
      console.log('[AudioGenerator] This may take several minutes...');
      console.log('[AudioGenerator] Using voice:', selectedVoice);

      // Build a detailed progress message showing which chapters are being generated
      const sortedChapters = [...selectedChapters].sort((a, b) => a - b);
      const chapterList = sortedChapters.length <= 3 
        ? sortedChapters.map(n => `Chapter ${n}`).join(', ')
        : `Chapters ${sortedChapters[0]}-${sortedChapters[sortedChapters.length - 1]}`;
      
      // Set the first chapter being generated for display
      if (generationMode === 'chapters' && sortedChapters.length > 0) {
        setGeneratingChapter(sortedChapters[0]);
      }

      setGenerationProgress(
        generationMode === 'chapters' 
          ? `Generating ${chapterList} (${selectedChapters.length} chapter${selectedChapters.length !== 1 ? 's' : ''})...`
          : 'Generating full audiobook...'
      );

      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      setGenerationProgress('Processing response...');

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
        setGenerationProgress('Full audiobook generated successfully!');
        setFullAudioUrl(data.audioUrl);
        if (onAudioGenerated) {
          onAudioGenerated({ type: 'full', audioUrl: data.audioUrl });
        }
      } else if (data.type === 'chapters') {
        console.log('[AudioGenerator] Chapter audio generated:', data.chapters?.length, 'chapters');
        setGenerationProgress(`Successfully generated ${data.chapters?.length} chapter${data.chapters?.length !== 1 ? 's' : ''}!`);
        setGeneratedAudios(data.chapters);
        
        const updatedChapters = [...chaptersData];
        data.chapters.forEach((audio: GeneratedAudio) => {
          const idx = updatedChapters.findIndex(ch => ch.number === audio.chapterNumber);
          if (idx !== -1) {
            updatedChapters[idx] = {
              ...updatedChapters[idx],
              audioUrl: audio.audioUrl,
              audioDuration: audio.duration,
            };
          }
        });
        setChaptersData(updatedChapters);
        
        if (onAudioGenerated) {
          onAudioGenerated({ type: 'chapters', chapters: data.chapters });
        }
      }
    } catch (error) {
      console.error('[AudioGenerator] Audio generation error:', error);
      
      let errorMessage = 'Failed to generate audio';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setGenerationProgress('');
      alert(`Audio Generation Failed\n\n${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setGeneratingChapter(null);
      // Clear progress message after a delay
      setTimeout(() => setGenerationProgress(''), 3000);
    }
  };

  // Direct download function - fetches blob and triggers download
  // Must fetch as blob first because cross-origin URLs ignore the download attribute
  const downloadAudioFile = async (audioUrl: string, filename: string): Promise<boolean> => {
    try {
      console.log(`[Download] Fetching audio file: ${filename}`);
      
      const response = await fetch(audioUrl, {
        method: 'GET',
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`[Download] Blob received: ${blob.size} bytes, type: ${blob.type}`);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create a blob URL (same-origin) which respects the download attribute
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      
      console.log(`[Download] Successfully triggered download: ${filename}`);
      return true;
    } catch (error) {
      console.error('[Download] Error:', error);
      // Fallback: open in new tab where user can right-click to save
      alert(`Direct download failed. Opening audio in new tab - use right-click > "Save As" to download.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
      window.open(audioUrl, '_blank');
      return false;
    }
  };

  const handleDownloadChapter = async (audioUrl: string, chapterNumber: number, chapterTitle: string) => {
    const filename = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Chapter_${chapterNumber}_${chapterTitle.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    await downloadAudioFile(audioUrl, filename);
  };

  // Download all as ZIP
  const handleDownloadAllAudio = async () => {
    const chaptersWithAudioData = chaptersData.filter(ch => ch.audioUrl);
    
    if (chaptersWithAudioData.length === 0) {
      alert('No audio files available to download.');
      return;
    }
    
    // If only one file, download directly
    if (chaptersWithAudioData.length === 1) {
      const chapter = chaptersWithAudioData[0];
      await handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title);
      return;
    }
    
    // Multiple files - create ZIP
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      const zip = new JSZip();
      const folderName = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Audiobook`;
      const audioFolder = zip.folder(folderName);
      
      if (!audioFolder) throw new Error('Failed to create ZIP folder');
      
      let completed = 0;
      let successCount = 0;
      const total = chaptersWithAudioData.length;
      const failedChapters: number[] = [];
      
      console.log(`[AudioDownload] Starting download of ${total} audio files...`);
      
      // Fetch all audio files
      for (const chapter of chaptersWithAudioData) {
        if (!chapter.audioUrl) {
          completed++;
          setDownloadProgress(Math.round((completed / total) * 100));
          continue;
        }
        
        try {
          console.log(`[AudioDownload] Fetching chapter ${chapter.number}: ${chapter.audioUrl}`);
          
          const response = await fetch(chapter.audioUrl, {
            method: 'GET',
            credentials: 'same-origin',
          });
          
          if (!response.ok) {
            console.error(`[AudioDownload] Failed to fetch chapter ${chapter.number}: HTTP ${response.status}`);
            failedChapters.push(chapter.number);
            completed++;
            setDownloadProgress(Math.round((completed / total) * 100));
            continue;
          }
          
          const blob = await response.blob();
          console.log(`[AudioDownload] Chapter ${chapter.number} blob size: ${blob.size} bytes, type: ${blob.type}`);
          
          if (blob.size === 0) {
            console.error(`[AudioDownload] Chapter ${chapter.number} has empty blob`);
            failedChapters.push(chapter.number);
            completed++;
            setDownloadProgress(Math.round((completed / total) * 100));
            continue;
          }
          
          const filename = `Chapter_${String(chapter.number).padStart(2, '0')}_${chapter.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
          
          // Convert blob to ArrayBuffer for more reliable ZIP handling
          const arrayBuffer = await blob.arrayBuffer();
          audioFolder.file(filename, arrayBuffer);
          
          successCount++;
          completed++;
          setDownloadProgress(Math.round((completed / total) * 100));
          console.log(`[AudioDownload] Successfully added chapter ${chapter.number} to ZIP`);
        } catch (err) {
          console.error(`[AudioDownload] Error fetching chapter ${chapter.number}:`, err);
          failedChapters.push(chapter.number);
          completed++;
          setDownloadProgress(Math.round((completed / total) * 100));
        }
      }
      
      console.log(`[AudioDownload] Fetching complete. Success: ${successCount}, Failed: ${failedChapters.length}`);
      
      // Check if we have any files to zip
      if (successCount === 0) {
        throw new Error(`Failed to fetch any audio files. All ${total} chapters failed to download.`);
      }
      
      // Generate and download ZIP
      console.log(`[AudioDownload] Generating ZIP with ${successCount} files...`);
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log(`[AudioDownload] ZIP generated, size: ${zipBlob.size} bytes`);
      
      if (zipBlob.size < 100) {
        throw new Error('Generated ZIP file is too small - something went wrong');
      }
      
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Audiobook.zip`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      // Notify about partial success if some chapters failed
      if (failedChapters.length > 0) {
        alert(`Download complete! ${successCount} chapters included.\n\nNote: ${failedChapters.length} chapter(s) failed to download: Chapter ${failedChapters.join(', ')}`);
      }
    } catch (error) {
      console.error('[AudioDownload] ZIP creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create ZIP archive: ${errorMessage}\n\nDownloading files individually...`);
      
      // Fallback to individual downloads
      for (const chapter of chaptersWithAudioData) {
        if (chapter.audioUrl) {
          try {
            await handleDownloadChapter(chapter.audioUrl, chapter.number, chapter.title);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (downloadErr) {
            console.error(`[AudioDownload] Individual download failed for chapter ${chapter.number}:`, downloadErr);
          }
        }
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canGenerate =
    generationMode === 'full' || (generationMode === 'chapters' && selectedChapters.length > 0);

  const chaptersWithAudio = chaptersData.filter(ch => ch.audioUrl).length;
  const totalChapters = chaptersData.length;
  const audioCompletionPercent = totalChapters > 0 ? (chaptersWithAudio / totalChapters) * 100 : 0;
  const totalAudioDuration = chaptersData.reduce((sum, ch) => sum + (ch.audioDuration || 0), 0);

  // Calculate how many selected chapters already have audio (for regeneration indicator)
  const selectedChaptersWithAudio = generationMode === 'chapters' 
    ? selectedChapters.filter(num => {
        const chapter = chaptersData.find(ch => ch.number === num);
        return chapter && chapter.audioUrl;
      }).length
    : 0;
  
  const isRegenerating = selectedChaptersWithAudio > 0 || (generationMode === 'full' && chaptersWithAudio > 0);

  const selectedVoiceInfo = voices.find(v => v.id === selectedVoice);

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Hero Audio Status Card */}
      <motion.div 
        variants={cardVariants}
        className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-yellow-400/10 to-orange-500/20 dark:from-amber-900/30 dark:via-yellow-800/20 dark:to-orange-900/30 rounded-2xl border border-yellow-400/30 dark:border-yellow-600/30 p-8"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30"
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Headphones className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audiobook Studio</h2>
                <p className="text-gray-600 dark:text-gray-400">Transform your book into professional audio</p>
              </div>
            </div>
            
            {chaptersWithAudio > 0 && (
              <motion.button
                onClick={handleDownloadAllAudio}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 border border-yellow-400/50 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing ZIP... {downloadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Download All ({chaptersWithAudio})</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            variants={staggerContainer}
          >
            {[
              { icon: CheckCircle2, label: 'Complete', value: chaptersWithAudio, sub: 'chapters with audio', color: 'text-green-500' },
              { icon: Clock, label: 'Remaining', value: totalChapters - chaptersWithAudio, sub: 'chapters pending', color: 'text-yellow-500' },
              { icon: Radio, label: 'Duration', value: totalAudioDuration > 0 ? formatDuration(totalAudioDuration) : '--:--', sub: 'total audio time', color: 'text-blue-500' },
              { icon: BarChart3, label: 'Progress', value: `${audioCompletionPercent.toFixed(0)}%`, sub: 'completion rate', color: 'text-purple-500' },
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                variants={scaleIn}
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-gray-700/50 cursor-default"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${audioCompletionPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Voice Selection - Enhanced Cards */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              Select Your Narrator
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a professional voice that matches your content</p>
          </div>
          {selectedVoiceInfo && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/50 rounded-full"
            >
              <Check className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{selectedVoiceInfo.name}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
        >
          {voices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoiceSample === voice.id;
            const VoiceIcon = voice.icon;
            
            return (
              <motion.div
                key={voice.id}
                variants={slideUp}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative group rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg shadow-yellow-400/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600 hover:shadow-md'
                }`}
                onClick={() => setSelectedVoice(voice.id)}
              >
                {/* Selection Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      className="absolute top-3 right-3 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-4 h-4 text-black" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="p-5">
                  {/* Voice Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${voice.gradient}`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <VoiceIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">{voice.name}</h4>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{voice.title}</p>
                    </div>
                  </div>
                  
                  {/* Style Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400">
                      {voice.style}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {voice.description}
                  </p>
                  
                  {/* Expertise Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {voice.expertise.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Preview Button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlaying) {
                        stopVoiceSample();
                      } else {
                        playVoiceSample(voice.id);
                      }
                    }}
                    disabled={loadingPreview === voice.id}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      isPlaying
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : loadingPreview === voice.id
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    whileHover={{ scale: loadingPreview === voice.id ? 1 : 1.02 }}
                    whileTap={{ scale: loadingPreview === voice.id ? 1 : 0.98 }}
                  >
                    {loadingPreview === voice.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Stop Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Preview Voice</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Audio Settings */}
      <motion.div 
        variants={cardVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Speed Control */}
        <motion.div 
          className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Narration Speed
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <motion.span 
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500"
                key={selectedSpeed}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {selectedSpeed}x
              </motion.span>
              <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {selectedSpeed < 0.8 ? 'Slower' : selectedSpeed > 1.2 ? 'Faster' : 'Normal'} pace
              </span>
            </div>
            
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={selectedSpeed}
              onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0.5x Slow</span>
              <span>1.0x Normal</span>
              <span>2.0x Fast</span>
            </div>
          </div>
        </motion.div>

        {/* Quality Selection */}
        <motion.div 
          className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Audio Quality
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'tts-1' as const, icon: Music, label: 'Standard', desc: 'Fast generation', badge: 'Lower cost', badgeColor: 'text-green-500' },
              { id: 'tts-1-hd' as const, icon: Star, label: 'HD Quality', desc: 'Premium audio', badge: 'Best quality', badgeColor: 'text-purple-500' },
            ].map((quality) => (
              <motion.button
                key={quality.id}
                onClick={() => setSelectedQuality(quality.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedQuality === quality.id
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <quality.icon className={`w-6 h-6 mb-2 ${selectedQuality === quality.id ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div className="font-bold text-gray-900 dark:text-white">{quality.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{quality.desc}</div>
                <div className={`text-xs ${quality.badgeColor} mt-2 flex items-center gap-1`}>
                  {quality.id === 'tts-1' ? <CheckCircle2 className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                  {quality.badge}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Generation Mode */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          What would you like to generate?
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { mode: 'full' as const, icon: Book, title: 'Full Audiobook', desc: 'Generate complete audiobook as one file' },
            { mode: 'chapters' as const, icon: FileAudio, title: 'By Chapter', desc: 'Select specific chapters to generate' },
          ].map((option) => (
            <motion.button
              key={option.mode}
              onClick={() => setGenerationMode(option.mode)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                generationMode === option.mode
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <option.icon className={`w-10 h-10 mb-3 ${generationMode === option.mode ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div className="font-bold text-lg text-gray-900 dark:text-white">{option.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* Chapter Selection */}
        <AnimatePresence>
          {generationMode === 'chapters' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Select Chapters</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedChapters.length} of {totalChapters} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllChapters}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectMissingAudio}>
                    Missing Only ({totalChapters - chaptersWithAudio})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Select all chapters that have audio (for regeneration)
                      const chaptersWithAudioNumbers = chaptersData
                        .filter(ch => ch.audioUrl)
                        .map(ch => ch.number);
                      setSelectedChapters(chaptersWithAudioNumbers);
                    }}
                  >
                    With Audio ({chaptersWithAudio})
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {chaptersData.map((chapter, index) => {
                  const isSelected = selectedChapters.includes(chapter.number);
                  const hasAudio = !!chapter.audioUrl;
                  
                  return (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => toggleChapterSelection(chapter.number)}
                      whileHover={{ x: 4 }}
                      title={hasAudio && !isSelected ? 'Click to regenerate this chapter\'s audio' : undefined}
                    >
                      {/* Checkbox */}
                      <motion.div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-yellow-400 border-yellow-400'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        whileTap={{ scale: 0.8 }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="w-4 h-4 text-black" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Chapter Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Ch. {chapter.number}</span>
                          <h5 className="font-semibold text-gray-900 dark:text-white truncate">{chapter.title}</h5>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{chapter.wordCount.toLocaleString()} words</span>
                          <span>~{Math.ceil(chapter.wordCount / 150)} min</span>
                        </div>
                      </div>
                      
                      {/* Audio Status & Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasAudio ? (
                          <>
                            <Badge variant="success" size="sm">
                              <Headphones className="w-3 h-3 mr-1" /> Ready
                            </Badge>
                            {isSelected && (
                              <Badge variant="warning" size="sm" className="text-xs">
                                Will Regenerate
                              </Badge>
                            )}
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title);
                              }}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Download audio"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </motion.button>
                          </>
                        ) : (
                          <Badge variant="default" size="sm">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Generation Summary & Button */}
      <motion.div 
        variants={cardVariants}
        className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-1"
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                {isRegenerating ? 'Ready to Regenerate' : 'Ready to Generate'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {generationMode === 'full' 
                  ? `Full audiobook with ${totalChapters} chapters`
                  : `${selectedChapters.length} chapter${selectedChapters.length !== 1 ? 's' : ''} selected`
                }
                {isRegenerating && generationMode === 'chapters' && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    ({selectedChaptersWithAudio} will be regenerated)
                  </span>
                )}
                {isRegenerating && generationMode === 'full' && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    (will overwrite existing audio)
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">~{estimatedDuration()} min</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">estimated duration</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            {selectedVoiceInfo && (
              <>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedVoiceInfo.gradient} flex items-center justify-center`}>
                  <selectedVoiceInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedVoiceInfo.name} • {selectedSpeed}x speed • {selectedQuality === 'tts-1-hd' ? 'HD' : 'Standard'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedVoiceInfo.style}</div>
                </div>
              </>
            )}
          </div>

          <motion.div
            whileHover={{ scale: canGenerate && !isGenerating ? 1.01 : 1 }}
            whileTap={{ scale: canGenerate && !isGenerating ? 0.99 : 1 }}
          >
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full py-4 text-lg font-bold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transition-all"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegenerating ? 'Regenerating Audio...' : 'Generating Audio...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  {isRegenerating ? 'Regenerate Audiobook' : 'Generate Audiobook'}
                </span>
              )}
            </Button>
          </motion.div>
          
          {/* Regeneration Warning */}
          <AnimatePresence>
            {isRegenerating && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {generationMode === 'full' 
                      ? 'This will regenerate the full audiobook and overwrite the existing audio file.'
                      : `This will regenerate ${selectedChaptersWithAudio} chapter${selectedChaptersWithAudio !== 1 ? 's' : ''} that already have audio. The existing audio files will be replaced.`
                    }
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                      {generationProgress || 'Generating audio...'}
                    </p>
                    {generatingChapter && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">
                        Currently processing: <span className="font-semibold">Chapter {generatingChapter}</span>
                      </p>
                    )}
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      This may take several minutes. Please don't close this page.
                    </p>
                    {selectedVoiceInfo && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Voice: <span className="font-medium">{selectedVoiceInfo.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Full Audiobook Result */}
      <AnimatePresence>
        {fullAudioUrl && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <motion.div 
                className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="w-7 h-7" />
              </motion.div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Full Audiobook Ready!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your complete audiobook has been generated</p>
              </div>
              <Badge variant="success" size="lg">Complete</Badge>
            </div>

            <AudioPlayer
              audioUrl={fullAudioUrl}
              title={`${bookTitle} - Full Audiobook`}
            />

            <motion.button
              onClick={() => downloadAudioFile(fullAudioUrl, `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_Full_Audiobook.mp3`)}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Download className="w-5 h-5" />
              Download Full Audiobook
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Audio Results */}
      <AnimatePresence>
        {generatedAudios.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div 
                className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Headphones className="w-7 h-7" />
              </motion.div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Chapters Generated!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{generatedAudios.length} chapter audio files ready</p>
              </div>
              {generatedAudios.length > 1 && (
                <motion.button
                  onClick={handleDownloadAllAudio}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{downloadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Download All as ZIP</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <div className="space-y-4">
              {generatedAudios.map((audio, index) => {
                const chapter = chaptersData.find((ch) => ch.number === audio.chapterNumber);
                return (
                  <motion.div
                    key={audio.chapterNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-bold text-gray-900 dark:text-white">
                          Chapter {audio.chapterNumber}{chapter && `: ${chapter.title}`}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duration: {formatDuration(audio.duration)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleDownloadChapter(audio.audioUrl, audio.chapterNumber, chapter?.title || `Chapter_${audio.chapterNumber}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-medium rounded-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </motion.button>
                    </div>
                    <AudioPlayer audioUrl={audio.audioUrl} showMiniControls={true} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Audio Library */}
      {chaptersWithAudio > 0 && generatedAudios.length === 0 && (
        <motion.div 
          variants={cardVariants}
          className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-white" />
                </div>
                Your Audio Library
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{chaptersWithAudio} chapters with audio available</p>
            </div>
            <motion.button
              onClick={handleDownloadAllAudio}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-medium rounded-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{downloadProgress}%</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Download All</span>
                </>
              )}
            </motion.button>
          </div>

          <div className="space-y-4">
            {chaptersData.filter(ch => ch.audioUrl).map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Chapter Header */}
                <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 dark:text-white truncate">
                      Chapter {chapter.number}: {chapter.title}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {chapter.audioDuration ? formatDuration(chapter.audioDuration) : '—'} • {chapter.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handleDownloadChapter(chapter.audioUrl!, chapter.number, chapter.title)}
                    className="p-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg transition-all flex-shrink-0"
                    title="Download chapter"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
                {/* Audio Player - Full Width */}
                <div className="p-3">
                  <AudioPlayer audioUrl={chapter.audioUrl!} showMiniControls={true} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
