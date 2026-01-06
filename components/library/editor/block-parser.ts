import {
  Block,
  ParagraphBlock,
  ImageBlock,
  DividerBlock,
  QuoteBlock,
  CalloutBlock,
  CalloutType,
  ChapterImage,
  generateBlockId,
} from './types';
import { ImagePlacement, ImageSize } from '@/lib/types/book-images';

/**
 * Parse chapter content (markdown-like) and images into blocks
 */
export function parseContentToBlocks(
  content: string,
  images: ChapterImage[]
): Block[] {
  const blocks: Block[] = [];
  
  if (!content || content.trim() === '') {
    // Return a single empty paragraph block for empty content
    blocks.push({
      id: generateBlockId(),
      type: 'paragraph',
      content: '',
    });
    return blocks;
  }

  // Split content by double newlines to get raw blocks
  const rawBlocks = content.split(/\n\n+/);
  
  // Sort images by position to insert them at the right place
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  let imageIndex = 0;
  let currentPosition = 0;

  for (const rawBlock of rawBlocks) {
    const trimmedBlock = rawBlock.trim();
    if (!trimmedBlock) continue;

    // Check if we need to insert any images before this block
    while (imageIndex < sortedImages.length) {
      const img = sortedImages[imageIndex];
      const nextBlockEnd = currentPosition + trimmedBlock.length + 2; // +2 for \n\n
      
      // If image position is before or within this text block, insert it
      if (img.position <= currentPosition) {
        blocks.push(createImageBlock(img));
        imageIndex++;
      } else {
        break;
      }
    }

    // Parse the block type
    const block = parseRawBlock(trimmedBlock);
    if (block) {
      blocks.push(block);
    }

    currentPosition += trimmedBlock.length + 2; // +2 for the \n\n separator
  }

  // Add any remaining images at the end
  while (imageIndex < sortedImages.length) {
    blocks.push(createImageBlock(sortedImages[imageIndex]));
    imageIndex++;
  }

  // Ensure at least one paragraph block exists
  if (blocks.length === 0) {
    blocks.push({
      id: generateBlockId(),
      type: 'paragraph',
      content: '',
    });
  }

  return blocks;
}

/**
 * Parse a single raw text block into a Block object
 */
function parseRawBlock(raw: string): Block | null {
  // Check for divider (---)
  if (/^-{3,}$/.test(raw.trim())) {
    return {
      id: generateBlockId(),
      type: 'divider',
    } as DividerBlock;
  }

  // Check for blockquote (> ...)
  if (raw.startsWith('> ')) {
    const lines = raw.split('\n');
    const content = lines
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n');
    
    // Check for attribution (last line starting with — or --)
    const contentLines = content.split('\n');
    let attribution: string | undefined;
    let quoteContent = content;
    
    const lastLine = contentLines[contentLines.length - 1];
    if (lastLine && (lastLine.startsWith('— ') || lastLine.startsWith('-- '))) {
      attribution = lastLine.replace(/^(—|--)\s*/, '');
      quoteContent = contentLines.slice(0, -1).join('\n');
    }

    return {
      id: generateBlockId(),
      type: 'quote',
      content: quoteContent.trim(),
      attribution,
    } as QuoteBlock;
  }

  // Check for callout (:::type ... :::)
  const calloutMatch = raw.match(/^:::(info|warning|tip|note)(?:\s+(.+?))?\n([\s\S]*?):::$/);
  if (calloutMatch) {
    return {
      id: generateBlockId(),
      type: 'callout',
      calloutType: calloutMatch[1] as CalloutType,
      title: calloutMatch[2]?.trim() || undefined,
      content: calloutMatch[3].trim(),
    } as CalloutBlock;
  }

  // Check for inline image markdown: ![alt](url){...}
  const imageMatch = raw.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?$/);
  if (imageMatch) {
    // This is an embedded image in markdown format
    // Parse attributes from {#id size=... align=... caption="..."}
    const attrs = parseImageAttributes(imageMatch[3] || '');
    return {
      id: generateBlockId(),
      type: 'image',
      imageId: attrs.imageId || -1,
      imageUrl: imageMatch[2],
      imageType: 'illustration',
      placement: attrs.align || 'center',
      size: attrs.size || 'medium',
      caption: attrs.caption,
      altText: imageMatch[1] || undefined,
    } as ImageBlock;
  }

  // Default: paragraph
  return {
    id: generateBlockId(),
    type: 'paragraph',
    content: raw,
  } as ParagraphBlock;
}

/**
 * Parse image attributes from markdown attribute syntax
 */
function parseImageAttributes(attrString: string): {
  imageId?: number;
  size?: ImageSize;
  align?: ImagePlacement;
  caption?: string;
} {
  const result: {
    imageId?: number;
    size?: ImageSize;
    align?: ImagePlacement;
    caption?: string;
  } = {};

  // Parse #img-123 style ID
  const idMatch = attrString.match(/#img-(\d+)/);
  if (idMatch) {
    result.imageId = parseInt(idMatch[1], 10);
  }

  // Parse size=...
  const sizeMatch = attrString.match(/size=(\w+)/);
  if (sizeMatch) {
    result.size = sizeMatch[1] as ImageSize;
  }

  // Parse align=...
  const alignMatch = attrString.match(/align=(\w+(?:-\w+)?)/);
  if (alignMatch) {
    result.align = alignMatch[1] as ImagePlacement;
  }

  // Parse caption="..."
  const captionMatch = attrString.match(/caption="([^"]*)"/);
  if (captionMatch) {
    result.caption = captionMatch[1];
  }

  return result;
}

