'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useBookStore } from '@/lib/store/book-store';
import { useStudioStore } from '@/lib/store/studio-store';
import { useUserTier } from '@/contexts/UserTierContext';
import { useBooks } from '@/contexts/BooksContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BasicInfo } from '@/components/studio/config/BasicInfo';
import { ContentSettings } from '@/components/studio/config/ContentSettings';
import { WritingStyle } from '@/components/studio/config/WritingStyle';
import { StylePreferences } from '@/components/studio/config/StylePreferences';
import { CharactersWorld } from '@/components/studio/config/CharactersWorld';
import { BibliographySettings } from '@/components/studio/config/BibliographySettings';
import { ImageSettings } from '@/components/studio/config/ImageSettings';
import { AdvancedSettings } from '@/components/studio/config/AdvancedSettings';
import { ReferenceBooks } from '@/components/studio/config/ReferenceBooks';
import { OutlineEditor } from '@/components/studio/OutlineEditor';
import { ReferenceUpload } from '@/components/studio/ReferenceUpload';
import { SmartPrompt } from '@/components/studio/SmartPrompt';
import { ProFeatureGate, ProButton } from '@/components/pro/ProFeatureGate';
import { autoPopulateFromBook } from '@/lib/utils/auto-populate';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UpgradeBanner } from '@/components/pro/UpgradeBanner';
import { 
  OutlineGenerationModal, 
  BookGenerationModal,
  type GenerationProgress,
  type OutlineProgress 
} from '@/components/studio/GenerationModal';
import { Lock, Crown, Sparkles, FileText, BookOpen, PenTool, Globe, Image, Search, Library, Bot, Paperclip, Target, Check, X, AlertTriangle, Lightbulb } from 'lucide-react';

type UserTier = 'free' | 'pro';

// Generation type to track what's being generated
type GenerationType = 'none' | 'outline' | 'book';

type ConfigTab = 
  | 'prompt'
  | 'basic' 
  | 'content' 
  | 'style' 
  | 'characters' 
  | 'images'
  | 'bibliography'
  | 'references'
  | 'advanced';

