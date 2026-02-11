'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ChapterOutline } from '@/lib/types/generation';

interface EditingCharacter {
  index: number;
  name: string;
  role: string;
}

interface SavedOutlineItem {
  id: number;
  title: string;
  outline: any;
  config: any;
  createdAt: string;
}

export const OutlineEditor: React.FC = () => {
  const { outline, setOutline, config } = useStudioStore();
  const [editingChapter, setEditingChapter] = useState<ChapterOutline | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Editable fields states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Theme editing
  const [newTheme, setNewTheme] = useState('');
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  
  // Character editing
  const [editingCharacter, setEditingCharacter] = useState<EditingCharacter | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterRole, setNewCharacterRole] = useState('');

  // Outline history
  const [showHistory, setShowHistory] = useState(false);
  const [savedOutlines, setSavedOutlines] = useState<SavedOutlineItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchOutlineHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/outlines');
      if (response.ok) {
        const data = await response.json();
        setSavedOutlines(data.outlines || []);
      }
    } catch (error) {
      console.error('Failed to fetch outline history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleSaveOutline = async () => {
    if (!outline) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/outlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: outline.title || 'Untitled Outline',
          outline,
          config,
        }),
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        // Refresh history if it's open
        if (showHistory) fetchOutlineHistory();
      }
    } catch (error) {
      console.error('Failed to save outline:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadOutline = (saved: SavedOutlineItem) => {
    if (outline) {
      const confirmed = confirm('Loading this outline will replace the current one. Continue?');
      if (!confirmed) return;
    }
    setOutline(saved.outline);
    setShowHistory(false);
  };

  const handleDeleteSavedOutline = async (id: number) => {
    const confirmed = confirm('Delete this saved outline?');
    if (!confirmed) return;
    try {
      await fetch(`/api/outlines?id=${id}`, { method: 'DELETE' });
      setSavedOutlines(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Failed to delete outline:', error);
    }
  };

  useEffect(() => {
    if (showHistory) fetchOutlineHistory();
  }, [showHistory, fetchOutlineHistory]);

  if (!outline) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <p className="text-lg mb-2">No outline generated yet</p>
        <p className="text-sm mb-4">Click &quot;Generate Outline&quot; to create your book structure</p>
        <button
          onClick={() => setShowHistory(true)}
          className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
        >
          Or load from saved outlines
        </button>
        {showHistory && (
          <OutlineHistoryPanel
            outlines={savedOutlines}
            isLoading={isLoadingHistory}
            onLoad={handleLoadOutline}
            onDelete={handleDeleteSavedOutline}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    );
  }

  // Title editing handlers
  const handleStartEditTitle = () => {
    setEditTitle(outline.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && outline) {
      setOutline({ ...outline, title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  // Author editing handlers
  const handleStartEditAuthor = () => {
    setEditAuthor(outline.author);
    setIsEditingAuthor(true);
  };

  const handleSaveAuthor = () => {
    if (editAuthor.trim() && outline) {
      setOutline({ ...outline, author: editAuthor.trim() });
    }
    setIsEditingAuthor(false);
  };

  // Description editing handlers
  const handleStartEditDescription = () => {
    setEditDescription(outline.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    if (outline) {
      setOutline({ ...outline, description: editDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  // Theme handlers
  const handleAddTheme = () => {
    if (newTheme.trim() && outline) {
      const currentThemes = outline.themes || [];
      setOutline({ ...outline, themes: [...currentThemes, newTheme.trim()] });
      setNewTheme('');
      setIsAddingTheme(false);
    }
  };

  const handleDeleteTheme = (indexToDelete: number) => {
    if (outline && outline.themes) {
      const updatedThemes = outline.themes.filter((_, idx) => idx !== indexToDelete);
      setOutline({ ...outline, themes: updatedThemes });
    }
  };

  // Character handlers
  const handleEditCharacter = (index: number) => {
    if (outline?.characters?.[index]) {
      setEditingCharacter({
        index,
        name: outline.characters[index].name,
        role: outline.characters[index].role,
      });
      setIsCharacterModalOpen(true);
      setIsAddingCharacter(false);
    }
  };

  const handleSaveCharacter = () => {
    if (!editingCharacter || !outline) return;

    const updatedCharacters = outline.characters?.map((char, idx) =>
      idx === editingCharacter.index
        ? { ...char, name: editingCharacter.name, role: editingCharacter.role }
        : char
    ) || [];

    setOutline({ ...outline, characters: updatedCharacters });
    setIsCharacterModalOpen(false);
    setEditingCharacter(null);
  };

  const handleAddCharacter = () => {
    setNewCharacterName('');
    setNewCharacterRole('');
    setIsAddingCharacter(true);
    setIsCharacterModalOpen(true);
    setEditingCharacter(null);
  };

  const handleSaveNewCharacter = () => {
    if (newCharacterName.trim() && newCharacterRole.trim() && outline) {
      const currentCharacters = outline.characters || [];
      setOutline({
        ...outline,
        characters: [...currentCharacters, { 
          name: newCharacterName.trim(), 
          role: newCharacterRole.trim(),
          description: '' 
        }],
      });
      setIsCharacterModalOpen(false);
      setIsAddingCharacter(false);
      setNewCharacterName('');
      setNewCharacterRole('');
    }
  };

  const handleDeleteCharacter = (indexToDelete: number) => {
    if (outline && outline.characters) {
      const confirmed = confirm(`Delete character "${outline.characters[indexToDelete].name}"?`);
      if (!confirmed) return;
      
      const updatedCharacters = outline.characters.filter((_, idx) => idx !== indexToDelete);
      setOutline({ ...outline, characters: updatedCharacters });
    }
  };

  const handleEditChapter = (chapter: ChapterOutline) => {
    setEditingChapter(chapter);
    setIsModalOpen(true);
  };

  const handleSaveChapter = () => {
    if (!editingChapter || !outline) return;

    const updatedChapters = outline.chapters.map((ch) =>
      ch.number === editingChapter.number ? editingChapter : ch
    );

    setOutline({
      ...outline,
      chapters: updatedChapters,
    });

    setIsModalOpen(false);
    setEditingChapter(null);
  };

  const handleAddChapter = () => {
    if (!outline) return;

    const newChapter: ChapterOutline = {
      number: outline.chapters.length + 1,
      title: `Chapter ${outline.chapters.length + 1}`,
      summary: 'Add chapter summary here...',
      wordCount: Math.floor(outline.totalWordCount / (outline.chapters.length + 1)),
    };

    setOutline({
      ...outline,
      chapters: [...outline.chapters, newChapter],
      totalWordCount: outline.totalWordCount,
    });
  };

  const handleDeleteChapter = (chapterNumber: number) => {
    if (!outline || outline.chapters.length <= 1) {
      alert('You must have at least one chapter');
      return;
    }

    const confirmed = confirm(`Delete Chapter ${chapterNumber}?`);
    if (!confirmed) return;

    const updatedChapters = outline.chapters
      .filter((ch) => ch.number !== chapterNumber)
      .map((ch, index) => ({
        ...ch,
        number: index + 1,
      }));

    setOutline({
      ...outline,
      chapters: updatedChapters,
    });
  };

  const handleMoveChapter = (chapterNumber: number, direction: 'up' | 'down') => {
    if (!outline) return;

    const index = outline.chapters.findIndex((ch) => ch.number === chapterNumber);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === outline.chapters.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedChapters = [...outline.chapters];
    [updatedChapters[index], updatedChapters[newIndex]] = [
      updatedChapters[newIndex],
      updatedChapters[index],
    ];

    // Renumber chapters
    const renumberedChapters = updatedChapters.map((ch, idx) => ({
      ...ch,
      number: idx + 1,
    }));

    setOutline({
      ...outline,
      chapters: renumberedChapters,
    });
  };

  const totalWords = outline.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  const handleExportOutline = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch('/api/outline/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${outline.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_outline.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        alert('Export failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export outline');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Title & Author Editable */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Editable Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold bg-[var(--card-bg)] border border-yellow-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full max-w-md"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-green-500 hover:text-green-600"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-gray-500 hover:text-gray-600"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <h2
              className="text-2xl font-bold cursor-pointer hover:text-yellow-400 transition-colors group inline-flex items-center gap-2"
              onClick={handleStartEditTitle}
              title="Click to edit title"
            >
              {outline.title}
              <span className="opacity-0 group-hover:opacity-100 text-sm text-gray-400 transition-opacity">✎</span>
            </h2>
          )}

          {/* Editable Author */}
          {isEditingAuthor ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[var(--text-secondary)] text-sm">by</span>
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                className="text-sm bg-[var(--card-bg)] border border-yellow-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAuthor();
                  if (e.key === 'Escape') setIsEditingAuthor(false);
                }}
              />
              <button
                onClick={handleSaveAuthor}
                className="p-1 text-green-500 hover:text-green-600 text-sm"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={() => setIsEditingAuthor(false)}
                className="p-1 text-gray-500 hover:text-gray-600 text-sm"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <p
              className="text-[var(--text-secondary)] text-sm mt-1 cursor-pointer hover:text-yellow-400 transition-colors group inline-flex items-center gap-1"
              onClick={handleStartEditAuthor}
              title="Click to edit author"
            >
              by {outline.author}
              <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 transition-opacity">✎</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveOutline}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              saveSuccess
                ? 'bg-green-500 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
            title="Save outline to history"
          >
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showHistory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="View saved outlines"
          >
            History
          </button>
          <div className="relative group">
            <Button variant="outline" size="sm">Export ▼</Button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-[var(--card-bg)] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg py-1 w-36 z-10">
              <button
                onClick={() => handleExportOutline('pdf')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExportOutline('docx')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Export as DOCX
              </button>
            </div>
          </div>
          <Badge variant="info">{outline.chapters.length} Chapters</Badge>
          <Badge variant="default">{totalWords.toLocaleString()} words</Badge>
        </div>
      </div>

      {/* Outline History Panel */}
      {showHistory && (
        <OutlineHistoryPanel
          outlines={savedOutlines}
          isLoading={isLoadingHistory}
          onLoad={handleLoadOutline}
          onDelete={handleDeleteSavedOutline}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Description - Editable */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 border border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Description</h3>
          {!isEditingDescription && (
            <button
              onClick={handleStartEditDescription}
              className="text-sm text-gray-500 hover:text-yellow-400 transition-colors"
              title="Edit description"
            >
              ✎ Edit
            </button>
          )}
        </div>
        {isEditingDescription ? (
          <div className="space-y-2">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full bg-[var(--card-bg)] border border-yellow-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingDescription(false)}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDescription}
                className="px-3 py-1 text-sm bg-yellow-400 text-black rounded hover:bg-yellow-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {outline.description || 'No description yet. Click Edit to add one.'}
          </p>
        )}
      </div>

      {/* Themes & Characters - Editable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Themes - Editable */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Themes</h3>
            <button
              onClick={() => setIsAddingTheme(true)}
              className="text-sm text-gray-500 hover:text-yellow-400 transition-colors"
              title="Add theme"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {outline.themes && outline.themes.length > 0 ? (
              outline.themes.map((theme, idx) => (
                <div key={idx} className="group relative">
                  <Badge variant="default" className="pr-6">
                    {theme}
                  </Badge>
                  <button
                    onClick={() => handleDeleteTheme(idx)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 text-xs transition-opacity"
                    title="Remove theme"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No themes yet</p>
            )}
          </div>
          {isAddingTheme && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Enter new theme..."
                className="flex-1 bg-[var(--card-bg)] border border-yellow-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTheme();
                  if (e.key === 'Escape') {
                    setIsAddingTheme(false);
                    setNewTheme('');
                  }
                }}
              />
              <button
                onClick={handleAddTheme}
                className="p-1 text-green-500 hover:text-green-600"
                title="Add"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setIsAddingTheme(false);
                  setNewTheme('');
                }}
                className="p-1 text-gray-500 hover:text-gray-600"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Characters - Editable */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 border border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Characters</h3>
            <button
              onClick={handleAddCharacter}
              className="text-sm text-gray-500 hover:text-yellow-400 transition-colors"
              title="Add character"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {outline.characters && outline.characters.length > 0 ? (
              outline.characters.map((char, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-yellow-400">{char.name}</span>
                    <span className="text-[var(--text-secondary)]"> — {char.role}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCharacter(idx)}
                      className="p-1 text-gray-500 hover:text-yellow-400"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(idx)}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No characters yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Chapters</h3>
          <Button variant="outline" size="sm" onClick={handleAddChapter}>
            + Add Chapter
          </Button>
        </div>

        <div className="space-y-3">
          {outline.chapters.map((chapter) => (
            <div
              key={chapter.number}
              className="bg-gray-100 dark:bg-gray-800 rounded p-4 border border-gray-300 dark:border-gray-700 hover:border-yellow-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="warning" size="sm">
                      {chapter.number}
                    </Badge>
                    <h4 className="font-semibold">{chapter.title}</h4>
                    <span className="text-xs text-[var(--text-secondary)]">
                      ~{chapter.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{chapter.summary}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleMoveChapter(chapter.number, 'up')}
                    disabled={chapter.number === 1}
                    className="p-2 text-[var(--text-secondary)] hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveChapter(chapter.number, 'down')}
                    disabled={chapter.number === outline.chapters.length}
                    className="p-2 text-[var(--text-secondary)] hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEditChapter(chapter)}
                    className="p-2 text-[var(--text-secondary)] hover:text-yellow-400"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chapter.number)}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-400"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChapter(null);
        }}
        title={`Edit Chapter ${editingChapter?.number}`}
        size="lg"
      >
        {editingChapter && (
          <div className="space-y-4">
            <Input
              label="Chapter Title"
              value={editingChapter.title}
              onChange={(e) =>
                setEditingChapter({ ...editingChapter, title: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chapter Summary
              </label>
              <textarea
                value={editingChapter.summary}
                onChange={(e) =>
                  setEditingChapter({ ...editingChapter, summary: e.target.value })
                }
                rows={6}
                className="w-full bg-[var(--card-bg)] border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <Input
              type="number"
              label="Target Word Count"
              value={editingChapter.wordCount}
              onChange={(e) =>
                setEditingChapter({
                  ...editingChapter,
                  wordCount: parseInt(e.target.value) || 0,
                })
              }
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingChapter(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveChapter}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Character Edit Modal */}
      <Modal
        isOpen={isCharacterModalOpen}
        onClose={() => {
          setIsCharacterModalOpen(false);
          setEditingCharacter(null);
          setIsAddingCharacter(false);
        }}
        title={isAddingCharacter ? 'Add Character' : 'Edit Character'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Character Name"
            value={isAddingCharacter ? newCharacterName : (editingCharacter?.name || '')}
            onChange={(e) =>
              isAddingCharacter
                ? setNewCharacterName(e.target.value)
                : setEditingCharacter(editingCharacter ? { ...editingCharacter, name: e.target.value } : null)
            }
            placeholder="e.g., John Smith"
          />

          <Input
            label="Role / Description"
            value={isAddingCharacter ? newCharacterRole : (editingCharacter?.role || '')}
            onChange={(e) =>
              isAddingCharacter
                ? setNewCharacterRole(e.target.value)
                : setEditingCharacter(editingCharacter ? { ...editingCharacter, role: e.target.value } : null)
            }
            placeholder="e.g., Protagonist, a brave knight"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCharacterModalOpen(false);
                setEditingCharacter(null);
                setIsAddingCharacter(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={isAddingCharacter ? handleSaveNewCharacter : handleSaveCharacter}
            >
              {isAddingCharacter ? 'Add Character' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Outline History Panel component
const OutlineHistoryPanel: React.FC<{
  outlines: SavedOutlineItem[];
  isLoading: boolean;
  onLoad: (outline: SavedOutlineItem) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}> = ({ outlines, isLoading, onLoad, onDelete, onClose }) => {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <span>📋</span> Saved Outlines
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-gray-500">
          <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2" />
          Loading outlines...
        </div>
      ) : outlines.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No saved outlines yet. Generate an outline and click &quot;Save&quot; to store it.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {outlines.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-[var(--border)] hover:border-yellow-400 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                  {saved.title}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {saved.outline?.chapters?.length || 0} chapters &middot;{' '}
                  {new Date(saved.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => onLoad(saved)}
                  className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-medium rounded transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(saved.id)}
                  className="px-2 py-1 text-red-500 hover:text-red-600 text-xs"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
