'use client';

import { useState, useCallback } from 'react';
import { BookReader } from './BookReader';
import { BookEditor } from './BookEditor';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BookOpen, 
  PenTool, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioMetadata?: any;
}

interface WorkspaceProps {
  bookId: number;
  bookTitle: string;
  author: string;
  genre?: string;
  chapters: Chapter[];
  initialChapterIndex?: number;
  initialMode?: 'read' | 'edit';
  bibliography?: any;
  modelId?: string;
  onClose?: () => void;
  onSave?: (chapters: Chapter[]) => void;
  onAudioGenerated?: (chapterNumber: number, audioUrl: string, duration: number) => void;
}

export function Workspace({
  bookId,
  bookTitle,
  author,
  genre,
  chapters: initialChapters,
  initialChapterIndex = 0,
  initialMode = 'read',
  bibliography,
  modelId,
  onClose,
  onSave,
  onAudioGenerated,
}: WorkspaceProps) {
  const [mode, setMode] = useState<'read' | 'edit'>(initialMode);
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSave = useCallback((updatedChapters: Chapter[]) => {
    setChapters(updatedChapters);
    onSave?.(updatedChapters);
  }, [onSave]);

  const handleModeSwitch = () => {
    setMode(mode === 'read' ? 'edit' : 'read');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
              {bookTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">by {author}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('read')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'read'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Read
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'edit'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'read' ? (
          <BookReader
            bookId={bookId}
            bookTitle={bookTitle}
            author={author}
            chapters={chapters}
            initialChapterIndex={initialChapterIndex}
            bibliography={bibliography}
            onClose={onClose}
            onAudioGenerated={onAudioGenerated}
          />
        ) : (
          <BookEditor
            bookId={bookId}
            bookTitle={bookTitle}
            author={author}
            genre={genre}
            chapters={chapters}
            modelId={modelId}
            onClose={onClose}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

// Compact workspace mode switcher for use outside the workspace
interface WorkspaceModeSwitcherProps {
  mode: 'read' | 'edit';
  onChange: (mode: 'read' | 'edit') => void;
  className?: string;
}

export function WorkspaceModeSwitcher({ mode, onChange, className = '' }: WorkspaceModeSwitcherProps) {
  return (
    <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onChange('read')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'read'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <BookOpen className="w-4 h-4" />
        <span>Read</span>
      </button>
      <button
        onClick={() => onChange('edit')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          mode === 'edit'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <PenTool className="w-4 h-4" />
        <span>Edit</span>
      </button>
    </div>
  );
}
