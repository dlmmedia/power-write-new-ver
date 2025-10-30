'use client';

import { useState } from 'react';
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
import { AdvancedSettings } from '@/components/studio/config/AdvancedSettings';
import { OutlineEditor } from '@/components/studio/OutlineEditor';
import { ReferenceUpload } from '@/components/studio/ReferenceUpload';
import { getDemoUserId, canGenerateBook } from '@/lib/services/demo-account';
import { autoPopulateFromBook } from '@/lib/utils/auto-populate';

type ConfigTab = 
  | 'basic' 
  | 'content' 
  | 'style' 
  | 'characters' 
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
    removeUploadedReference 
  } = useStudioStore();
  const [activeTab, setActiveTab] = useState<ConfigTab>('basic');
  const [viewMode, setViewMode] = useState<'config' | 'outline'>('config');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const tabs = [
    { id: 'basic' as ConfigTab, label: 'Basic Info', icon: '📝' },
    { id: 'content' as ConfigTab, label: 'Content Settings', icon: '📖' },
    { id: 'style' as ConfigTab, label: 'Style Preferences', icon: '✍️' },
    { id: 'characters' as ConfigTab, label: 'Characters & World', icon: '🌍' },
    { id: 'advanced' as ConfigTab, label: 'Advanced Settings', icon: '⚙️' },
  ];

  const handleGenerateBook = async () => {
    if (!outline) {
      alert('Please generate an outline first');
      return;
    }

    const canGenerate = canGenerateBook();
    if (!canGenerate.allowed) {
      alert(canGenerate.reason);
      return;
    }

    const confirmed = confirm(
      `Generate full book: "${outline.title}"?\n\n` +
      `This will generate ${outline.chapters.length} chapters and may take several minutes.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          outline: outline,
          config: config,
        }),
      });

      const data = await response.json();
      if (data.success && data.book) {
        alert(
          `Book generated successfully!\n\n` +
          `Title: ${data.book.title}\n` +
          `Chapters: ${data.book.chapters}\n` +
          `Words: ${data.book.wordCount.toLocaleString()}\n\n` +
          `Book ID: ${data.book.id}`
        );
        // Redirect to library or book detail
        router.push(`/library`);
      } else {
        alert('Failed to generate book: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating book:', error);
      alert('Failed to generate book. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getDemoUserId(),
          config: config,
          referenceBooks: selectedBooks,
        }),
      });

      const data = await response.json();
      if (data.success && data.outline) {
        // Save outline to store
        const { setOutline } = useStudioStore.getState();
        setOutline(data.outline);
        setViewMode('outline');
        alert(`Outline generated successfully!\n\nTitle: ${data.outline.title}\nChapters: ${data.outline.chapters.length}`);
      } else {
        alert('Failed to generate outline: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      alert('Failed to generate outline. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-black sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 text-2xl">
                PW
              </div>
              <h1 className="text-2xl font-bold">Book Studio</h1>
            </div>

            <div className="flex items-center gap-3">
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
                isLoading={isGenerating}
                disabled={!config.basicInfo?.title || !config.basicInfo?.author}
              >
                {outline ? 'Regenerate Outline' : 'Generate Outline'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateBook}
                isLoading={isGenerating}
                disabled={!outline}
              >
                Generate Book
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="bg-green-900 border-b border-green-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="text-white font-semibold">
                    Configuration Auto-Populated Successfully!
                  </p>
                  <p className="text-green-200 text-sm">
                    Generated sample title, description, genre, themes, and settings. You can now customize as needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-green-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Book Selector */}
      {selectedBooks.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-300">
                🎯 Auto-Populate From:
              </label>
              <select
                value={selectedReferenceId}
                onChange={(e) => setSelectedReferenceId(e.target.value)}
                className="flex-1 max-w-md bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
            <p className="text-xs text-gray-500 mt-2">
              Select a reference book to automatically generate sample title, description, genre, themes, and settings based on its style.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Configuration Tabs */}
          <div className="col-span-3">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <h2 className="text-lg font-semibold mb-4 text-yellow-400">Configuration</h2>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded transition-colors flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-yellow-400 text-black font-semibold'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Reference Materials */}
              {(selectedBooks.length > 0 || uploadedReferences.length > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-sm font-semibold mb-3 text-gray-400">Reference Materials</h3>
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
                          <p className="text-xs text-white truncate">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate">{book.authors[0]}</p>
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
                          <p className="text-xs text-white truncate">{ref.name}</p>
                          <p className="text-xs text-gray-500">{ref.type.toUpperCase()}</p>
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
                      <p className="text-xs text-gray-500">+{selectedBooks.length + uploadedReferences.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Panel - Configuration Forms or Outline */}
          <div className="col-span-9">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              {viewMode === 'outline' ? (
                <OutlineEditor />
              ) : (
                <>
                  {activeTab === 'basic' && <BasicInfo />}
                  {activeTab === 'content' && <ContentSettings />}
                  {activeTab === 'style' && <StylePreferences />}
                  {activeTab === 'characters' && <CharactersWorld />}
                  {activeTab === 'advanced' && <AdvancedSettings />}
                </>
              )}
            </div>
          </div>
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
    </div>
  );
}
