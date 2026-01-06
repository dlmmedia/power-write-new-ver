'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Block,
  ParagraphBlock,
  ChapterImage,
  generateBlockId,
} from './types';
import {
  parseContentToBlocks,
  serializeBlocksToContent,
  insertBlockAfter,
  updateBlock,
  deleteBlock,
  calculateWordCount,
} from './block-parser';
import { LineMenu } from './LineMenu';
import { ImageBlockComponent } from './ImageBlock';
import { QuoteBlockComponent } from './QuoteBlock';
import { CalloutBlockComponent } from './CalloutBlock';
import { DividerBlockComponent } from './DividerBlock';
import { ImagePopover } from './ImagePopover';
import { BookImageType, ImagePlacement, ImageSize } from '@/lib/types/book-images';

interface BlockEditorProps {
  content: string;
  images: ChapterImage[];
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  onChange: (content: string, wordCount: number) => void;
  onImageInsert: () => void;
  onCitationInsert: () => void;
  onBibliographyOpen?: () => void;
  onImageClick?: (image: ChapterImage) => void;
  onImageDelete?: (imageId: number) => void;
  onImageUpdate?: (imageId: number, updates: Partial<ChapterImage>) => void;
  bookId: number;
  chapterId: number;
  isReadOnly?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  content,
  images,
  fontSize = 'base',
  onChange,
  onImageInsert,
  onCitationInsert,
  onBibliographyOpen,
  onImageClick,
  onImageDelete,
  onImageUpdate,
  bookId,
  chapterId,
  isReadOnly = false,
}) => {
  // Parse content and images into blocks
  const [blocks, setBlocks] = useState<Block[]>(() => 
    parseContentToBlocks(content, images)
  );
  
  // Track which block is focused/selected
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Track hovered block for showing the '+' menu
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  
  // Track if hovering over the line menu itself (to prevent disappearing)
  const [isHoveringMenu, setIsHoveringMenu] = useState(false);
  
  // Track which block shows the line menu
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null);
  
  // Track image popover state
  const [popoverImageId, setPopoverImageId] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Refs for blocks
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Re-parse when content or images change externally
  useEffect(() => {
    const newBlocks = parseContentToBlocks(content, images);
    setBlocks(newBlocks);
  }, [content, images]);
  
  // Serialize and emit changes
  const emitChanges = useCallback((newBlocks: Block[]) => {
    const newContent = serializeBlocksToContent(newBlocks);
    const wordCount = calculateWordCount(newBlocks);
    onChange(newContent, wordCount);
  }, [onChange]);
  
  // Update a block's content
  const handleBlockChange = useCallback((blockId: string, newContent: string) => {
    setBlocks(prev => {
      const newBlocks = updateBlock(prev, blockId, { content: newContent } as Partial<ParagraphBlock>);
      emitChanges(newBlocks);
      return newBlocks;
    });
  }, [emitChanges]);
  
  // Delete a block
  const handleBlockDelete = useCallback((blockId: string) => {
    setBlocks(prev => {
      const newBlocks = deleteBlock(prev, blockId);
      emitChanges(newBlocks);
      return newBlocks;
    });
  }, [emitChanges]);
  
  // Insert a new block after the current one
  const handleInsertBlock = useCallback((afterBlockId: string, blockType: Block['type'], initialData?: Partial<Block>) => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: blockType,
      ...(blockType === 'paragraph' ? { content: '' } : {}),
      ...(blockType === 'quote' ? { content: '' } : {}),
      ...(blockType === 'callout' ? { calloutType: 'note', content: '' } : {}),
      ...initialData,
    } as Block;
    
    setBlocks(prev => {
      const newBlocks = insertBlockAfter(prev, afterBlockId, newBlock);
      emitChanges(newBlocks);
      return newBlocks;
    });
    
    // Focus the new block
    setTimeout(() => {
      setFocusedBlockId(newBlock.id);
    }, 0);
    
    return newBlock.id;
  }, [emitChanges]);
  
  // Handle Enter key in a paragraph - split or create new block
  const handleEnterKey = useCallback((blockId: string, cursorPosition: number, content: string) => {
    const before = content.substring(0, cursorPosition);
    const after = content.substring(cursorPosition);
    
    // Update current block with content before cursor
    setBlocks(prev => {
      const updatedBlocks = updateBlock(prev, blockId, { content: before } as Partial<ParagraphBlock>);
      
      // Insert new block with content after cursor
      const newBlock: ParagraphBlock = {
        id: generateBlockId(),
        type: 'paragraph',
        content: after,
      };
      
      const newBlocks = insertBlockAfter(updatedBlocks, blockId, newBlock);
      emitChanges(newBlocks);
      
      // Focus the new block
      setTimeout(() => {
        setFocusedBlockId(newBlock.id);
        const el = blockRefs.current.get(newBlock.id);
        if (el) {
          el.focus();
          // Move cursor to start
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(el, 0);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
      
      return newBlocks;
    });
  }, [emitChanges]);
  
  // Handle Backspace at start of block - merge with previous
  const handleBackspaceAtStart = useCallback((blockId: string) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId);
      if (blockIndex <= 0) return prev;
      
      const currentBlock = prev[blockIndex];
      const previousBlock = prev[blockIndex - 1];
      
      // Only merge paragraphs
      if (currentBlock.type !== 'paragraph' || previousBlock.type !== 'paragraph') {
        // Just delete current block if empty
        if (currentBlock.type === 'paragraph' && !currentBlock.content) {
          const newBlocks = deleteBlock(prev, blockId);
          setFocusedBlockId(previousBlock.id);
          emitChanges(newBlocks);
          return newBlocks;
        }
        return prev;
      }
      
      // Merge content
      const mergedContent = previousBlock.content + currentBlock.content;
      const cursorPos = previousBlock.content.length;
      
      // Update previous block
      let newBlocks = updateBlock(prev, previousBlock.id, { content: mergedContent });
      
      // Delete current block
      newBlocks = deleteBlock(newBlocks, blockId);
      
      // Focus previous block at merge point
      setTimeout(() => {
        setFocusedBlockId(previousBlock.id);
        const el = blockRefs.current.get(previousBlock.id);
        if (el && el.firstChild) {
          const range = document.createRange();
          const sel = window.getSelection();
          // Try to position cursor at the merge point
          try {
            range.setStart(el.firstChild, cursorPos);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          } catch {
            // Fallback to end of text
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 0);
      
      emitChanges(newBlocks);
      return newBlocks;
    });
  }, [emitChanges]);
  
  // Handle arrow key navigation between blocks
  const handleArrowNavigation = useCallback((blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    const targetBlock = blocks[targetIndex];
    setFocusedBlockId(targetBlock.id);
    
    const el = blockRefs.current.get(targetBlock.id);
    if (el) {
      el.focus();
    }
  }, [blocks]);
  
  // Handle image popover
  const handleImageClick = useCallback((imageBlock: Block, event: React.MouseEvent) => {
    if (imageBlock.type !== 'image') return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverImageId(imageBlock.imageId);
    setPopoverPosition({
      top: rect.top - 50,
      left: rect.left + rect.width / 2,
    });
    setSelectedBlockId(imageBlock.id);
  }, []);
  
  // Close image popover
  const handleClosePopover = useCallback(() => {
    setPopoverImageId(null);
    setPopoverPosition(null);
  }, []);
  
  // Handle image size change from popover
  const handleImageSizeChange = useCallback((imageId: number, size: ImageSize) => {
    setBlocks(prev => {
      const newBlocks = prev.map(block => {
        if (block.type === 'image' && block.imageId === imageId) {
          return { ...block, size };
        }
        return block;
      });
      return newBlocks;
    });
    
    // Also update via callback
    if (onImageUpdate) {
      onImageUpdate(imageId, { metadata: { size } });
    }
  }, [onImageUpdate]);
  
  // Handle image alignment change from popover
  const handleImageAlignChange = useCallback((imageId: number, placement: ImagePlacement) => {
    setBlocks(prev => {
      const newBlocks = prev.map(block => {
        if (block.type === 'image' && block.imageId === imageId) {
          return { ...block, placement };
        }
        return block;
      });
      return newBlocks;
    });
    
    if (onImageUpdate) {
      onImageUpdate(imageId, { placement });
    }
  }, [onImageUpdate]);
  
  // Font size classes
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  // Get the image for an image block
  const getImageForBlock = useCallback((imageId: number): ChapterImage | undefined => {
    return images.find(img => img.id === imageId);
  }, [images]);
  
  // Render a single block
  const renderBlock = (block: Block, index: number) => {
    const isHovered = hoveredBlockId === block.id;
    const isFocused = focusedBlockId === block.id;
    const isSelected = selectedBlockId === block.id;
    
    const commonProps = {
      onMouseEnter: () => setHoveredBlockId(block.id),
      onMouseLeave: () => {
        // Don't hide if menu is open or if hovering over the line menu
        if (menuBlockId !== block.id && !isHoveringMenu) {
          // Small delay to allow mouse to move to the plus button
          setTimeout(() => {
            if (!isHoveringMenu) {
              setHoveredBlockId(null);
            }
          }, 100);
        }
      },
    };
    
    switch (block.type) {
      case 'paragraph':
        return (
          <div
            key={block.id}
            className="relative group"
            {...commonProps}
          >
            {/* Line menu trigger */}
            {(isHovered || menuBlockId === block.id || isHoveringMenu) && !isReadOnly && (
              <LineMenu
                isOpen={menuBlockId === block.id}
                onToggle={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                onClose={() => setMenuBlockId(null)}
                onInsertImage={() => {
                  setMenuBlockId(null);
                  onImageInsert();
                }}
                onInsertCitation={() => {
                  setMenuBlockId(null);
                  onCitationInsert();
                }}
                onBibliographyOpen={onBibliographyOpen ? () => {
                  setMenuBlockId(null);
                  onBibliographyOpen();
                } : undefined}
                onInsertDivider={() => {
                  handleInsertBlock(block.id, 'divider');
                  setMenuBlockId(null);
                }}
                onInsertQuote={() => {
                  handleInsertBlock(block.id, 'quote', { content: '' });
                  setMenuBlockId(null);
                }}
                onInsertCallout={(calloutType) => {
                  handleInsertBlock(block.id, 'callout', { calloutType, content: '' });
                  setMenuBlockId(null);
                }}
                onMouseEnter={() => setIsHoveringMenu(true)}
                onMouseLeave={() => {
                  setIsHoveringMenu(false);
                  if (menuBlockId !== block.id) {
                    setHoveredBlockId(null);
                  }
                }}
              />
            )}
            
            {/* Paragraph content */}
            <div
              ref={(el) => {
                if (el) blockRefs.current.set(block.id, el);
              }}
              contentEditable={!isReadOnly}
              suppressContentEditableWarning
              className={`${fontSizeClasses[fontSize]} leading-relaxed font-serif outline-none min-h-[1.5em] py-1 px-1 rounded transition-colors ${
                isFocused ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
              }`}
              style={{ fontFamily: 'Georgia, serif' }}
              onFocus={() => setFocusedBlockId(block.id)}
              onBlur={(e) => {
                const newContent = e.currentTarget.textContent || '';
                if (newContent !== block.content) {
                  handleBlockChange(block.id, newContent);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const selection = window.getSelection();
                  const cursorPos = selection?.anchorOffset || 0;
                  handleEnterKey(block.id, cursorPos, e.currentTarget.textContent || '');
                } else if (e.key === 'Backspace') {
                  const selection = window.getSelection();
                  if (selection?.anchorOffset === 0 && selection?.focusOffset === 0) {
                    e.preventDefault();
                    handleBackspaceAtStart(block.id);
                  }
                } else if (e.key === 'ArrowUp' && e.currentTarget.textContent) {
                  const selection = window.getSelection();
                  if (selection?.anchorOffset === 0) {
                    e.preventDefault();
                    handleArrowNavigation(block.id, 'up');
                  }
                } else if (e.key === 'ArrowDown' && e.currentTarget.textContent) {
                  const selection = window.getSelection();
                  const len = e.currentTarget.textContent?.length || 0;
                  if (selection?.anchorOffset === len) {
                    e.preventDefault();
                    handleArrowNavigation(block.id, 'down');
                  }
                }
              }}
              dangerouslySetInnerHTML={{ __html: block.content || '<br>' }}
            />
          </div>
        );
      
      case 'image':
        const chapterImage = getImageForBlock(block.imageId);
        return (
          <div
            key={block.id}
            className="relative group"
            {...commonProps}
          >
            {(isHovered || menuBlockId === block.id || isHoveringMenu) && !isReadOnly && (
              <LineMenu
                isOpen={menuBlockId === block.id}
                onToggle={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                onClose={() => setMenuBlockId(null)}
                onInsertImage={() => {
                  setMenuBlockId(null);
                  onImageInsert();
                }}
                onInsertCitation={() => {
                  setMenuBlockId(null);
                  onCitationInsert();
                }}
                onBibliographyOpen={onBibliographyOpen ? () => {
                  setMenuBlockId(null);
                  onBibliographyOpen();
                } : undefined}
                onInsertDivider={() => {
                  handleInsertBlock(block.id, 'divider');
                  setMenuBlockId(null);
                }}
                onInsertQuote={() => {
                  handleInsertBlock(block.id, 'quote', { content: '' });
                  setMenuBlockId(null);
                }}
                onInsertCallout={(calloutType) => {
                  handleInsertBlock(block.id, 'callout', { calloutType, content: '' });
                  setMenuBlockId(null);
                }}
                onMouseEnter={() => setIsHoveringMenu(true)}
                onMouseLeave={() => {
                  setIsHoveringMenu(false);
                  if (menuBlockId !== block.id) {
                    setHoveredBlockId(null);
                  }
                }}
              />
            )}
            
            <ImageBlockComponent
              block={block}
              isSelected={isSelected}
              onClick={(e) => handleImageClick(block, e)}
              onDelete={() => {
                if (onImageDelete) {
                  onImageDelete(block.imageId);
                }
                handleBlockDelete(block.id);
              }}
              onOpenSidePanel={() => {
                if (chapterImage && onImageClick) {
                  onImageClick(chapterImage);
                }
              }}
            />
          </div>
        );
      
      case 'divider':
        return (
          <div
            key={block.id}
            className="relative group"
            {...commonProps}
          >
            {(isHovered || menuBlockId === block.id || isHoveringMenu) && !isReadOnly && (
              <LineMenu
                isOpen={menuBlockId === block.id}
                onToggle={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                onClose={() => setMenuBlockId(null)}
                onInsertImage={() => {
                  setMenuBlockId(null);
                  onImageInsert();
                }}
                onInsertCitation={() => {
                  setMenuBlockId(null);
                  onCitationInsert();
                }}
                onBibliographyOpen={onBibliographyOpen ? () => {
                  setMenuBlockId(null);
                  onBibliographyOpen();
                } : undefined}
                onInsertDivider={() => {
                  handleInsertBlock(block.id, 'divider');
                  setMenuBlockId(null);
                }}
                onInsertQuote={() => {
                  handleInsertBlock(block.id, 'quote', { content: '' });
                  setMenuBlockId(null);
                }}
                onInsertCallout={(calloutType) => {
                  handleInsertBlock(block.id, 'callout', { calloutType, content: '' });
                  setMenuBlockId(null);
                }}
                onMouseEnter={() => setIsHoveringMenu(true)}
                onMouseLeave={() => {
                  setIsHoveringMenu(false);
                  if (menuBlockId !== block.id) {
                    setHoveredBlockId(null);
                  }
                }}
              />
            )}
            
            <DividerBlockComponent
              block={block}
              isSelected={isSelected}
              onClick={() => setSelectedBlockId(block.id)}
              onDelete={() => handleBlockDelete(block.id)}
              isReadOnly={isReadOnly}
            />
          </div>
        );
      
      case 'quote':
        return (
          <div
            key={block.id}
            className="relative group"
            {...commonProps}
          >
            {(isHovered || menuBlockId === block.id || isHoveringMenu) && !isReadOnly && (
              <LineMenu
                isOpen={menuBlockId === block.id}
                onToggle={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                onClose={() => setMenuBlockId(null)}
                onInsertImage={() => {
                  setMenuBlockId(null);
                  onImageInsert();
                }}
                onInsertCitation={() => {
                  setMenuBlockId(null);
                  onCitationInsert();
                }}
                onBibliographyOpen={onBibliographyOpen ? () => {
                  setMenuBlockId(null);
                  onBibliographyOpen();
                } : undefined}
                onInsertDivider={() => {
                  handleInsertBlock(block.id, 'divider');
                  setMenuBlockId(null);
                }}
                onInsertQuote={() => {
                  handleInsertBlock(block.id, 'quote', { content: '' });
                  setMenuBlockId(null);
                }}
                onInsertCallout={(calloutType) => {
                  handleInsertBlock(block.id, 'callout', { calloutType, content: '' });
                  setMenuBlockId(null);
                }}
                onMouseEnter={() => setIsHoveringMenu(true)}
                onMouseLeave={() => {
                  setIsHoveringMenu(false);
                  if (menuBlockId !== block.id) {
                    setHoveredBlockId(null);
                  }
                }}
              />
            )}
            
            <QuoteBlockComponent
              block={block}
              isSelected={isSelected}
              isFocused={isFocused}
              fontSize={fontSize}
              onFocus={() => setFocusedBlockId(block.id)}
              onChange={(content, attribution) => {
                setBlocks(prev => {
                  const newBlocks = updateBlock(prev, block.id, { content, attribution });
                  emitChanges(newBlocks);
                  return newBlocks;
                });
              }}
              onDelete={() => handleBlockDelete(block.id)}
              isReadOnly={isReadOnly}
            />
          </div>
        );
      
      case 'callout':
        return (
          <div
            key={block.id}
            className="relative group"
            {...commonProps}
          >
            {(isHovered || menuBlockId === block.id || isHoveringMenu) && !isReadOnly && (
              <LineMenu
                isOpen={menuBlockId === block.id}
                onToggle={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)}
                onClose={() => setMenuBlockId(null)}
                onInsertImage={() => {
                  setMenuBlockId(null);
                  onImageInsert();
                }}
                onInsertCitation={() => {
                  setMenuBlockId(null);
                  onCitationInsert();
                }}
                onBibliographyOpen={onBibliographyOpen ? () => {
                  setMenuBlockId(null);
                  onBibliographyOpen();
                } : undefined}
                onInsertDivider={() => {
                  handleInsertBlock(block.id, 'divider');
                  setMenuBlockId(null);
                }}
                onInsertQuote={() => {
                  handleInsertBlock(block.id, 'quote', { content: '' });
                  setMenuBlockId(null);
                }}
                onInsertCallout={(calloutType) => {
                  handleInsertBlock(block.id, 'callout', { calloutType, content: '' });
                  setMenuBlockId(null);
                }}
                onMouseEnter={() => setIsHoveringMenu(true)}
                onMouseLeave={() => {
                  setIsHoveringMenu(false);
                  if (menuBlockId !== block.id) {
                    setHoveredBlockId(null);
                  }
                }}
              />
            )}
            
            <CalloutBlockComponent
              block={block}
              isSelected={isSelected}
              isFocused={isFocused}
              fontSize={fontSize}
              onFocus={() => setFocusedBlockId(block.id)}
              onChange={(content, title, calloutType) => {
                setBlocks(prev => {
                  const newBlocks = updateBlock(prev, block.id, { content, title, calloutType });
                  emitChanges(newBlocks);
                  return newBlocks;
                });
              }}
              onDelete={() => handleBlockDelete(block.id)}
              isReadOnly={isReadOnly}
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Get the current image for popover
  const popoverImage = useMemo(() => {
    if (popoverImageId === null) return null;
    return images.find(img => img.id === popoverImageId) || null;
  }, [popoverImageId, images]);
  
  return (
    <div
      ref={editorRef}
      className="block-editor min-h-[400px] p-4 pl-14 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
      onClick={(e) => {
        // Click outside blocks - focus last block or create new one
        if (e.target === editorRef.current) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock) {
            setFocusedBlockId(lastBlock.id);
            const el = blockRefs.current.get(lastBlock.id);
            if (el) el.focus();
          }
        }
      }}
    >
      {blocks.map((block, index) => renderBlock(block, index))}
      
      {/* Image popover */}
      {popoverImage && popoverPosition && (
        <ImagePopover
          image={popoverImage}
          position={popoverPosition}
          onClose={handleClosePopover}
          onSizeChange={(size) => handleImageSizeChange(popoverImage.id, size)}
          onAlignChange={(align) => handleImageAlignChange(popoverImage.id, align)}
          onDelete={() => {
            if (onImageDelete) {
              onImageDelete(popoverImage.id);
            }
            // Find and delete the block
            const imageBlock = blocks.find(
              b => b.type === 'image' && b.imageId === popoverImage.id
            );
            if (imageBlock) {
              handleBlockDelete(imageBlock.id);
            }
            handleClosePopover();
          }}
          onOpenSidePanel={() => {
            if (onImageClick) {
              onImageClick(popoverImage);
            }
            handleClosePopover();
          }}
        />
      )}
    </div>
  );
};
