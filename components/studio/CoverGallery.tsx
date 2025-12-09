'use client';

import { useState, useEffect } from 'react';
import { 
  Images, 
  Check, 
  Trash2, 
  Download, 
  Star, 
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  RotateCcw,
  Upload,
  Sparkles
} from 'lucide-react';

interface CoverGalleryItem {
  id: number;
  bookId: number;
  coverUrl: string;
  coverType: 'front' | 'back';
  thumbnailUrl?: string;
  isSelected: boolean;
  generationSettings?: any;
  imageModel?: string;
  prompt?: string;
  source: 'generated' | 'uploaded';
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

interface CoverGalleryProps {
  bookId: number;
  coverType?: 'front' | 'back' | 'all';
  onCoverSelect?: (coverUrl: string, coverId: number) => void;
  currentCoverUrl?: string;
  compact?: boolean;
}

export default function CoverGallery({
  bookId,
  coverType = 'all',
  onCoverSelect,
  currentCoverUrl,
  compact = false,
}: CoverGalleryProps) {
  const [covers, setCovers] = useState<CoverGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverGalleryItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingMainId, setSettingMainId] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

  // Fetch covers on mount and when bookId changes
  useEffect(() => {
    fetchCovers();
  }, [bookId, coverType]);

  const fetchCovers = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = coverType !== 'all' ? `?type=${coverType}` : '';
      const response = await fetch(`/api/books/${bookId}/covers${typeParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch covers');
      }

      setCovers(data.covers || []);
      
      // Show message if table doesn't exist yet
      if (data.message && data.message.includes('not yet created')) {
        setError('Cover gallery feature requires database migration. New covers will be saved once the migration is run.');
      }
    } catch (err) {
      console.error('Error fetching covers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load covers';
      // Make the error message more user-friendly
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        setError('Cover gallery feature requires database migration. Please run the migration SQL to enable this feature.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsMain = async (coverId: number) => {
    setSettingMainId(coverId);
    try {
      const response = await fetch(`/api/books/${bookId}/covers/${coverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setAsMain: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set as main cover');
      }

      // Update local state
      setCovers(prev => prev.map(c => ({
        ...c,
        isSelected: c.id === coverId && c.coverType === data.cover.coverType,
      })));

      // Notify parent if callback provided
      if (onCoverSelect && data.cover) {
        onCoverSelect(data.cover.coverUrl, coverId);
      }
    } catch (err) {
      console.error('Error setting main cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to set main cover');
    } finally {
      setSettingMainId(null);
    }
  };

  const handleDelete = async (coverId: number) => {
    if (!confirm('Are you sure you want to delete this cover? This cannot be undone.')) {
      return;
    }

    setDeletingId(coverId);
    try {
      const response = await fetch(`/api/books/${bookId}/covers/${coverId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete cover');
      }

      // Remove from local state
      setCovers(prev => prev.filter(c => c.id !== coverId));
      
      // Close lightbox if viewing deleted cover
      if (lightboxOpen && covers[lightboxIndex]?.id === coverId) {
        setLightboxOpen(false);
      }
    } catch (err) {
      console.error('Error deleting cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete cover');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (cover: CoverGalleryItem) => {
    const link = document.createElement('a');
    link.href = cover.coverUrl;
    link.download = cover.fileName || `cover-${cover.coverType}-${cover.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const filteredCovers = getFilteredCovers();
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev === 0 ? filteredCovers.length - 1 : prev - 1));
    } else {
      setLightboxIndex(prev => (prev === filteredCovers.length - 1 ? 0 : prev + 1));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getFilteredCovers = () => {
    if (coverType === 'all') {
      return covers.filter(c => c.coverType === activeTab);
    }
    return covers;
  };

  const frontCovers = covers.filter(c => c.coverType === 'front');
  const backCovers = covers.filter(c => c.coverType === 'back');
  const filteredCovers = getFilteredCovers();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 dark:text-yellow-400" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading cover gallery...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchCovers}
          className="mt-2 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (covers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-center py-8">
          <Images className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            No covers yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Generate or upload your first cover to start building your gallery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Images className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
          Cover Gallery
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({covers.length} {covers.length === 1 ? 'cover' : 'covers'})
          </span>
        </h3>
        <button
          onClick={fetchCovers}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Refresh gallery"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab selector for front/back covers when showing all */}
      {coverType === 'all' && (
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab('front')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'front'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Front Covers ({frontCovers.length})
          </button>
          <button
            onClick={() => setActiveTab('back')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'back'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Back Covers ({backCovers.length})
          </button>
        </div>
      )}

      {/* Cover Grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {filteredCovers.map((cover, index) => (
          <div
            key={cover.id}
            className={`group relative bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all ${
              cover.isSelected
                ? 'border-amber-500 dark:border-yellow-400 ring-2 ring-amber-500/20 dark:ring-yellow-400/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {/* Cover Image */}
            <div 
              className="aspect-[2/3] cursor-pointer overflow-hidden"
              onClick={() => openLightbox(index)}
            >
              <img
                src={cover.thumbnailUrl || cover.coverUrl}
                alt={`${cover.coverType} cover`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Selected Badge */}
            {cover.isSelected && (
              <div className="absolute top-2 left-2 bg-amber-500 dark:bg-yellow-400 text-white dark:text-black px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                Main
              </div>
            )}

            {/* Source Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
              cover.source === 'generated'
                ? 'bg-purple-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {cover.source === 'generated' ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Info & Actions */}
            <div className="p-3 space-y-2">
              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDate(cover.createdAt)}
              </div>

              {/* Model info */}
              {cover.imageModel && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {cover.imageModel}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1">
                {!cover.isSelected && (
                  <button
                    onClick={() => handleSetAsMain(cover.id)}
                    disabled={settingMainId === cover.id}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      settingMainId === cover.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500/10 text-amber-600 dark:text-yellow-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {settingMainId === cover.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Set Main
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleDownload(cover)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(cover.id)}
                  disabled={deletingId === cover.id}
                  className={`p-1.5 rounded-lg transition-colors ${
                    deletingId === cover.id
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title="Delete"
                >
                  {deletingId === cover.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && filteredCovers[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation buttons */}
          {filteredCovers.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image */}
          <div 
            className="max-w-3xl max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredCovers[lightboxIndex].coverUrl}
              alt="Cover preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            
            {/* Info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm opacity-70">
                    {lightboxIndex + 1} of {filteredCovers.length}
                  </p>
                  <p className="text-xs opacity-50">
                    {formatDate(filteredCovers[lightboxIndex].createdAt)}
                    {filteredCovers[lightboxIndex].imageModel && (
                      <span> • {filteredCovers[lightboxIndex].imageModel}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!filteredCovers[lightboxIndex].isSelected && (
                    <button
                      onClick={() => handleSetAsMain(filteredCovers[lightboxIndex].id)}
                      disabled={settingMainId === filteredCovers[lightboxIndex].id}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      {settingMainId === filteredCovers[lightboxIndex].id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Set as Main
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(filteredCovers[lightboxIndex])}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

