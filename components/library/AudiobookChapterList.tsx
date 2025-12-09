'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Play, 
  Clock, 
  Volume2,
  VolumeX,
  Check
} from 'lucide-react';

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

interface AudiobookChapterListProps {
  chapters: Chapter[]; // Chapters with audio
  allChapters: Chapter[]; // All chapters including those without audio
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  onClose: () => void;
}

export const AudiobookChapterList: React.FC<AudiobookChapterListProps> = ({
  chapters,
  allChapters,
  currentChapterIndex,
  onSelectChapter,
  onClose,
}) => {
  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total duration
  const totalDuration = chapters.reduce((acc, ch) => acc + (ch.audioDuration || 0), 0);
  const completedDuration = chapters
    .slice(0, currentChapterIndex)
    .reduce((acc, ch) => acc + (ch.audioDuration || 0), 0);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold">Chapters</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {chapters.length} chapters with audio
          </p>
        </div>
        <motion.button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Progress summary */}
      <div className="px-4 py-3 bg-gray-800/30 border-b border-gray-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400">Total Duration</span>
          <span className="text-amber-400 font-medium">{formatDuration(totalDuration)}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-1.5">
          {currentChapterIndex + 1} of {chapters.length} chapters
        </p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="p-2">
          {allChapters.map((chapter, allIndex) => {
            // Find if this chapter has audio
            const audioIndex = chapters.findIndex(ch => ch.number === chapter.number);
            const hasAudio = audioIndex !== -1;
            const isCurrentChapter = hasAudio && audioIndex === currentChapterIndex;
            const isCompleted = hasAudio && audioIndex < currentChapterIndex;
            const audioChapter = hasAudio ? chapters[audioIndex] : null;

            return (
              <motion.button
                key={chapter.id}
                onClick={() => hasAudio && onSelectChapter(audioIndex)}
                disabled={!hasAudio}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-all group ${
                  isCurrentChapter
                    ? 'bg-amber-500/20 border border-amber-500/30'
                    : hasAudio
                    ? 'hover:bg-gray-800/50 border border-transparent'
                    : 'opacity-50 cursor-not-allowed border border-transparent'
                }`}
                whileHover={hasAudio ? { scale: 1.01 } : {}}
                whileTap={hasAudio ? { scale: 0.99 } : {}}
              >
                <div className="flex items-start gap-3">
                  {/* Chapter number / status indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCurrentChapter
                      ? 'bg-amber-500 text-black'
                      : isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : hasAudio
                      ? 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                      : 'bg-gray-800/50 text-gray-600'
                  }`}>
                    {isCurrentChapter ? (
                      <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    ) : isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : hasAudio ? (
                      <span className="text-xs font-medium">{chapter.number}</span>
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </div>

                  {/* Chapter info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCurrentChapter
                        ? 'text-amber-400'
                        : hasAudio
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}>
                      {chapter.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {hasAudio ? (
                        <>
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatDuration(audioChapter?.audioDuration)}
                          </span>
                          {isCurrentChapter && (
                            <span className="text-xs text-amber-400 font-medium ml-2">
                              Now Playing
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-600">No audio</span>
                      )}
                    </div>
                  </div>

                  {/* Audio indicator */}
                  {hasAudio && !isCurrentChapter && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  {/* Playing animation */}
                  {isCurrentChapter && (
                    <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-amber-400 rounded-full"
                          animate={{
                            height: ['30%', '100%', '50%', '80%', '30%'],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Volume2 className="w-4 h-4" />
          <span>
            {chapters.length} of {allChapters.length} chapters have audio
          </span>
        </div>
      </div>
    </motion.div>
  );
};

