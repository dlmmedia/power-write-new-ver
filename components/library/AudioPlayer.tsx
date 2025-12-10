'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1,
  Headphones,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
  showMiniControls?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title,
  onEnded,
  onError,
  autoPlay = false,
  showMiniControls = false,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handleError = () => {
      const mediaError = audio.error;
      let errorMsg = 'Failed to load audio';
      
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = 'Audio loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Audio decoding error - file may be corrupted';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Audio format not supported or URL invalid';
            break;
          default:
            errorMsg = mediaError.message || 'Unknown audio error';
        }
      }
      
      console.error('AudioPlayer error:', errorMsg, {
        audioUrl,
        errorCode: mediaError?.code,
        errorMessage: mediaError?.message,
      });
      
      setError(errorMsg);
      setIsLoading(false);
      if (onError) onError(new Error(errorMsg));
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay) {
        audio.play().catch(err => console.error('Autoplay failed:', err));
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, autoPlay, onEnded, onError]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = async () => {
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
  };

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
    const percentage = hoverX / rect.width;
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume > 0.5 ? Volume2 : Volume1;

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mini Controls Version
  if (showMiniControls) {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3 shadow-sm ${className}`}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 w-full py-1">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
            <span className="text-sm">Loading audio...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-red-400 w-full py-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{error}</span>
          </div>
        ) : (
          <>
            {/* Play Button */}
            <motion.button
              onClick={togglePlayPause}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isPlaying 
                  ? 'bg-green-500 hover:bg-green-400 text-white' 
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Pause className="w-4 h-4" fill="currentColor" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            {/* Progress Section */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-9 sm:w-10 text-right tabular-nums font-medium flex-shrink-0">
                {formatTime(currentTime)}
              </span>
              
              {/* Custom Progress Bar */}
              <div 
                ref={progressRef}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative group min-w-[60px]"
                onClick={handleProgressClick}
                onMouseMove={handleProgressHover}
                onMouseEnter={() => setIsHoveringProgress(true)}
                onMouseLeave={() => setIsHoveringProgress(false)}
              >
                {/* Hover Preview */}
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
                
                {/* Progress Fill */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
                
                {/* Thumb */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
              
              <span className="text-xs text-gray-500 dark:text-gray-400 w-9 sm:w-10 tabular-nums font-medium flex-shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Speed Control - Compact dropdown */}
            <div className="relative flex-shrink-0">
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="appearance-none bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm pl-2 pr-6 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {speedOptions.map(speed => (
                  <option key={speed} value={speed}>{speed}x</option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Volume */}
            <motion.button
              onClick={toggleMute}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <VolumeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </>
        )}
      </div>
    );
  }

  // Full Player Version
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {title && (
        <div className="flex items-center gap-4 mb-6">
          <motion.div 
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                : 'bg-gradient-to-br from-yellow-400 to-amber-500'
            }`}
            animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Headphones className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isPlaying ? 'Now Playing' : 'Audio Player'}
            </p>
          </div>
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="success" size="sm" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Playing
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {error ? (
        <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Please try regenerating the audio</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading audio...</p>
        </div>
      ) : (
        <>
          {/* Waveform-style Progress Bar */}
          <div className="mb-6">
            <div 
              ref={progressRef}
              className="relative h-16 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden cursor-pointer group"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => setIsHoveringProgress(false)}
            >
              {/* Waveform Visualization */}
              <div className="absolute inset-0 flex items-center justify-around px-2">
                {Array.from({ length: 50 }).map((_, i) => {
                  const height = 20 + Math.sin(i * 0.3) * 15 + (i % 3) * 5;
                  const isPlayed = (i / 50) * 100 <= progressPercent;
                  return (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        isPlayed 
                          ? 'bg-gradient-to-t from-yellow-400 to-amber-500' 
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      style={{ height: `${height}%` }}
                      animate={isPlaying && isPlayed ? { 
                        scaleY: [1, 1.2, 1],
                      } : {}}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 0.5, 
                        delay: i * 0.02 
                      }}
                    />
                  );
                })}
              </div>

              {/* Progress Overlay */}
              <motion.div 
                className="absolute inset-y-0 left-0 bg-yellow-400/20 border-r-2 border-yellow-400"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Hover Time Indicator */}
              <AnimatePresence>
                {isHoveringProgress && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg transform -translate-x-1/2 z-10 shadow-lg"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {formatTime(hoverTime)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time Display */}
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span className="tabular-nums font-medium">{formatTime(currentTime)}</span>
              <span className="text-xs">{formatTime(duration - currentTime)} remaining</span>
              <span className="tabular-nums font-medium">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Skip Back */}
            <motion.button
              onClick={skipBackward}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all"
              title="Skip back 15s"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              onClick={togglePlayPause}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isPlaying 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white shadow-green-500/30' 
                  : 'bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-yellow-500/30'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Pause className="w-8 h-8" fill="currentColor" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Play className="w-8 h-8 ml-1" fill="currentColor" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Skip Forward */}
            <motion.button
              onClick={skipForward}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all"
              title="Skip forward 15s"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Additional Controls */}
          <div className="grid grid-cols-2 gap-6">
            {/* Playback Speed */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                Playback Speed
              </label>
              <div className="flex gap-1">
                {speedOptions.map((speed) => (
                  <motion.button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`flex-1 py-2 text-sm rounded-lg transition-all font-medium ${
                      playbackSpeed === speed
                        ? 'bg-yellow-400 text-black shadow-md'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {speed}x
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                Volume: {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
              </label>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={toggleMute}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isMuted 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <VolumeIcon className="w-5 h-5" />
                </motion.button>
                <div className="flex-1 relative">
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
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
