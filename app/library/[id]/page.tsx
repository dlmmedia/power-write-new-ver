'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { WorkspaceModeSwitcher } from '@/components/library/Workspace';
import { FlipBookCover } from '@/components/library/FlipBookCover';
import { getDemoUserId } from '@/lib/services/demo-account';
import { useUserTier } from '@/contexts/UserTierContext';
import { useBooks } from '@/contexts/BooksContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { BibliographyConfig, Reference } from '@/lib/types/bibliography';
import type { ProductionStatus } from '@/lib/types/generation';

// Loading skeleton components for dynamic imports
const LoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg h-64 w-full" />
);

const FullScreenLoadingSkeleton = () => (
  <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-50">
    <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
  </div>
);

// Dynamic imports for heavy components - these load on demand
const BookReader = dynamic(
  () => import('@/components/library/BookReader').then(mod => ({ default: mod.BookReader })),
  { loading: () => <FullScreenLoadingSkeleton />, ssr: false }
);

const BookEditor = dynamic(
  () => import('@/components/library/BookEditor').then(mod => ({ default: mod.BookEditor })),
  { loading: () => <FullScreenLoadingSkeleton />, ssr: false }
);

const CoverGenerator = dynamic(
  () => import('@/components/studio/CoverGenerator'),
  { loading: () => <LoadingSkeleton />, ssr: false }
);

const AudioGeneratorCompact = dynamic(
  () => import('@/components/library/AudioGeneratorCompact').then(mod => ({ default: mod.AudioGeneratorCompact })),
  { loading: () => <LoadingSkeleton />, ssr: false }
);

const BibliographyManager = dynamic(
  () => import('@/components/library/BibliographyManager').then(mod => ({ default: mod.BibliographyManager })),
  { loading: () => <LoadingSkeleton />, ssr: false }
);

const PublishingSettings = dynamic(
  () => import('@/components/library/publishing').then(mod => ({ default: mod.PublishingSettings })),
  { loading: () => <LoadingSkeleton />, ssr: false }
);

const AudiobookPlayer = dynamic(
  () => import('@/components/library/AudiobookPlayer').then(mod => ({ default: mod.AudiobookPlayer })),
  { loading: () => <FullScreenLoadingSkeleton />, ssr: false }
);

const VideoExportModal = dynamic(
  () => import('@/components/library/VideoExportModal').then(mod => ({ default: mod.VideoExportModal })),
  { loading: () => null, ssr: false }
);

import { 
  BookOpen, 
  Clock, 
  PenTool, 
  BarChart2, 
  MoreVertical, 
  Download, 
  Share2, 
  Trash2, 
  Archive, 
  Copy,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Edit3,
  Book,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Headphones,
  GripVertical,
  Lock,
  Crown,
  Sparkles,
  Globe,
  Eye,
  EyeOff,
  Save,
  X,
  Video,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
// AudiobookPlayer is dynamically imported above
import type { AudiobookChapter } from '@/components/library/AudiobookPlayer';

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
  audioTimestamps?: { word: string; start: number; end: number }[] | null;
}

interface BibliographyData {
  config: BibliographyConfig;
  references: Reference[];
}

