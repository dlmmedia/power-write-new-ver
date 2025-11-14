'use client';

import React from 'react';
import { Reference, BibliographyConfig, REFERENCE_TYPE_LABELS } from '@/lib/types/bibliography';
import { CitationService } from '@/lib/services/citation-service';

interface BibliographySectionProps {
  references: Reference[];
  config: BibliographyConfig;
  chapterNumber?: number; // If provided, shows chapter-specific references
  title?: string;
}

export const BibliographySection: React.FC<BibliographySectionProps> = ({
  references,
  config,
  chapterNumber,
  title = 'Bibliography',
}) => {
  if (!config.enabled || references.length === 0) {
    return null;
  }

  // Sort references
  const sortedReferences = CitationService.sortReferences(
    references,
    config.sortBy,
    config.sortDirection
  );

  // Group by type if configured
  const groupedReferences: Record<string, Reference[]> = {};
  if (config.groupByType) {
    sortedReferences.forEach((ref) => {
      const type = REFERENCE_TYPE_LABELS[ref.type];
      if (!groupedReferences[type]) {
        groupedReferences[type] = [];
      }
      groupedReferences[type].push(ref);
    });
  }

  const renderReference = (ref: Reference, index: number) => {
    const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
    
    return (
      <div
        key={ref.id}
        className={`mb-3 ${config.hangingIndent ? 'pl-8 -indent-8' : ''}`}
        style={{
          lineHeight: config.lineSpacing === 'single' ? '1.5' : 
                     config.lineSpacing === '1.5' ? '1.75' : '2',
        }}
      >
        {config.numberingStyle === 'numeric' && (
          <span className="font-semibold mr-2">{index + 1}.</span>
        )}
        {config.numberingStyle === 'alphabetic' && (
          <span className="font-semibold mr-2">
            {String.fromCharCode(65 + index)}.
          </span>
        )}
        <span
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      </div>
    );
  };

  return (
    <div className="bibliography-section py-8 px-6 bg-white dark:bg-gray-900">
      {/* Title */}
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b-2 border-yellow-500 pb-2">
        {chapterNumber ? `Chapter ${chapterNumber} References` : title}
      </h2>

      {/* References */}
      {config.groupByType ? (
        // Grouped by type
        <div className="space-y-8">
          {Object.entries(groupedReferences).map(([type, refs]) => (
            <div key={type}>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {type}
              </h3>
              <div className="space-y-2">
                {refs.map((ref, index) => renderReference(ref, index))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single list
        <div className="space-y-2">
          {sortedReferences.map((ref, index) => renderReference(ref, index))}
        </div>
      )}

      {/* Citation style note */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          References formatted in {config.citationStyle} style.
        </p>
      </div>
    </div>
  );
};

// Component for chapter-end references (endnotes)
interface ChapterReferencesProps {
  chapterNumber: number;
  chapterTitle: string;
  references: Reference[];
  config: BibliographyConfig;
}

export const ChapterReferences: React.FC<ChapterReferencesProps> = ({
  chapterNumber,
  chapterTitle,
  references,
  config,
}) => {
  if (!config.enabled || !config.location.includes('endnote') || references.length === 0) {
    return null;
  }

  return (
    <div className="chapter-references mt-12 pt-8 border-t-2 border-gray-300 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Notes for Chapter {chapterNumber}: {chapterTitle}
      </h3>
      <div className="space-y-2">
        {references.map((ref, index) => {
          const formatted = CitationService.formatReference(ref, config.citationStyle, index + 1);
          return (
            <div key={ref.id} className="text-sm">
              <span className="font-semibold mr-2">{index + 1}.</span>
              <span
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatted }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component for displaying a single inline citation
interface InlineCitationProps {
  referenceId: string;
  reference: Reference;
  config: BibliographyConfig;
  pageNumber?: string;
  suppressAuthor?: boolean;
}

export const InlineCitation: React.FC<InlineCitationProps> = ({
  referenceId,
  reference,
  config,
  pageNumber,
  suppressAuthor,
}) => {
  const citation = {
    id: referenceId,
    referenceId,
    position: 0,
    pageNumber,
    suppressAuthor,
    createdAt: new Date(),
  };

  const formatted = CitationService.formatInTextCitation(reference, citation, config.citationStyle);

  return (
    <span
      className="citation inline"
      data-reference-id={referenceId}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
};

