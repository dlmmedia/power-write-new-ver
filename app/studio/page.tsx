'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBookStore } from '@/lib/store/book-store';
import { useStudioStore } from '@/lib/store/studio-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BasicInfo } from '@/components/studio/config/BasicInfo';
import { ContentSettings } from '@/components/studio/config/ContentSettings';
import { WritingStyle } from '@/components/studio/config/WritingStyle';
import { StylePreferences } from '@/components/studio/config/StylePreferences';
import { CharactersWorld } from '@/components/studio/config/CharactersWorld';
import { BibliographySettings } from '@/components/studio/config/BibliographySettings';
import { AdvancedSettings } from '@/components/studio/config/AdvancedSettings';
import { OutlineEditor } from '@/components/studio/OutlineEditor';
import { ReferenceUpload } from '@/components/studio/ReferenceUpload';
import { SmartPrompt } from '@/components/studio/SmartPrompt';
import { getDemoUserId, canGenerateBook } from '@/lib/services/demo-account';
import { autoPopulateFromBook } from '@/lib/utils/auto-populate';
import { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';

// Progress state for incremental generation
interface GenerationProgress {
  phase: 'idle' | 'creating' | 'generating' | 'cover' | 'completed' | 'error';
  bookId?: number;
  chaptersCompleted: number;
  totalChapters: number;
  progress: number;
  message: string;
}

// Outline generation progress state
interface OutlineProgress {
  phase: 'idle' | 'analyzing' | 'structuring' | 'detailing' | 'completed' | 'error';
  progress: number;
  message: string;
}

// Generation type to track what's being generated
type GenerationType = 'none' | 'outline' | 'book';

type ConfigTab = 
  | 'prompt'
  | 'basic' 
  | 'content' 
  | 'style' 
  | 'characters' 
  | 'bibliography'
  | 'advanced';

export default function StudioPage() {
  const router = useRouter();
  const { selectedBooks } = useBookStore();
  const { 
    config, 
    outline, 
    isGenerating, 
    setIsGenerating,
    uploadedReferences,
    addUploadedReferences,
    removeUploadedReference,
    resetConfig,
    clearOutline
  } = useStudioStore();
  const [activeTab, setActiveTab] = useState<ConfigTab>('prompt');
  const [viewMode, setViewMode] = useState<'config' | 'outline'>('config');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    phase: 'idle',
    chaptersCompleted: 0,
    totalChapters: 0,
    progress: 0,
    message: '',
  });
  const [outlineProgress, setOutlineProgress] = useState<OutlineProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [generationType, setGenerationType] = useState<GenerationType>('none');
  const [showNoOutlineConfirm, setShowNoOutlineConfirm] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const tabs = [
    { id: 'prompt' as ConfigTab, label: 'Smart Prompt', icon: '✨' },
    { id: 'basic' as ConfigTab, label: 'Basic Info', icon: '📝' },
    { id: 'content' as ConfigTab, label: 'Content', icon: '📖' },
    { id: 'style' as ConfigTab, label: 'Style', icon: '✍️' },
    { id: 'characters' as ConfigTab, label: 'Characters', icon: '🌍' },
    { id: 'bibliography' as ConfigTab, label: 'Bibliography', icon: '📚' },
    { id: 'advanced' as ConfigTab, label: 'Advanced & AI', icon: '🤖' },
  ];

  // Handle generate book click - check for outline first
  const handleGenerateBookClick = useCallback(() => {
    if (!outline) {
      setShowNoOutlineConfirm(true);
      return;
    }
    handleGenerateBook();
  }, [outline]);

  // Incremental book generation with progress tracking
  const handleGenerateBook = useCallback(async () => {
    const canGenerate = canGenerateBook();
    if (!canGenerate.allowed) {
      alert(canGenerate.reason);
      return;
    }

    // If no outline, generate one first or use basic config
    const workingOutline = outline || {
      title: config.basicInfo?.title || 'Untitled Book',
      chapters: Array.from({ length: config.content?.numChapters || 10 }, (_, i) => ({
        chapterNumber: i + 1,
        title: `Chapter ${i + 1}`,
        synopsis: `Content for chapter ${i + 1}`,
        scenes: [],
        estimatedWordCount: Math.floor((config.content?.targetWordCount || 30000) / (config.content?.numChapters || 10)),
      })),
    };

    const chapterModel = (config.aiSettings as any)?.chapterModel || config.aiSettings?.model || 'anthropic/claude-sonnet-4';
    const totalChapters = workingOutline.chapters.length;

    const confirmed = confirm(
      `Generate full book: "${workingOutline.title}"?\n\n` +
      `This will generate ${totalChapters} chapters using ${chapterModel}.\n` +
      `The book will be generated in batches to ensure reliable completion.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsGenerating(true);
    setGenerationType('book');
    abortControllerRef.current = new AbortController();

    // Initialize progress
    setGenerationProgress({
      phase: 'creating',
      chaptersCompleted: 0,
      totalChapters,
      progress: 0,
      message: 'Creating book...',
    });

    let currentBookId: number | undefined;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    try {
      // Keep generating until complete
      while (true) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Generation cancelled by user');
        }

        const response = await fetch('/api/generate/book-incremental', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: getDemoUserId(),
            outline: workingOutline,
            config: config,
            modelId: chapterModel,
            bookId: currentBookId,
          }),
          signal: abortControllerRef.current?.signal,
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server error: ${text.substring(0, 100)}`);
        }

        if (!data.success) {
          consecutiveErrors++;
          console.error('Generation error:', data.error, data.details);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(data.details || data.error || 'Generation failed after multiple attempts');
          }
          
          // Update progress to show error but continue trying
          setGenerationProgress(prev => ({
            ...prev,
            message: `Error: ${data.error}. Retrying... (${consecutiveErrors}/${maxConsecutiveErrors})`,
          }));
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // Reset error counter on success
        consecutiveErrors = 0;

        // Update progress
        currentBookId = data.bookId;
        setGenerationProgress({
          phase: data.phase,
          bookId: data.bookId,
          chaptersCompleted: data.chaptersCompleted,
          totalChapters: data.totalChapters,
          progress: data.progress,
          message: data.message,
        });

        // Check if complete
        if (data.phase === 'completed' && data.book) {
          // Clear caches
          if (typeof window !== 'undefined' && 'caches' in window) {
            try {
              const cacheNames = await caches.keys();
              const bookCacheNames = cacheNames.filter(name => 
                name.includes('books') || name.includes('powerwrite-books')
              );
              await Promise.all(bookCacheNames.map(name => caches.delete(name)));
            } catch (error) {
              console.error('Failed to clear caches:', error);
            }
          }

          // Success!
          setGenerationProgress({
            phase: 'completed',
            bookId: data.book.id,
            chaptersCompleted: data.totalChapters,
            totalChapters: data.totalChapters,
            progress: 100,
            message: 'Book generated successfully!',
          });

          // Show success message and redirect after a short delay
          setTimeout(() => {
            alert(
              `Book generated successfully!\n\n` +
              `Title: ${data.book.title}\n` +
              `Chapters: ${data.book.chapters}\n` +
              `Words: ${data.book.wordCount.toLocaleString()}\n\n` +
              `Book ID: ${data.book.id}`
            );
            router.push(`/library`);
          }, 500);
          
          break;
        }

        // Small delay between batches to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error generating book:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'error',
        message: `Error: ${errorMessage}`,
      }));

      // If we have a partial book, offer to continue
      if (currentBookId) {
        const retry = confirm(
          `Generation encountered an error: ${errorMessage}\n\n` +
          `Progress has been saved (${generationProgress.chaptersCompleted}/${generationProgress.totalChapters} chapters).\n\n` +
          `Would you like to retry and continue from where you left off?`
        );
        
        if (retry) {
          // Recursive call to continue
          handleGenerateBook();
          return;
        }
      } else {
        alert(`Failed to generate book: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
      setGenerationType('none');
      abortControllerRef.current = null;
    }
  }, [outline, config, router, generationProgress.chaptersCompleted, generationProgress.totalChapters]);

  // Cancel generation
  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'error',
        message: 'Generation cancelled. Progress has been saved.',
      }));
    }
  }, []);

  const handleAutoPopulate = () => {
    if (!selectedReferenceId) {
      alert('Please select a reference book first');
      return;
    }

    const selectedBook = selectedBooks.find(book => book.id === selectedReferenceId);
    if (!selectedBook) {
      alert('Selected book not found');
      return;
    }

    const authorName = config.basicInfo.author || 'Your Name';
    const newConfig = autoPopulateFromBook(selectedBook, config, authorName);
    const { setConfig } = useStudioStore.getState();
    setConfig(newConfig);
    
    // Show success banner
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 8000);
  };

  const handleGenerateOutline = async () => {
    const canGenerate = canGenerateBook();
    if (!canGenerate.allowed) {
      alert(canGenerate.reason);
      return;
    }

    // Get selected model for outline
    const outlineModel = config.aiSettings?.model || 'gpt-4o-mini';

    setIsGenerating(true);
    setGenerationType('outline');
    
    // Start outline progress animation
    setOutlineProgress({
      phase: 'analyzing',
      progress: 0,
      message: 'Analyzing your book configuration...',
    });

    // Simulate progress stages while waiting for API
    const progressInterval = setInterval(() => {
      setOutlineProgress(prev => {
        if (prev.phase === 'analyzing' && prev.progress >= 30) {
          return {
            phase: 'structuring',
            progress: 35,
            message: 'Structuring your book chapters...',
          };
        } else if (prev.phase === 'structuring' && prev.progress >= 65) {
          return {
            phase: 'detailing',
            progress: 70,
            message: 'Adding chapter details and scenes...',
          };
        } else if (prev.progress < 90) {
          return {
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 5 + 2, 90),
          };
        }
        return prev;
      });
    }, 800);

    try {
      const response = await fetch('/api/generate/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          config: config,
          referenceBooks: selectedBooks,
          modelId: outlineModel,
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();
      if (data.success && data.outline) {
        // Complete progress
        setOutlineProgress({
          phase: 'completed',
          progress: 100,
          message: 'Outline generated successfully!',
        });
        
        // Save outline to store
        const { setOutline } = useStudioStore.getState();
        setOutline(data.outline);
        
        // Short delay to show completion before switching
        setTimeout(() => {
          setViewMode('outline');
          setOutlineProgress({ phase: 'idle', progress: 0, message: '' });
        }, 1500);
      } else {
        setOutlineProgress({
          phase: 'error',
          progress: 0,
          message: data.error || 'Unknown error occurred',
        });
        alert('Failed to generate outline: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating outline:', error);
      setOutlineProgress({
        phase: 'error',
        progress: 0,
        message: 'Failed to connect to server',
      });
      alert('Failed to generate outline. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationType('none');
    }
  };

  // Get current model info for display
  const currentOutlineModel = config.aiSettings?.model || 'gpt-4o-mini';
  const currentChapterModel = (config.aiSettings as any)?.chapterModel || 'anthropic/claude-sonnet-4';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-white dark:bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
              <Logo size="md" />
              <h1 className="text-2xl font-bold">Book Studio</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (config.basicInfo?.title || outline) {
                    const confirmed = confirm('Start a new book? This will clear all current configuration and outline.');
                    if (!confirmed) return;
                  }
                  resetConfig();
                  setActiveTab('prompt');
                  setViewMode('config');
                }}
                className="text-yellow-600 hover:text-yellow-500"
              >
                ✨ New Book
              </Button>
              {/* Model indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  🤖 {currentChapterModel.split('/').pop()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggleCompact />
              {(selectedBooks.length > 0 || uploadedReferences.length > 0) && (
                <Badge variant="info">
                  {selectedBooks.length + uploadedReferences.length} Reference{(selectedBooks.length + uploadedReferences.length) !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                📎 Upload References
              </Button>
              {outline && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setViewMode(viewMode === 'config' ? 'outline' : 'config')}
                >
                  {viewMode === 'config' ? 'View Outline' : 'Edit Config'}
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={handleGenerateOutline}
                isLoading={generationType === 'outline'}
                disabled={!config.basicInfo?.title || !config.basicInfo?.author || isGenerating}
              >
                {outline ? 'Regenerate Outline' : 'Generate Outline'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateBookClick}
                isLoading={generationType === 'book'}
                disabled={isGenerating}
              >
                Generate Book
              </Button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <Logo size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (config.basicInfo?.title || outline) {
                      const confirmed = confirm('Start a new book? This will clear all current configuration and outline.');
                      if (!confirmed) return;
                    }
                    resetConfig();
                    setActiveTab('prompt');
                    setViewMode('config');
                  }}
                  className="text-yellow-600 hover:text-yellow-500 text-sm"
                >
                  ✨ New
                </Button>
                <ThemeToggleCompact />
              </div>
            </div>
            <h1 className="text-lg font-bold mb-3">Book Studio</h1>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(selectedBooks.length > 0 || uploadedReferences.length > 0) && (
                <Badge variant="info" size="sm">
                  {selectedBooks.length + uploadedReferences.length} Ref{(selectedBooks.length + uploadedReferences.length) !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                📎 Upload
              </Button>
              {outline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'config' ? 'outline' : 'config')}
                >
                  {viewMode === 'config' ? 'Outline' : 'Config'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="bg-green-100 dark:bg-green-900 border-b border-green-300 dark:border-green-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="text-green-900 dark:text-white font-semibold">
                    Configuration Auto-Populated Successfully!
                  </p>
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    Generated sample title, description, genre, themes, and settings. You can now customize as needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Book Selector */}
      {selectedBooks.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🎯 Auto-Populate From:
              </label>
              <select
                value={selectedReferenceId}
                onChange={(e) => setSelectedReferenceId(e.target.value)}
                className="flex-1 max-w-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a reference book...</option>
                {selectedBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.authors?.[0] ? `by ${book.authors[0]}` : ''}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="md"
                onClick={handleAutoPopulate}
                disabled={!selectedReferenceId}
              >
                ✨ Auto-Populate
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-2">
              Select a reference book to automatically generate sample title, description, genre, themes, and settings based on its style.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile Tab Navigation (Horizontal Scroll) */}
        <div className="md:hidden mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-yellow-400 text-black font-semibold'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - Configuration Tabs (Desktop Only) */}
          <div className="hidden md:block md:col-span-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-lg font-semibold mb-4 text-yellow-600 dark:text-yellow-400">Configuration</h2>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded transition-colors flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-black font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Reference Materials */}
              {(selectedBooks.length > 0 || uploadedReferences.length > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">Reference Materials</h3>
                  <div className="space-y-2">
                    {/* Selected Books */}
                    {selectedBooks.slice(0, 2).map((book) => (
                      <div key={book.id} className="flex items-center gap-2">
                        <img
                          src={book.imageUrl || '/placeholder-cover.jpg'}
                          alt={book.title}
                          className="w-8 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 dark:text-white truncate">{book.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 truncate">{book.authors[0]}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Uploaded References */}
                    {uploadedReferences.slice(0, 2).map((ref) => (
                      <div key={ref.id} className="flex items-center gap-2">
                        <div className="text-xl">
                          {ref.type === 'pdf' && '📕'}
                          {ref.type === 'txt' && '📄'}
                          {ref.type === 'docx' && '📘'}
                          {ref.type === 'url' && '🔗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 dark:text-white truncate">{ref.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-500">{ref.type.toUpperCase()}</p>
                        </div>
                        <button
                          onClick={() => removeUploadedReference(ref.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    
                    {(selectedBooks.length + uploadedReferences.length) > 4 && (
                      <p className="text-xs text-gray-600 dark:text-gray-500">+{selectedBooks.length + uploadedReferences.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Model Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">AI Models</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outline:</span>
                    <span className="text-gray-900 dark:text-white font-medium truncate max-w-[120px]">
                      {currentOutlineModel.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chapters:</span>
                    <span className="text-gray-900 dark:text-white font-medium truncate max-w-[120px]">
                      {currentChapterModel.split('/').pop()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className="w-full mt-2 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  Change models →
                </button>
              </div>
            </div>
          </div>

          {/* Main Panel - Configuration Forms or Outline */}
          <div className="col-span-1 md:col-span-9">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6">
              {viewMode === 'outline' ? (
                <OutlineEditor />
              ) : (
                <>
                  {activeTab === 'prompt' && <SmartPrompt />}
                  {activeTab === 'basic' && <BasicInfo />}
                  {activeTab === 'content' && <ContentSettings />}
                  {activeTab === 'style' && <StylePreferences />}
                  {activeTab === 'characters' && <CharactersWorld />}
                  {activeTab === 'bibliography' && <BibliographySettings />}
                  {activeTab === 'advanced' && <AdvancedSettings />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-20">
          <Button
            variant="outline"
            size="md"
            onClick={handleGenerateOutline}
            isLoading={generationType === 'outline'}
            disabled={!config.basicInfo?.title || !config.basicInfo?.author || isGenerating}
            className="shadow-lg"
          >
            {outline ? 'Regenerate' : 'Generate'} Outline
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateBookClick}
            isLoading={generationType === 'book'}
            disabled={isGenerating}
            className="shadow-lg"
          >
            Generate Book
          </Button>
        </div>
      </div>

      {/* Reference Upload Modal */}
      <ReferenceUpload
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(references) => {
          addUploadedReferences(references);
          setShowUploadModal(false);
        }}
      />

      {/* No Outline Confirmation Modal */}
      {showNoOutlineConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Outline Generated
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You haven&apos;t generated an outline yet. An outline helps structure your book and ensures better quality chapters.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setShowNoOutlineConfirm(false);
                  handleGenerateOutline();
                }}
              >
                ✨ Generate Outline First
              </Button>
              
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => {
                  setShowNoOutlineConfirm(false);
                  handleGenerateBook();
                }}
              >
                Skip & Generate Book Anyway
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowNoOutlineConfirm(false)}
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
              💡 Tip: Books with outlines typically have better structure and coherence.
            </p>
          </div>
        </div>
      )}

      {/* Outline Generation Progress Modal */}
      {generationType === 'outline' && outlineProgress.phase !== 'idle' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-4 border-yellow-200 dark:border-yellow-900 animate-ping opacity-20"></div>
                <div className="absolute inset-2 rounded-full border-4 border-yellow-300 dark:border-yellow-800 animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-4 rounded-full border-4 border-yellow-400 dark:border-yellow-700 animate-ping opacity-40" style={{ animationDelay: '0.4s' }}></div>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl animate-bounce">
                    {outlineProgress.phase === 'analyzing' && '🔍'}
                    {outlineProgress.phase === 'structuring' && '📐'}
                    {outlineProgress.phase === 'detailing' && '✏️'}
                    {outlineProgress.phase === 'completed' && '✅'}
                    {outlineProgress.phase === 'error' && '❌'}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {outlineProgress.phase === 'analyzing' && 'Analyzing Configuration'}
                {outlineProgress.phase === 'structuring' && 'Structuring Chapters'}
                {outlineProgress.phase === 'detailing' && 'Adding Details'}
                {outlineProgress.phase === 'completed' && 'Outline Complete!'}
                {outlineProgress.phase === 'error' && 'Generation Failed'}
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(outlineProgress.progress)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    outlineProgress.phase === 'error' 
                      ? 'bg-red-500' 
                      : outlineProgress.phase === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                  }`}
                  style={{ width: `${outlineProgress.progress}%` }}
                />
              </div>
            </div>

            {/* Status Steps */}
            <div className="space-y-2 mb-6">
              <div className={`flex items-center gap-3 ${outlineProgress.phase === 'analyzing' || outlineProgress.progress >= 30 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  outlineProgress.progress >= 30 ? 'bg-green-500 text-white' : 
                  outlineProgress.phase === 'analyzing' ? 'bg-yellow-400 text-black animate-pulse' : 
                  'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {outlineProgress.progress >= 30 ? '✓' : '1'}
                </span>
                <span>Analyze book configuration</span>
              </div>
              <div className={`flex items-center gap-3 ${outlineProgress.phase === 'structuring' || outlineProgress.progress >= 65 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  outlineProgress.progress >= 65 ? 'bg-green-500 text-white' : 
                  outlineProgress.phase === 'structuring' ? 'bg-yellow-400 text-black animate-pulse' : 
                  'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {outlineProgress.progress >= 65 ? '✓' : '2'}
                </span>
                <span>Structure chapter flow</span>
              </div>
              <div className={`flex items-center gap-3 ${outlineProgress.phase === 'detailing' || outlineProgress.phase === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  outlineProgress.phase === 'completed' ? 'bg-green-500 text-white' : 
                  outlineProgress.phase === 'detailing' ? 'bg-yellow-400 text-black animate-pulse' : 
                  'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {outlineProgress.phase === 'completed' ? '✓' : '3'}
                </span>
                <span>Generate chapter details</span>
              </div>
            </div>

            {/* Message */}
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              {outlineProgress.message}
            </p>

            {/* Completed Message */}
            {outlineProgress.phase === 'completed' && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  ✨ Your outline is ready! Switching to outline view...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Generation Progress Modal */}
      {generationType === 'book' && generationProgress.phase !== 'idle' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                {/* Animated rings for generating state */}
                {(generationProgress.phase === 'creating' || generationProgress.phase === 'generating' || generationProgress.phase === 'cover') && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-200 dark:border-yellow-900 animate-ping opacity-20"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-yellow-300 dark:border-yellow-800 animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
                  </>
                )}
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl ${generationProgress.phase !== 'completed' && generationProgress.phase !== 'error' ? 'animate-bounce' : ''}`}>
                    {generationProgress.phase === 'creating' && '📚'}
                    {generationProgress.phase === 'generating' && '✍️'}
                    {generationProgress.phase === 'cover' && '🎨'}
                    {generationProgress.phase === 'completed' && '✅'}
                    {generationProgress.phase === 'error' && '⚠️'}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {generationProgress.phase === 'creating' && 'Creating Book...'}
                {generationProgress.phase === 'generating' && 'Writing Chapters...'}
                {generationProgress.phase === 'cover' && 'Designing Cover...'}
                {generationProgress.phase === 'completed' && 'Book Complete!'}
                {generationProgress.phase === 'error' && 'Generation Error'}
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{generationProgress.progress}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    generationProgress.phase === 'error' 
                      ? 'bg-red-500' 
                      : generationProgress.phase === 'completed'
                        ? 'bg-green-500'
                        : 'bg-yellow-500'
                  }`}
                  style={{ width: `${generationProgress.progress}%` }}
                />
              </div>
            </div>

            {/* Chapter Progress */}
            {generationProgress.totalChapters > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {generationProgress.chaptersCompleted}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">written</div>
                  </div>
                  <div className="text-2xl text-gray-300 dark:text-gray-600">/</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                      {generationProgress.totalChapters}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">total</div>
                  </div>
                </div>
                {/* Chapter progress dots */}
                <div className="flex justify-center gap-1 flex-wrap">
                  {Array.from({ length: generationProgress.totalChapters }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < generationProgress.chaptersCompleted
                          ? 'bg-green-500'
                          : i === generationProgress.chaptersCompleted
                            ? 'bg-yellow-400 animate-pulse'
                            : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {generationProgress.message}
            </p>

            {/* Cancel Button */}
            {generationProgress.phase !== 'completed' && generationProgress.phase !== 'error' && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelGeneration}
                  className="text-gray-500 hover:text-red-500"
                >
                  Cancel Generation
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Progress is saved automatically. You can continue later.
                </p>
              </div>
            )}

            {/* Completed State */}
            {generationProgress.phase === 'completed' && (
              <div className="text-center">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  Redirecting to library...
                </p>
              </div>
            )}

            {/* Error State with Book ID */}
            {generationProgress.phase === 'error' && generationProgress.bookId && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Book ID: {generationProgress.bookId}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateBook}
                >
                  Continue Generation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
