// Types for the Immersive 3D Book Reader

export type ReadingTheme = 'day' | 'night' | 'sepia' | 'focus';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type AmbientSoundType = 'fireplace' | 'rain' | 'library' | null;

export interface ThemeConfig {
  name: string;
  background: string;
  pageBackground: string;
  textColor: string;
  accentColor: string;
  spineColor: string;
  shadowColor: string;
  icon: string;
}

export const READING_THEMES: Record<ReadingTheme, ThemeConfig> = {
  day: {
    name: 'Day',
    background: 'from-slate-100 via-gray-50 to-slate-100',
    pageBackground: '#fffef7',
    textColor: '#1f2937',
    accentColor: '#d97706',
    spineColor: '#92400e',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    icon: '☀️',
  },
  night: {
    name: 'Night',
    background: 'from-gray-950 via-black to-gray-950',
    pageBackground: '#0a0a0a',
    textColor: '#e5e5e5',
    accentColor: '#fbbf24',
    spineColor: '#1f2937',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    icon: '🌙',
  },
  sepia: {
    name: 'Sepia',
    background: 'from-amber-100 via-orange-50 to-amber-100',
    pageBackground: '#fef3c7',
    textColor: '#451a03',
    accentColor: '#b45309',
    spineColor: '#78350f',
    shadowColor: 'rgba(120, 53, 15, 0.2)',
    icon: '📜',
  },
  focus: {
    name: 'Focus',
    background: 'from-neutral-900 via-neutral-800 to-neutral-900',
    pageBackground: '#262626',
    textColor: '#fafafa',
    accentColor: '#a3a3a3',
    spineColor: '#404040',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    icon: '🎯',
  },
};

export interface Chapter {
  id: number;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'completed';
  audioUrl?: string | null;
  audioDuration?: number | null;
}

export interface BookData {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: Chapter[];
}

export interface ReadingState {
  currentChapter: number;
  currentPage: number; // Page within current chapter (0-indexed)
  totalPagesInChapter: number;
  theme: ReadingTheme;
  fontSize: FontSize;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  soundEffectsEnabled: boolean;
}

export interface PageDimensions {
  width: number;
  height: number;
  linesPerPage: number;
  charsPerLine: number;
}

export interface PaginatedContent {
  pages: string[][];  // Array of pages, each page is array of paragraphs
  totalPages: number;
}

export interface ImmersiveReaderProps {
  bookId: number;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  chapters: Chapter[];
  initialChapterIndex?: number;
  initialPage?: number;
  onClose?: () => void;
}

export interface Book3DProps {
  leftPageContent: string[];
  rightPageContent: string[];
  leftPageNumber: number;
  rightPageNumber: number;
  totalPages: number;
  chapterTitle: string;
  theme: ReadingTheme;
  fontSize: FontSize;
  isFlipping: boolean;
  flipDirection: 'forward' | 'backward';
  onFlipComplete?: () => void;
  onPageClick: (direction: 'prev' | 'next') => void;
}

export interface PageFlipProps {
  frontContent: string[];
  backContent: string[];
  isFlipping: boolean;
  direction: 'forward' | 'backward';
  theme: ReadingTheme;
  fontSize: FontSize;
  pageNumber: number;
  onAnimationComplete?: () => void;
}

export interface ReadingControlsProps {
  currentPage: number;
  totalPages: number;
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  theme: ReadingTheme;
  fontSize: FontSize;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  soundEffectsEnabled: boolean;
  onThemeChange: (theme: ReadingTheme) => void;
  onFontSizeChange: (size: FontSize) => void;
  onAmbientSoundChange: (sound: AmbientSoundType) => void;
  onAmbientVolumeChange: (volume: number) => void;
  onSoundEffectsToggle: () => void;
  onOpenTOC: () => void;
  onClose: () => void;
}

export interface ThemeSelectorProps {
  currentTheme: ReadingTheme;
  onSelect: (theme: ReadingTheme) => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface TableOfContentsProps {
  chapters: Chapter[];
  currentChapter: number;
  onSelectChapter: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
  theme: ReadingTheme;
}

export interface AmbientSoundManagerProps {
  currentSound: AmbientSoundType;
  volume: number;
  isPlaying: boolean;
}

export interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
  currentChapter: number;
  totalChapters: number;
  theme: ReadingTheme;
}

// Font size configurations - Enhanced for larger book display
export const FONT_SIZE_CONFIG: Record<FontSize, { 
  className: string; 
  lineHeight: string;
  linesPerPage: number;
}> = {
  sm: { className: 'text-base', lineHeight: 'leading-relaxed', linesPerPage: 28 },
  base: { className: 'text-lg', lineHeight: 'leading-relaxed', linesPerPage: 24 },
  lg: { className: 'text-xl', lineHeight: 'leading-loose', linesPerPage: 20 },
  xl: { className: 'text-2xl', lineHeight: 'leading-loose', linesPerPage: 16 },
};

// Ambient sound configurations
export const AMBIENT_SOUNDS: { id: AmbientSoundType; name: string; icon: string; file: string }[] = [
  { id: 'fireplace', name: 'Fireplace', icon: '🔥', file: '/sounds/ambiance-fireplace.mp3' },
  { id: 'rain', name: 'Rain', icon: '🌧️', file: '/sounds/ambiance-rain.mp3' },
  { id: 'library', name: 'Library', icon: '📚', file: '/sounds/ambiance-library.mp3' },
];

export const PAGE_TURN_SOUND = '/sounds/page-turn.mp3';
