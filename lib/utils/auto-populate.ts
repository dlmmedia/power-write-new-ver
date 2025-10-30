import { SelectedBook } from '@/lib/types/book';
import { BookConfiguration } from '@/lib/types/studio';

/**
 * Generate a sample book title inspired by the reference book
 */
export function generateSampleTitle(referenceBook: SelectedBook): string {
  const genre = referenceBook.genre || referenceBook.categories?.[0] || 'fiction';
  const themes = extractThemes(referenceBook);
  
  // Generate a title based on genre
  const titleTemplates = {
    fiction: [
      'The Chronicles of Tomorrow',
      'Beyond the Horizon',
      'Whispers in the Wind',
      'The Last Journey',
      'Echoes of Eternity',
    ],
    fantasy: [
      'Realm of Shadows',
      'The Dragon\'s Legacy',
      'Crown of Stars',
      'The Enchanted Kingdom',
      'Sword of Destiny',
    ],
    'science fiction': [
      'The Quantum Paradox',
      'Stellar Convergence',
      'The Synthetic Dawn',
      'Beyond the Void',
      'The Neural Network',
    ],
    mystery: [
      'The Hidden Truth',
      'Shadow of Doubt',
      'The Silent Witness',
      'Beneath the Surface',
      'The Last Clue',
    ],
    romance: [
      'Hearts Entwined',
      'A Second Chance',
      'Love Beyond Time',
      'The Promise',
      'Destined Hearts',
    ],
    thriller: [
      'The Final Hour',
      'Point of No Return',
      'Deadly Secrets',
      'The Reckoning',
      'Edge of Darkness',
    ],
  };

  const genreLower = genre.toLowerCase();
  const templates = titleTemplates[genreLower as keyof typeof titleTemplates] || titleTemplates.fiction;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return randomTemplate;
}

/**
 * Generate a sample book description based on the reference book
 */
