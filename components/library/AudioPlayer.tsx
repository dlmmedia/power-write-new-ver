'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
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

    const handleError = (e: ErrorEvent) => {
      const errorMsg = 'Failed to load audio';
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
    audio.addEventListener('error', handleError as any);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
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

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  if (showMiniControls) {
    return (
      <div className={`flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 ${className}`}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {isLoading ? (
          <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
        ) : error ? (
          <span className="text-red-400 text-sm">⚠️ Error</span>
        ) : (
          <>
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(duration)}</span>
            </div>

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-gray-200 dark:bg-gray-800 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            >
              {speedOptions.map(speed => (
                <option key={speed} value={speed}>{speed}x</option>
              ))}
            </select>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {title && (
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🎧</div>
          <div className="flex-1">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Audio Playback</p>
          </div>
          {isPlaying && <Badge variant="success" size="sm">Playing</Badge>}
        </div>
      )}

      {error ? (
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Please try regenerating the audio</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading audio...</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration - currentTime)} remaining</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={skipBackward}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center transition-colors"
              title="Skip back 15s"
            >
              ⏪
            </button>

            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center transition-colors text-2xl"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={skipForward}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-center transition-colors"
              title="Skip forward 15s"
            >
              ⏩
            </button>
          </div>

          {/* Additional Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Playback Speed */}
            <div>
              <label className="block text-sm font-medium mb-2">Playback Speed</label>
              <div className="flex gap-1">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`flex-1 py-2 text-sm rounded transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Volume: {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                </button>
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
                  className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