function StudioPageContent() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
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
  
  // Use global tier context
  const { userTier, isProUser, isLoading: isTierLoading, showUpgradeModal: triggerUpgradeModal } = useUserTier();
  
  // Use books context for cache invalidation
  const { refreshBooks, addBookToList } = useBooks();
  
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
  const [useStreaming, setUseStreaming] = useState(true); // Use streaming by default for real-time updates
  
  // Stable modal visibility state - prevents flickering during re-renders
  const [showBookModal, setShowBookModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Use refs to track progress values for use in callbacks (prevents stale closures)
  const generationProgressRef = useRef(generationProgress);
  const outlineProgressRef = useRef(outlineProgress);
  
  // Keep refs in sync with state
  useEffect(() => {
    generationProgressRef.current = generationProgress;
  }, [generationProgress]);
  
  useEffect(() => {
    outlineProgressRef.current = outlineProgress;
  }, [outlineProgress]);
  
  // Check if user can generate (Pro users only)
  const canGenerate = isProUser;

  const tabs = [
    { id: 'prompt' as ConfigTab, label: 'Smart Prompt', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'basic' as ConfigTab, label: 'Basic Info', icon: <FileText className="w-4 h-4" /> },
    { id: 'content' as ConfigTab, label: 'Content', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'style' as ConfigTab, label: 'Style', icon: <PenTool className="w-4 h-4" /> },
    { id: 'characters' as ConfigTab, label: 'Characters', icon: <Globe className="w-4 h-4" /> },
    { id: 'images' as ConfigTab, label: 'Book Images', icon: <Image className="w-4 h-4" /> },
    { id: 'references' as ConfigTab, label: 'Reference Books', icon: <Search className="w-4 h-4" /> },
    { id: 'bibliography' as ConfigTab, label: 'Bibliography', icon: <Library className="w-4 h-4" /> },
    { id: 'advanced' as ConfigTab, label: 'Advanced & AI', icon: <Bot className="w-4 h-4" /> },
  ];

  // Incremental book generation with progress tracking
  // Optional continuationBookId allows resuming from a streaming failure
  const handleGenerateBook = useCallback(async (continuationBookId?: number) => {
    if (!canGenerate) {
      triggerUpgradeModal('generate-book');
      return;
    }

    // If no outline, generate one first or use basic config
    const workingOutline = outline || {
      title: config.basicInfo?.title || 'Untitled Book',
      author: config.basicInfo?.author || '',
      genre: config.basicInfo?.genre || '',
      description: '',
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

    // Skip confirmation if continuing from a streaming failure
    if (!continuationBookId) {
      const confirmed = confirm(
        `Generate full book: "${workingOutline.title}"?\n\n` +
        `This will generate ${totalChapters} chapters using ${chapterModel}.\n` +
        `The book will be generated in batches to ensure reliable completion.\n\n` +
        `Continue?`
      );

      if (!confirmed) return;
    }

    setIsGenerating(true);
    setGenerationType('book');
    setShowBookModal(true); // Show modal immediately with stable state
    abortControllerRef.current = new AbortController();

    // Initialize progress (keep existing progress if continuing)
    if (!continuationBookId) {
      setGenerationProgress({
        phase: 'creating',
        chaptersCompleted: 0,
        totalChapters,
        progress: 0,
        message: 'Creating book...',
      });
    } else {
      setGenerationProgress(prev => ({
        ...prev,
        phase: 'generating',
        message: 'Connection interrupted. Continuing generation...',
      }));
    }

    let currentBookId: number | undefined = continuationBookId;
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
            outline: workingOutline,
            config: config,
            modelId: chapterModel,
            bookId: currentBookId,
            // Pass generation speed and parallel settings
            generationSpeed: config.aiSettings?.generationSpeed || 'quality',
            useParallel: config.aiSettings?.useParallelGeneration !== false,
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
          // Clear browser caches
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

          // Immediately add the new book to the cache so it appears in library
          addBookToList({
            id: data.book.id,
            title: data.book.title,
            author: workingOutline.author || config.basicInfo?.author || '',
            genre: workingOutline.genre || config.basicInfo?.genre || '',
            status: 'completed',
            coverUrl: data.book.coverUrl,
            createdAt: new Date().toISOString(),
            outline: workingOutline,
            config: config,
            metadata: {
              wordCount: data.book.wordCount || 0,
              chapters: data.book.chapters || data.totalChapters,
              modelUsed: chapterModel,
            },
          });

          // Refresh books cache in background, then show success and navigate
          // Ensure refreshBooks completes before navigation so library is up-to-date
          await refreshBooks();
          
          alert(
            `Book generated successfully!\n\n` +
            `Title: ${data.book.title}\n` +
            `Chapters: ${data.book.chapters}\n` +
            `Words: ${data.book.wordCount.toLocaleString()}\n\n` +
            `Book ID: ${data.book.id}`
          );
          router.push(`/library/${data.book.id}`);
          
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
          // Continue from existing book to avoid creating a duplicate
          handleGenerateBook(currentBookId);
          return;
        }
      } else {
        alert(`Failed to generate book: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
      setGenerationType('none');
      abortControllerRef.current = null;
      // Delay hiding modal to show final state
      setTimeout(() => {
        const finalPhase = generationProgressRef.current.phase;
        if (finalPhase === 'completed' || finalPhase === 'error') {
          // Keep modal visible for completed/error states until user action or navigation
        } else {
          setShowBookModal(false);
        }
      }, 500);
    }
  }, [outline, config, router, refreshBooks, addBookToList]);

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

  // Streaming-based book generation with real-time progress updates
  const handleGenerateBookStreaming = useCallback(async () => {
    if (!canGenerate) {
      triggerUpgradeModal('generate-book');
      return;
    }

    const workingOutline = outline || {
      title: config.basicInfo?.title || 'Untitled Book',
      author: config.basicInfo?.author || '',
      genre: config.basicInfo?.genre || '',
      description: '',
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
    const generationSpeed = config.aiSettings?.generationSpeed || 'quality';
    const useParallel = config.aiSettings?.useParallelGeneration !== false;

    const confirmed = confirm(
      `Generate full book with streaming: "${workingOutline.title}"?\n\n` +
      `• ${totalChapters} chapters\n` +
      `• Speed: ${generationSpeed} (${useParallel ? 'parallel' : 'sequential'})\n` +
      `• Real-time progress updates\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsGenerating(true);
    setGenerationType('book');
    setShowBookModal(true); // Show modal immediately with stable state
    abortControllerRef.current = new AbortController();

    setGenerationProgress({
      phase: 'creating',
      chaptersCompleted: 0,
      totalChapters,
      progress: 0,
      message: 'Connecting to generation stream...',
      isParallel: useParallel,
      modelUsed: chapterModel,
    });

    try {
      const response = await fetch('/api/generate/book-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: workingOutline,
          config: config,
          modelId: chapterModel,
          generationSpeed,
          useParallel,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let streamCompleted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Skip heartbeat comments (keep-alive pings from server)
          if (line.startsWith(':')) continue;

          if (line.startsWith('event:')) {
            const eventType = line.replace('event:', '').trim();
            continue;
          }
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.replace('data:', '').trim());
              
              // Handle different event types
              if (data.phase === 'starting') {
                setGenerationProgress(prev => ({
                  ...prev,
                  phase: 'generating',
                  message: data.message || 'Starting generation...',
                  isParallel: data.parallel,
                  modelUsed: data.model,
                }));
              } else if (data.bookId && !generationProgressRef.current.bookId) {
                setGenerationProgress(prev => ({
                  ...prev,
                  bookId: data.bookId,
                  message: data.message || 'Book created',
                }));
              } else if (data.batch !== undefined) {
                // Batch progress
                setGenerationProgress(prev => ({
                  ...prev,
                  phase: 'generating',
                  currentBatch: data.chapters || prev.currentBatch,
                  chaptersCompleted: data.chaptersCompleted || prev.chaptersCompleted,
                  progress: data.progress || prev.progress,
                  totalWords: data.totalWords || prev.totalWords,
                  batchDuration: data.batchDuration || prev.batchDuration,
                  message: data.message || prev.message,
                }));
              } else if (data.chapterNumber !== undefined) {
                // Individual chapter progress
                setGenerationProgress(prev => ({
                  ...prev,
                  message: `Chapter ${data.chapterNumber}: ${data.title} (${data.wordCount} words)`,
                }));
              } else if (data.type === 'front' || data.type === 'back') {
                // Cover progress
                setGenerationProgress(prev => ({
                  ...prev,
                  phase: 'cover',
                  message: data.message || `${data.type} cover generated`,
                }));
              } else if (data.chaptersCompleted !== undefined && data.totalWords !== undefined) {
                // Completion
                streamCompleted = true;
                setGenerationProgress(prev => ({
                  ...prev,
                  phase: 'completed',
                  chaptersCompleted: data.chaptersCompleted,
                  totalWords: data.totalWords,
                  progress: 100,
                  message: data.message || 'Book generation complete!',
                }));

                // Clear browser caches
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

                // Immediately add the new book to the cache so it appears in library
                if (data.bookId) {
                  addBookToList({
                    id: data.bookId,
                    title: data.title || workingOutline.title || '',
                    author: workingOutline.author || config.basicInfo?.author || '',
                    genre: workingOutline.genre || config.basicInfo?.genre || '',
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    outline: workingOutline,
                    config: config,
                    metadata: {
                      wordCount: data.totalWords || 0,
                      chapters: data.chaptersCompleted || totalChapters,
                      modelUsed: chapterModel,
                    },
                  });
                }

                // Refresh cache then show success and navigate
                await refreshBooks();
                
                alert(
                  `Book generated successfully!\n\n` +
                  `Title: ${data.title}\n` +
                  `Chapters: ${data.chaptersCompleted}\n` +
                  `Words: ${data.totalWords?.toLocaleString()}\n\n` +
                  `Book ID: ${data.bookId}`
                );
                router.push(`/library/${data.bookId}`);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Detect premature stream end - if the stream ended without a completion event,
      // the server connection was likely killed (Railway proxy timeout, Node.js timeout, etc.)
      // Auto-recover by switching to incremental mode which uses separate requests per batch
      if (!streamCompleted && generationProgressRef.current.bookId) {
        const savedBookId = generationProgressRef.current.bookId;
        console.log(`[Studio] Stream ended prematurely for book ${savedBookId}. Switching to incremental mode...`);
        
        setGenerationProgress(prev => ({
          ...prev,
          message: 'Connection interrupted. Continuing generation...',
        }));

        // Small delay then continue with incremental mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reset state for incremental handler to take over
        setIsGenerating(false);
        setGenerationType('none');
        abortControllerRef.current = null;
        
        // Continue with incremental mode using the saved bookId
        handleGenerateBook(savedBookId);
        return;
      }
    } catch (error) {
      console.error('Streaming generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // If the stream failed with a bookId, auto-recover with incremental mode
      if (generationProgressRef.current.bookId && !errorMessage.includes('cancelled')) {
        const savedBookId = generationProgressRef.current.bookId;
        console.log(`[Studio] Stream error for book ${savedBookId}. Switching to incremental mode...`);
        
        setGenerationProgress(prev => ({
          ...prev,
          message: 'Connection interrupted. Continuing generation...',
        }));

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsGenerating(false);
        setGenerationType('none');
        abortControllerRef.current = null;
        
        handleGenerateBook(savedBookId);
        return;
      }

      setGenerationProgress(prev => ({
        ...prev,
        phase: 'error',
        message: `Error: ${errorMessage}`,
      }));

      if (generationProgressRef.current.bookId) {
        const retry = confirm(
          `Generation encountered an error: ${errorMessage}\n\n` +
          `Progress has been saved. Would you like to retry?`
        );
        if (retry) {
          // Resume via incremental mode with the existing book ID to avoid duplication
          handleGenerateBook(generationProgressRef.current.bookId);
          return;
        }
      } else {
        alert(`Failed to generate book: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
      setGenerationType('none');
      abortControllerRef.current = null;
      // Delay hiding modal to show final state
      setTimeout(() => {
        const finalPhase = generationProgressRef.current.phase;
        if (finalPhase === 'completed' || finalPhase === 'error') {
          // Keep modal visible for completed/error states until user action or navigation
        } else {
          setShowBookModal(false);
        }
      }, 500);
    }
  }, [outline, config, router, refreshBooks, addBookToList, handleGenerateBook]);

  // Handle generate book click - check for outline first
  const handleGenerateBookClick = useCallback(() => {
    if (!outline) {
      setShowNoOutlineConfirm(true);
      return;
    }

    // Auto-switch to incremental mode for books with >12 chapters
    // Streaming SSE connections can be killed by Railway's proxy or Node.js
    // after ~300 seconds, which is roughly the time for 12 chapters.
    // Incremental mode uses separate HTTP requests per batch and is immune to this.
    const totalChapters = outline.chapters?.length || config.content?.numChapters || 10;
    if (totalChapters > 12) {
      console.log(`[Studio] ${totalChapters} chapters requested — using incremental mode for reliability`);
      handleGenerateBook();
      return;
    }

    // Use streaming for real-time updates when enabled (for smaller books)
    if (useStreaming) {
      handleGenerateBookStreaming();
    } else {
      handleGenerateBook();
    }
  }, [outline, config, useStreaming, handleGenerateBook, handleGenerateBookStreaming]);

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
    if (!canGenerate) {
      triggerUpgradeModal('generate-outline');
      return;
    }

    // Get selected model for outline
    const outlineModel = config.aiSettings?.model || 'gpt-4o-mini';

    setIsGenerating(true);
    setGenerationType('outline');
    setShowOutlineModal(true); // Show modal immediately with stable state
    
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
      // Delay hiding modal to show completion/error state
      setTimeout(() => {
        const finalPhase = outlineProgressRef.current.phase;
        if (finalPhase === 'completed') {
          // Modal will be hidden after viewMode change
          setShowOutlineModal(false);
        } else if (finalPhase === 'error') {
          setShowOutlineModal(false);
        } else {
          setShowOutlineModal(false);
        }
      }, 1600); // Match the timeout for switching to outline view
    }
  };

  // Get current model info for display
  const currentOutlineModel = config.aiSettings?.model || 'gpt-4o-mini';
  const currentChapterModel = (config.aiSettings as any)?.chapterModel || 'anthropic/claude-sonnet-4';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Free Tier Banner */}
      <UpgradeBanner variant="full" dismissible={false} />

      {/* Page Toolbar */}
      <header className="border-b border-gray-200/80 dark:border-gray-800/60 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl sticky top-16 z-30">
        <div className="container mx-auto px-4 lg:px-6 py-3">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 dark:bg-yellow-400/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Book Studio</h1>
              </div>
              <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={() => {
                  if (config.basicInfo?.title || outline) {
                    const confirmed = confirm('Start a new book? This will clear all current configuration and outline.');
                    if (!confirmed) return;
                  }
                  resetConfig();
                  setActiveTab('prompt');
                  setViewMode('config');
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Start a new book"
              >
                <span className="text-lg leading-none">+</span> New Project
              </button>
              {/* Tier indicator */}
              {!isProUser && (
                <button
                  onClick={() => triggerUpgradeModal('generate-book')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                <Paperclip className="w-3.5 h-3.5 mr-1 inline" /> Upload
              </Button>
              {outline && (
                <>
                  <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'config' ? 'outline' : 'config')}
                  >
                    {viewMode === 'config' ? 'View Outline' : 'Back to Config'}
                  </Button>
                </>
              )}
              <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 ml-1" />
              {/* Show enabled buttons while loading or if Pro user */}
              {(isTierLoading || isProUser) ? (
                <div className="flex items-center gap-2 ml-1">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleGenerateOutline}
                    isLoading={generationType === 'outline'}
                    disabled={!config.basicInfo?.title || !config.basicInfo?.author || isGenerating || isTierLoading}
                    className="min-w-[140px]"
                  >
                    {outline ? 'Regenerate Outline' : 'Generate Outline'}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGenerateBookClick}
                    isLoading={generationType === 'book'}
                    disabled={isGenerating || isTierLoading}
                    className="min-w-[140px]"
                  >
                    Generate Book
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => triggerUpgradeModal('generate-outline')}
                    className="flex items-center gap-2 px-4 py-2 min-w-[140px] bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {outline ? 'Regenerate Outline' : 'Generate Outline'}
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                  </button>
                  <button
                    onClick={() => triggerUpgradeModal('generate-book')}
                    className="flex items-center gap-2 px-4 py-2 min-w-[140px] bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Generate Book
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-base font-semibold tracking-tight">Book Studio</h1>
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
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
                >
                  <span className="text-lg leading-none mr-1">+</span> New
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
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
                <Paperclip className="w-3.5 h-3.5 mr-1 inline" /> Upload
              </Button>
              {outline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'config' ? 'outline' : 'config')}
                >
                  {viewMode === 'config' ? 'View Outline' : 'Back to Config'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200/60 dark:border-emerald-800/30">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Configuration Auto-Populated Successfully
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/70 mt-0.5">
                    Generated sample title, description, genre, themes, and settings. Customize as needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Book Selector */}
      {selectedBooks.length > 0 && (
        <div className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200/60 dark:border-gray-800/40">
          <div className="container mx-auto px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-shrink-0">
                <Target className="w-3.5 h-3.5" /> Auto-Populate:
              </label>
              <select
                value={selectedReferenceId}
                onChange={(e) => setSelectedReferenceId(e.target.value)}
                className="flex-1 max-w-md bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/40 focus:border-yellow-500/40 transition-shadow"
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
                <Sparkles className="w-4 h-4 mr-1 inline" /> Auto-Populate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-4 md:py-6">
        {/* Mobile Tab Navigation (Horizontal Scroll) */}
        <div className="md:hidden mb-4 overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1.5 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap text-[13px] ${
                  activeTab === tab.id
                    ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 font-medium ring-1 ring-yellow-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                <span className="flex items-center opacity-70">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - Configuration Tabs (Desktop Only) */}
          <div className="hidden md:block md:col-span-3">
            <div className="sticky top-36 space-y-1">
              {/* Setup Section */}
              <div className="mb-4">
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Setup</p>
                {tabs.slice(0, 3).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 text-[13px] ${
                      activeTab === tab.id
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <span className={`flex items-center ${activeTab === tab.id ? 'text-yellow-600 dark:text-yellow-400' : 'opacity-50'}`}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Writing Section */}
              <div className="mb-4">
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Writing</p>
                {tabs.slice(3, 5).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 text-[13px] ${
                      activeTab === tab.id
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <span className={`flex items-center ${activeTab === tab.id ? 'text-yellow-600 dark:text-yellow-400' : 'opacity-50'}`}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Assets & References Section */}
              <div className="mb-4">
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Assets</p>
                {tabs.slice(5, 8).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 text-[13px] ${
                      activeTab === tab.id
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <span className={`flex items-center ${activeTab === tab.id ? 'text-yellow-600 dark:text-yellow-400' : 'opacity-50'}`}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Section */}
              <div className="mb-4">
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Advanced</p>
                {tabs.slice(8).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 text-[13px] ${
                      activeTab === tab.id
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <span className={`flex items-center ${activeTab === tab.id ? 'text-yellow-600 dark:text-yellow-400' : 'opacity-50'}`}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Reference Materials */}
              {(selectedBooks.length > 0 || uploadedReferences.length > 0) && (
                <div className="pt-4 mt-2 border-t border-gray-200/60 dark:border-gray-800/40">
                  <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">References</p>
                  <div className="space-y-2 px-1">
                    {/* Selected Books */}
                    {selectedBooks.slice(0, 2).map((book) => (
                      <div key={book.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <img
                          src={book.imageUrl || '/placeholder-cover.jpg'}
                          alt={book.title}
                          className="w-7 h-10 object-cover rounded shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{book.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">{book.authors[0]}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Uploaded References */}
                    {uploadedReferences.slice(0, 2).map((ref) => (
                      <div key={ref.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                        <div className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{ref.name}</p>
                          <p className="text-[11px] text-gray-500">{ref.type.toUpperCase()}</p>
                        </div>
                        <button
                          onClick={() => removeUploadedReference(ref.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {(selectedBooks.length + uploadedReferences.length) > 4 && (
                      <p className="text-[11px] text-gray-500 px-2">+{selectedBooks.length + uploadedReferences.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Model Info */}
              <div className="pt-4 mt-2 border-t border-gray-200/60 dark:border-gray-800/40">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">AI Models</p>
                <div className="px-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-500">Outline</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[130px] text-right">
                      {currentOutlineModel.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-500">Chapters</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[130px] text-right">
                      {currentChapterModel.split('/').pop()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className="w-full mt-2 px-3 text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors text-left"
                >
                  Configure models →
                </button>
              </div>
            </div>
          </div>

          {/* Main Panel - Configuration Forms or Outline */}
          <div className="col-span-1 md:col-span-9">
            <div className="min-h-[60vh]">
              {viewMode === 'outline' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Book Outline</h2>
                    <div className="flex items-center gap-2">
                      {(isTierLoading || isProUser) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateOutline}
                          isLoading={generationType === 'outline'}
                          disabled={!config.basicInfo?.title || !config.basicInfo?.author || isGenerating || isTierLoading}
                        >
                          Regenerate Outline
                        </Button>
                      ) : (
                        <button
                          onClick={() => triggerUpgradeModal('generate-outline')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-xs hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Regenerate Outline
                          <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded">PRO</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <OutlineEditor />
                </div>
              ) : (
                <>
                  {activeTab === 'prompt' && <SmartPrompt />}
                  {activeTab === 'basic' && <BasicInfo />}
                  {activeTab === 'content' && <ContentSettings />}
                  {activeTab === 'style' && <StylePreferences />}
                  {activeTab === 'characters' && <CharactersWorld />}
                  {activeTab === 'images' && <ImageSettings />}
                  {activeTab === 'references' && <ReferenceBooks />}
                  {activeTab === 'bibliography' && <BibliographySettings />}
                  {activeTab === 'advanced' && <AdvancedSettings />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-20">
          {isProUser ? (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={handleGenerateOutline}
                isLoading={generationType === 'outline'}
                disabled={!config.basicInfo?.title || !config.basicInfo?.author || isGenerating}
                className="shadow-lg shadow-black/10 min-w-[140px] backdrop-blur-sm"
              >
                {outline ? 'Regenerate Outline' : 'Generate Outline'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateBookClick}
                isLoading={generationType === 'book'}
                disabled={isGenerating}
                className="shadow-lg shadow-black/10 backdrop-blur-sm"
              >
                Generate Book
              </Button>
            </>
          ) : (
            <button
              onClick={() => triggerUpgradeModal('generate-book')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white rounded-lg font-medium text-sm shadow-lg shadow-purple-500/20 hover:from-purple-600 hover:to-pink-600 transition-all backdrop-blur-sm"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Generate
            </button>
          )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200/80 dark:border-gray-700/60">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
                No Outline Generated
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <Sparkles className="w-4 h-4 mr-1 inline" /> Generate Outline First
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
              <Lightbulb className="w-4 h-4 inline mr-1" /> Tip: Books with outlines typically have better structure and coherence.
            </p>
          </div>
        </div>
      )}

      {/* Outline Generation Progress Modal - Stable component to prevent flickering */}
      <OutlineGenerationModal
        isVisible={showOutlineModal && outlineProgress.phase !== 'idle'}
        progress={outlineProgress}
      />

      {/* Book Generation Progress Modal - Stable component to prevent flickering */}
      <BookGenerationModal
        isVisible={showBookModal && generationProgress.phase !== 'idle'}
        progress={generationProgress}
        onCancel={handleCancelGeneration}
        onContinue={handleGenerateBook}
      />
    </div>
  );
}

// Wrap with auth guard
export default function StudioPage() {
  return (
    <AuthGuard feature="studio">
      <StudioPageContent />
    </AuthGuard>
  );
}
