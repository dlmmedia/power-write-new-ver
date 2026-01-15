'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { 
  Video, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Film,
  Pause,
  Play,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ReadingTheme, FontSize } from './reader/types';

interface VideoExportJob {
  id: number;
  status: string;
  scope: string;
  chapterNumber?: number;
  theme: string;
  currentPhase: string;
  progress: number;
  currentChapter?: number;
  totalChapters?: number;
  currentFrame?: number;
  totalFrames?: number;
  outputUrl?: string;
  outputSize?: number;
  outputDuration?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
  audioUrl?: string | null;
}

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  bookTitle: string;
  chapters: Chapter[];
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  chapters,
}) => {
  // Export options
  const [scope, setScope] = useState<'full' | 'chapter'>('full');
  const [selectedChapter, setSelectedChapter] = useState<number | undefined>(undefined);
  const [theme, setTheme] = useState<ReadingTheme>('day');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  
  // Job state
  const [jobs, setJobs] = useState<VideoExportJob[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<number | null>(null);
  
  // Polling interval for job status
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Filter chapters with audio
  const chaptersWithAudio = chapters.filter(ch => ch.audioUrl);
  
  // Fetch existing jobs
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/generate/video?bookId=${bookId}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error('Failed to fetch video jobs:', e);
    }
  }, [bookId]);
  
  // Start polling when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      
      // Poll for updates every 3 seconds if there are active jobs
      const interval = setInterval(() => {
        fetchJobs();
      }, 3000);
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isOpen, fetchJobs]);
  
  // Start export
  const startExport = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          scope,
          chapterNumber: scope === 'chapter' ? selectedChapter : undefined,
          theme,
          fontSize,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start export');
      }
      
      // Refresh jobs list
      await fetchJobs();
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start export');
    } finally {
      setIsStarting(false);
    }
  };
  
  // Cancel job
  const cancelJob = async (jobId: number) => {
    console.log(`[VideoExportModal] Cancelling job ${jobId}`);
    setCancellingJobId(jobId);
    setError(null);
    
    try {
      const response = await fetch(`/api/generate/video/${jobId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log(`[VideoExportModal] Cancel response status: ${response.status}`);
      
      const data = await response.json();
      console.log(`[VideoExportModal] Cancel response data:`, data);
      
      if (!response.ok) {
        console.error('Failed to cancel job:', data.error);
        setError(data.error || 'Failed to cancel job');
      } else {
        console.log('Job cancelled successfully:', data);
      }
      
      // Refresh jobs list
      await fetchJobs();
    } catch (e) {
      console.error('Failed to cancel job:', e);
      setError(e instanceof Error ? e.message : 'Failed to cancel job');
    } finally {
      setCancellingJobId(null);
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-amber-500';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="w-5 h-5" />;
      case 'failed': return <XCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get phase description
  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'initializing': return 'Preparing export...';
      case 'rendering_frames': return 'Rendering frames...';
      case 'downloading': return 'Downloading frames...';
      case 'stitching': return 'Creating video...';
      case 'uploading': return 'Uploading video...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return phase;
    }
  };
  
  // Check if we have active jobs
  const hasActiveJobs = jobs.some(j => 
    ['pending', 'rendering', 'stitching'].includes(j.status)
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Video" size="lg">
      <div className="space-y-6">
        {/* Info banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Create a Video of Your Book</p>
              <p className="text-amber-700 dark:text-amber-300">
                Export your book as a video with synced audio narration and page flip animations.
                This process runs in the background - you can close this modal and come back later.
              </p>
            </div>
          </div>
        </div>
        
        {/* No audio warning */}
        {chaptersWithAudio.length === 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">No Audio Available</p>
                <p className="text-red-700 dark:text-red-300">
                  Please generate audio for at least one chapter before exporting video.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Export options */}
        {chaptersWithAudio.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Export Options</h4>
            
            {/* Scope selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What to Export
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="full"
                    checked={scope === 'full'}
                    onChange={() => setScope('full')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Full Book ({chaptersWithAudio.length} chapters with audio)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="chapter"
                    checked={scope === 'chapter'}
                    onChange={() => setScope('chapter')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Single Chapter</span>
                </label>
              </div>
            </div>
            
            {/* Chapter selection (if scope is chapter) */}
            {scope === 'chapter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Chapter
                </label>
                <select
                  value={selectedChapter || ''}
                  onChange={(e) => setSelectedChapter(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Select a chapter...</option>
                  {chaptersWithAudio.map(ch => (
                    <option key={ch.id} value={ch.chapterNumber}>
                      Chapter {ch.chapterNumber}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Theme selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visual Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['day', 'night', 'sepia', 'focus'] as ReadingTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === t
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-2 border-amber-500'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Start button */}
            <button
              onClick={startExport}
              disabled={isStarting || (scope === 'chapter' && !selectedChapter) || hasActiveJobs}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Export...
                </>
              ) : hasActiveJobs ? (
                <>
                  <Clock className="w-5 h-5" />
                  Export in Progress...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" />
                  Start Video Export
                </>
              )}
            </button>
            
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}
        
        {/* Jobs list */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Export Jobs</h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Job header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {job.scope === 'chapter' 
                            ? `Chapter ${job.chapterNumber}` 
                            : 'Full Book'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({job.theme} theme)
                        </span>
                      </div>
                      
                      {/* Progress bar for active jobs */}
                      {['pending', 'rendering', 'stitching'].includes(job.status) && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>{getPhaseDescription(job.currentPhase)}</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          {job.currentFrame !== undefined && job.totalFrames !== undefined && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Frame {job.currentFrame} of {job.totalFrames}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Completed job info */}
                      {job.status === 'complete' && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Duration: {formatDuration(job.outputDuration)}</span>
                          <span>Size: {formatFileSize(job.outputSize)}</span>
                        </div>
                      )}
                      
                      {/* Error message */}
                      {job.status === 'failed' && job.error && (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          {job.error}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {job.status === 'complete' && job.outputUrl && (
                        <a
                          href={job.outputUrl}
                          download
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                      
                      {['pending', 'rendering', 'stitching'].includes(job.status) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelJob(job.id);
                          }}
                          disabled={cancellingJobId === job.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                        >
                          {cancellingJobId === job.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </>
                          )}
                        </button>
                      )}
                      
                      {['complete', 'failed', 'cancelled'].includes(job.status) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelJob(job.id);
                          }}
                          disabled={cancellingJobId === job.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                        >
                          {cancellingJobId === job.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoExportModal;
