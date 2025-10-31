'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  isEdited?: boolean;
}

interface BookEditorProps {
  bookId: number;
  bookTitle: string;
  author: string;
  chapters: Chapter[];
  onClose?: () => void;
  onSave?: (updatedChapters: Chapter[]) => void;
}

export const BookEditor: React.FC<BookEditorProps> = ({
  bookId,
  bookTitle,
  author,
  chapters: initialChapters,
  onClose,
  onSave,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  const currentChapter = chapters[currentChapterIndex];

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateChapterContent = (content: string) => {
    const updatedChapters = [...chapters];
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    
    updatedChapters[currentChapterIndex] = {
      ...currentChapter,
      content,
      wordCount,
      isEdited: true,
    };
    
    setChapters(updatedChapters);
    setHasUnsavedChanges(true);
  };

  const updateChapterTitle = (title: string) => {
    const updatedChapters = [...chapters];
    updatedChapters[currentChapterIndex] = {
      ...currentChapter,
      title,
      isEdited: true,
    };
    
    setChapters(updatedChapters);
    setHasUnsavedChanges(true);
  };

  const addChapter = () => {
    const newChapterNumber = chapters.length + 1;
    const newChapter: Chapter = {
      id: Date.now(), // Temporary ID
      number: newChapterNumber,
      title: `New Chapter ${newChapterNumber}`,
      content: '',
      wordCount: 0,
      status: 'draft',
      isEdited: true,
    };

    setChapters([...chapters, newChapter]);
    setCurrentChapterIndex(chapters.length);
    setHasUnsavedChanges(true);
  };

  const deleteChapter = (index: number) => {
    if (chapters.length === 1) {
      alert('Cannot delete the last chapter');
      return;
    }

    if (!confirm(`Delete Chapter ${chapters[index].number}: ${chapters[index].title}?`)) {
      return;
    }

    const updatedChapters = chapters.filter((_, i) => i !== index);
    // Renumber chapters
    updatedChapters.forEach((ch, i) => {
      ch.number = i + 1;
    });

    setChapters(updatedChapters);
    setCurrentChapterIndex(Math.min(currentChapterIndex, updatedChapters.length - 1));
    setHasUnsavedChanges(true);
  };

  const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = currentChapter.content;
    const newContent = content.substring(0, start) + text + content.substring(end);
    updateChapterContent(newContent);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'underline' | 'quote' | 'list') => {
    const textarea = document.getElementById('chapter-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentChapter.content.substring(start, end);

    if (!selectedText) {
      alert('Please select text to format');
      return;
    }

    let formattedText = '';
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
    }

    const newContent = 
      currentChapter.content.substring(0, start) + 
      formattedText + 
      currentChapter.content.substring(end);
    
    updateChapterContent(newContent);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      alert('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/books/${bookId}/chapters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave(chapters);
      }

      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    if (onClose) {
      onClose();
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setShowChapterList(false);
    window.scrollTo(0, 0);
  };

  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 overflow-hidden flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-white dark:bg-black px-4 py-3 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← {hasUnsavedChanges ? 'Close (Unsaved Changes)' : 'Close'}
            </button>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">Editing: {bookTitle}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">by {author}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            <Button
              variant={hasUnsavedChanges ? 'primary' : 'outline'}
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </Button>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded px-2 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Font:</span>
              {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 text-${size} rounded ${
                    fontSize === size ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  A
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 px-3 py-2 rounded transition-colors text-gray-900 dark:text-white"
            >
              <span className="text-sm">
                Chapter {currentChapter.number} of {chapters.length}
              </span>
              <span className="text-xs">{showChapterList ? '▲' : '▼'}</span>
            </button>

            <Badge variant="info">
              {totalWords.toLocaleString()} total words
            </Badge>
          </div>
        </div>

        {/* Chapter List Dropdown */}
        {showChapterList && (
          <div className="absolute right-4 top-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto w-96 z-50">
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Chapters</h3>
                <Button variant="outline" size="sm" onClick={addChapter}>
                  + Add Chapter
                </Button>
              </div>
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`group rounded mb-1 ${
                    index === currentChapterIndex ? 'bg-yellow-400/10 border-l-2 border-yellow-400' : ''
                  }`}
                >
                  <button
                    onClick={() => goToChapter(index)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between text-gray-900 dark:text-white"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        Chapter {chapter.number}: {chapter.title}
                        {chapter.isEdited && <Badge variant="warning" size="sm">Edited</Badge>}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {chapter.wordCount.toLocaleString()} words
                      </div>
                    </div>
                    {index === currentChapterIndex && (
                      <Badge variant="success" size="sm">Editing</Badge>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded"
                  >
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-2">
        <div className="container mx-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('bold')}
            title="Bold (select text first)"
          >
            <strong>B</strong>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('italic')}
            title="Italic (select text first)"
          >
            <em>I</em>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('underline')}
            title="Underline (select text first)"
          >
            <u>U</u>
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('quote')}
            title="Quote (select text first)"
          >
            " "
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('list')}
            title="Bullet list (select text first)"
          >
            •••
          </Button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const textarea = document.getElementById('chapter-content') as HTMLTextAreaElement;
              if (textarea) insertTextAtCursor(textarea, '\n\n---\n\n');
            }}
            title="Insert scene break"
          >
            ---
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {currentChapter.wordCount.toLocaleString()} words in this chapter
          </span>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          {/* Chapter Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">
              Chapter {currentChapter.number} Title
            </label>
            <Input
              type="text"
              value={currentChapter.title}
              onChange={(e) => updateChapterTitle(e.target.value)}
              className="text-2xl font-bold"
              placeholder="Enter chapter title"
            />
          </div>

          {/* Chapter Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">
              Content
            </label>
            <textarea
              id="chapter-content"
              value={currentChapter.content}
              onChange={(e) => updateChapterContent(e.target.value)}
              className={`w-full min-h-[600px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors ${fontSizeClasses[fontSize]} leading-relaxed font-serif`}
              placeholder="Start writing your chapter..."
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => {
                if (currentChapterIndex > 0) {
                  setCurrentChapterIndex(currentChapterIndex - 1);
                  window.scrollTo(0, 0);
                }
              }}
              disabled={currentChapterIndex === 0}
            >
              ← Previous Chapter
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={addChapter}>
                + Add New Chapter
              </Button>
              <Button
                variant="outline"
                onClick={() => deleteChapter(currentChapterIndex)}
                className="text-red-400 border-red-900 hover:bg-red-900/20"
              >
                🗑 Delete This Chapter
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                if (currentChapterIndex < chapters.length - 1) {
                  setCurrentChapterIndex(currentChapterIndex + 1);
                  window.scrollTo(0, 0);
                }
              }}
              disabled={currentChapterIndex === chapters.length - 1}
            >
              Next Chapter →
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {hasUnsavedChanges && (
              <span className="text-yellow-400">● Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
