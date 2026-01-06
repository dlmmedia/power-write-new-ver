'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChapterReviewEditor, type ReviewChapter } from './ChapterReviewEditor';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  File,
  ChevronRight,
  Settings2,
} from 'lucide-react';

// Types for parsed content
interface ParsedChapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
}

interface ParsedBookData {
  title: string;
  author: string;
  chapters: ParsedChapter[];
  totalWordCount: number;
  chapterCount: number;
  fileType: string;
  fileName: string;
  fileSize: number;
  detectionMethod: string;
}

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (bookId: number) => void;
}

type UploadStep = 'upload' | 'review' | 'chapters' | 'importing';

const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'TXT'];
const MAX_FILE_SIZE_MB = 50;

export function BookUploadModal({ isOpen, onClose, onImportComplete }: BookUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [showChapterEditor, setShowChapterEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBookData | null>(null);
  
  // Editable metadata
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookGenre, setBookGenre] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setIsDragging(false);
    setIsUploading(false);
    setIsImporting(false);
    setError(null);
    setSelectedFile(null);
    setParsedData(null);
    setBookTitle('');
    setBookAuthor('');
    setBookGenre('');
    setBookDescription('');
    setShowChapterEditor(false);
  }, []);

  // Handle chapter updates from editor
  const handleChaptersChange = useCallback((newChapters: ReviewChapter[]) => {
    if (parsedData) {
      const newWordCount = newChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      setParsedData({
        ...parsedData,
        chapters: newChapters,
        chapterCount: newChapters.length,
        totalWordCount: newWordCount,
      });
    }
  }, [parsedData]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      return `Unsupported file type. Please upload ${SUPPORTED_FORMATS.join(', ')} files.`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return `File is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }

    // Check for empty file
    if (file.size === 0) {
      return 'File is empty.';
    }

    return null;
  };

  const uploadAndParseFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to parse file');
      }

      // Set parsed data
      setParsedData(data.data);
      setBookTitle(data.data.title);
      setBookAuthor(data.data.author);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    uploadAndParseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/books/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: bookTitle.trim() || parsedData.title,
          author: bookAuthor.trim() || parsedData.author,
          genre: bookGenre.trim() || undefined,
          description: bookDescription.trim() || undefined,
          chapters: parsedData.chapters,
          sourceFile: {
            name: parsedData.fileName,
            type: parsedData.fileType,
            size: parsedData.fileSize,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to import book');
      }

      // Success - notify parent and close
      onImportComplete(data.book.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import book');
      setStep('review');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Upload className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Upload Book
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {step === 'upload' && 'Import an existing book into PowerWrite'}
                  {step === 'review' && 'Review and customize your import'}
                  {step === 'importing' && 'Creating your book...'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Upload Error</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div>
                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging 
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    ${isUploading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          Analyzing your book...
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Extracting content and detecting chapters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                          <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {isDragging ? 'Drop your file here' : 'Drag & drop your book file'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        or click to browse
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUPPORTED_FORMATS.map((format) => (
                          <span
                            key={format}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Maximum file size: {MAX_FILE_SIZE_MB}MB
                      </p>
                    </>
                  )}
                </div>

                {/* Selected File Info */}
                {selectedFile && !isUploading && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                    <File className="w-8 h-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review */}
            {step === 'review' && parsedData && (
              <div className="space-y-6">
                {/* Success Banner */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Successfully parsed!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      Found {parsedData.chapterCount} chapter{parsedData.chapterCount !== 1 ? 's' : ''} with {parsedData.totalWordCount.toLocaleString()} words
                    </p>
                  </div>
                </div>

                {/* Book Metadata Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Book Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Title"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Enter book title"
                    />
                    <Input
                      label="Author"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      placeholder="Enter author name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Genre (optional)"
                      value={bookGenre}
                      onChange={(e) => setBookGenre(e.target.value)}
                      placeholder="e.g., Fiction, Non-Fiction"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Source File
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <File className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {parsedData.fileName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={bookDescription}
                      onChange={(e) => setBookDescription(e.target.value)}
                      placeholder="Enter a brief description of the book..."
                      rows={3}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Chapters Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Detected Chapters ({parsedData.chapterCount})
                    </h3>
                    <button
                      onClick={() => setShowChapterEditor(!showChapterEditor)}
                      className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      {showChapterEditor ? 'Simple View' : 'Edit Chapters'}
                    </button>
                  </div>

                  {showChapterEditor ? (
                    <ChapterReviewEditor
                      chapters={parsedData.chapters}
                      onChaptersChange={handleChaptersChange}
                      totalWordCount={parsedData.totalWordCount}
                    />
                  ) : (
                    <>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                        {parsedData.chapters.map((chapter, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between px-4 py-3 ${
                              index !== parsedData.chapters.length - 1 
                                ? 'border-b border-gray-100 dark:border-gray-800' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg">
                                {chapter.number}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {chapter.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                              {chapter.wordCount.toLocaleString()} words
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Detection method: {parsedData.detectionMethod.replace(/_/g, ' ')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Importing */}
            {step === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-6" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Importing your book...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Creating chapters and saving to your library
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'importing' && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              {step === 'upload' ? (
                <>
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <div />
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setStep('upload');
                      setParsedData(null);
                      setSelectedFile(null);
                      setError(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!bookTitle.trim() || !bookAuthor.trim() || isImporting}
                    isLoading={isImporting}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Import Book
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
