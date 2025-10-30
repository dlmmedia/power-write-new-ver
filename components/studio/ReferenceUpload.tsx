'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface UploadedReference {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'url';
  content?: string;
  url?: string;
  size?: number;
  uploadedAt: Date;
}

interface ReferenceUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (references: UploadedReference[]) => void;
}

export function ReferenceUpload({ isOpen, onClose, onUpload }: ReferenceUploadProps) {
  const [uploads, setUploads] = useState<UploadedReference[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    const newUploads: UploadedReference[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (!['pdf', 'txt', 'docx', 'doc'].includes(fileType || '')) {
        alert(`File type .${fileType} is not supported. Please upload PDF, TXT, or DOCX files.`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        
        newUploads.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          type: fileType as 'pdf' | 'txt' | 'docx',
          content,
          size: file.size,
          uploadedAt: new Date()
        });
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Failed to read ${file.name}`);
      }
    }

    setUploads([...uploads, ...newUploads]);
    setIsProcessing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput); // Validate URL
      
      const newRef: UploadedReference = {
        id: `url-${Date.now()}`,
        name: urlInput,
        type: 'url',
        url: urlInput,
        uploadedAt: new Date()
      };

      setUploads([...uploads, newRef]);
      setUrlInput('');
    } catch {
      alert('Please enter a valid URL');
    }
  };

  const handleTextAdd = () => {
    if (!textContent.trim() || !textTitle.trim()) {
      alert('Please provide both title and content');
      return;
    }

    const newRef: UploadedReference = {
      id: `text-${Date.now()}`,
      name: textTitle,
      type: 'txt',
      content: textContent,
      uploadedAt: new Date()
    };

    setUploads([...uploads, newRef]);
    setTextContent('');
    setTextTitle('');
  };

  const handleRemove = (id: string) => {
    setUploads(uploads.filter(u => u.id !== id));
  };

  const handleSubmit = () => {
    if (uploads.length === 0) {
      alert('Please add at least one reference');
      return;
    }
    onUpload(uploads);
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Reference Materials" size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'file'
                ? 'border-b-2 border-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📄 Upload Files
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'url'
                ? 'border-b-2 border-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔗 Add URL
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'text'
                ? 'border-b-2 border-yellow-400 text-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ✍️ Paste Text
          </button>
        </div>

        {/* Upload Area */}
        <div className="min-h-[200px]">
          {activeTab === 'file' && (
            <div>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-4">📁</div>
                <p className="text-gray-300 mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">PDF, TXT, or DOCX files (Max 10MB each)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {isProcessing && (
                <div className="mt-4 text-center text-yellow-400">
                  Processing files...
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website or Document URL</label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
                  />
                  <Button variant="primary" onClick={handleUrlAdd}>
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add web articles, blog posts, or online documents as references
                </p>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  type="text"
                  placeholder="Reference title..."
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  placeholder="Paste your reference text here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                />
              </div>
              <Button variant="primary" onClick={handleTextAdd} className="w-full">
                Add Text Reference
              </Button>
            </div>
          )}
        </div>

        {/* Uploaded References List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Uploaded References ({uploads.length})</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {uploads.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">
                      {ref.type === 'pdf' && '📕'}
                      {ref.type === 'txt' && '📄'}
                      {ref.type === 'docx' && '📘'}
                      {ref.type === 'url' && '🔗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ref.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="default" size="sm">{ref.type.toUpperCase()}</Badge>
                        {ref.size && <span>{formatFileSize(ref.size)}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(ref.id)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={uploads.length === 0}
          >
            Add {uploads.length} Reference{uploads.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
