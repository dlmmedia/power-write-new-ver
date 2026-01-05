'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CoverDesignOptions, 
  GENRE_COVER_DEFAULTS,
  CoverTextCustomization,
  CoverTypographyOptions,
  CoverLayoutOptions,
  CoverVisualOptions,
  FONT_STYLE_PRESETS,
  VISUAL_STYLE_PRESETS,
  COLOR_PALETTES,
  FontStylePreset,
  VisualStylePreset,
  ColorPalette,
} from '@/lib/types/cover';
import { CoverService } from '@/lib/services/cover-service';
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/lib/types/models';
import CoverGallery from './CoverGallery';
import { CollapsibleSection, CollapsibleItem } from '@/components/ui/CollapsibleSection';
import { Badge } from '@/components/ui/Badge';
import { 
  Zap, 
  Type, 
  Layout, 
  Palette, 
  Settings, 
  Bot, 
  Upload, 
  Book, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Download,
  Lightbulb,
  Target,
  CheckCircle,
  CheckCircle2,
  Star,
  Image as ImageIcon,
  Loader2,
  BoxSelect,
  Images,
  ChevronDown,
  Eye,
  Wand2,
  PenTool,
  Layers,
  X,
  Plus,
  Check,
} from 'lucide-react';

interface CoverGeneratorProps {
  bookId?: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  targetAudience: string;
  themes?: string[];
  currentCoverUrl?: string;
  currentBackCoverUrl?: string;
  onCoverGenerated: (coverUrl: string, metadata: any) => void;
  onBackCoverGenerated?: (backCoverUrl: string, metadata: any) => void;
  onGalleryUpdate?: () => void;
}

type CustomizationTab = 'quick' | 'text' | 'typography' | 'layout' | 'visuals' | 'advanced';

