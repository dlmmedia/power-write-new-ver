// Citation Formatting Service
// Formats references according to different citation styles

import {
  Reference,
  Author,
  CitationStyle,
  FormattedCitation,
  InTextCitation,
  BookReference,
  JournalReference,
  WebsiteReference,
  NewspaperReference,
  MagazineReference,
  ConferenceReference,
  ThesisReference,
  ReportReference,
  PatentReference,
  VideoReference,
  PodcastReference,
  InterviewReference,
  GovernmentReference,
  LegalReference,
  SoftwareReference,
  DatasetReference,
  PresentationReference,
  ManuscriptReference,
  ArchiveReference,
  PersonalReference,
} from '@/lib/types/bibliography';

export class CitationService {
  // Format author name based on citation style
  static formatAuthor(author: Author, style: CitationStyle, isFirst: boolean = true): string {
    if (author.organization) {
      return author.organization;
    }

    const { firstName, middleName, lastName, suffix } = author;

    switch (style) {
      case 'APA':
      case 'Harvard':
      case 'Vancouver':
      case 'AMA':
        // Last, F. M.
        const initials = [firstName, middleName]
          .filter(Boolean)
          .map(name => name![0].toUpperCase() + '.')
          .join(' ');
        return `${lastName}, ${initials}${suffix ? `, ${suffix}` : ''}`.trim();

      case 'MLA':
        // Last, First Middle
        if (isFirst) {
          const middle = middleName ? ` ${middleName}` : '';
          return `${lastName}, ${firstName}${middle}${suffix ? `, ${suffix}` : ''}`.trim();
        } else {
          // Subsequent authors: First Middle Last
          const middle = middleName ? ` ${middleName}` : '';
          return `${firstName}${middle} ${lastName}${suffix ? `, ${suffix}` : ''}`.trim();
        }

      case 'Chicago':
        // Last, First Middle
        const middle = middleName ? ` ${middleName}` : '';
        return `${lastName}, ${firstName}${middle}${suffix ? `, ${suffix}` : ''}`.trim();

      case 'IEEE':
        // F. M. Last
        const ieeeInitials = [firstName, middleName]
          .filter(Boolean)
          .map(name => name![0].toUpperCase() + '.')
          .join(' ');
        return `${ieeeInitials} ${lastName}${suffix ? `, ${suffix}` : ''}`.trim();

      default:
        return `${firstName} ${lastName}`;
    }
  }

  // Format multiple authors
  static formatAuthors(authors: Author[], style: CitationStyle, maxAuthors: number = 999): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return this.formatAuthor(authors[0], style);

    const formatted = authors.slice(0, maxAuthors).map((author, index) => 
      this.formatAuthor(author, style, index === 0)
    );

