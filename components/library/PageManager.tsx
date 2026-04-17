'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Trash2, Plus, Loader2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PAGE_TYPES,
  PageSlug,
  FRONT_MATTER_SLUGS,
  BACK_MATTER_SLUGS,
  getDefaultChapterNumber,
} from '@/lib/types/book-pages';

export interface PageChapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  isEdited?: boolean;
  modelUsed?: string;
  chapterType?: 'chapter' | 'front_matter' | 'back_matter';
  slug?: string | null;
}

interface PageManagerProps {
  bookId: number;
  chapters: PageChapter[];
  modelId?: string;
  /** Add a stub page to the editor's local chapter list. */
  onAddStubPage: (page: PageChapter) => void;
  /** Merge a server-persisted page into the local chapter list. */
  onPagePersisted: (page: PageChapter) => void;
  /** Open a page in the main editor by its chapter id. */
  onOpenPage: (chapterId: number) => void;
  /** Delete a page (page is identified by chapter id). */
  onDeletePage: (chapterId: number) => void;
  onClose?: () => void;
}

export function PageManager({
  bookId,
  chapters,
  modelId,
  onAddStubPage,
  onPagePersisted,
  onOpenPage,
  onDeletePage,
  onClose,
}: PageManagerProps) {
  const [generatingSlug, setGeneratingSlug] = useState<PageSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingBySlug = useMemo(() => {
    const map: Record<string, PageChapter> = {};
    for (const ch of chapters) {
      if (ch.slug && ch.chapterType && ch.chapterType !== 'chapter') {
        map[ch.slug] = ch;
      }
    }
    return map;
  }, [chapters]);

  const addStub = (slug: PageSlug) => {
    const def = PAGE_TYPES[slug];
    const existingNumbers = chapters.map((ch) => ch.number);
    const number = getDefaultChapterNumber(slug, existingNumbers);
    const stub: PageChapter = {
      id: Date.now(),
      number,
      title: def.defaultTitle,
      content: '',
      wordCount: 0,
      status: 'draft',
      isEdited: true,
      chapterType: def.type,
      slug,
    };
    onAddStubPage(stub);
  };

  const generateWithAI = async (slug: PageSlug) => {
    setError(null);
    setGeneratingSlug(slug);
    try {
      const response = await fetch('/api/generate/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          slug,
          modelId,
          replace: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to generate ${slug}`);
      }
      const newPage: PageChapter = {
        id: data.page.id,
        number: data.page.number,
        title: data.page.title,
        content: data.page.content,
        wordCount: data.page.wordCount,
        status: 'completed',
        isEdited: false,
        chapterType: data.page.chapterType,
        slug: data.page.slug,
      };
      onPagePersisted(newPage);
    } catch (e) {
      console.error('[PageManager] generate error', e);
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingSlug(null);
    }
  };

  const renderRow = (slug: PageSlug) => {
    const def = PAGE_TYPES[slug];
    const existing = existingBySlug[slug];
    const isGenerating = generatingSlug === slug;
    return (
      <div
        key={slug}
        className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 flex items-start gap-3"
      >
        <div className="mt-0.5 text-yellow-500">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
              {def.defaultTitle}
            </h4>
            <Badge size="sm" variant={def.type === 'front_matter' ? 'info' : 'default'}>
              {def.type === 'front_matter' ? 'Front matter' : 'Back matter'}
            </Badge>
            {existing ? (
              <Badge size="sm" variant="success">
                {existing.wordCount.toLocaleString()} words
              </Badge>
            ) : (
              <Badge size="sm" variant="warning">Not added</Badge>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {def.description}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {existing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenPage(existing.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateWithAI(slug)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete the ${def.defaultTitle} page?`)) {
                      onDeletePage(existing.id);
                    }
                  }}
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => addStub(slug)}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Add empty
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => generateWithAI(slug)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Front &amp; Back Matter
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Add acknowledgments, an introduction, a synopsis and more. AI generation
            uses the book&apos;s context.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
        <section>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-2">
            Front Matter (before Chapter 1)
          </h3>
          <div className="space-y-2">
            {FRONT_MATTER_SLUGS.map(renderRow)}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-2">
            Back Matter (after the final chapter)
          </h3>
          <div className="space-y-2">
            {BACK_MATTER_SLUGS.map(renderRow)}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PageManager;