export default function CoverGenerator({
  bookId,
  title,
  author,
  genre,
  description,
  targetAudience,
  themes = [],
  currentCoverUrl,
  currentBackCoverUrl,
  onCoverGenerated,
  onBackCoverGenerated,
  onGalleryUpdate,
}: CoverGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBack, setIsGeneratingBack] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(currentCoverUrl);
  const [backCoverUrl, setBackCoverUrl] = useState<string | undefined>(currentBackCoverUrl);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'cover' | 'mockup'>('cover');
  const [coverType, setCoverType] = useState<'front' | 'back'>('front');
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [coverMode, setCoverMode] = useState<'generate' | 'upload'>('generate');
  const [activeTab, setActiveTab] = useState<CustomizationTab>('quick');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryKey, setGalleryKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync with props when they change
  useEffect(() => {
    setCoverUrl(currentCoverUrl);
  }, [currentCoverUrl]);
  
  useEffect(() => {
    setBackCoverUrl(currentBackCoverUrl);
  }, [currentBackCoverUrl]);
  
  const refreshGallery = useCallback(() => {
    setGalleryKey(prev => prev + 1);
    onGalleryUpdate?.();
  }, [onGalleryUpdate]);
  
  const handleGalleryCoverSelect = useCallback((selectedCoverUrl: string, coverId: number) => {
    if (coverType === 'front') {
      setCoverUrl(selectedCoverUrl);
      onCoverGenerated(selectedCoverUrl, { source: 'gallery', coverId });
    } else {
      setBackCoverUrl(selectedCoverUrl);
      onBackCoverGenerated?.(selectedCoverUrl, { source: 'gallery', coverId });
    }
  }, [coverType, onCoverGenerated, onBackCoverGenerated]);
  
  // PowerWrite branding toggle - OFF by default now
  const [showPowerWriteBranding, setShowPowerWriteBranding] = useState(false);
  const [hideAuthorName, setHideAuthorName] = useState(false);
  
  // Back cover customization state
  const [backCoverOptions, setBackCoverOptions] = useState({
    showBarcode: true,
    barcodeType: 'isbn' as 'isbn' | 'qr' | 'none',
    customDescription: '',
    layout: 'classic' as 'classic' | 'modern' | 'minimal' | 'editorial',
    showWebsite: true,
    showTagline: false, // Off by default since branding is off
    matchFrontCover: true,
  });
  
  // Design customization state
  const genreDefaults = GENRE_COVER_DEFAULTS[genre] || GENRE_COVER_DEFAULTS['Literary Fiction'];
  const [designOptions, setDesignOptions] = useState<Partial<CoverDesignOptions>>({
    style: genreDefaults.style,
    colorScheme: genreDefaults.colorScheme,
    generationMethod: 'ai',
  });

  // Text Customization
  const [textCustomization, setTextCustomization] = useState<CoverTextCustomization>({
    customTitle: '',
    customAuthor: '',
    subtitle: '',
    tagline: '',
    publisherName: 'DLM Media',
    seriesName: '',
    seriesNumber: undefined,
    awardBadge: '',
  });
  
  // Typography Options
  const [typographyOptions, setTypographyOptions] = useState<CoverTypographyOptions>({
    titleFont: 'serif',
    titleWeight: 'bold',
    titleStyle: 'normal',
    titleEffect: 'none',
    authorFont: 'serif',
    authorStyle: 'italic',
    titleSize: 'large',
    authorSize: 'medium',
    alignment: 'center',
    verticalPosition: 'center',
  });
  
  // Layout Options
  const [layoutOptions, setLayoutOptions] = useState<CoverLayoutOptions>({
    layout: 'classic',
    imagePosition: 'background',
    borderStyle: 'none',
    borderColor: '#d4af37',
    overlayType: 'gradient',
    overlayOpacity: 50,
    textZone: 'full',
  });
  
  // Visual Options
  const [visualOptions, setVisualOptions] = useState<CoverVisualOptions>({
    style: 'photographic',
    colorScheme: 'monochrome',
    mood: '',
    atmosphere: 'dramatic',
    visualElements: [],
    avoidElements: [],
    mainSubject: '',
    backgroundDescription: '',
  });
  
  // Custom Prompt
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceStyle, setReferenceStyle] = useState('');
  
  // Preset selections
  const [selectedFontPreset, setSelectedFontPreset] = useState<FontStylePreset | ''>('');
  const [selectedVisualPreset, setSelectedVisualPreset] = useState<VisualStylePreset | ''>('');
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPalette | ''>('');
  
  // Visual elements input
  const [newVisualElement, setNewVisualElement] = useState('');
  const [newAvoidElement, setNewAvoidElement] = useState('');

  // Apply font preset
  const applyFontPreset = (presetKey: FontStylePreset) => {
    const preset = FONT_STYLE_PRESETS[presetKey];
    setTypographyOptions(prev => ({
      ...prev,
      titleFont: preset.titleFont,
      titleWeight: preset.titleWeight,
      titleStyle: preset.titleStyle,
      authorFont: preset.authorFont,
      authorStyle: preset.authorStyle,
    }));
    setSelectedFontPreset(presetKey);
  };

  // Apply visual preset
  const applyVisualPreset = (presetKey: VisualStylePreset) => {
    const preset = VISUAL_STYLE_PRESETS[presetKey];
    setVisualOptions(prev => ({
      ...prev,
      style: preset.style,
      atmosphere: preset.atmosphere,
    }));
    setSelectedVisualPreset(presetKey);
  };

  // Apply color palette
  const applyColorPalette = (paletteKey: ColorPalette) => {
    const palette = COLOR_PALETTES[paletteKey];
    setVisualOptions(prev => ({
      ...prev,
      colorScheme: 'custom',
      customColors: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        text: palette.text,
        background: palette.background,
      },
    }));
    setSelectedColorPalette(paletteKey);
  };

  // Add visual element
  const addVisualElement = () => {
    if (newVisualElement.trim()) {
      setVisualOptions(prev => ({
        ...prev,
        visualElements: [...(prev.visualElements || []), newVisualElement.trim()],
      }));
      setNewVisualElement('');
    }
  };

  // Remove visual element
  const removeVisualElement = (index: number) => {
    setVisualOptions(prev => ({
      ...prev,
      visualElements: (prev.visualElements || []).filter((_, i) => i !== index),
    }));
  };

  // Add avoid element
  const addAvoidElement = () => {
    if (newAvoidElement.trim()) {
      setVisualOptions(prev => ({
        ...prev,
        avoidElements: [...(prev.avoidElements || []), newAvoidElement.trim()],
      }));
      setNewAvoidElement('');
    }
  };

  // Remove avoid element
  const removeAvoidElement = (index: number) => {
    setVisualOptions(prev => ({
      ...prev,
      avoidElements: (prev.avoidElements || []).filter((_, i) => i !== index),
    }));
  };

  const handleGenerateCover = async () => {
    if (!title || !author || !description) {
      setError('Please fill in title, author, and description first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const userId = 'demo_user';

      const hasTextCustomization = 
        textCustomization.customTitle || 
        textCustomization.customAuthor || 
        textCustomization.subtitle || 
        textCustomization.tagline ||
        textCustomization.seriesName ||
        textCustomization.awardBadge ||
        (textCustomization.publisherName && textCustomization.publisherName !== 'DLM Media');

      const response = await fetch('/api/generate/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          bookId,
          title,
          author,
          genre,
          description,
          targetAudience,
          themes,
          designOptions,
          imageModel,
          showPowerWriteBranding,
          hideAuthorName,
          textCustomization: hasTextCustomization ? textCustomization : undefined,
          typographyOptions,
          layoutOptions,
          visualOptions,
          customPrompt: customPrompt.trim() || undefined,
          referenceStyle: referenceStyle.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate cover');
      }

      if (data.coverUrl) {
        setCoverUrl(data.coverUrl);
        onCoverGenerated(data.coverUrl, data.metadata);
        
        if (bookId) {
          try {
            await fetch(`/api/books/${bookId}/covers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coverUrl: data.coverUrl,
                coverType: 'front',
                imageModel,
                source: 'generated',
                generationSettings: {
                  designOptions,
                  textCustomization: hasTextCustomization ? textCustomization : undefined,
                  typographyOptions,
                  layoutOptions,
                  visualOptions,
                  customPrompt: customPrompt.trim() || undefined,
                  referenceStyle: referenceStyle.trim() || undefined,
                },
                setAsMain: true,
              }),
            });
            refreshGallery();
          } catch (galleryErr) {
            console.error('Failed to save to gallery:', galleryErr);
          }
        }
      } else {
        throw new Error('No cover URL returned');
      }
    } catch (err) {
      console.error('Cover generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cover');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBackCover = async () => {
    if (!title || !description) {
      setError('Please fill in title and description first');
      return;
    }

    setIsGeneratingBack(true);
    setError(null);

    try {
      const userId = 'demo_user';

      const response = await fetch('/api/generate/back-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          bookId,
          title,
          author,
          genre,
          description: backCoverOptions.customDescription || description,
          style: designOptions.style || 'photographic',
          imageModel,
          showPowerWriteBranding,
          hideAuthorName,
          backCoverOptions: {
            showBarcode: backCoverOptions.showBarcode,
            barcodeType: backCoverOptions.barcodeType,
            layout: backCoverOptions.layout,
            showWebsite: backCoverOptions.showWebsite,
            showTagline: backCoverOptions.showTagline,
            matchFrontCover: backCoverOptions.matchFrontCover,
          },
          frontCoverStyle: {
            colorScheme: designOptions.colorScheme,
            style: designOptions.style,
            visualOptions,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate back cover');
      }

      if (data.coverUrl) {
        setBackCoverUrl(data.coverUrl);
        onBackCoverGenerated?.(data.coverUrl, data.metadata);
        
        if (bookId) {
          try {
            await fetch(`/api/books/${bookId}/covers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coverUrl: data.coverUrl,
                coverType: 'back',
                imageModel,
                source: 'generated',
                generationSettings: { backCoverOptions, designOptions },
                setAsMain: true,
              }),
            });
            refreshGallery();
          } catch (galleryErr) {
            console.error('Failed to save back cover to gallery:', galleryErr);
          }
        }
      } else {
        throw new Error('No back cover URL returned');
      }
    } catch (err) {
      console.error('Back cover generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate back cover');
    } finally {
      setIsGeneratingBack(false);
    }
  };

  const handleStyleChange = (style: CoverDesignOptions['style']) => {
    setDesignOptions(prev => ({ ...prev, style }));
  };

  const handleColorSchemeChange = (colorScheme: CoverDesignOptions['colorScheme']) => {
    setDesignOptions(prev => ({ ...prev, colorScheme }));
  };

  const handleMethodChange = (method: 'ai' | 'template' | 'hybrid') => {
    setDesignOptions(prev => ({ ...prev, generationMethod: method }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (!bookId) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (coverType === 'front') {
            setCoverUrl(dataUrl);
            onCoverGenerated(dataUrl, { source: 'upload', fileName: file.name });
          } else {
            setBackCoverUrl(dataUrl);
            onBackCoverGenerated?.(dataUrl, { source: 'upload', fileName: file.name });
          }
        };
        reader.readAsDataURL(file);
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('cover', file);
      formData.append('coverType', coverType);

      const response = await fetch(`/api/books/${bookId}/cover/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to upload cover');
      }

      if (data.coverUrl) {
        if (coverType === 'front') {
          setCoverUrl(data.coverUrl);
          onCoverGenerated(data.coverUrl, { source: 'upload', fileName: file.name });
        } else {
          setBackCoverUrl(data.coverUrl);
          onBackCoverGenerated?.(data.coverUrl, { source: 'upload', fileName: file.name });
        }
        
        if (bookId) {
          try {
            await fetch(`/api/books/${bookId}/covers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coverUrl: data.coverUrl,
                coverType,
                source: 'uploaded',
                fileName: file.name,
                fileSize: file.size,
                setAsMain: true,
              }),
            });
            refreshGallery();
          } catch (galleryErr) {
            console.error('Failed to save uploaded cover to gallery:', galleryErr);
          }
        }
      } else {
        throw new Error('No cover URL returned');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload cover');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Preview generation
  const displayAuthorForPreview = hideAuthorName 
    ? '' 
    : showPowerWriteBranding 
      ? (textCustomization.customAuthor || 'PowerWrite')
      : (textCustomization.customAuthor || author || '');

  const previewDataUrl = CoverService.generatePreviewDataURL(
    textCustomization.customTitle || title || 'Book Title',
    displayAuthorForPreview,
    '#1a1a1a',
    '#ffffff',
    showPowerWriteBranding
  );

  const backCoverPreviewDataUrl = CoverService.generateBackCoverPreviewDataURL(
    title || 'Book Title',
    backCoverOptions.customDescription || description || 'Your book description will appear here...',
    '#1a1a1a',
    '#ffffff',
    {
      showPowerWriteBranding,
      barcodeType: backCoverOptions.barcodeType,
      showWebsite: backCoverOptions.showWebsite,
      showTagline: backCoverOptions.showTagline,
      author: hideAuthorName ? '' : (textCustomization.customAuthor || author),
    }
  );

  // Determine current preview image
  const getCurrentPreviewImage = () => {
    if (coverType === 'front') {
      return coverUrl || previewDataUrl;
    } else {
      return backCoverUrl || backCoverPreviewDataUrl;
    }
  };

  // Status calculations
  const hasFrontCover = !!coverUrl;
  const hasBackCover = !!backCoverUrl;
  const coverProgress = (hasFrontCover ? 50 : 0) + (hasBackCover ? 50 : 0);

  const selectedModelInfo = IMAGE_MODELS.find(m => m.id === imageModel);

  return (
    <div className="space-y-3">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-orange-500/10 dark:from-amber-900/20 dark:via-yellow-800/15 dark:to-orange-900/20 rounded-xl border border-yellow-400/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cover Studio</h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  {hasFrontCover ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  Front
                </span>
                <span className="flex items-center gap-1">
                  {hasBackCover ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  Back
                </span>
              </div>
            </div>
          </div>
          
          {/* Download Buttons */}
          {(coverUrl || backCoverUrl) && (
            <div className="flex items-center gap-2">
              {coverUrl && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = coverUrl;
                    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_front_cover.png`;
                    link.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Front
                </button>
              )}
              {backCoverUrl && (
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = backCoverUrl;
                    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_back_cover.png`;
                    link.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/50 dark:bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${coverProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Cover Type & Mode Selection */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Cover Type Toggle */}
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Cover Type</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCoverType('front')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  coverType === 'front'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Book className="w-4 h-4" />
                Front Cover
                {hasFrontCover && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
              </button>
              <button
                onClick={() => setCoverType('back')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  coverType === 'back'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Back Cover
                {hasBackCover && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
              </button>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Method</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCoverMode('generate')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  coverMode === 'generate'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                AI Generate
              </button>
              <button
                onClick={() => setCoverMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  coverMode === 'upload'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section - Always Visible */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {coverType === 'front' ? 'Front Cover' : 'Back Cover'} Preview
            </span>
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
            <button
              onClick={() => setPreviewMode('cover')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                previewMode === 'cover'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Flat
            </button>
            <button
              onClick={() => setPreviewMode('mockup')}
              className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                previewMode === 'mockup'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <BoxSelect className="w-3 h-3" />
              3D
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
          {previewMode === 'cover' ? (
            <div className="relative w-48 h-72 bg-gray-300 dark:bg-gray-700 rounded-lg shadow-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
              <img
                src={getCurrentPreviewImage()}
                alt={`${coverType} cover preview`}
                className="w-full h-full object-cover"
              />
              {(coverType === 'front' && !coverUrl) || (coverType === 'back' && !backCoverUrl) ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-black/50 px-2 py-1 rounded">Preview</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative" style={{ perspective: '1000px' }}>
              <div
                className="w-48 h-72 bg-gray-800 rounded shadow-2xl overflow-hidden"
                style={{
                  transform: coverType === 'front' ? 'rotateY(-15deg) rotateX(5deg)' : 'rotateY(15deg) rotateX(5deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src={getCurrentPreviewImage()}
                  alt={`${coverType} cover preview`}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Section - Collapsible */}
      {bookId && (
        <CollapsibleSection
          title="Cover Gallery"
          subtitle="Previously generated covers"
          icon={<div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center"><Images className="w-4 h-4 text-white" /></div>}
          defaultOpen={false}
          variant="card"
        >
          <CoverGallery
            key={galleryKey}
            bookId={bookId}
            coverType="all"
            currentCoverUrl={coverType === 'front' ? coverUrl : backCoverUrl}
            onCoverSelect={handleGalleryCoverSelect}
          />
        </CollapsibleSection>
      )}

      {/* Generation/Upload Content */}
      {coverMode === 'generate' ? (
        <>
          {/* AI Model Selection */}
          <CollapsibleSection
            title="AI Model"
            subtitle={selectedModelInfo ? `${selectedModelInfo.name} (${selectedModelInfo.tier})` : 'Select model'}
            icon={<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>}
            badge={selectedModelInfo?.tier === 'premium' ? <Badge variant="warning" size="sm">Premium</Badge> : null}
            defaultOpen={false}
            variant="card"
          >
            <div className="grid grid-cols-1 gap-2">
              {IMAGE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setImageModel(model.id)}
                  className={`px-4 py-3 rounded-lg text-left transition-all border ${
                    imageModel === model.id
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{model.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      model.tier === 'premium' 
                        ? imageModel === model.id 
                          ? 'bg-black/20 text-black'
                          : 'bg-amber-100 dark:bg-yellow-500/20 text-amber-600 dark:text-yellow-400'
                        : imageModel === model.id
                          ? 'bg-black/20 text-black'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                    }`}>
                      {model.tier === 'premium' && <Star className="w-3 h-3 fill-current" />}
                      {model.tier === 'premium' ? 'Premium' : 'Standard'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${imageModel === model.id ? 'text-black/70' : 'text-gray-500'}`}>
                    {model.description}
                  </p>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Style & Design Options */}
          <CollapsibleSection
            title="Style & Design"
            subtitle={`${designOptions.style} • ${designOptions.colorScheme}`}
            icon={<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>}
            defaultOpen={true}
            variant="card"
          >
            {/* Cover Style */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Style
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(['minimalist', 'illustrative', 'photographic', 'abstract', 'typographic'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleChange(style)}
                    className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                      designOptions.style === style
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Scheme
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['warm', 'cool', 'monochrome', 'vibrant', 'pastel', 'dark'] as const).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                      designOptions.colorScheme === scheme
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {scheme}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Text & Branding Options */}
          <CollapsibleSection
            title="Text & Branding"
            subtitle={showPowerWriteBranding ? 'PowerWrite branding ON' : 'Custom branding'}
            icon={<div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"><Type className="w-4 h-4 text-white" /></div>}
            defaultOpen={false}
            variant="card"
          >
            {/* PowerWrite Branding Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  "Created with PowerWrite" Branding
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Display PowerWrite branding on the cover
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPowerWriteBranding(!showPowerWriteBranding)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showPowerWriteBranding ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  showPowerWriteBranding ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Hide Author Name Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hide Author Name
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Show only the title (no author)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHideAuthorName(!hideAuthorName)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  hideAuthorName ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  hideAuthorName ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Custom Title & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Custom Title
                </label>
                <input
                  type="text"
                  value={textCustomization.customTitle || ''}
                  onChange={(e) => setTextCustomization(prev => ({ ...prev, customTitle: e.target.value }))}
                  placeholder={title || 'Use book title'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div className={hideAuthorName ? 'opacity-50' : ''}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Author Name {hideAuthorName && '(hidden)'}
                </label>
                <input
                  type="text"
                  value={textCustomization.customAuthor || ''}
                  onChange={(e) => setTextCustomization(prev => ({ ...prev, customAuthor: e.target.value }))}
                  placeholder={author || 'Enter author'}
                  disabled={hideAuthorName}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Subtitle & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Subtitle (optional)
                </label>
                <input
                  type="text"
                  value={textCustomization.subtitle || ''}
                  onChange={(e) => setTextCustomization(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Add a subtitle..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Tagline (optional)
                </label>
                <input
                  type="text"
                  value={textCustomization.tagline || ''}
                  onChange={(e) => setTextCustomization(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="A gripping tale..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Back Cover Options - Only show when back cover is selected */}
          {coverType === 'back' && (
            <CollapsibleSection
              title="Back Cover Options"
              subtitle={`${backCoverOptions.layout} layout • ${backCoverOptions.barcodeType} barcode`}
              icon={<div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-700 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-white" /></div>}
              defaultOpen={true}
              variant="card"
            >
              {/* Custom Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Back Cover Synopsis
                </label>
                <textarea
                  value={backCoverOptions.customDescription}
                  onChange={(e) => setBackCoverOptions(prev => ({ ...prev, customDescription: e.target.value }))}
                  placeholder={`Leave blank to use book description...`}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
              </div>

              {/* Layout Style */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'modern', label: 'Modern' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'editorial', label: 'Editorial' },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setBackCoverOptions(prev => ({ ...prev, layout: layout.id as any }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        backCoverOptions.layout === layout.id
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barcode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'isbn', label: '📊 ISBN' },
                    { id: 'qr', label: '📱 QR Code' },
                    { id: 'none', label: '✕ None' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setBackCoverOptions(prev => ({ 
                        ...prev, 
                        barcodeType: option.id as any,
                        showBarcode: option.id !== 'none'
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        backCoverOptions.barcodeType === option.id
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Match Front Cover Style</span>
                  <button
                    type="button"
                    onClick={() => setBackCoverOptions(prev => ({ ...prev, matchFrontCover: !prev.matchFrontCover }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      backCoverOptions.matchFrontCover ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      backCoverOptions.matchFrontCover ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Website URL</span>
                  <button
                    type="button"
                    onClick={() => setBackCoverOptions(prev => ({ ...prev, showWebsite: !prev.showWebsite }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      backCoverOptions.showWebsite ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      backCoverOptions.showWebsite ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-300">"Created with PowerWrite" Tagline</span>
                  <button
                    type="button"
                    onClick={() => setBackCoverOptions(prev => ({ ...prev, showTagline: !prev.showTagline }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      backCoverOptions.showTagline ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      backCoverOptions.showTagline ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Advanced Options */}
          <CollapsibleSection
            title="Advanced Options"
            subtitle="Typography, layout, visuals & custom prompts"
            icon={<div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center"><Settings className="w-4 h-4 text-white" /></div>}
            defaultOpen={false}
            variant="card"
          >
            {/* Typography Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typography Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(FONT_STYLE_PRESETS) as FontStylePreset[]).slice(0, 6).map((presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => applyFontPreset(presetKey)}
                    className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                      selectedFontPreset === presetKey
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {presetKey.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Presets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visual Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(VISUAL_STYLE_PRESETS) as VisualStylePreset[]).slice(0, 6).map((presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => applyVisualPreset(presetKey)}
                    className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                      selectedVisualPreset === presetKey
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {presetKey.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Main Subject/Imagery
              </label>
              <input
                type="text"
                value={visualOptions.mainSubject || ''}
                onChange={(e) => setVisualOptions(prev => ({ ...prev, mainSubject: e.target.value }))}
                placeholder="e.g., A mysterious hooded figure..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {/* Custom Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom AI Instructions
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific instructions for the AI..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              />
            </div>

            {/* Reference Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style Reference
              </label>
              <input
                type="text"
                value={referenceStyle}
                onChange={(e) => setReferenceStyle(e.target.value)}
                placeholder="e.g., 'Like Stephen King covers'"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </CollapsibleSection>
        </>
      ) : (
        /* Upload Mode */
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800/50 transition-all"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-10 w-10 text-yellow-500" />
                <p className="text-gray-600 dark:text-gray-400">Uploading {coverType} cover...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-gray-800 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-yellow-500" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                  Drop your {coverType} cover here
                </p>
                <p className="text-gray-500 text-sm mb-3">
                  or click to browse
                </p>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>JPEG, PNG, WebP, GIF • Max 5MB</p>
                  <p>Recommended: 1024×1536px</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
          >
            <div className="flex-1">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-xl p-0.5">
        <div className="bg-white dark:bg-gray-900 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {coverType === 'front' ? 'Front Cover' : 'Back Cover'}
              </span>
              {selectedModelInfo && coverMode === 'generate' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  with {selectedModelInfo.name}
                </span>
              )}
            </div>
            {coverMode === 'generate' && (
              <span className="text-xs text-gray-500">
                {showPowerWriteBranding ? '✓ Branding ON' : 'No branding'}
              </span>
            )}
          </div>
          
          {coverMode === 'generate' ? (
            <button
              onClick={coverType === 'front' ? handleGenerateCover : handleGenerateBackCover}
              disabled={(coverType === 'front' ? isGenerating : isGeneratingBack) || !title || (coverType === 'front' && !author)}
              className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                (coverType === 'front' ? isGenerating : isGeneratingBack) || !title || (coverType === 'front' && !author)
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black hover:from-yellow-500 hover:via-amber-500 hover:to-orange-500 shadow-lg'
              }`}
            >
              {(coverType === 'front' ? isGenerating : isGeneratingBack) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating {coverType === 'front' ? 'Front' : 'Back'} Cover...
                </>
              ) : (coverType === 'front' ? coverUrl : backCoverUrl) ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Regenerate {coverType === 'front' ? 'Front' : 'Back'} Cover
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {coverType === 'front' ? 'Front' : 'Back'} Cover
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isUploading
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-black hover:from-yellow-500 hover:via-amber-500 hover:to-orange-500 shadow-lg'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload {coverType === 'front' ? 'Front' : 'Back'} Cover
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