interface BookDetail {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  status: string;
  productionStatus?: string;
  createdAt: string;
  coverUrl?: string; // Add cover URL to interface
  backCoverUrl?: string; // Add back cover URL to interface
  isPublic?: boolean; // Whether book is in public showcase
  isOwner?: boolean; // Whether current user owns this book
  metadata: {
    wordCount: number;
    chapters: number;
    targetWordCount: number;
    description: string;
    backCoverUrl?: string; // Back cover URL in metadata
    modelUsed?: string; // Model used for generation
  };
  chapters: Chapter[];
  bibliography?: BibliographyData;
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params as any)?.id;
  const bookId = typeof rawId === 'string' ? parseInt(rawId, 10) : null;
  const { isProUser, isLoading: isTierLoading, showUpgradeModal: triggerUpgradeModal } = useUserTier();
  
  // Use centralized books context for caching
  const { 
    getBookDetailFromCache, 
    fetchBookDetail: fetchBookDetailFromContext,
    updateBookDetailInCache,
    invalidateBookDetail,
  } = useBooks();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReading, setIsReading] = useState(false);
  const [initialChapterIndex, setInitialChapterIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'read' | 'edit'>('read');
  const [manageSubTab, setManageSubTab] = useState<'cover' | 'publishing' | 'settings'>('cover');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBibliography, setShowBibliography] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showAudiobookPlayer, setShowAudiobookPlayer] = useState(false);
  const [isReorderingChapters, setIsReorderingChapters] = useState(false);
  const [isTogglingShowcase, setIsTogglingShowcase] = useState(false);
  const [showVideoExportModal, setShowVideoExportModal] = useState(false);
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  
  // Author editing state
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [editedAuthor, setEditedAuthor] = useState('');
  const [isSavingAuthor, setIsSavingAuthor] = useState(false);
  
  // Synopsis editing state
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [editedSynopsis, setEditedSynopsis] = useState('');
  const [isSavingSynopsis, setIsSavingSynopsis] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = async (status: ProductionStatus) => {
    if (isUpdatingStatus || !bookId) return;
    setIsUpdatingStatus(true);
    try {
      // Assuming we'll use the generic book update endpoint
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStatus: status }),
      });
      
      if (response.ok) {
        setBook(prev => prev ? ({ ...prev, productionStatus: status }) : null);
        updateBookDetailInCache(bookId, { productionStatus: status });
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Load book - try cache first for instant display, then fetch fresh
  useEffect(() => {
    if (!bookId) return;
    
    // Try to get from cache first for instant display
    const cachedBook = getBookDetailFromCache(bookId);
    if (cachedBook) {
      setBook(cachedBook as BookDetail);
      setLoading(false);
    }
    
    // Always fetch fresh data
    fetchBookDetail();
  }, [bookId]);

  const fetchBookDetail = async () => {
    if (!bookId) return;
    
    // Only show loading if we don't have cached data
    if (!book) {
      setLoading(true);
    }
    
    try {
      // Use context's fetch which handles caching
      const fetchedBook = await fetchBookDetailFromContext(bookId, true);
      if (fetchedBook) {
        setBook(fetchedBook as BookDetail);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'epub') => {
    if (!book) return;
    
    // Check if Pro user
    if (!isProUser) {
      triggerUpgradeModal('export-book');
      return;
    }
    
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      console.log(`Starting export as ${format.toUpperCase()}...`);
      
      const response = await fetch('/api/books/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for Clerk auth
        body: JSON.stringify({
          bookId: book.id,
          format,
        }),
      });

      if (response.ok) {
        console.log(`Export successful, downloading ${format} file...`);
        
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        showToast(`Successfully exported as ${format.toUpperCase()}`);
      } else {
        // Log response details for debugging
        console.error('Export failed with status:', response.status, response.statusText);
        const contentType = response.headers.get('content-type');
        console.error('Response content-type:', contentType);
        
        let errorMessage = 'Unknown error';
        try {
          const text = await response.text();
          console.error('Response text:', text);
          
          // Try to parse as JSON
          if (contentType?.includes('application/json')) {
            const data = JSON.parse(text);
            errorMessage = data.error || data.details || 'Unknown error';
            console.error('Parsed error data:', data);
          } else {
            errorMessage = text || 'Server returned non-JSON response';
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = 'Failed to parse error response';
        }
        
        alert(`Export failed: ${errorMessage}\n\nPlease check the console for more details.`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export book as ${format.toUpperCase()}.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your connection and try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!book) return;

    const confirmed = confirm(
      'Generate audiobook for entire book?\n\n' +
      'This will convert all chapters to speech. It may take several minutes.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          bookId: book.id.toString(),
          voice: 'alloy',
          speed: 1.0,
          model: 'tts-1',
        }),
      });

      const data = await response.json();
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        alert('Audiobook generated successfully!');
      } else {
        alert('Failed to generate audio: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      alert('Failed to generate audiobook');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDeleteBook = () => {
    if (!book) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBook = async () => {
    if (!book) return;
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Book deleted successfully');
        router.push('/library');
      } else {
        alert('Failed to delete book: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete book. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveBook = async () => {
    if (!book) return;

    const isArchived = book.status === 'archived';
    const action = isArchived ? 'Unarchive' : 'Archive';
    const newStatus = isArchived ? 'completed' : 'archived';

    const confirmed = confirm(
      `${action} "${book.title}"?\n\n` +
      (isArchived 
        ? 'This will restore the book to your active library.'
        : 'This will move the book to your archived books. You can unarchive it later.') +
      '\n\nContinue?'
    );

    if (!confirmed) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Book ${action.toLowerCase()}d successfully`);
        // Refresh book data
        await fetchBookDetail();
      } else {
        alert(`Failed to ${action.toLowerCase()} book: ` + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert(`Failed to ${action.toLowerCase()} book. Please try again.`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDuplicateBook = async () => {
    if (!book) return;
    
    // Check if Pro user
    if (!isProUser) {
      triggerUpgradeModal('duplicate-book');
      return;
    }

    const confirmed = confirm(
      `Duplicate "${book.title}"?\n\n` +
      'This will create a copy of the book with all its chapters and content.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/books/${book.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getDemoUserId() }),
      });

      const data = await response.json();
      if (data.success && data.book) {
        showToast('Book duplicated successfully!');
        // Navigate to the new book
        router.push(`/library/${data.book.id}`);
      } else {
        alert('Failed to duplicate book: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate book. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleToggleShowcase = async () => {
    if (!book) return;

    // Only allow completed books to be showcased
    if (book.status !== 'completed' && !book.isPublic) {
      alert('Only completed books can be added to the showcase.');
      return;
    }

    const isCurrentlyPublic = book.isPublic;
    const action = isCurrentlyPublic ? 'Remove from' : 'Add to';

    const confirmed = confirm(
      `${action} Showcase?\n\n` +
      (isCurrentlyPublic 
        ? 'This will make your book private and remove it from the public showcase.'
        : 'This will make your book publicly visible in the showcase. Anyone can read and listen to it.') +
      '\n\nContinue?'
    );

    if (!confirmed) return;

    setIsTogglingShowcase(true);
    try {
      const response = await fetch(`/api/books/${book.id}/showcase`, {
        method: isCurrentlyPublic ? 'DELETE' : 'POST',
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Book ${isCurrentlyPublic ? 'removed from' : 'added to'} showcase successfully!`);
        // Update local state
        setBook(prev => prev ? { ...prev, isPublic: !isCurrentlyPublic } : null);
      } else {
        alert(`Failed to ${action.toLowerCase()} showcase: ` + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Showcase toggle error:', error);
      alert(`Failed to ${action.toLowerCase()} showcase. Please try again.`);
    } finally {
      setIsTogglingShowcase(false);
    }
  };

  // Handle saving edited book title
  const handleSaveTitle = async () => {
    if (!book || !editedTitle.trim()) return;
    
    // Don't save if title hasn't changed
    if (editedTitle.trim() === book.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state with new title
        setBook(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
        setIsEditingTitle(false);
      } else {
        alert('Failed to update title: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Title update error:', error);
      alert('Failed to update title. Please try again.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  // Handle saving edited author name
  const handleSaveAuthor = async () => {
    if (!book || !editedAuthor.trim()) return;
    
    // Don't save if author hasn't changed
    if (editedAuthor.trim() === book.author) {
      setIsEditingAuthor(false);
      return;
    }

    setIsSavingAuthor(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: editedAuthor.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state with new author
        setBook(prev => prev ? { ...prev, author: editedAuthor.trim() } : null);
        setIsEditingAuthor(false);
      } else {
        alert('Failed to update author: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Author update error:', error);
      alert('Failed to update author. Please try again.');
    } finally {
      setIsSavingAuthor(false);
    }
  };

  // Handle saving edited synopsis
  const handleSaveSynopsis = async () => {
    if (!book) return;
    
    // Don't save if synopsis hasn't changed
    if (editedSynopsis.trim() === (book.metadata.description || '')) {
      setIsEditingSynopsis(false);
      return;
    }

    setIsSavingSynopsis(true);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: editedSynopsis.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state with new synopsis
        setBook(prev => prev ? { 
          ...prev, 
          metadata: { ...prev.metadata, description: editedSynopsis.trim() } 
        } : null);
        setIsEditingSynopsis(false);
      } else {
        alert('Failed to update synopsis: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Synopsis update error:', error);
      alert('Failed to update synopsis. Please try again.');
    } finally {
      setIsSavingSynopsis(false);
    }
  };

  const handleMoveChapter = async (chapterId: number, direction: 'up' | 'down') => {
    if (!book || !book.chapters || book.chapters.length < 2) return;
    
    // Prevent multiple simultaneous reorder operations
    if (isReorderingChapters) return;

    const index = book.chapters.findIndex((ch) => ch.id === chapterId);
    
    // Can't find chapter or can't move first chapter up or last chapter down
    if (index === -1) return;
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === book.chapters.length - 1)
    ) {
      return;
    }

    setIsReorderingChapters(true);

    // Set a timeout fallback to ensure state always resets (safety net)
    const timeoutId = setTimeout(() => {
      setIsReorderingChapters(false);
    }, 10000); // 10 second timeout as fallback

    try {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const reorderedChapters = [...book.chapters];
      
      // Swap the chapters
      [reorderedChapters[index], reorderedChapters[newIndex]] = [
        reorderedChapters[newIndex],
        reorderedChapters[index],
      ];

      // Renumber all chapters based on their new positions
      const renumberedChapters = reorderedChapters.map((ch, idx) => ({
        ...ch,
        number: idx + 1,
      }));

      // Update local state immediately for responsive UI
      setBook((prev) => {
        if (!prev) return null;
        return { ...prev, chapters: renumberedChapters };
      });

      // Save to the API
      const response = await fetch(`/api/books/${book.id}/chapters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapters: renumberedChapters.map((ch) => ({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount,
            status: ch.status,
          })),
        }),
      });

      if (!response.ok) {
        // Read error message before reverting
        let errorMessage = 'Unknown error';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Revert on error - refresh from server
        await fetchBookDetail();
        alert('Failed to reorder chapters: ' + errorMessage);
        return; // Exit early on error, finally block will still execute
      }
      
      // Success - no need to refresh, local state is already updated
      // The reorder is saved to the server and local state is in sync
    } catch (error) {
      console.error('Reorder error:', error);
      // Revert on error
      try {
        await fetchBookDetail();
      } catch (fetchError) {
        console.error('Error fetching book detail:', fetchError);
      }
      alert('Failed to reorder chapters. Please try again.');
    } finally {
      // Clear the timeout since we're resetting manually
      clearTimeout(timeoutId);
      // Always reset the reordering state, even if there was an error
      setIsReorderingChapters(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <Link href="/library">
            <Button variant="primary">
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = (book.metadata.wordCount / book.metadata.targetWordCount) * 100;

  // Check if book has any audio
  const hasAudio = book.chapters?.some(ch => ch.audioUrl) || false;
  const chaptersWithAudio = book.chapters?.filter(ch => ch.audioUrl).length || 0;

  // Function to open the editor at a specific chapter
  const openEditorAtChapter = (chapterIndex: number) => {
    if (!isProUser) {
      triggerUpgradeModal('edit-book');
      return;
    }
    setInitialChapterIndex(chapterIndex);
    setIsEditing(true);
  };

  // Function to start immersive reading from the beginning
  const startReading = () => {
    router.push(`/library/${bookId}/read`);
  };

  // Function to open legacy reader (for fallback)
  const openLegacyReader = () => {
    setInitialChapterIndex(0);
    setIsReading(true);
  };

  // If editing mode is active, show full-screen editor
  if (isEditing && book.chapters && book.chapters.length > 0) {
    return (
      <BookEditor
        bookId={book.id}
        bookTitle={book.title}
        author={book.author}
        genre={book.genre}
        chapters={book.chapters}
        initialChapterIndex={initialChapterIndex}
        onClose={() => {
          setIsEditing(false);
          fetchBookDetail(); // Refresh book data
        }}
        onSave={(updatedChapters) => {
          // Update local state
          setBook(prev => prev ? {...prev, chapters: updatedChapters} : null);
        }}
        modelId={book.metadata.modelUsed}
      />
    );
  }

  // If reading mode is active, show full-screen reader
  if (isReading && book.chapters && book.chapters.length > 0) {
    return (
      <BookReader
        bookTitle={book.title}
        author={book.author}
        bookId={book.id}
        chapters={book.chapters}
        initialChapterIndex={initialChapterIndex}
        bibliography={book.bibliography}
        onClose={() => {
          setIsReading(false);
          // Refresh book data to get any newly generated audio
          fetchBookDetail();
        }}
        onEdit={() => {
          // Switch from reading to editing mode (Pro only)
          if (!isProUser) {
            triggerUpgradeModal('edit-book');
            return;
          }
          setIsReading(false);
          setIsEditing(true);
        }}
        onAudioGenerated={(chapterNumber, audioUrl, duration) => {
          // Update local state immediately when audio is generated in reader
          if (book) {
            const updatedChapters = book.chapters.map(ch => 
              ch.number === chapterNumber 
                ? { ...ch, audioUrl, audioDuration: duration }
                : ch
            );
            setBook({ ...book, chapters: updatedChapters });
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors">
      {/* Page Toolbar */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-16 z-30" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)', boxShadow: 'var(--shadow-header)' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/library"
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/40 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/50 dark:hover:to-amber-900/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Library
              </Link>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-header)' }}>{book.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Tier Badge */}
              {isProUser ? (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                  <Crown className="w-3 h-3" />
                  Pro
                </span>
              ) : (
                <button
                  onClick={() => triggerUpgradeModal()}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Upgrade
                </button>
              )}
              <div className="relative">
                {/* Pro users always see enabled export button - API handles ownership check */}
                {isProUser ? (
                  <DropdownMenu.Root open={showExportMenu} onOpenChange={setShowExportMenu}>
                    <DropdownMenu.Trigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={isExporting}
                        className="flex items-center gap-2"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Export
                          </>
                        )}
                      </Button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        className="min-w-[220px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                        sideOffset={5}
                        align="end"
                      >
                        <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Export As
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator className="h-px bg-gray-200 dark:border-gray-700 my-1" />
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('pdf')}
                        >
                          <FileText className="w-4 h-4 text-red-500" />
                          PDF Document
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('docx')}
                        >
                          <FileText className="w-4 h-4 text-blue-500" />
                          Word (DOCX)
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('epub')}
                        >
                          <Book className="w-4 h-4 text-orange-500" />
                          EPUB (Kindle/KDP)
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator className="h-px bg-gray-200 dark:border-gray-700 my-1" />
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('html')}
                        >
                          <code className="w-4 h-4 flex items-center justify-center font-bold text-green-500">&lt;/&gt;</code>
                          HTML
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('md')}
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          Markdown
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => handleExport('txt')}
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          Plain Text
                        </DropdownMenu.Item>
                        
                        <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                        
                        <DropdownMenu.Item 
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors text-sm text-gray-900 dark:text-white font-medium flex items-center gap-3 outline-none cursor-pointer"
                          onSelect={() => setShowVideoExportModal(true)}
                        >
                          <Video className="w-4 h-4 text-purple-500" />
                          Video (with Audio)
                          <span className="ml-auto text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                ) : isTierLoading ? (
                  // Show loading state while checking tier
                  <Button 
                    variant="outline" 
                    disabled
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 opacity-50" />
                    Export
                  </Button>
                ) : (
                  // Free user - show upgrade prompt
                  <button
                    onClick={() => triggerUpgradeModal('export-book')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    Export
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PRO</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'workspace', label: 'Read & Edit' },
            { id: 'audio', label: 'Audio' },
            { id: 'manage', label: 'Manage' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Section — clean, editorial layout */}
              <motion.div 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative overflow-hidden bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)]"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--accent)] via-amber-500 to-[var(--accent)]" />
                
                <div className="p-6 md:p-10">
                  <div className="flex flex-col lg:flex-row gap-10">
                    {/* Book Cover */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 self-center lg:self-start"
                    >
                      <FlipBookCover
                        title={book.title}
                        author={book.author}
                        coverUrl={book.coverUrl}
                        backCoverUrl={book.backCoverUrl || book.metadata.backCoverUrl}
                        genre={book.genre}
                        subgenre={book.subgenre}
                        wordCount={book.metadata.wordCount}
                        chapters={book.metadata.chapters}
                        description={book.metadata.description}
                        status={book.status}
                        createdAt={book.createdAt}
                      />
                    </motion.div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0 space-y-6">
                      {/* Title & Author */}
                      <div>
                        {/* Editable Title */}
                        {isEditingTitle ? (
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="flex-1 text-2xl md:text-3xl font-bold px-3 py-2 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                              placeholder="Enter book title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') {
                                  setIsEditingTitle(false);
                                  setEditedTitle(book.title);
                                }
                              }}
                            />
                            <button
                              onClick={handleSaveTitle}
                              disabled={isSavingTitle || !editedTitle.trim()}
                              className="p-2.5 text-[var(--success)] hover:bg-[var(--success-light)] rounded-lg transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {isSavingTitle ? <span className="animate-spin">&#9203;</span> : <Save className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingTitle(false);
                                setEditedTitle(book.title);
                              }}
                              disabled={isSavingTitle}
                              className="p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group flex items-baseline gap-3 mb-1"
                          >
                            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                              {book.title}
                            </h2>
                            <button
                              onClick={() => {
                                setEditedTitle(book.title);
                                setIsEditingTitle(true);
                              }}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-surface)] rounded-md"
                              title="Edit title"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                        
                        {/* Editable Author */}
                        {isEditingAuthor ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base text-[var(--text-secondary)]">by</span>
                            <input
                              type="text"
                              value={editedAuthor}
                              onChange={(e) => setEditedAuthor(e.target.value)}
                              className="flex-1 text-base px-3 py-1.5 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-lg text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                              placeholder="Enter author name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAuthor();
                                if (e.key === 'Escape') {
                                  setIsEditingAuthor(false);
                                  setEditedAuthor(book.author);
                                }
                              }}
                            />
                            <button
                              onClick={handleSaveAuthor}
                              disabled={isSavingAuthor || !editedAuthor.trim()}
                              className="p-2 text-[var(--success)] hover:bg-[var(--success-light)] rounded-lg transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {isSavingAuthor ? <span className="animate-spin">&#9203;</span> : <Save className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingAuthor(false);
                                setEditedAuthor(book.author);
                              }}
                              disabled={isSavingAuthor}
                              className="p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="group flex items-center gap-2"
                          >
                            <p className="text-base text-[var(--text-secondary)]">by <span className="font-medium">{book.author}</span></p>
                            <button
                              onClick={() => {
                                setEditedAuthor(book.author);
                                setIsEditingAuthor(true);
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-surface)] rounded-md"
                              title="Edit author"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                        
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-[var(--text-muted)] mt-2"
                        >
                          Created {new Date(book.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </motion.p>
                      </div>

                      {/* Stats Row — clean card grid */}
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                      >
                        <div className="flex flex-col items-center gap-1 px-4 py-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                          <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                          <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            <AnimatedNumber value={book.metadata.chapters} />
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Chapters</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4 py-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                          <FileText className="w-4 h-4 text-[var(--info)]" />
                          <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            <AnimatedNumber value={book.metadata.wordCount} format="locale" />
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Words</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4 py-3 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                            ~<AnimatedNumber value={Math.ceil(book.metadata.wordCount / 200)} />
                          </span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Min Read</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 px-4 py-3 bg-[var(--accent-surface)] rounded-xl border border-[var(--accent)]/20">
                          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                          <span className="text-sm font-bold text-[var(--accent-text)]">{book.genre}</span>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Genre</span>
                        </div>
                      </motion.div>

                      {/* Synopsis */}
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pt-5 border-t border-[var(--border)]"
                      >
                        <div className="group flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Synopsis</h4>
                          {!isEditingSynopsis && (
                            <button
                              onClick={() => {
                                setEditedSynopsis(book.metadata.description || '');
                                setIsEditingSynopsis(true);
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-surface)] rounded-md"
                              title="Edit synopsis"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {isEditingSynopsis ? (
                          <div className="space-y-3">
                            <textarea
                              value={editedSynopsis}
                              onChange={(e) => setEditedSynopsis(e.target.value)}
                              className="w-full px-4 py-3 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-xl text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y min-h-[100px]"
                              placeholder="Enter book synopsis..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setIsEditingSynopsis(false);
                                  setEditedSynopsis(book.metadata.description || '');
                                }
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveSynopsis}
                                disabled={isSavingSynopsis}
                                leftIcon={isSavingSynopsis ? undefined : <Save className="w-3.5 h-3.5" />}
                                isLoading={isSavingSynopsis}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsEditingSynopsis(false);
                                  setEditedSynopsis(book.metadata.description || '');
                                }}
                                disabled={isSavingSynopsis}
                                leftIcon={<X className="w-3.5 h-3.5" />}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                            {book.metadata.description || <span className="italic text-[var(--text-muted)]">Click edit to add a synopsis...</span>}
                          </p>
                        )}
                      </motion.div>

                      {/* Primary CTA */}
                      {book.chapters && book.chapters.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="pt-2"
                        >
                          <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={startReading} 
                            className="w-full sm:w-auto shadow-lg shadow-[var(--accent)]/20"
                            leftIcon={<Book className="w-5 h-5" />}
                          >
                            Start Reading
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Chapters Preview — table-like clean list */}
              {book.chapters && book.chapters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border)]">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                        Chapter Preview
                      </h3>
                      <p className="text-sm text-[var(--text-muted)] mt-0.5">
                        Showing first {Math.min(3, book.chapters.length)} of {book.chapters.length} chapters
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('workspace')} rightIcon={<ChevronLeft className="w-4 h-4 rotate-180" />}>
                      View All
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {book.chapters.slice(0, 3).map((chapter, idx) => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
                        onClick={() => openEditorAtChapter(idx)}
                      >
                        {/* Chapter number badge */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-surface)] flex items-center justify-center">
                          <span className="text-sm font-bold text-[var(--accent-text)] tabular-nums">{chapter.number}</span>
                        </div>
                        
                        {/* Chapter details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">{chapter.title}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[var(--text-muted)]">
                              {chapter.wordCount.toLocaleString()} words
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              ~{Math.ceil(chapter.wordCount / 200)} min
                            </span>
                          </div>
                          {chapter.content && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1 italic">
                              {chapter.content.substring(0, 150)}...
                            </p>
                          )}
                        </div>

                        {/* Reorder controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveChapter(chapter.id, 'up');
                            }}
                            disabled={chapter.number === 1 || isReorderingChapters}
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveChapter(chapter.id, 'down');
                            }}
                            disabled={chapter.number === book.chapters.length || isReorderingChapters}
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronLeft className="w-4 h-4 rotate-180 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-6">
              {/* Header bar with mode toggle and chapter count */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] p-4"
              >
                <div className="flex items-center gap-4">
                  <WorkspaceModeSwitcher 
                    mode={workspaceMode} 
                    onChange={(newMode) => {
                      if (newMode === 'read') {
                        setWorkspaceMode(newMode);
                        setInitialChapterIndex(0);
                        setIsReading(true);
                      } else {
                        if (!isProUser) {
                          triggerUpgradeModal('edit-book');
                          return;
                        }
                        setWorkspaceMode(newMode);
                        setIsEditing(true);
                      }
                    }} 
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--background-secondary)] rounded-md border border-[var(--border)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    {book.chapters?.length || 0} chapters
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--background-secondary)] rounded-md border border-[var(--border)]">
                    <FileText className="w-3.5 h-3.5" />
                    {book.metadata.wordCount.toLocaleString()} words
                  </span>
                </div>
              </motion.div>

              {/* Chapter List */}
              {book.chapters && book.chapters.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  <div className="divide-y divide-[var(--border)]">
                    {book.chapters.map((chapter, idx) => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
                        onClick={() => openEditorAtChapter(idx)}
                      >
                        {/* Reorder controls — appear on hover */}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveChapter(chapter.id, 'up');
                            }}
                            disabled={chapter.number === 1 || isReorderingChapters}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-surface)] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveChapter(chapter.id, 'down');
                            }}
                            disabled={chapter.number === book.chapters.length || isReorderingChapters}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-surface)] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Chapter number */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-surface)] flex items-center justify-center border border-[var(--accent)]/15">
                          <span className="text-sm font-bold text-[var(--accent-text)] tabular-nums">{chapter.number}</span>
                        </div>

                        {/* Chapter info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                            {chapter.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[var(--text-muted)]">{chapter.wordCount.toLocaleString()} words</span>
                            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                            <span className="text-xs text-[var(--text-muted)]">~{Math.ceil(chapter.wordCount / 200)} min read</span>
                          </div>
                          {chapter.content && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1.5 italic leading-relaxed">
                              &ldquo;{chapter.content.substring(0, 200).trim()}&hellip;&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronLeft className="w-4 h-4 rotate-180 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)]"
                >
                  <div className="mb-5 flex justify-center">
                    <div className="bg-[var(--background-tertiary)] p-5 rounded-2xl">
                      <PenTool className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                  </div>
                  <p className="text-[var(--text-primary)] text-lg font-semibold mb-1.5">No chapters yet</p>
                  <p className="text-[var(--text-muted)] text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                    Generate your book in the Studio to create chapters that will appear here.
                  </p>
                  <Button variant="primary" onClick={() => router.push('/studio')} leftIcon={<Sparkles className="w-4 h-4" />}>
                    Go to Studio
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Sub-navigation — segmented control style */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] p-1.5 inline-flex gap-1"
              >
                {([
                  { id: 'cover' as const, label: 'Cover', icon: <Edit3 className="w-4 h-4" /> },
                  { id: 'publishing' as const, label: 'Publishing', icon: <FileText className="w-4 h-4" /> },
                  { id: 'settings' as const, label: 'Settings', icon: <Activity className="w-4 h-4" /> },
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setManageSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      manageSubTab === tab.id
                        ? 'bg-[var(--accent)] text-[var(--text-inverse)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </motion.div>

              {/* Cover Sub-tab */}
              {manageSubTab === 'cover' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-[var(--border)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
                      <Edit3 className="w-5 h-5 text-[var(--accent)]" />
                      Book Cover
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Generate and manage AI-powered covers for your book
                    </p>
                  </div>
                  <div className="p-6">
                    {isProUser ? (
                      <CoverGenerator
                        bookId={book.id}
                        title={book.title}
                        author={book.author}
                        genre={book.genre}
                        description={book.metadata.description || ''}
                        targetAudience="General"
                        themes={[]}
                        currentCoverUrl={book.coverUrl}
                        currentBackCoverUrl={book.backCoverUrl || book.metadata.backCoverUrl}
                        onCoverGenerated={(coverUrl, metadata) => {
                          setBook(prev => prev ? { ...prev, coverUrl } : null);
                          alert('Front cover generated successfully!');
                        }}
                        onBackCoverGenerated={(backCoverUrl, metadata) => {
                          setBook(prev => prev ? { 
                            ...prev, 
                            backCoverUrl,
                            metadata: { ...prev.metadata, backCoverUrl }
                          } : null);
                          alert('Back cover generated successfully!');
                        }}
                      />
                    ) : (
                      <div className="text-center py-16">
                        <div className="mb-6">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Lock className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">Cover Generation</h4>
                        <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                          Upgrade to Pro to generate beautiful AI-powered book covers for your books.
                        </p>
                        <button
                          onClick={() => triggerUpgradeModal('generate-cover')}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro
                        </button>
                        
                        {book.coverUrl && (
                          <div className="mt-10 pt-8 border-t border-[var(--border)]">
                            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">Current Cover</p>
                            <div className="w-44 h-64 mx-auto rounded-xl overflow-hidden shadow-[var(--shadow-md)] border border-[var(--border)]">
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Publishing Sub-tab */}
              {manageSubTab === 'publishing' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isProUser ? (
                    <PublishingSettings
                      bookId={book.id}
                      bookTitle={book.title}
                      onSave={() => {
                        fetchBookDetail();
                      }}
                    />
                  ) : (
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] p-10 text-center">
                      <div className="mb-5">
                        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <Lock className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">Publishing Settings</h4>
                      <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                        Configure typography, margins, trim size, and export your book for publishing.
                      </p>
                      <button
                        onClick={() => triggerUpgradeModal('publishing-settings')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Pro
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings Sub-tab */}
              {manageSubTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Public Showcase — toggle card */}
                  <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--accent-surface)] flex items-center justify-center">
                          <Globe className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)]">Public Showcase</h4>
                          <p className="text-sm text-[var(--text-muted)] mt-0.5">
                            Share your book publicly in our showcase
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleShowcase}
                        disabled={isTogglingShowcase}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 ${
                          book.isPublic
                            ? 'bg-[var(--success)]'
                            : 'bg-[var(--background-tertiary)]'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            book.isPublic ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {book.isPublic && (
                      <div className="mt-3 ml-15 pl-4 border-l-2 border-[var(--success)]/30">
                        <p className="text-xs text-[var(--success)] font-medium flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Visible in public showcase
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Book Information */}
                  <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[var(--border)]">
                      <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[var(--accent)]" />
                        Book Information
                      </h4>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {/* Production Status */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                          Production Status
                        </label>
                        <select
                          value={book.productionStatus || 'draft'}
                          onChange={(e) => handleStatusChange(e.target.value as ProductionStatus)}
                          disabled={isUpdatingStatus}
                          className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 transition-colors"
                        >
                          <option value="draft">Draft</option>
                          <option value="in-progress">In Progress</option>
                          <option value="content-complete">Content Complete</option>
                          <option value="audio-pending">Audio Pending</option>
                          <option value="published">Published</option>
                        </select>
                        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                          Track where you are in your writing process.
                        </p>
                      </div>

                      <div className="border-t border-[var(--border-subtle)]" />

                      {/* Title Field */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                          Book Title
                        </label>
                        {isEditingTitle ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="flex-1 px-3.5 py-2.5 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                              placeholder="Enter book title"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') {
                                  setIsEditingTitle(false);
                                  setEditedTitle(book.title);
                                }
                              }}
                            />
                            <Button variant="primary" size="sm" onClick={handleSaveTitle} disabled={isSavingTitle || !editedTitle.trim()} isLoading={isSavingTitle} leftIcon={!isSavingTitle ? <Save className="w-3.5 h-3.5" /> : undefined}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setIsEditingTitle(false); setEditedTitle(book.title); }} disabled={isSavingTitle}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex-1 px-3.5 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm">
                              {book.title}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => { setEditedTitle(book.title); setIsEditingTitle(true); }} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Author Field */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                          Author
                        </label>
                        {isEditingAuthor ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedAuthor}
                              onChange={(e) => setEditedAuthor(e.target.value)}
                              className="flex-1 px-3.5 py-2.5 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                              placeholder="Enter author name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAuthor();
                                if (e.key === 'Escape') {
                                  setIsEditingAuthor(false);
                                  setEditedAuthor(book.author);
                                }
                              }}
                            />
                            <Button variant="primary" size="sm" onClick={handleSaveAuthor} disabled={isSavingAuthor || !editedAuthor.trim()} isLoading={isSavingAuthor} leftIcon={!isSavingAuthor ? <Save className="w-3.5 h-3.5" /> : undefined}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setIsEditingAuthor(false); setEditedAuthor(book.author); }} disabled={isSavingAuthor}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="flex-1 px-3.5 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm">
                              {book.author}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => { setEditedAuthor(book.author); setIsEditingAuthor(true); }} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Synopsis Field */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                          Synopsis
                        </label>
                        {isEditingSynopsis ? (
                          <div className="space-y-2.5">
                            <textarea
                              value={editedSynopsis}
                              onChange={(e) => setEditedSynopsis(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-[var(--input-bg)] border-2 border-[var(--accent)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y min-h-[120px] leading-relaxed"
                              placeholder="Enter book synopsis..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setIsEditingSynopsis(false);
                                  setEditedSynopsis(book.metadata.description || '');
                                }
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <Button variant="primary" size="sm" onClick={handleSaveSynopsis} disabled={isSavingSynopsis} isLoading={isSavingSynopsis} leftIcon={!isSavingSynopsis ? <Save className="w-3.5 h-3.5" /> : undefined}>
                                Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setIsEditingSynopsis(false); setEditedSynopsis(book.metadata.description || ''); }} disabled={isSavingSynopsis}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <span className="flex-1 px-3.5 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm whitespace-pre-wrap min-h-[60px] leading-relaxed">
                              {book.metadata.description || <span className="text-[var(--text-muted)] italic">No synopsis added</span>}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => { setEditedSynopsis(book.metadata.description || ''); setIsEditingSynopsis(true); }} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Genre (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                          Genre
                        </label>
                        <span className="block px-3.5 py-2.5 bg-[var(--background-tertiary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-muted)] text-sm">
                          {book.genre}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--error)]/20 shadow-[var(--shadow-sm)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--error)]/10 bg-[var(--error-light)]/30">
                      <h4 className="text-sm font-semibold text-[var(--error)] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Danger Zone
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {/* Duplicate */}
                        <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Duplicate Book</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Create an identical copy of this book</p>
                          </div>
                          {isProUser ? (
                            <Button variant="outline" size="sm" onClick={handleDuplicateBook} disabled={isDuplicating} isLoading={isDuplicating} leftIcon={!isDuplicating ? <Copy className="w-3.5 h-3.5" /> : undefined}>
                              Duplicate
                            </Button>
                          ) : (
                            <button
                              onClick={() => triggerUpgradeModal('duplicate-book')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              Pro
                            </button>
                          )}
                        </div>
                        
                        {/* Archive */}
                        <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Archive Book</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Move this book to your archive</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleArchiveBook} disabled={isArchiving} isLoading={isArchiving} leftIcon={!isArchiving ? <Archive className="w-3.5 h-3.5" /> : undefined}>
                            Archive
                          </Button>
                        </div>
                        
                        {/* Delete */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--error)]">Delete Book</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Permanently delete this book and all its data</p>
                          </div>
                          <Button variant="danger" size="sm" onClick={handleDeleteBook} disabled={isDeleting} isLoading={isDeleting} leftIcon={!isDeleting ? <Trash2 className="w-3.5 h-3.5" /> : undefined}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'audio' && book.chapters && book.chapters.length > 0 && (
            <div className="space-y-3">
              {/* Audiobook Player Link - Compact */}
              {hasAudio && (
                <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-xl border border-green-500/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Listen to Your Audiobook</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {chaptersWithAudio} of {book.chapters.length} chapters ready
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => router.push(`/library/${book.id}/listen`)}
                      className="flex items-center gap-2"
                    >
                      <Headphones className="w-4 h-4" />
                      Listen Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Audio Generation - Pro only */}
              {isProUser ? (
                <AudioGeneratorCompact
                  bookId={book.id}
                  bookTitle={book.title}
                  chapters={book.chapters}
                  userId={getDemoUserId()}
                  onAudioGenerated={(data) => {
                    if (data.type === 'full') {
                      setAudioUrl(data.audioUrl);
                    }
                    // Refresh book data to show new audio
                    fetchBookDetail();
                  }}
                />
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Audio Generation is a Pro Feature</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Upgrade to Pro to generate AI narration.
                        {hasAudio && ' You can still listen to existing audio.'}
                      </p>
                    </div>
                    <button
                      onClick={() => triggerUpgradeModal('generate-audio')}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center gap-2 flex-shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (!book.chapters || book.chapters.length === 0) && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                No chapters available. Please generate your book first.
              </p>
            </div>
          )}

          {activeTab === 'publishing' && (
            isProUser ? (
              <PublishingSettings
                bookId={book.id}
                bookTitle={book.title}
                onSave={() => {
                  showToast('Publishing settings saved successfully!');
                }}
              />
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Publishing Settings is a Pro Feature</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Upgrade to Pro to access publishing settings and prepare your book for distribution.
                </p>
                <button
                  onClick={() => triggerUpgradeModal('publishing-settings')}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Upgrade to Pro
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Bibliography Manager Modal */}
      {showBibliography && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-auto">
            <BibliographyManager
              bookId={book.id}
              userId={getDemoUserId()}
              onClose={() => setShowBibliography(false)}
            />
          </div>
        </div>
      )}

      {/* Audiobook Player Modal */}
      {showAudiobookPlayer && book.chapters && (
        <AudiobookPlayer
          bookId={book.id}
          bookTitle={book.title}
          author={book.author}
          coverUrl={book.coverUrl}
          chapters={book.chapters.map(ch => ({
            id: ch.id,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount,
            audioUrl: ch.audioUrl,
            audioDuration: ch.audioDuration,
            audioMetadata: ch.audioMetadata,
            audioTimestamps: ch.audioTimestamps,
          }))}
          onClose={() => {
            setShowAudiobookPlayer(false);
            // Refresh book data in case progress was updated
            fetchBookDetail();
          }}
          isModal={true}
        />
      )}

      {/* Video Export Modal */}
      {showVideoExportModal && book.chapters && (
        <VideoExportModal
          isOpen={showVideoExportModal}
          onClose={() => setShowVideoExportModal(false)}
          bookId={book.id}
          bookTitle={book.title}
          chapters={book.chapters.map(ch => ({
            id: ch.id,
            chapterNumber: ch.number,
            title: ch.title,
            audioUrl: ch.audioUrl,
          }))}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/80 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl shadow-lg backdrop-blur-sm">
            <Check className="w-4 h-4 inline mr-1" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
            <div className="text-center mb-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
              Delete &ldquo;{book.title}&rdquo;?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              This action cannot be undone. All chapters, audio, and associated data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBook}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
