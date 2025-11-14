// Comprehensive Bibliography System
// Supports multiple citation formats and reference types

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver' | 'AMA';
export type ReferenceType = 
  | 'book'
  | 'journal'
  | 'website'
  | 'newspaper'
  | 'magazine'
  | 'conference'
  | 'thesis'
  | 'report'
  | 'patent'
  | 'video'
  | 'podcast'
  | 'interview'
  | 'government'
  | 'legal'
  | 'software'
  | 'dataset'
  | 'presentation'
  | 'manuscript'
  | 'archive'
  | 'personal';

export type ReferenceLocation = 'footnote' | 'endnote' | 'in-text' | 'bibliography';

// Base reference interface
export interface BaseReference {
  id: string;
  type: ReferenceType;
  title: string;
  authors: Author[];
  year?: number;
  accessDate?: string; // For online sources
  url?: string;
  doi?: string; // Digital Object Identifier
  notes?: string;
  tags?: string[];
  citationKey?: string; // For BibTeX-style references
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  firstName?: string;
  middleName?: string;
  lastName: string;
  suffix?: string; // Jr., Sr., III, etc.
  organization?: string; // For corporate authors
}

// Specific reference types with their unique fields

export interface BookReference extends BaseReference {
  type: 'book';
  edition?: string;
  volume?: string;
  publisher: string;
  publisherLocation?: string;
  isbn?: string;
  pages?: string; // Total pages or page range
  editors?: Author[];
  translators?: Author[];
  series?: string;
  seriesNumber?: number;
}

export interface JournalReference extends BaseReference {
  type: 'journal';
  journalTitle: string;
  volume?: string;
  issue?: string;
  pages: string; // Page range
  issn?: string;
  publisher?: string;
  articleNumber?: string; // For electronic journals
}

export interface WebsiteReference extends BaseReference {
  type: 'website';
  websiteName?: string;
  publisher?: string;
  publicationDate?: string;
  retrievedDate: string;
}

export interface NewspaperReference extends BaseReference {
  type: 'newspaper';
  newspaperName: string;
  publicationDate: string;
  pages?: string;
  section?: string;
  edition?: string;
  city?: string;
}

export interface MagazineReference extends BaseReference {
  type: 'magazine';
  magazineName: string;
  volume?: string;
  issue?: string;
  publicationDate: string;
  pages?: string;
}

export interface ConferenceReference extends BaseReference {
  type: 'conference';
  conferenceName: string;
  conferenceLocation: string;
  conferenceDate: string;
  proceedings?: string;
  pages?: string;
  publisher?: string;
  editors?: Author[];
}

export interface ThesisReference extends BaseReference {
  type: 'thesis';
  thesisType: 'PhD' | 'Masters' | 'Undergraduate' | 'Other';
  institution: string;
  department?: string;
  location?: string;
  advisor?: Author;
}

export interface ReportReference extends BaseReference {
  type: 'report';
  reportType?: string; // Technical report, Research report, etc.
  reportNumber?: string;
  institution: string;
  location?: string;
  sponsor?: string;
}

export interface PatentReference extends BaseReference {
  type: 'patent';
  patentNumber: string;
  country: string;
  filingDate?: string;
  issueDate?: string;
  assignee?: string;
}

export interface VideoReference extends BaseReference {
  type: 'video';
  platform?: string; // YouTube, Vimeo, etc.
  duration?: string;
  director?: Author;
  producers?: Author[];
  studio?: string;
  releaseDate?: string;
}

export interface PodcastReference extends BaseReference {
  type: 'podcast';
  podcastName: string;
  episodeNumber?: string;
  hosts?: Author[];
  guests?: Author[];
  duration?: string;
  network?: string;
  releaseDate?: string;
}

export interface InterviewReference extends BaseReference {
  type: 'interview';
  interviewee: Author;
  interviewer?: Author;
  interviewDate: string;
  location?: string;
  medium?: string; // Personal, telephone, email, etc.
  transcript?: boolean;
}

export interface GovernmentReference extends BaseReference {
  type: 'government';
  department: string;
  country: string;
  documentNumber?: string;
  publicationType?: string;
  congress?: string; // For US government docs
  session?: string;
}

export interface LegalReference extends BaseReference {
  type: 'legal';
  caseTitle?: string;
  court?: string;
  reporter?: string;
  volume?: string;
  pages?: string;
  decisionDate?: string;
  docketNumber?: string;
}

export interface SoftwareReference extends BaseReference {
  type: 'software';
  version?: string;
  publisher?: string;
  platform?: string;
  programmingLanguage?: string;
  repository?: string; // GitHub, GitLab, etc.
  license?: string;
}

export interface DatasetReference extends BaseReference {
  type: 'dataset';
  version?: string;
  publisher?: string;
  repository?: string;
  dataType?: string;
  fileFormat?: string;
  size?: string;
}

export interface PresentationReference extends BaseReference {
  type: 'presentation';
  presentationType: 'Conference' | 'Lecture' | 'Seminar' | 'Webinar' | 'Other';
  venue?: string;
  location?: string;
  presentationDate: string;
  slides?: boolean;
}

export interface ManuscriptReference extends BaseReference {
  type: 'manuscript';
  manuscriptType: 'Unpublished' | 'In preparation' | 'Submitted' | 'Other';
  institution?: string;
  location?: string;
}

