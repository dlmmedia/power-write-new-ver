'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Merge,
  Scissors,
  Check,
  X,
  Eye,
  EyeOff,
  GripVertical,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface ReviewChapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
}

interface ChapterReviewEditorProps {
  chapters: ReviewChapter[];
  onChaptersChange: (chapters: ReviewChapter[]) => void;
  totalWordCount: number;
}

export function ChapterReviewEditor({
  chapters,
  onChaptersChange,
  totalWordCount,
}: ChapterReviewEditorProps) {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [splitMode, setSplitMode] = useState<number | null>(null);
  const [splitPosition, setSplitPosition] = useState<number>(0);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [mergeSelection, setMergeSelection] = useState<number | null>(null);

  // Calculate word count
  const countWords = useCallback((text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Renumber chapters sequentially
  const renumberChapters = useCallback((chapterList: ReviewChapter[]): ReviewChapter[] => {
    return chapterList.map((ch, idx) => ({ ...ch, number: idx + 1 }));
  }, []);

  // Handle title edit
  const startEditingTitle = (chapterIndex: number) => {
    setEditingTitle(chapterIndex);
    setEditTitleValue(chapters[chapterIndex].title);
  };

  const saveTitle = () => {
    if (editingTitle === null) return;

    const newChapters = [...chapters];
    newChapters[editingTitle] = {
      ...newChapters[editingTitle],
      title: editTitleValue.trim() || `Chapter ${editingTitle + 1}`,
    };
    onChaptersChange(newChapters);
    setEditingTitle(null);
    setEditTitleValue('');
  };

  const cancelEditTitle = () => {
    setEditingTitle(null);
    setEditTitleValue('');
  };

  // Handle merge
  const startMerge = (chapterIndex: number) => {
    setMergeSelection(chapterIndex);
  };

  const confirmMerge = (targetIndex: number) => {
    if (mergeSelection === null) return;

    const minIndex = Math.min(mergeSelection, targetIndex);
    const maxIndex = Math.max(mergeSelection, targetIndex);

    // Can only merge adjacent chapters
    if (maxIndex - minIndex !== 1) {
      setMergeSelection(null);
      return;
    }

    const chapter1 = chapters[minIndex];
    const chapter2 = chapters[maxIndex];

    const mergedContent = chapter1.content + '\n\n' + chapter2.content;
    const mergedChapter: ReviewChapter = {
      number: minIndex + 1,
      title: chapter1.title,
      content: mergedContent,
      wordCount: countWords(mergedContent),
    };

    const newChapters = [
      ...chapters.slice(0, minIndex),
      mergedChapter,
      ...chapters.slice(maxIndex + 1),
    ];

    onChaptersChange(renumberChapters(newChapters));
    setMergeSelection(null);
    setExpandedChapter(null);
  };

  const cancelMerge = () => {
    setMergeSelection(null);
  };

  // Handle split
  const startSplit = (chapterIndex: number) => {
    setSplitMode(chapterIndex);
    setSplitPosition(Math.floor(chapters[chapterIndex].content.length / 2));
    setNewChapterTitle(`Chapter ${chapterIndex + 2}`);
  };

  const confirmSplit = () => {
    if (splitMode === null) return;

    const chapter = chapters[splitMode];
    const content1 = chapter.content.substring(0, splitPosition).trim();
    const content2 = chapter.content.substring(splitPosition).trim();

    if (!content1 || !content2) {
      return; // Invalid split
    }

    const newChapter1: ReviewChapter = {
      number: splitMode + 1,
      title: chapter.title,
      content: content1,
      wordCount: countWords(content1),
    };

    const newChapter2: ReviewChapter = {
      number: splitMode + 2,
      title: newChapterTitle.trim() || `Chapter ${splitMode + 2}`,
      content: content2,
      wordCount: countWords(content2),
    };

    const newChapters = [
      ...chapters.slice(0, splitMode),
      newChapter1,
      newChapter2,
      ...chapters.slice(splitMode + 1),
    ];

    onChaptersChange(renumberChapters(newChapters));
    setSplitMode(null);
    setSplitPosition(0);
    setNewChapterTitle('');
    setExpandedChapter(null);
  };

  const cancelSplit = () => {
    setSplitMode(null);
    setSplitPosition(0);
    setNewChapterTitle('');
  };

  // Toggle chapter preview
  const toggleExpanded = (chapterIndex: number) => {
    setExpandedChapter(expandedChapter === chapterIndex ? null : chapterIndex);
  };

  // Computed stats
  const stats = useMemo(() => {
    const avgWords = Math.round(totalWordCount / chapters.length);
    const minWords = Math.min(...chapters.map(ch => ch.wordCount));
    const maxWords = Math.max(...chapters.map(ch => ch.wordCount));
    return { avgWords, minWords, maxWords };
  }, [chapters, totalWordCount]);

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            {chapters.length} chapters
          </span>
        </div>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <span className="text-gray-600 dark:text-gray-400">
          {totalWordCount.toLocaleString()} total words
        </span>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <span className="text-gray-600 dark:text-gray-400">
          ~{stats.avgWords.toLocaleString()} words/chapter
        </span>
      </div>

      {/* Merge Mode Indicator */}
      {mergeSelection !== null && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Merge className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Select an adjacent chapter to merge with Chapter {mergeSelection + 1}
            </span>
          </div>
          <button
            onClick={cancelMerge}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Split Mode Editor */}
      {splitMode !== null && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Split Chapter {splitMode + 1}
              </span>
            </div>
            <button
              onClick={cancelSplit}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
              Split Position (character {splitPosition} of {chapters[splitMode].content.length})
            </label>
            <input
              type="range"
              min={100}
              max={chapters[splitMode].content.length - 100}
              value={splitPosition}
              onChange={(e) => setSplitPosition(parseInt(e.target.value))}
              className="w-full h-2 bg-amber-200 dark:bg-amber-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <Input
            label="New Chapter Title"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Enter title for the new chapter"
          />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
              <span className="text-gray-500 dark:text-gray-400">First part: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {countWords(chapters[splitMode].content.substring(0, splitPosition)).toLocaleString()} words
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
              <span className="text-gray-500 dark:text-gray-400">Second part: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {countWords(chapters[splitMode].content.substring(splitPosition)).toLocaleString()} words
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancelSplit}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmSplit}>
              <Scissors className="w-3 h-3 mr-1" />
              Split Chapter
            </Button>
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
        {chapters.map((chapter, index) => {
          const isExpanded = expandedChapter === index;
          const isMergeTarget = mergeSelection !== null && mergeSelection !== index;
          const canMergeWith = isMergeTarget && Math.abs(mergeSelection - index) === 1;

          return (
            <div
              key={index}
              className={`
                transition-colors
                ${mergeSelection === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${canMergeWith ? 'hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer' : ''}
              `}
              onClick={canMergeWith ? () => confirmMerge(index) : undefined}
            >
              {/* Chapter Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />

                {/* Chapter Number */}
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg">
                  {chapter.number}
                </span>

                {/* Title (editable) */}
                {editingTitle === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') cancelEditTitle();
                      }}
                      className="flex-1 px-2 py-1 bg-white dark:bg-gray-900 border border-yellow-400 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      autoFocus
                    />
                    <button
                      onClick={saveTitle}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditTitle}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canMergeWith) startEditingTitle(index);
                    }}
                    title="Click to edit title"
                  >
                    {chapter.title}
                  </span>
                )}

                {/* Word Count */}
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {chapter.wordCount.toLocaleString()} words
                </span>

                {/* Actions */}
                {mergeSelection === null && splitMode === null && editingTitle !== index && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(index);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Edit title"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {chapters.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startMerge(index);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Merge with adjacent chapter"
                      >
                        <Merge className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {chapter.wordCount > 500 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startSplit(index);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                        title="Split chapter"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(index);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title={isExpanded ? 'Hide preview' : 'Show preview'}
                    >
                      {isExpanded ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Merge indicator */}
                {canMergeWith && (
                  <span className="text-xs font-medium text-blue-500">
                    Click to merge
                  </span>
                )}

                {/* Expand/Collapse */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canMergeWith) toggleExpanded(index);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Content Preview */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="ml-12 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-10">
                      {chapter.content.substring(0, 1500)}
                      {chapter.content.length > 1500 && '...'}
                    </p>
                    {chapter.content.length > 1500 && (
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Showing first 1,500 characters of {chapter.content.length.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Tip:</strong> Click on a chapter title to rename it. Use the merge button to combine adjacent chapters, or the split button to divide a long chapter into two parts.
        </p>
      </div>
    </div>
  );
}
