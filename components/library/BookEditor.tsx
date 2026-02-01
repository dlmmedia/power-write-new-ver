'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { SaveStatus, SaveState } from '@/components/ui/SaveStatus';
import { AIChapterModal } from './AIChapterModal';
import { ImageInsertModal } from './ImageInsertModal';
import { ImageManager } from './ImageManager';
import { ContentWithImages } from './ContentWithImages';
import { CitationInserter } from './CitationInserter';
import { BibliographyManager } from './BibliographyManager';
import { BlockEditor } from './editor';
import { BookImageType, ImagePlacement } from '@/lib/types/book-images';
import { getDemoUserId } from '@/lib/services/demo-account';

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
  genre?: string;
  chapters: Chapter[];
  initialChapterIndex?: number;
  onClose?: () => void;
  onSave?: (updatedChapters: Chapter[]) => void;
  modelId?: string; // Model to use for AI chapter generation
}

interface FindReplaceState {
  isOpen: boolean;
  findText: string;
  replaceText: string;
  matchCase: boolean;
  wholeWord: boolean;
  currentMatchIndex: number;
  totalMatches: number;
}

interface UndoHistoryEntry {
  chapters: Chapter[];
  currentChapterIndex: number;
  timestamp: number;
}

export const BookEditor: React.FC<BookEditorProps> = ({
  bookId,
  bookTitle,
  author,
  genre = 'Fiction',
  chapters: initialChapters,
  initialChapterIndex = 0,
  onClose,
  onSave,
  modelId,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showAIChapterModal, setShowAIChapterModal] = useState(false);
  const [showImageInsertModal, setShowImageInsertModal] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showCitationInserter, setShowCitationInserter] = useState(false);
  const [showBibliographyManager, setShowBibliographyManager] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [chapterImages, setChapterImages] = useState<Array<{
    id: number;
    imageUrl: string;
    thumbnailUrl?: string;
    imageType: BookImageType;
    position: number;
    placement: ImagePlacement;
    caption?: string;
    altText?: string;
    chapterId?: number;
    metadata?: {
      size?: 'small' | 'medium' | 'large' | 'full';
      paragraphIndex?: number;
      [key: string]: unknown;
    };
  }>>([]);
  const [allBookImages, setAllBookImages] = useState<Array<{
    id: number;
    imageUrl: string;
    thumbnailUrl?: string;
    imageType: BookImageType;
    position: number;
    placement: ImagePlacement;
    caption?: string;
    altText?: string;
    chapterId?: number;
    metadata?: {
      size?: 'small' | 'medium' | 'large' | 'full';
      paragraphIndex?: number;
      [key: string]: unknown;
    };
  }>>([]);
  
  // Find and Replace state
  const [findReplace, setFindReplace] = useState<FindReplaceState>({
    isOpen: false,
    findText: '',
    replaceText: '',
    matchCase: false,
    wholeWord: false,
    currentMatchIndex: 0,
    totalMatches: 0,
  });

  // Undo/Redo history
  const [undoHistory, setUndoHistory] = useState<UndoHistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<UndoHistoryEntry[]>([]);
  const maxHistoryLength = 50;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentChapter = chapters[currentChapterIndex];

  // Save state for undo
  const saveToHistory = useCallback(() => {
    const entry: UndoHistoryEntry = {
      chapters: JSON.parse(JSON.stringify(chapters)),
      currentChapterIndex,
      timestamp: Date.now(),
    };
    setUndoHistory(prev => [...prev.slice(-maxHistoryLength + 1), entry]);
    setRedoHistory([]); // Clear redo when new action is performed
  }, [chapters, currentChapterIndex]);

  // Undo action
  const undo = useCallback(() => {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory[undoHistory.length - 1];
    
    // Save current state to redo
    setRedoHistory(prev => [...prev, {
      chapters: JSON.parse(JSON.stringify(chapters)),
      currentChapterIndex,
      timestamp: Date.now(),
    }]);
    
    setChapters(previousState.chapters);
    setCurrentChapterIndex(previousState.currentChapterIndex);
    setUndoHistory(prev => prev.slice(0, -1));
    setHasUnsavedChanges(true);
  }, [undoHistory, chapters, currentChapterIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (redoHistory.length === 0) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    
    // Save current state to undo
    setUndoHistory(prev => [...prev, {
      chapters: JSON.parse(JSON.stringify(chapters)),
      currentChapterIndex,
      timestamp: Date.now(),
    }]);
    
    setChapters(nextState.chapters);
    setCurrentChapterIndex(nextState.currentChapterIndex);
    setRedoHistory(prev => prev.slice(0, -1));
    setHasUnsavedChanges(true);
  }, [redoHistory, chapters, currentChapterIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S - Save
      if (modKey && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) handleSave();
        return;
      }

      // Ctrl/Cmd + F - Find
      if (modKey && e.key === 'f') {
        e.preventDefault();
        setFindReplace(prev => ({ ...prev, isOpen: true }));
        return;
      }

      // Ctrl/Cmd + H - Find and Replace
      if (modKey && e.key === 'h') {
        e.preventDefault();
        setFindReplace(prev => ({ ...prev, isOpen: true }));
        return;
      }

      // Ctrl/Cmd + Z - Undo
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((modKey && e.shiftKey && e.key === 'z') || (modKey && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + B - Bold
      if (modKey && e.key === 'b') {
        e.preventDefault();
        applyFormatting('bold');
        return;
      }

      // Ctrl/Cmd + I - Italic
      if (modKey && e.key === 'i') {
        e.preventDefault();
        applyFormatting('italic');
        return;
      }

      // Escape - Close find/replace or modals
      if (e.key === 'Escape') {
        if (findReplace.isOpen) {
          setFindReplace(prev => ({ ...prev, isOpen: false }));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, undo, redo, findReplace.isOpen]);

  // Unsaved changes warning
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

  // Find matches in current chapter
  useEffect(() => {
    if (!findReplace.findText) {
      setFindReplace(prev => ({ ...prev, totalMatches: 0, currentMatchIndex: 0 }));
      return;
    }

    const flags = findReplace.matchCase ? 'g' : 'gi';
    const searchText = findReplace.wholeWord
      ? `\\b${escapeRegex(findReplace.findText)}\\b`
      : escapeRegex(findReplace.findText);
    
    try {
      const regex = new RegExp(searchText, flags);
      const matches = currentChapter.content.match(regex);
      setFindReplace(prev => ({
        ...prev,
        totalMatches: matches ? matches.length : 0,
        currentMatchIndex: Math.min(prev.currentMatchIndex, matches ? matches.length - 1 : 0),
      }));
    } catch {
      setFindReplace(prev => ({ ...prev, totalMatches: 0 }));
    }
  }, [findReplace.findText, findReplace.matchCase, findReplace.wholeWord, currentChapter.content]);

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const updateChapterContent = (content: string, saveHistory = true) => {
    if (saveHistory) saveToHistory();
    
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
    saveToHistory();
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
    saveToHistory();
    const newChapterNumber = chapters.length + 1;
    const newChapter: Chapter = {
      id: Date.now(),
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

  const addAIChapter = (chapter: Chapter) => {
    saveToHistory();
    setChapters([...chapters, chapter]);
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

    saveToHistory();
    const updatedChapters = chapters.filter((_, i) => i !== index);
    updatedChapters.forEach((ch, i) => {
      ch.number = i + 1;
    });

    setChapters(updatedChapters);
    setCurrentChapterIndex(Math.min(currentChapterIndex, updatedChapters.length - 1));
    setHasUnsavedChanges(true);
  };

  const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    saveToHistory();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = currentChapter.content;
    const newContent = content.substring(0, start) + text + content.substring(end);
    updateChapterContent(newContent, false);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'underline' | 'quote' | 'list') => {
    // Get the current selection from the contentEditable editor
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText) {
      alert('Please select text to format');
      return;
    }

    // For bold, italic, underline - use document.execCommand which works with contentEditable
    switch (type) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'quote':
        // For quote formatting, wrap selection in blockquote-like styling
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'list':
        // For list formatting, insert unordered list
        document.execCommand('insertUnorderedList', false);
        break;
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  // Find and Replace functions
  const findNext = () => {
    if (!findReplace.findText || findReplace.totalMatches === 0) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const flags = findReplace.matchCase ? 'g' : 'gi';
    const searchText = findReplace.wholeWord
      ? `\\b${escapeRegex(findReplace.findText)}\\b`
      : escapeRegex(findReplace.findText);
    
    const regex = new RegExp(searchText, flags);
    const content = currentChapter.content;
    
    let match;
    let matchIndex = 0;
    const targetIndex = (findReplace.currentMatchIndex + 1) % findReplace.totalMatches;
    
    while ((match = regex.exec(content)) !== null) {
      if (matchIndex === targetIndex) {
        textarea.focus();
        textarea.setSelectionRange(match.index, match.index + match[0].length);
        setFindReplace(prev => ({ ...prev, currentMatchIndex: targetIndex }));
        
        // Scroll the match into view
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const textBeforeMatch = content.substring(0, match.index);
        const linesBeforeMatch = textBeforeMatch.split('\n').length;
        textarea.scrollTop = (linesBeforeMatch - 5) * lineHeight;
        break;
      }
      matchIndex++;
    }
  };

  const findPrevious = () => {
    if (!findReplace.findText || findReplace.totalMatches === 0) return;

    const newIndex = findReplace.currentMatchIndex === 0 
      ? findReplace.totalMatches - 1 
      : findReplace.currentMatchIndex - 1;
    
    setFindReplace(prev => ({ ...prev, currentMatchIndex: newIndex }));

    // Navigate to that match
    const textarea = textareaRef.current;
    if (!textarea) return;

    const flags = findReplace.matchCase ? 'g' : 'gi';
    const searchText = findReplace.wholeWord
      ? `\\b${escapeRegex(findReplace.findText)}\\b`
      : escapeRegex(findReplace.findText);
    
    const regex = new RegExp(searchText, flags);
    const content = currentChapter.content;
    
    let match;
    let matchIndex = 0;
    
    while ((match = regex.exec(content)) !== null) {
      if (matchIndex === newIndex) {
        textarea.focus();
        textarea.setSelectionRange(match.index, match.index + match[0].length);
        break;
      }
      matchIndex++;
    }
  };

  const replaceOne = () => {
    if (!findReplace.findText || findReplace.totalMatches === 0) return;
    
    saveToHistory();
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentChapter.content.substring(start, end);
    
    // Check if current selection matches
    const flags = findReplace.matchCase ? '' : 'i';
    const searchText = findReplace.wholeWord
      ? `^${escapeRegex(findReplace.findText)}$`
      : `^${escapeRegex(findReplace.findText)}$`;
    
    const regex = new RegExp(searchText, flags);
    
    if (regex.test(selectedText)) {
      const newContent = 
        currentChapter.content.substring(0, start) + 
        findReplace.replaceText + 
        currentChapter.content.substring(end);
      
      updateChapterContent(newContent, false);
      
      // Find next match
      setTimeout(findNext, 10);
    } else {
      // If not on a match, find the next one first
      findNext();
    }
  };

  const replaceAll = () => {
    if (!findReplace.findText || findReplace.totalMatches === 0) return;
    
    saveToHistory();
    const flags = findReplace.matchCase ? 'g' : 'gi';
    const searchText = findReplace.wholeWord
      ? `\\b${escapeRegex(findReplace.findText)}\\b`
      : escapeRegex(findReplace.findText);
    
    const regex = new RegExp(searchText, flags);
    const newContent = currentChapter.content.replace(regex, findReplace.replaceText);
    
    const replacedCount = findReplace.totalMatches;
    updateChapterContent(newContent, false);
    
    alert(`Replaced ${replacedCount} occurrence${replacedCount !== 1 ? 's' : ''}`);
  };

  // Replace in all chapters
  const replaceInAllChapters = () => {
    if (!findReplace.findText) return;
    
    if (!confirm(`Replace all occurrences of "${findReplace.findText}" in ALL chapters?`)) {
      return;
    }

    saveToHistory();
    const flags = findReplace.matchCase ? 'g' : 'gi';
    const searchText = findReplace.wholeWord
      ? `\\b${escapeRegex(findReplace.findText)}\\b`
      : escapeRegex(findReplace.findText);
    
    const regex = new RegExp(searchText, flags);
    let totalReplaced = 0;

    const updatedChapters = chapters.map(chapter => {
      const matches = chapter.content.match(regex);
      if (matches) {
        totalReplaced += matches.length;
        return {
          ...chapter,
          content: chapter.content.replace(regex, findReplace.replaceText),
          wordCount: chapter.content.replace(regex, findReplace.replaceText).trim().split(/\s+/).filter(Boolean).length,
          isEdited: true,
        };
      }
      return chapter;
    });

    setChapters(updatedChapters);
    setHasUnsavedChanges(true);
    
    alert(`Replaced ${totalReplaced} occurrence${totalReplaced !== 1 ? 's' : ''} across all chapters`);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);
    setSaveState('saving');
    setSaveError(null);
    
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

      // Update chapter IDs with the real database IDs returned from the server
      if (data.chapters && Array.isArray(data.chapters)) {
        const updatedChapters = chapters.map(chapter => {
          const savedChapter = data.chapters.find(
            (saved: { number: number; id: number }) => saved.number === chapter.number
          );
          if (savedChapter) {
            return {
              ...chapter,
              id: savedChapter.id, // Use the real database ID
              isEdited: false, // Clear edited flag after save
            };
          }
          return { ...chapter, isEdited: false };
        });
        setChapters(updatedChapters);
      }

      setHasUnsavedChanges(false);
      setSaveState('saved');
      setLastSaved(new Date());
      
      // Clear undo/redo history after save
      setUndoHistory([]);
      setRedoHistory([]);
      
      if (onSave) {
        onSave(chapters);
      }

      // Reset to idle after a delay
      setTimeout(() => {
        setSaveState('idle');
      }, 3000);
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save changes';
      setSaveError(errorMsg);
      setSaveState('error');
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

  // Fetch all book images on mount
  useEffect(() => {
    const fetchAllImages = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}/images`);
        const data = await response.json();
        if (data.success && data.images) {
          setAllBookImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching book images:', error);
      }
    };
    
    fetchAllImages();
  }, [bookId]);

  // Filter images for current chapter when chapter changes
  useEffect(() => {
    const currentChapterImages = allBookImages.filter(
      (img) => img.chapterId === currentChapter.id
    );
    console.log('[BookEditor] Filtering images for chapter', currentChapter.id, ':', currentChapterImages.length, 'images');
    setChapterImages(currentChapterImages);
  }, [currentChapter.id, allBookImages]);

  // Track cursor position
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);
  };

  // Handle image insertion
  const handleImageInserted = async (image: {
    imageUrl: string;
    caption?: string;
    altText?: string;
    imageType: BookImageType;
    placement: ImagePlacement;
    position: number;
    prompt?: string;
  }) => {
    console.log('[BookEditor] handleImageInserted called with:', image);
    
    try {
      // Create a temporary ID that's unique
      const tempId = -Date.now(); // Negative to distinguish from real IDs
      
      // Create the new image object for local state
      const newImage = {
        id: tempId,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.imageUrl,
        imageType: image.imageType,
        position: image.position,
        placement: image.placement,
        caption: image.caption,
        altText: image.altText,
        chapterId: currentChapter.id,
      };
      
      console.log('[BookEditor] Adding new image to state:', newImage);
      
      // Check for existing image with same URL to prevent duplicates
      setAllBookImages(prev => {
        const exists = prev.some(img => img.imageUrl === image.imageUrl && img.chapterId === currentChapter.id);
        if (exists) {
          console.log('[BookEditor] Image already exists, skipping duplicate');
          return prev;
        }
        return [...prev, newImage];
      });
      setChapterImages(prev => {
        const exists = prev.some(img => img.imageUrl === image.imageUrl);
        if (exists) {
          return prev;
        }
        return [...prev, newImage];
      });
      
      // Switch to preview mode to show the image
      setViewMode('preview');
      
      // Save image to database in background
      const response = await fetch(`/api/books/${bookId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentChapter.id,
          imageUrl: image.imageUrl,
          imageType: image.imageType,
          position: image.position,
          placement: image.placement,
          caption: image.caption,
          altText: image.altText,
          prompt: image.prompt,
          source: 'generated',
        }),
      });

      const data = await response.json();
      console.log('[BookEditor] Save image response:', data);
      
      if (data.success && data.image) {
        // Update the temporary ID with the real database ID, filtering out any duplicates
        setAllBookImages(prev => {
          // First update the temp image with real ID
          const updated = prev.map(img => 
            img.id === tempId ? { ...data.image, chapterId: currentChapter.id } : img
          );
          // Remove any duplicates by imageUrl
          const seen = new Set<string>();
          return updated.filter(img => {
            const key = `${img.imageUrl}-${img.chapterId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        setChapterImages(prev => {
          const updated = prev.map(img => 
            img.id === tempId ? { ...data.image, chapterId: currentChapter.id } : img
          );
          const seen = new Set<string>();
          return updated.filter(img => {
            if (seen.has(img.imageUrl)) return false;
            seen.add(img.imageUrl);
            return true;
          });
        });
        console.log('[BookEditor] Image saved successfully with ID:', data.image.id);
      } else {
        console.error('[BookEditor] Failed to save image:', data.error);
        // Keep the local image even if save fails - user can try again
      }
    } catch (error) {
      console.error('[BookEditor] Error saving image:', error);
      // Keep the local image even if save fails
    }
  };

  // Handle image deletion with optimistic UI update
  const handleImageDelete = async (imageId: number) => {
    console.log('[BookEditor] Deleting image:', imageId);
    
    // Optimistic update - remove immediately from UI
    setAllBookImages(prev => prev.filter(img => img.id !== imageId));
    setChapterImages(prev => prev.filter(img => img.id !== imageId));
    
    try {
      // For temporary IDs (negative), no need to call API
      if (imageId < 0) {
        console.log('[BookEditor] Removed temporary image from state');
        return;
      }
      
      const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('[BookEditor] Failed to delete image from server');
        // Could restore the image here, but for now just log the error
        // The image is already removed from UI
      } else {
        console.log('[BookEditor] Image deleted successfully');
      }
    } catch (error) {
      console.error('[BookEditor] Error deleting image:', error);
      // Image is already removed from UI - could show a toast notification here
    }
  };

  // State for paste upload
  const [isPastingImage, setIsPastingImage] = useState(false);

  // Handle clipboard paste for images
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Look for image data in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior for images
        
        const file = item.getAsFile();
        if (!file) continue;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('Image too large. Maximum size is 10MB.');
          return;
        }

        setIsPastingImage(true);
        console.log('[BookEditor] Pasting image from clipboard:', file.name, file.type);

        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('chapterId', currentChapter.id.toString());
          formData.append('imageType', 'illustration');
          formData.append('position', cursorPosition.toString());
          formData.append('placement', 'center');
          formData.append('caption', '');
          formData.append('altText', 'Pasted image');

          const response = await fetch(`/api/books/${bookId}/images/upload`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to upload pasted image');
          }

          console.log('[BookEditor] Pasted image uploaded successfully:', data);

          // Add the image to state
          const newImage = {
            id: data.image.id,
            imageUrl: data.imageUrl,
            thumbnailUrl: data.imageUrl,
            imageType: 'illustration' as BookImageType,
            position: cursorPosition,
            placement: 'center' as ImagePlacement,
            caption: undefined,
            altText: 'Pasted image',
            chapterId: currentChapter.id,
          };

          setAllBookImages(prev => [...prev, newImage]);
          setChapterImages(prev => [...prev, newImage]);
          
          // Switch to preview mode to show the image
          setViewMode('preview');

        } catch (error) {
          console.error('[BookEditor] Error uploading pasted image:', error);
          alert(error instanceof Error ? error.message : 'Failed to upload pasted image');
        } finally {
          setIsPastingImage(false);
        }

        return; // Only handle the first image
      }
    }
  }, [bookId, currentChapter.id, cursorPosition]);

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
              className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span>
              {hasUnsavedChanges ? 'Close (Unsaved)' : 'Close'}
            </button>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">Editing: {bookTitle}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">by {author}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            
            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded px-1 py-1">
              <button
                onClick={undo}
                disabled={undoHistory.length === 0}
                className={`p-2 rounded transition-colors ${
                  undoHistory.length > 0 
                    ? 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={redoHistory.length === 0}
                className={`p-2 rounded transition-colors ${
                  redoHistory.length > 0 
                    ? 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Shift+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <SaveStatus 
                state={saveState} 
                lastSaved={lastSaved}
                errorMessage={saveError || undefined}
                onRetry={handleSave}
              />
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
                  <>💾 Save</>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded px-2 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Font:</span>
              {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 rounded ${
                    fontSize === size ? 'bg-yellow-400 text-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={{ fontSize: size === 'sm' ? '0.75rem' : size === 'base' ? '0.875rem' : size === 'lg' ? '1rem' : '1.125rem' }}
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addChapter}>
                    + Add Chapter
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => {
                      setShowChapterList(false);
                      setShowAIChapterModal(true);
                    }}
                  >
                    ✨ AI Chapter
                  </Button>
                </div>
              </div>
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`group relative rounded mb-1 ${
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss from contentEditable
              applyFormatting('bold');
            }}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss from contentEditable
              applyFormatting('italic');
            }}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss from contentEditable
              applyFormatting('underline');
            }}
            title="Underline"
          >
            <u>U</u>
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss from contentEditable
              applyFormatting('quote');
            }}
            title="Quote"
          >
            &quot; &quot;
          </Button>
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus loss from contentEditable
              applyFormatting('list');
            }}
            title="Bullet list"
          >
            •••
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const textarea = textareaRef.current;
              if (textarea) insertTextAtCursor(textarea, '\n\n---\n\n');
            }}
            title="Insert scene break"
          >
            ---
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          
          {/* Image & Citation Tools */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImageInsertModal(true)}
            title="Insert image (also available via + menu in editor)"
          >
            🖼️ Add Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCitationInserter(true)}
            title="Insert citation"
          >
            📚 Cite
          </Button>
          <Button
            variant={showImageManager ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowImageManager(!showImageManager)}
            title="Manage chapter images"
          >
            📷 Images {chapterImages.length > 0 && `(${chapterImages.length})`}
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          
          {/* Find and Replace Toggle */}
          <Button
            variant={findReplace.isOpen ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFindReplace(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            title="Find and Replace (Ctrl+F)"
          >
            🔍 Find & Replace
          </Button>

          <div className="flex-1" />
          
          {/* Word count and keyboard shortcuts hint */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-500 hidden md:block">
              Ctrl+S: Save | Ctrl+Z: Undo | Ctrl+F: Find
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {currentChapter.wordCount.toLocaleString()} words in this chapter
            </span>
          </div>
        </div>
      </div>

      {/* Find and Replace Panel */}
      {findReplace.isOpen && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 px-4 py-3">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Find..."
                  value={findReplace.findText}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, findText: e.target.value, currentMatchIndex: 0 }))}
                  className="w-48"
                />
                <Input
                  type="text"
                  placeholder="Replace with..."
                  value={findReplace.replaceText}
                  onChange={(e) => setFindReplace(prev => ({ ...prev, replaceText: e.target.value }))}
                  className="w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={findReplace.matchCase}
                    onChange={(e) => setFindReplace(prev => ({ ...prev, matchCase: e.target.checked }))}
                    className="rounded"
                  />
                  Match case
                </label>
                <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={findReplace.wholeWord}
                    onChange={(e) => setFindReplace(prev => ({ ...prev, wholeWord: e.target.checked }))}
                    className="rounded"
                  />
                  Whole word
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={findPrevious} disabled={findReplace.totalMatches === 0}>
                  ← Prev
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
                  {findReplace.totalMatches > 0 
                    ? `${findReplace.currentMatchIndex + 1} of ${findReplace.totalMatches}`
                    : 'No matches'}
                </span>
                <Button variant="outline" size="sm" onClick={findNext} disabled={findReplace.totalMatches === 0}>
                  Next →
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={replaceOne} disabled={findReplace.totalMatches === 0}>
                  Replace
                </Button>
                <Button variant="outline" size="sm" onClick={replaceAll} disabled={findReplace.totalMatches === 0}>
                  Replace All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={replaceInAllChapters} 
                  disabled={!findReplace.findText}
                  className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                >
                  Replace in All Chapters
                </Button>
              </div>

              <button
                onClick={() => setFindReplace(prev => ({ ...prev, isOpen: false }))}
                className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Content
              </label>
              <div className="flex items-center gap-3">
                {chapterImages.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    🖼️ {chapterImages.length} image{chapterImages.length !== 1 ? 's' : ''}
                  </span>
                )}
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'edit'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'edit' ? (
              /* Edit Mode - Block Editor with inline images */
              <BlockEditor
                content={currentChapter.content}
                images={chapterImages}
                fontSize={fontSize}
                onChange={(newContent, wordCount) => {
                  const updatedChapters = [...chapters];
                  updatedChapters[currentChapterIndex] = {
                    ...currentChapter,
                    content: newContent,
                    wordCount,
                    isEdited: true,
                  };
                  setChapters(updatedChapters);
                  setHasUnsavedChanges(true);
                }}
                onImageInsert={() => setShowImageInsertModal(true)}
                onCitationInsert={() => setShowCitationInserter(true)}
                onBibliographyOpen={() => setShowBibliographyManager(true)}
                onImageClick={(image) => {
                  setSelectedImageId(image.id);
                  setShowImageManager(true);
                }}
                onImageDelete={handleImageDelete}
                onImageUpdate={async (imageId, updates) => {
                  try {
                    const response = await fetch(`/api/books/${bookId}/images/${imageId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updates),
                    });
                    if (response.ok) {
                      // Refresh images
                      const imagesResponse = await fetch(`/api/books/${bookId}/images`);
                      const data = await imagesResponse.json();
                      if (data.success && data.images) {
                        setAllBookImages(data.images);
                      }
                    }
                  } catch (error) {
                    console.error('Error updating image:', error);
                  }
                }}
                bookId={bookId}
                chapterId={currentChapter.id}
              />
            ) : (
              /* Preview Mode - Final preview with formatted content */
              <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 min-h-[600px] overflow-auto">
                <ContentWithImages
                  content={currentChapter.content}
                  images={chapterImages}
                  fontSize={fontSize}
                  onImageClick={(image) => {
                    setSelectedImageId(image.id);
                    setShowImageManager(true);
                  }}
                  onImageDelete={handleImageDelete}
                  isEditing={false}
                />
                
                {/* Preview mode info bar */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    📖 Final preview - This is how readers will see your chapter
                  </p>
                  <button
                    onClick={() => setViewMode('edit')}
                    className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium"
                  >
                    ✏️ Back to Edit
                  </button>
                </div>
              </div>
            )}
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
                variant="primary" 
                onClick={() => setShowAIChapterModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                ✨ Add AI Chapter
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
          <div className="text-sm text-gray-400 flex items-center gap-4">
            {hasUnsavedChanges && (
              <span className="text-yellow-400">● Unsaved changes</span>
            )}
            <span className="text-gray-500">
              {undoHistory.length > 0 && `${undoHistory.length} undo step${undoHistory.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <SaveStatus 
                state={saveState} 
                lastSaved={lastSaved}
                errorMessage={saveError || undefined}
                onRetry={handleSave}
              />
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

      {/* AI Chapter Generation Modal */}
      {showAIChapterModal && (
        <AIChapterModal
          bookId={bookId}
          bookTitle={bookTitle}
          bookGenre={genre}
          bookAuthor={author}
          existingChapters={chapters.map(ch => ({
            number: ch.number,
            title: ch.title,
            content: ch.content,
          }))}
          nextChapterNumber={chapters.length + 1}
          onClose={() => setShowAIChapterModal(false)}
          onChapterGenerated={addAIChapter}
          modelId={modelId}
        />
      )}

      {/* Image Insert Modal */}
      {showImageInsertModal && (
        <ImageInsertModal
          bookId={bookId}
          chapterId={currentChapter.id}
          bookTitle={bookTitle}
          bookGenre={genre}
          chapterTitle={currentChapter.title}
          chapterContent={currentChapter.content}
          cursorPosition={cursorPosition}
          onClose={() => setShowImageInsertModal(false)}
          onImageGenerated={handleImageInserted}
        />
      )}

      {/* Image Manager Sidebar */}
      <ImageManager
        bookId={bookId}
        chapterId={currentChapter.id}
        chapterContent={currentChapter.content}
        isOpen={showImageManager}
        onClose={() => {
          setShowImageManager(false);
          setSelectedImageId(null);
        }}
        onInsertImage={(position) => {
          setCursorPosition(position || cursorPosition);
          setShowImageInsertModal(true);
        }}
        onImageClick={(image) => {
          console.log('[BookEditor] Image clicked in manager:', image.id);
        }}
        onImageDelete={handleImageDelete}
        onImagesChanged={async () => {
          // Refresh images from the API
          try {
            const response = await fetch(`/api/books/${bookId}/images`);
            const data = await response.json();
            if (data.success && data.images) {
              setAllBookImages(data.images);
            }
          } catch (error) {
            console.error('Error refreshing images:', error);
          }
        }}
        selectedImageId={selectedImageId}
      />

      {/* Citation Inserter Modal */}
      {showCitationInserter && (
        <CitationInserter
          chapterId={currentChapter.id}
          onInsert={(citationText, referenceId) => {
            // Insert citation at current position in the content
            const newContent = currentChapter.content + citationText;
            const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
            const updatedChapters = [...chapters];
            updatedChapters[currentChapterIndex] = {
              ...currentChapter,
              content: newContent,
              wordCount,
              isEdited: true,
            };
            setChapters(updatedChapters);
            setHasUnsavedChanges(true);
          }}
          onClose={() => setShowCitationInserter(false)}
        />
      )}

      {/* Bibliography Manager Modal */}
      {showBibliographyManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-auto">
            <BibliographyManager
              bookId={bookId}
              userId={getDemoUserId()}
              onClose={() => setShowBibliographyManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
