'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { TextChunk, ReadingTheme, READING_THEMES } from './types';

interface AudioTextHighlighterProps {
  chunks: TextChunk[];
  currentWordIndex: number;
  isAudioPlaying: boolean;
  theme: ReadingTheme;
  fontSize: string;
  lineHeight: string;
  textColor: string;
  fontFamily?: string;
  // Callback to get base word offset for this page
  getPageBaseOffset: () => number;
}

// Helper to count words in a chunk
const countWords = (text: string) => text.split(/\s+/).filter(w => w.trim().length > 0).length;

export const AudioTextHighlighter: React.FC<AudioTextHighlighterProps> = ({
  chunks,
  currentWordIndex,
  isAudioPlaying,
  theme,
  fontSize,
  lineHeight,
  textColor,
  fontFamily = '"EB Garamond", "Crimson Pro", Georgia, serif',
  getPageBaseOffset,
}) => {
  const themeConfig = READING_THEMES[theme];
  const activeWordRef = useRef<HTMLSpanElement>(null);
  
  // Calculate word offsets for each chunk
  const chunkWordData = useMemo(() => {
    const pageBaseOffset = getPageBaseOffset();
    let localOffset = 0;
    
    return chunks.map(chunk => {
      const offset = pageBaseOffset + localOffset;
      const wordCount = countWords(chunk.text);
      localOffset += wordCount;
      
      return {
        startOffset: offset,
        endOffset: offset + wordCount - 1,
        wordCount,
      };
    });
  }, [chunks, getPageBaseOffset]);
  
  // Find which chunk contains the active word
  const activeChunkIndex = useMemo(() => {
    if (!isAudioPlaying || currentWordIndex < 0) return -1;
    
    return chunkWordData.findIndex(
      data => currentWordIndex >= data.startOffset && currentWordIndex <= data.endOffset
    );
  }, [chunkWordData, currentWordIndex, isAudioPlaying]);

  // Scroll active word into view smoothly (only when playing, not when paused)
  useEffect(() => {
    if (activeWordRef.current && isAudioPlaying && currentWordIndex >= 0) {
      // Use a gentle scroll that doesn't disrupt reading
      const element = activeWordRef.current;
      const rect = element.getBoundingClientRect();
      const isInView = rect.top >= 100 && rect.bottom <= window.innerHeight - 100;
      
      if (!isInView) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
  }, [currentWordIndex, isAudioPlaying]);
  
  // Render a single chunk with word highlighting - NO LAYOUT SHIFTS
  // IMPORTANT: Always wrap ALL words in spans to prevent DOM structure changes
  const renderChunk = (chunk: TextChunk, chunkIndex: number) => {
    const chunkData = chunkWordData[chunkIndex];
    const parts = chunk.text.split(/(\s+)/);
    let wordCounter = chunkData.startOffset;
    
    return parts.map((part, i) => {
      const isWord = part.trim().length > 0;
      
      if (!isWord) {
        // Preserve whitespace exactly as-is (no wrapper needed for spaces)
        return part;
      }
      
      const wordIndex = wordCounter;
      wordCounter++;
      
      // Calculate highlight intensity based on distance from current word
      let background = 'transparent';
      let color = 'inherit';
      
      // Highlight when audio is playing and we have a valid word index
      if (isAudioPlaying && currentWordIndex >= 0) {
        const distance = Math.abs(wordIndex - currentWordIndex);
        const isCurrentWord = wordIndex === currentWordIndex;
        const isPreviousWord = wordIndex === currentWordIndex - 1;
        const isNextWord = wordIndex === currentWordIndex + 1;
        
        if (isCurrentWord) {
          background = themeConfig.accentColor;
          color = theme === 'night' || theme === 'focus' ? '#fff' : '#1a1a1a';
        } else if (isPreviousWord) {
          background = `${themeConfig.accentColor}22`;
        } else if (isNextWord) {
          background = `${themeConfig.accentColor}10`;
        } else if (distance <= 3) {
          const opacity = Math.max(0, 6 - distance * 2);
          background = `${themeConfig.accentColor}0${opacity}`;
        }
      }
      
      // Always render a span for every word - prevents DOM structure changes
      return (
        <span
          key={i}
          ref={wordIndex === currentWordIndex ? activeWordRef : undefined}
          className="audio-word"
          style={{
            background,
            color,
            borderRadius: '2px',
          }}
        >
          {part}
        </span>
      );
    });
  };
  
  return (
    <>
      {chunks.map((chunk, index) => {
        const isActiveChunk = index === activeChunkIndex;
        
        return (
          <p
            key={index}
            className={`mb-5 text-justify ${fontSize} ${lineHeight} audio-paragraph`}
            style={{
              color: textColor,
              fontFamily,
              textIndent: chunk.isParagraphStart ? '2.5em' : '0',
              hyphens: 'auto',
              letterSpacing: '0.01em',
              position: 'relative',
              // Active paragraph gets subtle left border - using box-shadow to avoid layout shift
              boxShadow: isActiveChunk && isAudioPlaying 
                ? `inset 4px 0 0 ${themeConfig.accentColor}60`
                : 'none',
              backgroundColor: isActiveChunk && isAudioPlaying
                ? `${themeConfig.accentColor}05` 
                : 'transparent',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {renderChunk(chunk, index)}
          </p>
        );
      })}
    </>
  );
};

export default AudioTextHighlighter;
