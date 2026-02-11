'use client';

import { useEffect, useRef, memo } from 'react';
import { Search, Ruler, Pencil, CheckCircle, XCircle, Library, PenTool, Palette, AlertTriangle, Sparkles, Zap, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Progress state for book generation
export interface GenerationProgress {
  phase: 'idle' | 'creating' | 'generating' | 'cover' | 'completed' | 'error';
  bookId?: number;
  chaptersCompleted: number;
  totalChapters: number;
  progress: number;
  message: string;
  currentBatch?: number[];
  batchDuration?: string;
  totalWords?: number;
  isParallel?: boolean;
  modelUsed?: string;
}

// Outline generation progress state
export interface OutlineProgress {
  phase: 'idle' | 'analyzing' | 'structuring' | 'detailing' | 'completed' | 'error';
  progress: number;
  message: string;
}

interface OutlineGenerationModalProps {
  isVisible: boolean;
  progress: OutlineProgress;
}

interface BookGenerationModalProps {
  isVisible: boolean;
  progress: GenerationProgress;
  onCancel: () => void;
  onContinue: () => void;
}

// Memoized Outline Generation Modal - won't re-render unless props actually change
export const OutlineGenerationModal = memo(function OutlineGenerationModal({
  isVisible,
  progress,
}: OutlineGenerationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      style={{ willChange: 'opacity' }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Animated rings - use CSS animation with will-change for GPU acceleration */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-yellow-200 dark:border-yellow-900 animate-ping opacity-20"
              style={{ willChange: 'transform, opacity' }}
            />
            <div 
              className="absolute inset-2 rounded-full border-4 border-yellow-300 dark:border-yellow-800 animate-ping opacity-30"
              style={{ animationDelay: '0.2s', willChange: 'transform, opacity' }}
            />
            <div 
              className="absolute inset-4 rounded-full border-4 border-yellow-400 dark:border-yellow-700 animate-ping opacity-40"
              style={{ animationDelay: '0.4s', willChange: 'transform, opacity' }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="animate-bounce" style={{ willChange: 'transform' }}>
                {progress.phase === 'analyzing' && <Search className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'structuring' && <Ruler className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'detailing' && <Pencil className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'completed' && <CheckCircle className="w-10 h-10 text-green-500" />}
                {progress.phase === 'error' && <XCircle className="w-10 h-10 text-red-500" />}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {progress.phase === 'analyzing' && 'Analyzing Configuration'}
            {progress.phase === 'structuring' && 'Structuring Chapters'}
            {progress.phase === 'detailing' && 'Adding Details'}
            {progress.phase === 'completed' && 'Outline Complete!'}
            {progress.phase === 'error' && 'Generation Failed'}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                progress.phase === 'error' 
                  ? 'bg-red-500' 
                  : progress.phase === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
              }`}
              style={{ width: `${progress.progress}%`, willChange: 'width' }}
            />
          </div>
        </div>

        {/* Status Steps */}
        <div className="space-y-2 mb-6">
          <div className={`flex items-center gap-3 ${progress.phase === 'analyzing' || progress.progress >= 30 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress.progress >= 30 ? 'bg-green-500 text-white' : 
              progress.phase === 'analyzing' ? 'bg-yellow-400 text-black animate-pulse' : 
              'bg-gray-200 dark:bg-gray-700'
            }`}>
              {progress.progress >= 30 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span>Analyze book configuration</span>
          </div>
          <div className={`flex items-center gap-3 ${progress.phase === 'structuring' || progress.progress >= 65 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress.progress >= 65 ? 'bg-green-500 text-white' : 
              progress.phase === 'structuring' ? 'bg-yellow-400 text-black animate-pulse' : 
              'bg-gray-200 dark:bg-gray-700'
            }`}>
              {progress.progress >= 65 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span>Structure chapter flow</span>
          </div>
          <div className={`flex items-center gap-3 ${progress.phase === 'detailing' || progress.phase === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              progress.phase === 'completed' ? 'bg-green-500 text-white' : 
              progress.phase === 'detailing' ? 'bg-yellow-400 text-black animate-pulse' : 
              'bg-gray-200 dark:bg-gray-700'
            }`}>
              {progress.phase === 'completed' ? <Check className="w-3 h-3" /> : '3'}
            </span>
            <span>Generate chapter details</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
          {progress.message}
        </p>

        {/* Completed Message */}
        {progress.phase === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
            <p className="text-green-700 dark:text-green-400 font-medium">
              <Sparkles className="w-4 h-4 inline mr-1" /> Your outline is ready! Switching to outline view...
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// Memoized Book Generation Modal - won't re-render unless props actually change
export const BookGenerationModal = memo(function BookGenerationModal({
  isVisible,
  progress,
  onCancel,
  onContinue,
}: BookGenerationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  const isGenerating = progress.phase === 'creating' || progress.phase === 'generating' || progress.phase === 'cover';

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      style={{ willChange: 'opacity' }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scaleIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* Animated rings for generating state */}
            {isGenerating && (
              <>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-yellow-200 dark:border-yellow-900 animate-ping opacity-20"
                  style={{ willChange: 'transform, opacity' }}
                />
                <div 
                  className="absolute inset-2 rounded-full border-4 border-yellow-300 dark:border-yellow-800 animate-ping opacity-30"
                  style={{ animationDelay: '0.2s', willChange: 'transform, opacity' }}
                />
              </>
            )}
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className={`${isGenerating ? 'animate-bounce' : ''}`}
                style={{ willChange: isGenerating ? 'transform' : 'auto' }}
              >
                {progress.phase === 'creating' && <Library className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'generating' && <PenTool className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'cover' && <Palette className="w-10 h-10 text-yellow-500" />}
                {progress.phase === 'completed' && <CheckCircle className="w-10 h-10 text-green-500" />}
                {progress.phase === 'error' && <AlertTriangle className="w-10 h-10 text-red-500" />}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {progress.phase === 'creating' && 'Creating Book...'}
            {progress.phase === 'generating' && 'Writing Chapters...'}
            {progress.phase === 'cover' && 'Designing Cover...'}
            {progress.phase === 'completed' && 'Book Complete!'}
            {progress.phase === 'error' && 'Generation Error'}
          </h3>
          {/* Mode indicator */}
          {progress.isParallel !== undefined && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                progress.isParallel 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                {progress.isParallel ? <><Zap className="w-3 h-3 inline mr-0.5" /> Parallel Mode</> : <><FileText className="w-3 h-3 inline mr-0.5" /> Sequential Mode</>}
              </span>
              {progress.modelUsed && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                  {progress.modelUsed.split('/').pop()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                progress.phase === 'error'
                  ? 'bg-red-500'
                  : progress.phase === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
              }`}
              style={{ width: `${progress.progress}%`, willChange: 'width' }}
            />
          </div>
        </div>

        {/* Chapter Progress */}
        {progress.totalChapters > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {progress.chaptersCompleted}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">written</div>
              </div>
              <div className="text-2xl text-gray-300 dark:text-gray-600">/</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                  {progress.totalChapters}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">total</div>
              </div>
              {progress.totalWords && progress.totalWords > 0 && (
                <>
                  <div className="text-2xl text-gray-300 dark:text-gray-600">|</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progress.totalWords.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">words</div>
                  </div>
                </>
              )}
            </div>
            {/* Chapter progress dots with current batch highlighting */}
            <div className="flex justify-center gap-1 flex-wrap">
              {Array.from({ length: progress.totalChapters }).map((_, i) => {
                const chapterNum = i + 1;
                const isInCurrentBatch = progress.currentBatch?.includes(chapterNum);
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i < progress.chaptersCompleted
                        ? 'bg-green-500'
                        : isInCurrentBatch
                          ? 'bg-yellow-400 animate-pulse ring-2 ring-yellow-300'
                          : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    title={`Chapter ${chapterNum}${isInCurrentBatch ? ' (generating)' : ''}`}
                  />
                );
              })}
            </div>
            {/* Batch duration info */}
            {progress.batchDuration && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                Last batch: {progress.batchDuration}s
              </p>
            )}
          </div>
        )}

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {progress.message}
        </p>

        {/* Cancel Button */}
        {isGenerating && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
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
        {progress.phase === 'completed' && (
          <div className="text-center">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Opening your book...
            </p>
          </div>
        )}

        {/* Error State with Book ID */}
        {progress.phase === 'error' && progress.bookId && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Book ID: {progress.bookId}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={onContinue}
            >
              Continue Generation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
