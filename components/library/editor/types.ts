import { BookImageType, ImagePlacement, ImageSize } from '@/lib/types/book-images';

// Block types supported by the editor
export type BlockType = 
  | 'paragraph'
  | 'image'
  | 'divider'
  | 'quote'
  | 'callout';

// Callout variants
export type CalloutType = 'info' | 'warning' | 'tip' | 'note';

// Base block interface
export interface BaseBlock {
  id: string;
  type: BlockType;
}

// Paragraph block - regular text
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}

// Image block - inline image display
export interface ImageBlock extends BaseBlock {
  type: 'image';
  imageId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  placement: ImagePlacement;
  size: ImageSize;
  caption?: string;
  altText?: string;
}

// Divider block - horizontal rule
export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

// Quote block - blockquote
export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  attribution?: string;
}

// Callout block - note/info/warning boxes
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  calloutType: CalloutType;
  title?: string;
  content: string;
}

// Union type for all blocks
export type Block = 
  | ParagraphBlock 
  | ImageBlock 
  | DividerBlock 
  | QuoteBlock 
  | CalloutBlock;

// Editor state
export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  focusedBlockId: string | null;
}

// Block menu item
export interface BlockMenuItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  action: () => void;
}

// Image from the database (matching existing structure)
export interface ChapterImage {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageType: BookImageType;
  position: number;
  placement: ImagePlacement;
  caption?: string;
  altText?: string;
  chapterId?: number;
  metadata?: {
    size?: ImageSize;
    paragraphIndex?: number;
    [key: string]: unknown;
  };
}

// Callout type info
export const CALLOUT_TYPE_INFO: Record<CalloutType, { icon: string; label: string; bgClass: string; borderClass: string }> = {
  info: {
    icon: 'ℹ️',
    label: 'Info',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-400',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-400',
  },
  tip: {
    icon: '💡',
    label: 'Tip',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-400',
  },
  note: {
    icon: '📝',
    label: 'Note',
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    borderClass: 'border-purple-400',
  },
};

// Generate unique block ID
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
