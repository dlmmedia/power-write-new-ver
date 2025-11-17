'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Reference,
  Author,
  BookReference,
  JournalReference,
  WebsiteReference,
  REFERENCE_TYPE_LABELS,
} from '@/lib/types/bibliography';

interface ReferenceEditorProps {
  reference: Reference;
  onSave: (reference: Reference) => void;
  onCancel: () => void;
}

export const ReferenceEditor: React.FC<ReferenceEditorProps> = ({
  reference: initialReference,
  onSave,
  onCancel,
}) => {
  const [reference, setReference] = useState<Reference>(initialReference);

  const updateField = (field: string, value: any) => {
    setReference((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date(),
    }));
  };

  const addAuthor = () => {
    const newAuthor: Author = {
      firstName: '',
      lastName: '',
    };
    updateField('authors', [...reference.authors, newAuthor]);
  };

  const updateAuthor = (index: number, field: keyof Author, value: string) => {
    const updatedAuthors = [...reference.authors];
    updatedAuthors[index] = {
      ...updatedAuthors[index],
      [field]: value,
    };
    updateField('authors', updatedAuthors);
  };

  const removeAuthor = (index: number) => {
    updateField('authors', reference.authors.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validation
    if (!reference.title.trim()) {
      alert('Title is required');
      return;
    }
    if (reference.authors.length === 0) {
      alert('At least one author is required');
      return;
    }

    onSave(reference);
  };

  // Render type-specific fields
  const renderTypeSpecificFields = () => {
    switch (reference.type) {
      case 'book':
        const bookRef = reference as BookReference;
        return (
          <>
            <Input
              label="Publisher *"
              value={bookRef.publisher || ''}
              onChange={(e) => updateField('publisher', e.target.value)}
              placeholder="Publisher name"
            />
            <Input
              label="Publisher Location"
              value={bookRef.publisherLocation || ''}
              onChange={(e) => updateField('publisherLocation', e.target.value)}
              placeholder="City, Country"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Edition"
                value={bookRef.edition || ''}
                onChange={(e) => updateField('edition', e.target.value)}
                placeholder="e.g., 2nd ed."
              />
              <Input
                label="Volume"
                value={bookRef.volume || ''}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="Volume number"
              />
            </div>
            <Input
              label="ISBN"
              value={bookRef.isbn || ''}
              onChange={(e) => updateField('isbn', e.target.value)}
              placeholder="ISBN-13 or ISBN-10"
            />
            <Input
              label="Pages"
              value={bookRef.pages || ''}
              onChange={(e) => updateField('pages', e.target.value)}
              placeholder="Total pages or page range"
            />
          </>
        );

      case 'journal':
        const journalRef = reference as JournalReference;
        return (
          <>
            <Input
              label="Journal Title *"
              value={journalRef.journalTitle || ''}
              onChange={(e) => updateField('journalTitle', e.target.value)}
              placeholder="Name of the journal"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Volume"
                value={journalRef.volume || ''}
                onChange={(e) => updateField('volume', e.target.value)}
                placeholder="Vol."
              />
              <Input
                label="Issue"
                value={journalRef.issue || ''}
                onChange={(e) => updateField('issue', e.target.value)}
                placeholder="Issue no."
              />
              <Input
                label="Pages *"
                value={journalRef.pages || ''}
                onChange={(e) => updateField('pages', e.target.value)}
                placeholder="e.g., 123-145"
              />
            </div>
            <Input
              label="ISSN"
              value={journalRef.issn || ''}
              onChange={(e) => updateField('issn', e.target.value)}
              placeholder="ISSN number"
            />
          </>
        );

      case 'website':
        const websiteRef = reference as WebsiteReference;
        return (
          <>
            <Input
              label="Website Name"
              value={websiteRef.websiteName || ''}
              onChange={(e) => updateField('websiteName', e.target.value)}
              placeholder="Name of the website"
            />
            <Input
              label="Publication Date"
              type="date"
              value={websiteRef.publicationDate || ''}
              onChange={(e) => updateField('publicationDate', e.target.value)}
            />
            <Input
              label="Retrieved Date *"
              type="date"
              value={websiteRef.retrievedDate || ''}
              onChange={(e) => updateField('retrievedDate', e.target.value)}
            />
          </>
        );

      case 'conference':
        return (
          <>
            <Input
              label="Conference Name *"
              value={(reference as any).conferenceName || ''}
              onChange={(e) => updateField('conferenceName', e.target.value)}
              placeholder="Full conference name"
            />
            <Input
              label="Conference Location *"
              value={(reference as any).conferenceLocation || ''}
              onChange={(e) => updateField('conferenceLocation', e.target.value)}
              placeholder="City, Country"
            />
            <Input
              label="Conference Date *"
              type="date"
              value={(reference as any).conferenceDate || ''}
              onChange={(e) => updateField('conferenceDate', e.target.value)}
            />
            <Input
              label="Pages"
              value={(reference as any).pages || ''}
              onChange={(e) => updateField('pages', e.target.value)}
              placeholder="Page range"
            />
          </>
        );

      case 'thesis':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Thesis Type *
              </label>
              <select
                value={(reference as any).thesisType || 'PhD'}
                onChange={(e) => updateField('thesisType', e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
              >
                <option value="PhD">PhD Dissertation</option>
                <option value="Masters">Master's Thesis</option>
                <option value="Undergraduate">Undergraduate Thesis</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              label="Institution *"
              value={(reference as any).institution || ''}
              onChange={(e) => updateField('institution', e.target.value)}
              placeholder="University or institution name"
            />
            <Input
              label="Department"
              value={(reference as any).department || ''}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="Department name"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {initialReference.id ? 'Edit' : 'Add'} {REFERENCE_TYPE_LABELS[reference.type]}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <Input
          label="Title *"
          value={reference.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Full title of the work"
        />

        {/* Authors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Authors *
          </label>
          {reference.authors.map((author, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
              <Input
                placeholder="First Name"
                value={author.firstName || ''}
                onChange={(e) => updateAuthor(index, 'firstName', e.target.value)}
                className="col-span-3"
              />
              <Input
                placeholder="Middle Name"
                value={author.middleName || ''}
                onChange={(e) => updateAuthor(index, 'middleName', e.target.value)}
                className="col-span-3"
              />
              <Input
                placeholder="Last Name *"
                value={author.lastName}
                onChange={(e) => updateAuthor(index, 'lastName', e.target.value)}
                className="col-span-4"
              />
              <Input
                placeholder="Suffix"
                value={author.suffix || ''}
                onChange={(e) => updateAuthor(index, 'suffix', e.target.value)}
                className="col-span-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAuthor(index)}
                className="col-span-1 text-red-600 dark:text-red-400"
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAuthor}>
            + Add Author
          </Button>
        </div>

        {/* Year */}
        <Input
          label="Year"
          type="number"
          value={reference.year || ''}
          onChange={(e) => updateField('year', parseInt(e.target.value) || undefined)}
          placeholder="Publication year"
          min={1000}
          max={new Date().getFullYear() + 10}
        />

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* URL */}
        <Input
          label="URL"
          value={reference.url || ''}
          onChange={(e) => updateField('url', e.target.value)}
          placeholder="https://..."
        />

        {/* DOI */}
        <Input
          label="DOI"
          value={reference.doi || ''}
          onChange={(e) => updateField('doi', e.target.value)}
          placeholder="Digital Object Identifier"
        />

        {/* Access Date (for online sources) */}
        {(reference.type === 'website' || reference.url) && (
          <Input
            label="Access Date"
            type="date"
            value={reference.accessDate || ''}
            onChange={(e) => updateField('accessDate', e.target.value)}
          />
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={reference.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Additional notes or annotations..."
            rows={3}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-4 py-2 text-gray-900 dark:text-white"
          />
        </div>

        {/* Tags */}
        <Input
          label="Tags (Optional)"
          value={reference.tags?.join(', ') || ''}
          onChange={(e) =>
            updateField(
              'tags',
              e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
            )
          }
          placeholder="Separate tags with commas"
        />

        {/* Citation Key */}
        <Input
          label="Citation Key (Optional)"
          value={reference.citationKey || ''}
          onChange={(e) => updateField('citationKey', e.target.value)}
          placeholder="e.g., Smith2023"
          helperText="Used for BibTeX export and quick citations"
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Reference
          </Button>
        </div>
      </div>
    </div>
  );
};



