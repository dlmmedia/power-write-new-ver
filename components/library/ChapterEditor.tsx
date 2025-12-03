'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';

interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
}

interface ChapterEditorProps {
  chapter: Chapter;
  onSave: (chapter: Chapter) => void;
  onClose: () => void;
}

export function ChapterEditor({ chapter, onSave, onClose }: ChapterEditorProps) {
  const [editedChapter, setEditedChapter] = useState<Chapter>(chapter);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedChapter);
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (content: string) => {
    const wordCount = content.trim().split(/\s+/).length;
    setEditedChapter({
      ...editedChapter,
      content,
      wordCount
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Chapter {editedChapter.number}: {editedChapter.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {editedChapter.wordCount} words
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Chapter Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Chapter Title</label>
          <Input
            value={editedChapter.title}
            onChange={(e) => setEditedChapter({
              ...editedChapter,
              title: e.target.value
            })}
            className="text-lg"
          />
        </div>

        {/* Chapter Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Content</label>
          <Textarea
            value={editedChapter.content}
            onChange={(e) => updateContent(e.target.value)}
            rows={25}
            className="font-serif text-base leading-relaxed"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
          <select
            value={editedChapter.status}
            onChange={(e) => setEditedChapter({
              ...editedChapter,
              status: e.target.value as 'draft' | 'completed'
            })}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