/**
 * Create an ImageBlock from a ChapterImage
 */
function createImageBlock(image: ChapterImage): ImageBlock {
  return {
    id: generateBlockId(),
    type: 'image',
    imageId: image.id,
    imageUrl: image.imageUrl,
    thumbnailUrl: image.thumbnailUrl,
    imageType: image.imageType,
    placement: image.placement,
    size: image.metadata?.size || 'medium',
    caption: image.caption,
    altText: image.altText,
  };
}

/**
 * Serialize blocks back to markdown-like content
 * Note: Images are stored separately in the database, so we only serialize text blocks
 */
export function serializeBlocksToContent(blocks: Block[]): string {
  const textParts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        if (block.content.trim()) {
          textParts.push(block.content);
        }
        break;

      case 'divider':
        textParts.push('---');
        break;

      case 'quote':
        const quoteLines = block.content.split('\n').map(line => `> ${line}`);
        if (block.attribution) {
          quoteLines.push(`> — ${block.attribution}`);
        }
        textParts.push(quoteLines.join('\n'));
        break;

      case 'callout':
        let calloutText = `:::${block.calloutType}`;
        if (block.title) {
          calloutText += ` ${block.title}`;
        }
        calloutText += `\n${block.content}\n:::`;
        textParts.push(calloutText);
        break;

      case 'image':
        // Images are stored in the database separately
        // We can optionally include a markdown reference for compatibility
        // For now, we skip them as they're managed via the images table
        break;
    }
  }

  return textParts.join('\n\n');
}

/**
 * Extract image blocks from the block list with their relative positions
 */
export function extractImagePositions(blocks: Block[]): Array<{
  imageId: number;
  blockIndex: number;
  position: number;
}> {
  const results: Array<{ imageId: number; blockIndex: number; position: number }> = [];
  let charPosition = 0;

  blocks.forEach((block, index) => {
    if (block.type === 'image') {
      results.push({
        imageId: block.imageId,
        blockIndex: index,
        position: charPosition,
      });
    } else if (block.type === 'paragraph') {
      charPosition += block.content.length + 2; // +2 for \n\n
    } else if (block.type === 'quote') {
      charPosition += block.content.length + 10; // approximate
    } else if (block.type === 'callout') {
      charPosition += block.content.length + 20; // approximate
    } else if (block.type === 'divider') {
      charPosition += 5; // ---\n\n
    }
  });

  return results;
}

/**
 * Insert a new block after a specific block ID
 */
export function insertBlockAfter(blocks: Block[], afterBlockId: string, newBlock: Block): Block[] {
  const index = blocks.findIndex(b => b.id === afterBlockId);
  if (index === -1) {
    return [...blocks, newBlock];
  }
  return [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
}

/**
 * Insert a new block before a specific block ID
 */
export function insertBlockBefore(blocks: Block[], beforeBlockId: string, newBlock: Block): Block[] {
  const index = blocks.findIndex(b => b.id === beforeBlockId);
  if (index === -1) {
    return [newBlock, ...blocks];
  }
  return [...blocks.slice(0, index), newBlock, ...blocks.slice(index)];
}

/**
 * Update a block by ID
 */
export function updateBlock(blocks: Block[], blockId: string, updates: Partial<Block>): Block[] {
  return blocks.map(block => {
    if (block.id === blockId) {
      return { ...block, ...updates } as Block;
    }
    return block;
  });
}

/**
 * Delete a block by ID
 */
export function deleteBlock(blocks: Block[], blockId: string): Block[] {
  const filtered = blocks.filter(b => b.id !== blockId);
  // Ensure at least one paragraph exists
  if (filtered.length === 0) {
    return [{
      id: generateBlockId(),
      type: 'paragraph',
      content: '',
    }];
  }
  return filtered;
}

/**
 * Move a block to a new position
 */
export function moveBlock(blocks: Block[], blockId: string, newIndex: number): Block[] {
  const currentIndex = blocks.findIndex(b => b.id === blockId);
  if (currentIndex === -1) return blocks;

  const block = blocks[currentIndex];
  const withoutBlock = blocks.filter(b => b.id !== blockId);
  
  const clampedIndex = Math.max(0, Math.min(newIndex, withoutBlock.length));
  return [
    ...withoutBlock.slice(0, clampedIndex),
    block,
    ...withoutBlock.slice(clampedIndex),
  ];
}

/**
 * Calculate word count from blocks
 */
export function calculateWordCount(blocks: Block[]): number {
  let count = 0;
  
  for (const block of blocks) {
    let text = '';
    switch (block.type) {
      case 'paragraph':
        text = block.content;
        break;
      case 'quote':
        text = block.content + (block.attribution || '');
        break;
      case 'callout':
        text = (block.title || '') + ' ' + block.content;
        break;
    }
    
    if (text) {
      count += text.trim().split(/\s+/).filter(Boolean).length;
    }
  }
  
  return count;
}
