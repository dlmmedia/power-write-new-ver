'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Reference, REFERENCE_TYPE_LABELS } from '@/lib/types/bibliography';
import { useBibliographyStore, createNewCitation } from '@/lib/store/bibliography-store';
import { CitationService } from '@/lib/services/citation-service';
import { X, Library } from 'lucide-react';

interface CitationInserterProps {
  chapterId: number;
  onInsert: (citationText: string, referenceId: string) => void;
  onClose: () => void;
}

export const CitationInserter: React.FC<CitationInserterProps> = ({
  chapterId,
  onInsert,
  onClose,
}) => {
  const { references, config, addCitation } = useBibliographyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [pageNumber, setPageNumber] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  // Filter references based on search
  const filteredReferences = references.filter((ref) => {
    const query = searchQuery.toLowerCase();
    return (
      ref.title.toLowerCase().includes(query) ||
      ref.authors.some((a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(query)
      ) ||
      ref.citationKey?.toLowerCase().includes(query)
    );
  });

  const handleInsertCitation = () => {
    if (!selectedReference) {
      alert('Please select a reference');
      return;
    }

    // Create citation object
    const citation = createNewCitation(selectedReference.id, chapterId, 0);
    citation.pageNumber = pageNumber || undefined;
    citation.prefix = prefix || undefined;
    citation.suffix = suffix || undefined;

    // Format citation text
    const citationText = CitationService.formatInTextCitation(
      selectedReference,
      citation,
      config.citationStyle
    );

    // Add to store
    addCitation(citation);

    // Insert into editor
    let fullCitation = citationText;
    if (prefix) fullCitation = `${prefix} ${fullCitation}`;
    if (suffix) fullCitation = `${fullCitation} ${suffix}`;

    onInsert(fullCitation, selectedReference.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Insert Citation
            </h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 inline mr-1" /> Close
            </Button>
          </div>
          <Input
            placeholder="Search references by title, author, or citation key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Reference List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredReferences.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'No references found matching your search.'
                  : 'No references available. Add references in the Bibliography Manager first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReferences.map((ref) => {
                const isSelected = selectedReference?.id === ref.id;
                const formatted = CitationService.formatReference(ref, config.citationStyle);

                return (
                  <button
                    key={ref.id}
                    onClick={() => setSelectedReference(ref)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {REFERENCE_TYPE_LABELS[ref.type]}
                      </Badge>
                      {ref.citationKey && (
                        <Badge variant="default" size="sm">
                          {ref.citationKey}
                        </Badge>
                      )}
                      {ref.year && (
                        <Badge variant="default" size="sm">
                          {ref.year}
                        </Badge>
                      )}
                    </div>
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Citation Options */}
        {selectedReference && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Citation Options
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Input
                label="Page Number"
                placeholder="e.g., 42 or 42-45"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
              />
              <Input
                label="Prefix"
                placeholder="e.g., see, cf."
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
              <Input
                label="Suffix"
                placeholder="Additional text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Preview:</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {prefix && `${prefix} `}
                <span
                  dangerouslySetInnerHTML={{
                    __html: CitationService.formatInTextCitation(
                      selectedReference,
                      {
                        id: 'preview',
                        referenceId: selectedReference.id,
                        position: 0,
                        pageNumber: pageNumber || undefined,
                        createdAt: new Date(),
                      },
                      config.citationStyle
                    ),
                  }}
                />
                {suffix && ` ${suffix}`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleInsertCitation}>
                Insert Citation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Quick citation button component for toolbar
interface QuickCitationButtonProps {
  chapterId: number;
  onInsert: (citationText: string, referenceId: string) => void;
}

export const QuickCitationButton: React.FC<QuickCitationButtonProps> = ({
  chapterId,
  onInsert,
}) => {
  const [showInserter, setShowInserter] = useState(false);
  const { references } = useBibliographyStore();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInserter(true)}
        title="Insert citation"
        disabled={references.length === 0}
      >
        <Library className="w-4 h-4 inline mr-1" /> Cite
      </Button>

      {showInserter && (
        <CitationInserter
          chapterId={chapterId}
          onInsert={onInsert}
          onClose={() => setShowInserter(false)}
        />
      )}
    </>
  );
};

