'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  List,
  X,
  BookOpen,
} from 'lucide-react';
import { AudiobookChapterList } from './AudiobookChapterList';

export interface AudiobookChapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioMetadata?: any;
  audioTimestamps?: { word: string; start: number; end: number }[] | null;
}

export interface AudiobookPlayerProps {
  bookId: number;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  chapters: AudiobookChapter[];
  initialChapterIndex?: number;
  initialTime?: number;
  onClose?: () => void;
  onProgressUpdate?: (chapterIndex: number, currentTime: number) => void;
  isModal?: boolean;
}

export const AudiobookPlayer: React.FC<AudiobookPlayerProps> = ({
  bookId,
  bookTitle,
  author,
  coverUrl,
  chapters,
  initialChapterIndex = 0,
  initialTime = 0,
  onClose,
  onProgressUpdate,
  isModal = false,
}) => {
  // Filter chapters that have audio
  const chaptersWithAudio = chapters.filter(ch => ch.audioUrl);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [currentChapterIndex, setCurrentChapterIndex] = useState(() => {
    // Find the initial chapter in the filtered list
    const idx = chaptersWithAudio.findIndex(ch => ch.number === chapters[initialChapterIndex]?.number);
    return idx >= 0 ? idx : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const currentChapter = chaptersWithAudio[currentChapterIndex];
  const hasAudio = chaptersWithAudio.length > 0;

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`audiobook-progress-${bookId}`);
    if (savedProgress) {
      try {
        const { chapterIndex, time } = JSON.parse(savedProgress);
        if (chapterIndex !== undefined && chapterIndex < chaptersWithAudio.length) {
          setCurrentChapterIndex(chapterIndex);
          setCurrentTime(time || 0);
        }
      } catch (e) {
        console.error('Failed to parse saved progress', e);
      }
    }
  }, [bookId, chaptersWithAudio.length]);

  // Save progress periodically
  useEffect(() => {
    const saveProgress = () => {
      const progress = {
        chapterIndex: currentChapterIndex,
        time: currentTime,
        updatedAt: Date.now(),
      };
      localStorage.setItem(`audiobook-progress-${bookId}`, JSON.stringify(progress));
      onProgressUpdate?.(currentChapterIndex, currentTime);
    };

    const interval = setInterval(saveProgress, 5000); // Save every 5 seconds
    return () => clearInterval(interval);
  }, [bookId, currentChapterIndex, currentTime, onProgressUpdate]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter?.audioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      // Restore time position if we have saved progress
      if (currentTime > 0 && currentTime < audio.duration) {
        audio.currentTime = currentTime;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next chapter
      if (currentChapterIndex < chaptersWithAudio.length - 1) {
        setCurrentChapterIndex(prev => prev + 1);
        setCurrentTime(0);
      }
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    // Load new audio when chapter changes
    setIsLoading(true);
    setError(null);
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [currentChapter?.audioUrl, currentChapterIndex, chaptersWithAudio.length]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Auto-play when chapter changes (if was playing)
  useEffect(() => {
    if (isPlaying && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentChapterIndex, isLoading]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Playback failed');
    }
  }, [isPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const progress = progressRef.current;
    if (!progress) return;

    const rect = progress.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(percentage * duration);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      setCurrentTime(0);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chaptersWithAudio.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      setCurrentTime(0);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentTime(0);
    setShowChapterList(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume > 0.5 ? Volume2 : Volume1;
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate total book duration
  const totalDuration = chaptersWithAudio.reduce((acc, ch) => acc + (ch.audioDuration || 0), 0);
  const completedDuration = chaptersWithAudio
    .slice(0, currentChapterIndex)
    .reduce((acc, ch) => acc + (ch.audioDuration || 0), 0) + currentTime;
  const totalProgressPercent = totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0;

  if (!hasAudio) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center z-50">
        <div className="text-center px-8">
          <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Audio Available</h2>
          <p className="text-gray-400 mb-8 max-w-md">
            This book doesn't have any generated audio yet. Generate audio for chapters first to use the audiobook player.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black z-50 overflow-hidden">
      {/* Hidden audio element */}
      {currentChapter?.audioUrl && (
        <audio ref={audioRef} src={currentChapter.audioUrl} preload="metadata" />
      )}

      {/* Ambient glow effect behind cover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
          style={{
            background: coverUrl 
              ? 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.1) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6 z-10">
        {onClose && (
          <motion.button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </motion.button>
        )}
        
        <div className="flex items-center gap-3">
          {/* Chapter list toggle */}
          <motion.button
            onClick={() => setShowChapterList(!showChapterList)}
            className={`p-2 rounded-full transition-colors ${
              showChapterList 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showChapterList ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Main content */}
      <div className="h-full flex">
        {/* Player section */}
        <div className={`flex-1 flex flex-col items-center justify-center px-6 transition-all duration-300 ${
          showChapterList ? 'mr-80' : ''
        }`}>
          {/* Book cover */}
          <motion.div 
            className="relative mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`relative w-56 h-80 md:w-72 md:h-[420px] rounded-lg overflow-hidden shadow-2xl ${
              isPlaying ? 'shadow-amber-500/20' : 'shadow-black/50'
            }`}>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={bookTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
              
              {/* Playing indicator overlay */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  >
                    <div className="flex items-end gap-1 h-8">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-amber-400 rounded-full"
                          animate={{
                            height: ['40%', '100%', '60%', '80%', '40%'],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Pulsing glow when playing */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 -z-10 rounded-lg bg-amber-500/30 blur-xl"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Book info */}
          <motion.div 
            className="text-center mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-2">{bookTitle}</h1>
            <p className="text-gray-400 text-sm md:text-base">{author}</p>
          </motion.div>

          {/* Current chapter info */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-amber-400 text-sm font-medium">
              Chapter {currentChapter?.number}: {currentChapter?.title}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {currentChapterIndex + 1} of {chaptersWithAudio.length} chapters
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div 
            className="w-full max-w-xl px-4 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div
              ref={progressRef}
              className="relative h-2 bg-gray-800 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => setIsHoveringProgress(false)}
            >
              {/* Hover preview */}
              <AnimatePresence>
                {isHoveringProgress && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-8 px-2 py-1 bg-gray-800 text-white text-xs rounded transform -translate-x-1/2 pointer-events-none shadow-lg z-10"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 8px)` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span className="tabular-nums">{formatTime(currentTime)}</span>
              <span className="tabular-nums">{formatTime(duration)}</span>
            </div>
          </motion.div>

          {/* Main controls */}
          <motion.div 
            className="flex items-center justify-center gap-4 md:gap-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Previous chapter */}
            <motion.button
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex === 0}
              className="p-3 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Previous chapter"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Skip back 15s */}
            <motion.button
              onClick={skipBackward}
              className="p-3 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Skip back 15 seconds"
            >
              <SkipBack className="w-6 h-6" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              onClick={togglePlayPause}
              disabled={isLoading || !!error}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                  : 'bg-white hover:bg-gray-100 text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : error ? (
                <AlertCircle className="w-8 h-8" />
              ) : isPlaying ? (
                <Pause className="w-8 h-8" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              )}
            </motion.button>

            {/* Skip forward 15s */}
            <motion.button
              onClick={skipForward}
              className="p-3 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Skip forward 15 seconds"
            >
              <SkipForward className="w-6 h-6" />
            </motion.button>

            {/* Next chapter */}
            <motion.button
              onClick={goToNextChapter}
              disabled={currentChapterIndex === chaptersWithAudio.length - 1}
              className="p-3 rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Next chapter"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </motion.div>

          {/* Secondary controls */}
          <motion.div 
            className="flex items-center justify-center gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {/* Playback speed */}
            <div className="relative">
              <motion.button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1.5 rounded-full bg-gray-800/50 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {playbackSpeed}x
              </motion.button>
              
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 rounded-lg shadow-xl overflow-hidden"
                  >
                    {speedOptions.map(speed => (
                      <button
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${
                          playbackSpeed === speed ? 'text-amber-400 bg-gray-700/50' : 'text-gray-300'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={toggleMute}
                className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <VolumeIcon className="w-5 h-5" />
              </motion.button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-20 md:w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </motion.div>

          {/* Total book progress */}
          <motion.div 
            className="w-full max-w-xl px-4 mt-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Book Progress</span>
              <span>{Math.round(totalProgressPercent)}%</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                style={{ width: `${totalProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{formatTime(completedDuration)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </div>

        {/* Chapter list sidebar */}
        <AnimatePresence>
          {showChapterList && (
            <AudiobookChapterList
              chapters={chaptersWithAudio}
              allChapters={chapters}
              currentChapterIndex={currentChapterIndex}
              onSelectChapter={goToChapter}
              onClose={() => setShowChapterList(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};