export interface ArchiveReference extends BaseReference {
  type: 'archive';
  archiveName: string;
  archiveLocation: string;
  collectionName?: string;
  collectionNumber?: string;
  boxNumber?: string;
  folderNumber?: string;
  itemNumber?: string;
}

export interface PersonalReference extends BaseReference {
  type: 'personal';
  communicationType: 'Email' | 'Letter' | 'Conversation' | 'Memo' | 'Other';
  recipient?: Author;
  communicationDate: string;
}

// Union type for all reference types
export type Reference = 
  | BookReference
  | JournalReference
  | WebsiteReference
  | NewspaperReference
  | MagazineReference
  | ConferenceReference
  | ThesisReference
  | ReportReference
  | PatentReference
  | VideoReference
  | PodcastReference
  | InterviewReference
  | GovernmentReference
  | LegalReference
  | SoftwareReference
  | DatasetReference
  | PresentationReference
  | ManuscriptReference
  | ArchiveReference
  | PersonalReference;

// In-text citation
export interface InTextCitation {
  id: string;
  referenceId: string;
  chapterId?: number;
  position: number; // Character position in text
  pageNumber?: string; // Specific page being cited
  paragraph?: string; // Specific paragraph
  quotation?: string; // Direct quote if applicable
  prefix?: string; // e.g., "see", "cf.", "as noted by"
  suffix?: string; // Additional context
  suppressAuthor?: boolean; // For narrative citations
  createdAt: Date;
}

// Chapter references (endnotes for a chapter)
export interface ChapterReferences {
  chapterId: number;
  chapterNumber: number;
  chapterTitle: string;
  citations: InTextCitation[];
  references: Reference[];
}

// Bibliography configuration
export interface BibliographyConfig {
  enabled: boolean;
  citationStyle: CitationStyle;
  location: ReferenceLocation[];
  sortBy: 'author' | 'date' | 'title' | 'type' | 'appearance';
  sortDirection: 'asc' | 'desc';
  includeAnnotations: boolean;
  includeAbstracts: boolean;
  hangingIndent: boolean;
  lineSpacing: 'single' | '1.5' | 'double';
  groupByType: boolean;
  numberingStyle?: 'none' | 'numeric' | 'alphabetic';
  showDOI: boolean;
  showURL: boolean;
  showAccessDate: boolean;
}

// Complete bibliography for a book
export interface BookBibliography {
  bookId: number;
  config: BibliographyConfig;
  references: Reference[];
  chapterReferences: ChapterReferences[];
  createdAt: Date;
  updatedAt: Date;
}

// Citation format result
export interface FormattedCitation {
  inText: string; // How it appears in the text
  fullReference: string; // How it appears in bibliography
  footnote?: string; // For footnote styles
  endnote?: string; // For endnote styles
}

// Helper types for creating references
export type CreateReferenceInput<T extends ReferenceType> = 
  T extends 'book' ? Omit<BookReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'journal' ? Omit<JournalReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'website' ? Omit<WebsiteReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'newspaper' ? Omit<NewspaperReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'magazine' ? Omit<MagazineReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'conference' ? Omit<ConferenceReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'thesis' ? Omit<ThesisReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'report' ? Omit<ReportReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'patent' ? Omit<PatentReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'video' ? Omit<VideoReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'podcast' ? Omit<PodcastReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'interview' ? Omit<InterviewReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'government' ? Omit<GovernmentReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'legal' ? Omit<LegalReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'software' ? Omit<SoftwareReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'dataset' ? Omit<DatasetReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'presentation' ? Omit<PresentationReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'manuscript' ? Omit<ManuscriptReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'archive' ? Omit<ArchiveReference, 'id' | 'createdAt' | 'updatedAt'> :
  T extends 'personal' ? Omit<PersonalReference, 'id' | 'createdAt' | 'updatedAt'> :
  never;

// Default bibliography configuration
export const defaultBibliographyConfig: BibliographyConfig = {
  enabled: false,
  citationStyle: 'APA',
  location: ['bibliography'],
  sortBy: 'author',
  sortDirection: 'asc',
  includeAnnotations: false,
  includeAbstracts: false,
  hangingIndent: true,
  lineSpacing: 'single',
  groupByType: false,
  numberingStyle: 'none',
  showDOI: true,
  showURL: true,
  showAccessDate: true,
};

// Reference type labels for UI
export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  book: 'Book',
  journal: 'Journal Article',
  website: 'Website',
  newspaper: 'Newspaper Article',
  magazine: 'Magazine Article',
  conference: 'Conference Paper',
  thesis: 'Thesis/Dissertation',
  report: 'Report',
  patent: 'Patent',
  video: 'Video',
  podcast: 'Podcast',
  interview: 'Interview',
  government: 'Government Document',
  legal: 'Legal Document',
  software: 'Software',
  dataset: 'Dataset',
  presentation: 'Presentation',
  manuscript: 'Manuscript',
  archive: 'Archival Material',
  personal: 'Personal Communication',
};

// Citation style labels
export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  APA: 'APA (American Psychological Association)',
  MLA: 'MLA (Modern Language Association)',
  Chicago: 'Chicago Manual of Style',
  Harvard: 'Harvard Referencing',
  IEEE: 'IEEE (Institute of Electrical and Electronics Engineers)',
  Vancouver: 'Vancouver System',
  AMA: 'AMA (American Medical Association)',
};