    switch (style) {
      case 'APA':
        if (authors.length > 20) {
          return `${formatted.slice(0, 19).join(', ')}, ... ${this.formatAuthor(authors[authors.length - 1], style)}`;
        }
        if (authors.length === 2) {
          return `${formatted[0]} & ${formatted[1]}`;
        }
        return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;

      case 'MLA':
        if (authors.length > 3) {
          return `${formatted[0]}, et al.`;
        }
        if (authors.length === 2) {
          return `${formatted[0]}, and ${formatted[1]}`;
        }
        return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;

      case 'Chicago':
        if (authors.length > 10) {
          return `${formatted.slice(0, 7).join(', ')}, et al.`;
        }
        if (authors.length === 2) {
          return `${formatted[0]} and ${formatted[1]}`;
        }
        return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;

      case 'Harvard':
        if (authors.length > 3) {
          return `${formatted[0]} et al.`;
        }
        if (authors.length === 2) {
          return `${formatted[0]} and ${formatted[1]}`;
        }
        return `${formatted.slice(0, -1).join(', ')} and ${formatted[formatted.length - 1]}`;

      case 'IEEE':
        if (authors.length > 6) {
          return `${formatted.slice(0, 1).join(', ')}, et al.`;
        }
        return formatted.join(', ');

      case 'Vancouver':
      case 'AMA':
        if (authors.length > 6) {
          return `${formatted.slice(0, 6).join(', ')}, et al.`;
        }
        return formatted.join(', ');

      default:
        return formatted.join(', ');
    }
  }

  // Format in-text citation
  static formatInTextCitation(
    reference: Reference,
    citation: InTextCitation,
    style: CitationStyle
  ): string {
    const authors = reference.authors;
    const year = reference.year || 'n.d.';

    switch (style) {
      case 'APA':
      case 'Harvard':
        if (authors.length === 0) {
          return `(${reference.title}, ${year})`;
        }
        if (authors.length === 1) {
          const lastName = authors[0].organization || authors[0].lastName;
          return citation.pageNumber 
            ? `(${lastName}, ${year}, p. ${citation.pageNumber})`
            : `(${lastName}, ${year})`;
        }
        if (authors.length === 2) {
          const names = authors.map(a => a.organization || a.lastName).join(' & ');
          return citation.pageNumber
            ? `(${names}, ${year}, p. ${citation.pageNumber})`
            : `(${names}, ${year})`;
        }
        // 3+ authors
        const firstAuthor = authors[0].organization || authors[0].lastName;
        return citation.pageNumber
          ? `(${firstAuthor} et al., ${year}, p. ${citation.pageNumber})`
          : `(${firstAuthor} et al., ${year})`;

      case 'MLA':
        if (authors.length === 0) {
          const shortTitle = reference.title.split(' ').slice(0, 3).join(' ');
          return citation.pageNumber
            ? `("${shortTitle}" ${citation.pageNumber})`
            : `("${shortTitle}")`;
        }
        if (authors.length === 1) {
          const lastName = authors[0].organization || authors[0].lastName;
          return citation.pageNumber
            ? `(${lastName} ${citation.pageNumber})`
            : `(${lastName})`;
        }
        if (authors.length === 2) {
          const names = authors.map(a => a.organization || a.lastName).join(' and ');
          return citation.pageNumber
            ? `(${names} ${citation.pageNumber})`
            : `(${names})`;
        }
        // 3+ authors
        const mlaFirst = authors[0].organization || authors[0].lastName;
        return citation.pageNumber
          ? `(${mlaFirst} et al. ${citation.pageNumber})`
          : `(${mlaFirst} et al.)`;

      case 'Chicago':
        // Chicago uses footnotes, return superscript number
        return `<sup>${citation.id}</sup>`;

      case 'IEEE':
        // IEEE uses numbered references
        return `[${citation.id}]`;

      case 'Vancouver':
      case 'AMA':
        // Vancouver/AMA use superscript numbers
        return `<sup>${citation.id}</sup>`;

      default:
        return `(${authors[0]?.lastName || reference.title}, ${year})`;
    }
  }

  // Format full reference for bibliography
  static formatReference(reference: Reference, style: CitationStyle, index?: number): string {
    switch (reference.type) {
      case 'book':
        return this.formatBookReference(reference, style, index);
      case 'journal':
        return this.formatJournalReference(reference, style, index);
      case 'website':
        return this.formatWebsiteReference(reference, style, index);
      case 'newspaper':
        return this.formatNewspaperReference(reference, style, index);
      case 'magazine':
        return this.formatMagazineReference(reference, style, index);
      case 'conference':
        return this.formatConferenceReference(reference, style, index);
      case 'thesis':
        return this.formatThesisReference(reference, style, index);
      case 'report':
        return this.formatReportReference(reference, style, index);
      case 'patent':
        return this.formatPatentReference(reference, style, index);
      case 'video':
        return this.formatVideoReference(reference, style, index);
      case 'podcast':
        return this.formatPodcastReference(reference, style, index);
      case 'interview':
        return this.formatInterviewReference(reference, style, index);
      case 'government':
        return this.formatGovernmentReference(reference, style, index);
      case 'legal':
        return this.formatLegalReference(reference, style, index);
      case 'software':
        return this.formatSoftwareReference(reference, style, index);
      case 'dataset':
        return this.formatDatasetReference(reference, style, index);
      case 'presentation':
        return this.formatPresentationReference(reference, style, index);
      case 'manuscript':
        return this.formatManuscriptReference(reference, style, index);
      case 'archive':
        return this.formatArchiveReference(reference, style, index);
      case 'personal':
        return this.formatPersonalReference(reference, style, index);
      default:
        // Fallback for any unhandled reference types
        const fallbackRef = reference as any;
        return `${fallbackRef.title || 'Untitled'} (${fallbackRef.year || 'n.d.'})`;
    }
  }

  // Book reference formatting
  private static formatBookReference(ref: BookReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const year = ref.year || 'n.d.';
    const title = ref.title;
    const edition = ref.edition ? ` (${ref.edition})` : '';
    const volume = ref.volume ? `, Vol. ${ref.volume}` : '';
    const publisher = ref.publisher;
    const location = ref.publisherLocation;

    switch (style) {
      case 'APA':
        return `${authors} (${year}). <em>${title}</em>${edition}${volume}. ${publisher}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;

      case 'MLA':
        const editors = ref.editors ? `, edited by ${this.formatAuthors(ref.editors, style)}` : '';
        return `${authors}. <em>${title}</em>${editors}${edition}${volume}. ${publisher}, ${year}.`;

      case 'Chicago':
        return `${authors}. <em>${title}</em>${edition}${volume}. ${location ? `${location}: ` : ''}${publisher}, ${year}.`;

      case 'Harvard':
        return `${authors} ${year}. <em>${title}</em>${edition}${volume}. ${location ? `${location}: ` : ''}${publisher}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, <em>${title}</em>${edition}${volume}. ${location ? `${location}: ` : ''}${publisher}, ${year}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}${edition}${volume}. ${location ? `${location}: ` : ''}${publisher}; ${year}.`;

      default:
        return `${authors} (${year}). ${title}. ${publisher}.`;
    }
  }

  // Journal reference formatting
  private static formatJournalReference(ref: JournalReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const year = ref.year || 'n.d.';
    const title = ref.title;
    const journal = ref.journalTitle;
    const volume = ref.volume;
    const issue = ref.issue ? `(${ref.issue})` : '';
    const pages = ref.pages;

    switch (style) {
      case 'APA':
        return `${authors} (${year}). ${title}. <em>${journal}</em>, <em>${volume}</em>${issue}, ${pages}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;

      case 'MLA':
        return `${authors}. "${title}." <em>${journal}</em>, vol. ${volume}, no. ${ref.issue || '?'}, ${year}, pp. ${pages}.`;

      case 'Chicago':
        return `${authors}. "${title}." <em>${journal}</em> ${volume}, no. ${ref.issue || '?'} (${year}): ${pages}.`;

      case 'Harvard':
        return `${authors} ${year}. '${title}', <em>${journal}</em>, ${volume}${issue}, pp. ${pages}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," <em>${journal}</em>, vol. ${volume}, no. ${ref.issue || '?'}, pp. ${pages}, ${year}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}. ${journal}. ${year};${volume}${issue}:${pages}.`;

      default:
        return `${authors} (${year}). ${title}. ${journal}, ${volume}${issue}, ${pages}.`;
    }
  }

  // Website reference formatting
  private static formatWebsiteReference(ref: WebsiteReference, style: CitationStyle, index?: number): string {
    const authors = ref.authors.length > 0 ? this.formatAuthors(ref.authors, style) : ref.websiteName || 'Unknown';
    const year = ref.year || ref.publicationDate || 'n.d.';
    const title = ref.title;
    const website = ref.websiteName;
    const url = ref.url;
    const retrieved = ref.retrievedDate;

    switch (style) {
      case 'APA':
        return `${authors} (${year}). <em>${title}</em>. ${website ? `${website}. ` : ''}Retrieved ${retrieved} from ${url}`;

      case 'MLA':
        return `${authors}. "${title}." <em>${website || 'Web'}</em>, ${year}, ${url}. Accessed ${retrieved}.`;

      case 'Chicago':
        return `${authors}. "${title}." ${website ? `<em>${website}</em>. ` : ''}Accessed ${retrieved}. ${url}.`;

      case 'Harvard':
        return `${authors} ${year}. ${title}. [online] ${website ? `${website}. ` : ''}Available at: ${url} [Accessed ${retrieved}].`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," ${website || 'Website'}, ${year}. [Online]. Available: ${url}. [Accessed: ${retrieved}].`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title} [Internet]. ${website ? `${website}; ` : ''}${year} [cited ${retrieved}]. Available from: ${url}`;

      default:
        return `${authors} (${year}). ${title}. Retrieved from ${url}`;
    }
  }

  // Newspaper reference formatting
  private static formatNewspaperReference(ref: NewspaperReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const title = ref.title;
    const newspaper = ref.newspaperName;
    const date = ref.publicationDate;
    const pages = ref.pages;

    switch (style) {
      case 'APA':
        return `${authors} (${date}). ${title}. <em>${newspaper}</em>${pages ? `, ${pages}` : ''}.${ref.url ? ` ${ref.url}` : ''}`;

      case 'MLA':
        return `${authors}. "${title}." <em>${newspaper}</em>, ${date}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Chicago':
        return `${authors}. "${title}." <em>${newspaper}</em>, ${date}${pages ? `, ${pages}` : ''}.`;

      case 'Harvard':
        return `${authors} ${date}. '${title}', <em>${newspaper}</em>${pages ? `, p. ${pages}` : ''}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," <em>${newspaper}</em>, ${date}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}. ${newspaper}. ${date}${pages ? `;${pages}` : ''}.`;

      default:
        return `${authors} (${date}). ${title}. ${newspaper}.`;
    }
  }

  // Magazine reference formatting
  private static formatMagazineReference(ref: MagazineReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const title = ref.title;
    const magazine = ref.magazineName;
    const date = ref.publicationDate;
    const pages = ref.pages;

    switch (style) {
      case 'APA':
        return `${authors} (${date}). ${title}. <em>${magazine}</em>${pages ? `, ${pages}` : ''}.`;

      case 'MLA':
        return `${authors}. "${title}." <em>${magazine}</em>, ${date}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Chicago':
        return `${authors}. "${title}." <em>${magazine}</em>, ${date}${pages ? `, ${pages}` : ''}.`;

      case 'Harvard':
        return `${authors} ${date}. '${title}', <em>${magazine}</em>${pages ? `, pp. ${pages}` : ''}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," <em>${magazine}</em>, ${date}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}. ${magazine}. ${date}${pages ? `;${pages}` : ''}.`;

      default:
        return `${authors} (${date}). ${title}. ${magazine}.`;
    }
  }

  // Conference reference formatting
  private static formatConferenceReference(ref: ConferenceReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const year = ref.year || ref.conferenceDate.split('-')[0];
    const title = ref.title;
    const conference = ref.conferenceName;
    const location = ref.conferenceLocation;
    const pages = ref.pages;

    switch (style) {
      case 'APA':
      case 'Harvard':
        return `${authors} (${year}). ${title}. In <em>${conference}</em>${location ? ` (${location})` : ''}${pages ? `, pp. ${pages}` : ''}.`;

      case 'MLA':
        return `${authors}. "${title}." <em>${conference}</em>, ${location}, ${year}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Chicago':
        return `${authors}. "${title}." Paper presented at ${conference}, ${location}, ${year}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," in <em>${conference}</em>, ${location}, ${year}${pages ? `, pp. ${pages}` : ''}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}. In: ${conference}; ${year}; ${location}${pages ? `. p. ${pages}` : ''}.`;

      default:
        return `${authors} (${year}). ${title}. ${conference}, ${location}.`;
    }
  }

  // Thesis reference formatting
  private static formatThesisReference(ref: ThesisReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const year = ref.year || 'n.d.';
    const title = ref.title;
    const type = ref.thesisType === 'PhD' ? 'Doctoral dissertation' : 
                 ref.thesisType === 'Masters' ? "Master's thesis" : 'Thesis';
    const institution = ref.institution;

    switch (style) {
      case 'APA':
        return `${authors} (${year}). <em>${title}</em> [${type}]. ${institution}.`;

      case 'MLA':
        return `${authors}. <em>${title}</em>. ${year}. ${institution}, ${type}.`;

      case 'Chicago':
        return `${authors}. "${title}." ${type}, ${institution}, ${year}.`;

      case 'Harvard':
        return `${authors} ${year}. <em>${title}</em>. ${type}, ${institution}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title}," ${type}, ${institution}, ${year}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title} [${type}]. ${institution}; ${year}.`;

      default:
        return `${authors} (${year}). ${title}. ${type}, ${institution}.`;
    }
  }

  // Report reference formatting
  private static formatReportReference(ref: ReportReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    const year = ref.year || 'n.d.';
    const title = ref.title;
    const reportNum = ref.reportNumber ? ` (Report No. ${ref.reportNumber})` : '';
    const institution = ref.institution;

    switch (style) {
      case 'APA':
        return `${authors} (${year}). <em>${title}</em>${reportNum}. ${institution}.`;

      case 'MLA':
        return `${authors}. <em>${title}</em>${reportNum}. ${institution}, ${year}.`;

      case 'Chicago':
        return `${authors}. <em>${title}</em>${reportNum}. ${institution}, ${year}.`;

      case 'Harvard':
        return `${authors} ${year}. <em>${title}</em>${reportNum}. ${institution}.`;

      case 'IEEE':
        return `[${index || 1}] ${authors}, "${title},"${reportNum} ${institution}, ${year}.`;

      case 'Vancouver':
      case 'AMA':
        return `${index || 1}. ${authors}. ${title}${reportNum}. ${institution}; ${year}.`;

      default:
        return `${authors} (${year}). ${title}. ${institution}.`;
    }
  }

  // Simplified formatters for other reference types
  private static formatPatentReference(ref: PatentReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.issueDate || ref.year}). ${ref.title}. ${ref.country} Patent No. ${ref.patentNumber}.`;
  }

  private static formatVideoReference(ref: VideoReference, style: CitationStyle, index?: number): string {
    const authors = ref.director ? this.formatAuthors([ref.director], style) : this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.releaseDate || ref.year}). <em>${ref.title}</em> [Video]. ${ref.platform || ref.studio}.${ref.url ? ` ${ref.url}` : ''}`;
  }

  private static formatPodcastReference(ref: PodcastReference, style: CitationStyle, index?: number): string {
    const hosts = ref.hosts ? this.formatAuthors(ref.hosts, style) : this.formatAuthors(ref.authors, style);
    return `${hosts} (${ref.releaseDate || ref.year}). ${ref.title} [Audio podcast episode]. In <em>${ref.podcastName}</em>.${ref.url ? ` ${ref.url}` : ''}`;
  }

  private static formatInterviewReference(ref: InterviewReference, style: CitationStyle, index?: number): string {
    const interviewee = this.formatAuthors([ref.interviewee], style);
    const interviewer = ref.interviewer ? ` Interview by ${this.formatAuthors([ref.interviewer], style)}.` : '';
    return `${interviewee} (${ref.interviewDate}). ${ref.title} [${ref.medium || 'Interview'}].${interviewer}`;
  }

  private static formatGovernmentReference(ref: GovernmentReference, style: CitationStyle, index?: number): string {
    return `${ref.department} (${ref.year}). <em>${ref.title}</em>${ref.documentNumber ? ` (${ref.documentNumber})` : ''}. ${ref.country}.`;
  }

  private static formatLegalReference(ref: LegalReference, style: CitationStyle, index?: number): string {
    return `<em>${ref.caseTitle || ref.title}</em>, ${ref.volume} ${ref.reporter} ${ref.pages} (${ref.court} ${ref.decisionDate || ref.year}).`;
  }

  private static formatSoftwareReference(ref: SoftwareReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.year}). <em>${ref.title}</em> (Version ${ref.version || '1.0'}) [Computer software]. ${ref.publisher || ''}.${ref.url ? ` ${ref.url}` : ''}`;
  }

  private static formatDatasetReference(ref: DatasetReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.year}). <em>${ref.title}</em> [Data set]${ref.version ? ` (Version ${ref.version})` : ''}. ${ref.publisher || ref.repository || ''}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;
  }

  private static formatPresentationReference(ref: PresentationReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.presentationDate}). <em>${ref.title}</em> [${ref.presentationType}]. ${ref.venue ? `${ref.venue}, ` : ''}${ref.location || ''}.`;
  }

  private static formatManuscriptReference(ref: ManuscriptReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.year || 'n.d.'}). <em>${ref.title}</em> [${ref.manuscriptType} manuscript]. ${ref.institution || ''}.`;
  }

  private static formatArchiveReference(ref: ArchiveReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.year || 'n.d.'}). ${ref.title}. ${ref.archiveName}, ${ref.archiveLocation}${ref.collectionName ? `, ${ref.collectionName}` : ''}.`;
  }

  private static formatPersonalReference(ref: PersonalReference, style: CitationStyle, index?: number): string {
    const authors = this.formatAuthors(ref.authors, style);
    return `${authors} (${ref.communicationDate}). ${ref.title} [${ref.communicationType}].`;
  }

  // Sort references
  static sortReferences(
    references: Reference[],
    sortBy: 'author' | 'date' | 'title' | 'type' | 'appearance',
    direction: 'asc' | 'desc' = 'asc'
  ): Reference[] {
    const sorted = [...references].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'author':
          const aAuthor = a.authors[0]?.lastName || a.authors[0]?.organization || a.title;
          const bAuthor = b.authors[0]?.lastName || b.authors[0]?.organization || b.title;
          comparison = aAuthor.localeCompare(bAuthor);
          break;

        case 'date':
          const aYear = a.year || 9999;
          const bYear = b.year || 9999;
          comparison = aYear - bYear;
          break;

        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;

        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;

        case 'appearance':
          // Sort by order of appearance (using id as proxy for insertion order)
          comparison = a.id.localeCompare(b.id);
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}

