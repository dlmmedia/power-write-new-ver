'use client';

import React, { useState } from 'react';
import { useStudioStore } from '@/lib/store/studio-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ChapterOutline } from '@/lib/types/generation';

export const OutlineEditor: React.FC = () => {
  const { outline, setOutline } = useStudioStore();
  const [editingChapter, setEditingChapter] = useState<ChapterOutline | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!outline) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg mb-2">No outline generated yet</p>
        <p className="text-sm">Click "Generate Outline" to create your book structure</p>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{outline.title}</h2>
          <p className="text-gray-400 text-sm mt-1">by {outline.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Button variant="outline" size="sm">Export Outline ▼</Button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 w-36 z-10">
              <button
                onClick={() => handleExportOutline('pdf')}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExportOutline('docx')}
                className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-sm"
              >
                Export as DOCX
              </button>
            </div>
          </div>
          <Badge variant="info">{outline.chapters.length} Chapters</Badge>
          <Badge variant="default">{totalWords.toLocaleString()} words</Badge>
        </div>
      </div>

      {/* Description */}
      {outline.description && (
        <div className="bg-gray-800 rounded p-4 border border-gray-700">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-gray-300">{outline.description}</p>
        </div>
      )}

      {/* Themes & Characters */}
      <div className="grid grid-cols-2 gap-4">
        {outline.themes && outline.themes.length > 0 && (
          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <h3 className="font-semibold mb-2">Themes</h3>
            <div className="flex flex-wrap gap-2">
              {outline.themes.map((theme, idx) => (
                <Badge key={idx} variant="default">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {outline.characters && outline.characters.length > 0 && (
          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <h3 className="font-semibold mb-2">Characters</h3>
            <div className="space-y-2">
              {outline.characters.map((char, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-semibold text-yellow-400">{char.name}</span>
                  <span className="text-gray-400"> — {char.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
              className="bg-gray-800 rounded p-4 border border-gray-700 hover:border-yellow-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="warning" size="sm">
                      {chapter.number}
                    </Badge>
                    <h4 className="font-semibold">{chapter.title}</h4>
                    <span className="text-xs text-gray-400">
                      ~{chapter.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{chapter.summary}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleMoveChapter(chapter.number, 'up')}
                    disabled={chapter.number === 1}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveChapter(chapter.number, 'down')}
                    disabled={chapter.number === outline.chapters.length}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEditChapter(chapter)}
                    className="p-2 text-gray-400 hover:text-yellow-400"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chapter.number)}
                    className="p-2 text-gray-400 hover:text-red-400"
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

      {/* Edit Modal */}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Chapter Summary
              </label>
              <textarea
                value={editingChapter.summary}
                onChange={(e) =>
                  setEditingChapter({ ...editingChapter, summary: e.target.value })
                }
                rows={6}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
    </div>
  );
};
