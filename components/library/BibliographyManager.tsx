'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Reference,
  ReferenceType,
  CitationStyle,
  REFERENCE_TYPE_LABELS,
  CITATION_STYLE_LABELS,
  BibliographyConfig,
} from '@/lib/types/bibliography';
import {
  useBibliographyStore,
  createNewReference,
  exportBibliographyToJSON,
  exportToBibTeX,
  exportToRIS,
} from '@/lib/store/bibliography-store';
import { CitationService } from '@/lib/services/citation-service';
import { ReferenceEditor } from './ReferenceEditor';

interface BibliographyManagerProps {
  bookId: number;
  onClose?: () => void;
}

export const BibliographyManager: React.FC<BibliographyManagerProps> = ({
  bookId,
  onClose,
}) => {
  const {
    config,
    references,
    updateConfig,
    addReference,
    updateReference,
    deleteReference,
    exportReferences,
    importReferences,
  } = useBibliographyStore();

  const [view, setView] = useState<'list' | 'add' | 'edit' | 'settings'>('list');
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ReferenceType | 'all'>('all');

  // Filter and search references
  const filteredReferences = references.filter((ref) => {
    const matchesSearch = searchQuery === '' || 
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.authors.some(a => 
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesType = filterType === 'all' || ref.type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort references
  const sortedReferences = CitationService.sortReferences(
    filteredReferences,
    config.sortBy,
    config.sortDirection
  );

  const handleAddReference = (type: ReferenceType) => {
    const newRef = createNewReference(type) as Reference;
    setSelectedReference(newRef);
    setView('add');
  };

  const handleSaveReference = (reference: Reference) => {
    if (view === 'add') {
      addReference(reference);
    } else {
      updateReference(reference.id, reference);
    }
    setView('list');
    setSelectedReference(null);
  };

  const handleEditReference = (reference: Reference) => {
    setSelectedReference(reference);
    setView('edit');
  };

  const handleDeleteReference = (id: string) => {
    if (confirm('Are you sure you want to delete this reference?')) {
      deleteReference(id);
    }
  };

  const handleExport = (format: 'json' | 'bibtex' | 'ris') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = exportBibliographyToJSON({
          bookId,
          config,
          references,
          chapterReferences: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        filename = 'bibliography.json';
        mimeType = 'application/json';
        break;
      case 'bibtex':
        content = exportToBibTeX(references);
        filename = 'bibliography.bib';
        mimeType = 'text/plain';
        break;
      case 'ris':
        content = exportToRIS(references);
        filename = 'bibliography.ris';
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.references && Array.isArray(data.references)) {
          importReferences(data.references);
          alert(`Imported ${data.references.length} references successfully!`);
        }
      } catch (error) {
        alert('Failed to import references. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Render different views
  if (view === 'add' || view === 'edit') {
    return (
      <ReferenceEditor
        reference={selectedReference!}
        onSave={handleSaveReference}
        onCancel={() => {
          setView('list');
          setSelectedReference(null);
        }}
      />
    );
  }

  if (view === 'settings') {
    return (
      <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bibliography Settings
          </h2>
          <Button variant="outline" onClick={() => setView('list')}>
            ← Back to References
          </Button>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Bibliography */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                className="w-5 h-5 text-yellow-500 rounded"
              />
              <span className="text-gray-900 dark:text-white font-medium">
                Enable Bibliography
              </span>
            </label>
          </div>

          {/* Citation Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Citation Style
            </label>
            <select
              value={config.citationStyle}
              onChange={(e) => updateConfig({ citationStyle: e.target.value as CitationStyle })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
            >
              {Object.entries(CITATION_STYLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort References By
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={config.sortBy}
                onChange={(e) => updateConfig({ sortBy: e.target.value as any })}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
              >
                <option value="author">Author</option>
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
              </select>
              <select
                value={config.sortDirection}
                onChange={(e) => updateConfig({ sortDirection: e.target.value as 'asc' | 'desc' })}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Display Options</h3>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.groupByType}
                onChange={(e) => updateConfig({ groupByType: e.target.checked })}
                className="w-4 h-4 text-yellow-500 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Group by reference type</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.hangingIndent}
                onChange={(e) => updateConfig({ hangingIndent: e.target.checked })}
                className="w-4 h-4 text-yellow-500 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Use hanging indent</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.showDOI}
                onChange={(e) => updateConfig({ showDOI: e.target.checked })}
                className="w-4 h-4 text-yellow-500 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Show DOI</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.showURL}
                onChange={(e) => updateConfig({ showURL: e.target.checked })}
                className="w-4 h-4 text-yellow-500 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Show URL</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.showAccessDate}
                onChange={(e) => updateConfig({ showAccessDate: e.target.checked })}
                className="w-4 h-4 text-yellow-500 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Show access date for online sources</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bibliography Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {references.length} reference{references.length !== 1 ? 's' : ''} • {config.citationStyle} style
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('settings')}>
            ⚙️ Settings
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <Input
            placeholder="Search references by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ReferenceType | 'all')}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
        >
          <option value="all">All Types</option>
          {Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative">
          <Button
            variant="primary"
            onClick={() => {
              const type = prompt('Enter reference type (book, journal, website, etc.):');
              if (type && type in REFERENCE_TYPE_LABELS) {
                handleAddReference(type as ReferenceType);
              }
            }}
          >
            + Add Reference
          </Button>
        </div>
        
        <Button variant="outline" onClick={() => handleExport('json')}>
          📥 Export JSON
        </Button>
        <Button variant="outline" onClick={() => handleExport('bibtex')}>
          📥 Export BibTeX
        </Button>
        <Button variant="outline" onClick={() => handleExport('ris')}>
          📥 Export RIS
        </Button>
        
        <label className="inline-block cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            📤 Import
          </span>
        </label>
      </div>

      {/* Quick Add Buttons */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Quick Add:
        </h3>
        <div className="flex flex-wrap gap-2">
          {(['book', 'journal', 'website', 'conference', 'thesis'] as ReferenceType[]).map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => handleAddReference(type)}
            >
              + {REFERENCE_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* References List */}
      {sortedReferences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No references yet. Add your first reference to get started!
          </p>
          <Button variant="primary" onClick={() => handleAddReference('book')}>
            + Add Your First Reference
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReferences.map((ref, index) => {
            const formattedRef = CitationService.formatReference(ref, config.citationStyle, index + 1);
            
            return (
              <div
                key={ref.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {REFERENCE_TYPE_LABELS[ref.type]}
                      </Badge>
                      {ref.year && (
                        <Badge variant="default" size="sm">
                          {ref.year}
                        </Badge>
                      )}
                    </div>
                    <div
                      className="text-gray-900 dark:text-white prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formattedRef }}
                    />
                    {ref.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                        Note: {ref.notes}
                      </p>
                    )}
                    {ref.tags && ref.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ref.tags.map((tag) => (
                          <Badge key={tag} variant="default" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditReference(ref)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReference(ref.id)}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