export function generateSampleDescription(referenceBook: SelectedBook): string {
  const genre = referenceBook.genre || referenceBook.categories?.[0] || 'fiction';
  const themes = extractThemes(referenceBook);
  
  const descriptions = [
    `A compelling ${genre} novel that explores themes of ${themes.join(', ')}. Follow the journey of unforgettable characters as they navigate a world filled with challenges, discoveries, and transformations.`,
    
    `In the tradition of ${referenceBook.title}, this ${genre} story weaves together elements of adventure, emotion, and intrigue. A tale that will keep readers engaged from the first page to the last.`,
    
    `An immersive ${genre} experience that combines rich storytelling with deep character development. Set against a backdrop of ${themes[0] || 'human experience'}, this novel explores what it means to overcome adversity and find meaning.`,
    
    `Drawing inspiration from classic ${genre} works, this novel presents a fresh take on themes of ${themes.slice(0, 2).join(' and ')}. A story of courage, determination, and the power of hope.`,
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Extract themes from the book metadata
 */
function extractThemes(book: SelectedBook): string[] {
  const themes: string[] = [];
  
  if (book.metadata?.themes) {
    themes.push(...book.metadata.themes);
  }
  
  // Extract from categories
  if (book.categories) {
    themes.push(...book.categories.slice(0, 3));
  }
  
  // Default themes if none found
  if (themes.length === 0) {
    themes.push('adventure', 'discovery', 'transformation');
  }
  
  return themes.slice(0, 3);
}

/**
 * Map genre from book to studio genre options
 */
export function mapGenre(referenceBook: SelectedBook): string {
  const genre = referenceBook.genre || referenceBook.categories?.[0] || '';
  const genreLower = genre.toLowerCase();
  
  const genreMap: { [key: string]: string } = {
    'fiction': 'fiction',
    'fantasy': 'fantasy',
    'science fiction': 'science fiction',
    'sci-fi': 'science fiction',
    'romance': 'romance',
    'thriller': 'thriller',
    'mystery': 'mystery',
    'horror': 'horror',
    'historical': 'historical fiction',
    'contemporary': 'contemporary',
    'young adult': 'young adult',
    'ya': 'young adult',
    'literary': 'literary fiction',
    'biography': 'biography',
    'memoir': 'memoir',
    'self-help': 'self-help',
    'business': 'business',
    'non-fiction': 'non-fiction',
  };
  
  for (const [key, value] of Object.entries(genreMap)) {
    if (genreLower.includes(key)) {
      return value;
    }
  }
  
  return 'fiction';
}

/**
 * Determine writing style from book metadata
 */
export function inferWritingStyle(referenceBook: SelectedBook): BookConfiguration['writingStyle'] {
  const genre = referenceBook.genre || referenceBook.categories?.[0] || '';
  const genreLower = genre.toLowerCase();
  
  // Default style based on genre
  const styles: { [key: string]: BookConfiguration['writingStyle'] } = {
    'academic': {
      style: 'academic',
      tone: 'serious',
      pov: 'third-person-omniscient',
      tense: 'present',
      narrativeVoice: 'descriptive',
    },
    'business': {
      style: 'formal',
      tone: 'serious',
      pov: 'third-person-omniscient',
      tense: 'present',
      narrativeVoice: 'active',
    },
    'fantasy': {
      style: 'poetic',
      tone: 'serious',
      pov: 'third-person-limited',
      tense: 'past',
      narrativeVoice: 'descriptive',
    },
    'romance': {
      style: 'conversational',
      tone: 'light-hearted',
      pov: 'first-person',
      tense: 'past',
      narrativeVoice: 'dialogue-heavy',
    },
    'thriller': {
      style: 'casual',
      tone: 'dark',
      pov: 'third-person-limited',
      tense: 'present',
      narrativeVoice: 'active',
    },
    'mystery': {
      style: 'casual',
      tone: 'serious',
      pov: 'first-person',
      tense: 'past',
      narrativeVoice: 'active',
    },
  };
  
  for (const [key, value] of Object.entries(styles)) {
    if (genreLower.includes(key)) {
      return value;
    }
  }
  
  // Default conversational style
  return {
    style: 'conversational',
    tone: 'neutral',
    pov: 'third-person-limited',
    tense: 'past',
    narrativeVoice: 'active',
  };
}

/**
 * Determine target audience from book metadata
 */
export function inferAudience(referenceBook: SelectedBook): BookConfiguration['audience'] {
  const genre = referenceBook.genre || referenceBook.categories?.[0] || '';
  const genreLower = genre.toLowerCase();
  
  if (genreLower.includes('young adult') || genreLower.includes('ya')) {
    return {
      targetAudience: 'young-adult',
      ageRange: { min: 13, max: 18 },
      readingLevel: 'high-school',
      purpose: 'entertainment',
    };
  }
  
  if (genreLower.includes('children')) {
    return {
      targetAudience: 'children',
      ageRange: { min: 8, max: 12 },
      readingLevel: 'elementary',
      purpose: 'entertainment',
    };
  }
  
  if (genreLower.includes('academic') || genreLower.includes('textbook')) {
    return {
      targetAudience: 'academic',
      readingLevel: 'college',
      purpose: 'education',
    };
  }
  
  if (genreLower.includes('business') || genreLower.includes('professional')) {
    return {
      targetAudience: 'professional',
      readingLevel: 'college',
      purpose: 'professional',
    };
  }
  
  if (genreLower.includes('self-help') || genreLower.includes('self help')) {
    return {
      targetAudience: 'adult',
      readingLevel: 'high-school',
      purpose: 'self-help',
    };
  }
  
  return {
    targetAudience: 'adult',
    readingLevel: 'high-school',
    purpose: 'entertainment',
  };
}

/**
 * Auto-populate configuration from a reference book
 */
export function autoPopulateFromBook(
  referenceBook: SelectedBook,
  currentConfig: BookConfiguration,
  authorName: string = 'Your Name'
): BookConfiguration {
  const sampleTitle = generateSampleTitle(referenceBook);
  const sampleDescription = generateSampleDescription(referenceBook);
  const mappedGenre = mapGenre(referenceBook);
  const writingStyle = inferWritingStyle(referenceBook);
  const audience = inferAudience(referenceBook);
  const themes = extractThemes(referenceBook);
  
  return {
    ...currentConfig,
    basicInfo: {
      ...currentConfig.basicInfo,
      title: sampleTitle,
      author: authorName,
      genre: mappedGenre,
      subGenre: referenceBook.categories?.[1] || '',
    },
    content: {
      ...currentConfig.content,
      description: sampleDescription,
      targetWordCount: referenceBook.pageCount 
        ? Math.round(referenceBook.pageCount * 250) // ~250 words per page
        : 80000,
      numChapters: referenceBook.pageCount 
        ? Math.max(10, Math.round(referenceBook.pageCount / 25)) // ~25 pages per chapter
        : 15,
    },
    writingStyle: {
      ...currentConfig.writingStyle,
      ...writingStyle,
    },
    audience: {
      ...currentConfig.audience,
      ...audience,
    },
    themes: {
      ...currentConfig.themes,
      primary: themes,
    },
    setting: {
      ...currentConfig.setting,
      timePeriod: mappedGenre.includes('historical') ? 'historical' :
                  mappedGenre.includes('science fiction') ? 'future' :
                  mappedGenre.includes('fantasy') ? 'fantasy' : 'contemporary',
      location: mappedGenre.includes('fantasy') || mappedGenre.includes('science fiction') 
        ? 'fictional' : 'real-world',
    },
    referenceBooks: {
      selectedBookIds: [referenceBook.id],
      autoPopulated: true,
    },
  };
}
