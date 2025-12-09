'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Star,
  Image as ImageIcon,
  Loader2,
  BoxSelect,
  Images
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
  onGalleryUpdate?: () => void; // Callback to refresh gallery after generating new cover
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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true); // Enabled by default now
  const [showGallery, setShowGallery] = useState(false);
  const [galleryKey, setGalleryKey] = useState(0); // Key to force gallery refresh
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Callback to refresh gallery
  const refreshGallery = useCallback(() => {
    setGalleryKey(prev => prev + 1);
    onGalleryUpdate?.();
  }, [onGalleryUpdate]);
  
  // Handle cover selection from gallery
  const handleGalleryCoverSelect = useCallback((selectedCoverUrl: string, coverId: number) => {
    if (coverType === 'front') {
      setCoverUrl(selectedCoverUrl);
      onCoverGenerated(selectedCoverUrl, { source: 'gallery', coverId });
    } else {
      setBackCoverUrl(selectedCoverUrl);
      onBackCoverGenerated?.(selectedCoverUrl, { source: 'gallery', coverId });
    }
  }, [coverType, onCoverGenerated, onBackCoverGenerated]);
  
  // PowerWrite branding toggle
  const [showPowerWriteBranding, setShowPowerWriteBranding] = useState(true);
  
  // Hide author name toggle
  const [hideAuthorName, setHideAuthorName] = useState(false);
  
  // Back cover customization state
  const [backCoverOptions, setBackCoverOptions] = useState({
    showBarcode: true,
    barcodeType: 'isbn' as 'isbn' | 'qr' | 'none',
    customDescription: '',
    layout: 'classic' as 'classic' | 'modern' | 'minimal' | 'editorial',
    showWebsite: true,
    showTagline: true,
    matchFrontCover: true,
  });
  
  // Design customization state
  const genreDefaults = GENRE_COVER_DEFAULTS[genre] || GENRE_COVER_DEFAULTS['Literary Fiction'];
  const [designOptions, setDesignOptions] = useState<Partial<CoverDesignOptions>>({
    style: genreDefaults.style,
    colorScheme: genreDefaults.colorScheme,
    generationMethod: 'ai',
  });

  // === NEW COMPREHENSIVE CUSTOMIZATION STATE ===
  
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
      // Get demo user ID (or real user ID in production)
      const userId = 'demo_user'; // TODO: Get from auth context

      // Prepare customization data - only include if there are actual customizations
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          showPowerWriteBranding, // Include branding toggle
          hideAuthorName, // Include hide author option
          // New customization options
          textCustomization: hasTextCustomization ? textCustomization : undefined,
          typographyOptions: showAdvancedOptions ? typographyOptions : undefined,
          layoutOptions: showAdvancedOptions ? layoutOptions : undefined,
          visualOptions: showAdvancedOptions ? visualOptions : undefined,
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
        
        // Save to cover gallery if bookId exists
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
                  typographyOptions: showAdvancedOptions ? typographyOptions : undefined,
                  layoutOptions: showAdvancedOptions ? layoutOptions : undefined,
                  visualOptions: showAdvancedOptions ? visualOptions : undefined,
                  customPrompt: customPrompt.trim() || undefined,
                  referenceStyle: referenceStyle.trim() || undefined,
                },
                setAsMain: true, // Set as main cover by default
              }),
            });
            // Trigger gallery refresh
            refreshGallery();
          } catch (galleryErr) {
            console.error('Failed to save to gallery:', galleryErr);
            // Don't fail the main operation if gallery save fails
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bookId,
          title,
          author,
          genre,
          description: backCoverOptions.customDescription || description,
          style: designOptions.style || 'photographic',
          imageModel,
          // New back cover options
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
          // Pass front cover style for matching
          frontCoverStyle: {
            colorScheme: designOptions.colorScheme,
            style: designOptions.style,
            visualOptions: showAdvancedOptions ? visualOptions : undefined,
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
        
        // Save to cover gallery if bookId exists
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
                generationSettings: {
                  backCoverOptions,
                  designOptions,
                },
                setAsMain: true, // Set as main back cover by default
              }),
            });
            // Trigger gallery refresh
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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (!bookId) {
        // If no bookId, just show preview (for studio before book is created)
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setCoverUrl(dataUrl);
          onCoverGenerated(dataUrl, { source: 'upload', fileName: file.name });
        };
        reader.readAsDataURL(file);
        setIsUploading(false);
        return;
      }

      // Upload to server
      const formData = new FormData();
      formData.append('cover', file);

      const response = await fetch(`/api/books/${bookId}/cover/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to upload cover');
      }

      if (data.coverUrl) {
        setCoverUrl(data.coverUrl);
        onCoverGenerated(data.coverUrl, { source: 'upload', fileName: file.name });
        
        // Save uploaded cover to gallery
        if (bookId) {
          try {
            await fetch(`/api/books/${bookId}/covers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coverUrl: data.coverUrl,
                coverType: coverType, // front or back
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
      // Reset file input
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

    // Create a synthetic event to reuse the file select handler
    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      // Trigger change event manually
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
      handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Determine the author display based on branding toggle and hide author option
  const displayAuthorForPreview = hideAuthorName 
    ? '' 
    : showPowerWriteBranding 
      ? (textCustomization.customAuthor || 'PowerWrite')
      : (textCustomization.customAuthor || author || '');

  // Generate preview SVG for when no cover exists
  const previewDataUrl = CoverService.generatePreviewDataURL(
    textCustomization.customTitle || title || 'Book Title',
    displayAuthorForPreview,
    '#1a1a1a',
    '#ffffff',
    showPowerWriteBranding
  );

  // Generate back cover preview SVG with options
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

  // Tab content components
  const renderQuickOptions = () => (
    <div className="space-y-5">
      {/* Image Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Image AI Model
        </label>
        <div className="grid grid-cols-1 gap-2">
          {IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setImageModel(model.id)}
              className={`px-4 py-3 rounded-lg text-left transition-all border ${
                imageModel === model.id
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black border-amber-500 dark:border-yellow-400 shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{model.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  model.tier === 'premium' 
                    ? imageModel === model.id 
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-amber-100 dark:bg-yellow-500/20 text-amber-600 dark:text-yellow-400'
                    : imageModel === model.id
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                }`}>
                  {model.tier === 'premium' ? <Star className="w-3 h-3 fill-current" /> : null}
                  {model.tier === 'premium' ? 'Premium' : 'Standard'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${imageModel === model.id ? 'text-white/70 dark:text-black/70' : 'text-gray-500'}`}>
                {model.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cover Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cover Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['minimalist', 'illustrative', 'photographic', 'abstract', 'typographic'] as const).map((style) => (
            <button
              key={style}
              onClick={() => handleStyleChange(style)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                designOptions.style === style
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black shadow-md'
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
        <div className="grid grid-cols-3 gap-2">
          {(['warm', 'cool', 'monochrome', 'vibrant', 'pastel', 'dark'] as const).map((scheme) => (
            <button
              key={scheme}
              onClick={() => handleColorSchemeChange(scheme)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                designOptions.colorScheme === scheme
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {scheme}
            </button>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-400">All customization options available</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Use the tabs above to access text, typography, layout, and visual options
        </p>
      </div>
    </div>
  );

  const renderTextOptions = () => (
    <div className="space-y-4">
      <div className="bg-amber-500/10 dark:bg-gray-800/50 p-3 rounded-lg mb-4 flex gap-3 items-start border border-amber-200 dark:border-transparent">
        <Lightbulb className="w-5 h-5 text-amber-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Customize the text that appears on your cover. Leave blank to use defaults.
        </p>
      </div>

      {/* PowerWrite Branding Toggle */}
      <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              "Written by PowerWrite" Branding
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Display PowerWrite branding on the cover
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPowerWriteBranding(!showPowerWriteBranding)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              showPowerWriteBranding 
                ? 'bg-amber-500 dark:bg-yellow-400' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              showPowerWriteBranding ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Hide Author Name Toggle */}
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hide Author Name
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Show only the title on the cover (no author)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHideAuthorName(!hideAuthorName)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              hideAuthorName 
                ? 'bg-amber-500 dark:bg-yellow-400' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              hideAuthorName ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Custom Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Title
        </label>
        <input
          type="text"
          value={textCustomization.customTitle || ''}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, customTitle: e.target.value }))}
          placeholder={title || 'Leave blank to use book title'}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Custom Author */}
      <div className={hideAuthorName ? 'opacity-50' : ''}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Author Name
          {hideAuthorName && <span className="ml-2 text-xs text-gray-400">(hidden)</span>}
        </label>
        <input
          type="text"
          value={textCustomization.customAuthor || ''}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, customAuthor: e.target.value }))}
          placeholder={showPowerWriteBranding ? "PowerWrite (default)" : author || "Enter author name"}
          disabled={hideAuthorName}
          className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent ${hideAuthorName ? 'cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subtitle
        </label>
        <input
          type="text"
          value={textCustomization.subtitle || ''}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, subtitle: e.target.value }))}
          placeholder="Add a subtitle (optional)"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tagline / Quote
        </label>
        <input
          type="text"
          value={textCustomization.tagline || ''}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, tagline: e.target.value }))}
          placeholder="A gripping tale of mystery and adventure..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Series Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Series Name
          </label>
          <input
            type="text"
            value={textCustomization.seriesName || ''}
            onChange={(e) => setTextCustomization(prev => ({ ...prev, seriesName: e.target.value }))}
            placeholder="The Chronicles of..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Book #
          </label>
          <input
            type="number"
            min="1"
            value={textCustomization.seriesNumber || ''}
            onChange={(e) => setTextCustomization(prev => ({ 
              ...prev, 
              seriesNumber: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            placeholder="1"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Award Badge */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Award Badge
        </label>
        <input
          type="text"
          value={textCustomization.awardBadge || ''}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, awardBadge: e.target.value }))}
          placeholder="Bestseller, Award Winner, etc."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Publisher Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Publisher Name
        </label>
        <input
          type="text"
          value={textCustomization.publisherName || 'DLM Media'}
          onChange={(e) => setTextCustomization(prev => ({ ...prev, publisherName: e.target.value }))}
          placeholder="DLM Media"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderTypographyOptions = () => (
    <div className="space-y-5">
      {/* Font Style Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Typography Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FONT_STYLE_PRESETS) as FontStylePreset[]).map((presetKey) => {
            const preset = FONT_STYLE_PRESETS[presetKey];
            return (
              <button
                key={presetKey}
                onClick={() => applyFontPreset(presetKey)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  selectedFontPreset === presetKey
                    ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black border-amber-500 dark:border-yellow-400'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-medium text-sm capitalize">{presetKey.replace(/-/g, ' ')}</span>
                <p className={`text-xs mt-1 ${selectedFontPreset === presetKey ? 'text-white/70 dark:text-black/70' : 'text-gray-500'}`}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title Font */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Font Style
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['serif', 'sans-serif', 'display', 'script', 'gothic', 'modern', 'handwritten'] as const).map((font) => (
            <button
              key={font}
              onClick={() => setTypographyOptions(prev => ({ ...prev, titleFont: font }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                typographyOptions.titleFont === font
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Title Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Weight
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['light', 'normal', 'bold', 'black'] as const).map((weight) => (
            <button
              key={weight}
              onClick={() => setTypographyOptions(prev => ({ ...prev, titleWeight: weight }))}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                typographyOptions.titleWeight === weight
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {weight}
            </button>
          ))}
        </div>
      </div>

      {/* Title Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Style
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['normal', 'italic', 'uppercase', 'small-caps'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setTypographyOptions(prev => ({ ...prev, titleStyle: style }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                typographyOptions.titleStyle === style
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Title Effect */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Effect
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'shadow', 'outline', 'glow', 'embossed', '3d'] as const).map((effect) => (
            <button
              key={effect}
              onClick={() => setTypographyOptions(prev => ({ ...prev, titleEffect: effect }))}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                typographyOptions.titleEffect === effect
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {effect}
            </button>
          ))}
        </div>
      </div>

      {/* Title Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title Size
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setTypographyOptions(prev => ({ ...prev, titleSize: size }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                typographyOptions.titleSize === size
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text Alignment
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => setTypographyOptions(prev => ({ ...prev, alignment: align }))}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                typographyOptions.alignment === align
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Vertical Position
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(['top', 'upper-third', 'center', 'lower-third', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setTypographyOptions(prev => ({ ...prev, verticalPosition: pos }))}
              className={`px-2 py-2 rounded-lg text-xs capitalize transition-all ${
                typographyOptions.verticalPosition === pos
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {pos.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLayoutOptions = () => (
    <div className="space-y-5">
      {/* Layout Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Layout Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['classic', 'modern', 'bold', 'elegant', 'dramatic', 'minimalist', 'split', 'border', 'full-bleed'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => setLayoutOptions(prev => ({ ...prev, layout }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                layoutOptions.layout === layout
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Image Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Image Position
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['background', 'top-half', 'bottom-half', 'center', 'left-side', 'right-side'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setLayoutOptions(prev => ({ ...prev, imagePosition: pos }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                layoutOptions.imagePosition === pos
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {pos.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Border Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Border Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'thin', 'thick', 'double', 'ornate', 'geometric'] as const).map((border) => (
            <button
              key={border}
              onClick={() => setLayoutOptions(prev => ({ ...prev, borderStyle: border }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                layoutOptions.borderStyle === border
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {border}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Overlay Type
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(['none', 'gradient', 'solid', 'vignette', 'pattern'] as const).map((overlay) => (
            <button
              key={overlay}
              onClick={() => setLayoutOptions(prev => ({ ...prev, overlayType: overlay }))}
              className={`px-2 py-2 rounded-lg text-xs capitalize transition-all ${
                layoutOptions.overlayType === overlay
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {overlay}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay Opacity */}
      {layoutOptions.overlayType && layoutOptions.overlayType !== 'none' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overlay Opacity: {layoutOptions.overlayOpacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={layoutOptions.overlayOpacity || 50}
            onChange={(e) => setLayoutOptions(prev => ({ ...prev, overlayOpacity: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-yellow-400"
          />
        </div>
      )}

      {/* Text Zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text Zone
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['full', 'top', 'bottom', 'left', 'right', 'center-band'] as const).map((zone) => (
            <button
              key={zone}
              onClick={() => setLayoutOptions(prev => ({ ...prev, textZone: zone }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                layoutOptions.textZone === zone
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {zone.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVisualOptions = () => (
    <div className="space-y-5">
      {/* Visual Style Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Visual Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(VISUAL_STYLE_PRESETS) as VisualStylePreset[]).map((presetKey) => {
            const preset = VISUAL_STYLE_PRESETS[presetKey];
            return (
              <button
                key={presetKey}
                onClick={() => applyVisualPreset(presetKey)}
                className={`p-3 rounded-lg text-left transition-all border ${
                  selectedVisualPreset === presetKey
                    ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black border-amber-500 dark:border-yellow-400'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="font-medium text-sm capitalize">{presetKey.replace(/-/g, ' ')}</span>
                <p className={`text-xs mt-1 ${selectedVisualPreset === presetKey ? 'text-white/70 dark:text-black/70' : 'text-gray-500'}`}>
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palettes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color Palettes
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(COLOR_PALETTES) as ColorPalette[]).map((paletteKey) => {
            const palette = COLOR_PALETTES[paletteKey];
            return (
              <button
                key={paletteKey}
                onClick={() => applyColorPalette(paletteKey)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedColorPalette === paletteKey
                    ? 'ring-2 ring-amber-500 dark:ring-yellow-400'
                    : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                }`}
                style={{ backgroundColor: palette.primary }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.secondary }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: palette.accent }} />
                  <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: palette.text }} />
                </div>
                <span className="font-medium text-xs capitalize" style={{ color: palette.text }}>
                  {paletteKey.replace(/-/g, ' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Atmosphere */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Atmosphere
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['light', 'dark', 'moody', 'bright', 'mysterious', 'dramatic', 'peaceful', 'energetic'] as const).map((atm) => (
            <button
              key={atm}
              onClick={() => setVisualOptions(prev => ({ ...prev, atmosphere: atm }))}
              className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                visualOptions.atmosphere === atm
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {atm}
            </button>
          ))}
        </div>
      </div>

      {/* Main Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Main Subject/Imagery
        </label>
        <input
          type="text"
          value={visualOptions.mainSubject || ''}
          onChange={(e) => setVisualOptions(prev => ({ ...prev, mainSubject: e.target.value }))}
          placeholder="e.g., A mysterious hooded figure, A dragon silhouette..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Background Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Background Description
        </label>
        <input
          type="text"
          value={visualOptions.backgroundDescription || ''}
          onChange={(e) => setVisualOptions(prev => ({ ...prev, backgroundDescription: e.target.value }))}
          placeholder="e.g., Stormy night sky, Foggy forest, Ancient castle..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Visual Elements to Include */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Elements to Include
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newVisualElement}
            onChange={(e) => setNewVisualElement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addVisualElement()}
            placeholder="Add element (e.g., sword, moon, fire)"
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
          />
          <button
            onClick={addVisualElement}
            className="px-4 py-2 bg-amber-500 dark:bg-yellow-400 text-white dark:text-black rounded-lg font-medium hover:bg-amber-600 dark:hover:bg-yellow-500 transition-colors"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(visualOptions.visualElements || []).map((element, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-sm flex items-center gap-2"
            >
              {element}
              <button
                onClick={() => removeVisualElement(index)}
                className="hover:text-green-500 dark:hover:text-green-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Elements to Avoid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Elements to Avoid
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAvoidElement}
            onChange={(e) => setNewAvoidElement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAvoidElement()}
            placeholder="Add element to avoid"
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
          />
          <button
            onClick={addAvoidElement}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(visualOptions.avoidElements || []).map((element, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-sm flex items-center gap-2"
            >
              {element}
              <button
                onClick={() => removeAvoidElement(index)}
                className="hover:text-red-500 dark:hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // Back Cover Options Render
  const renderBackCoverOptions = () => (
    <div className="space-y-5">
      <div className="bg-amber-500/10 dark:bg-gray-800/50 p-3 rounded-lg flex gap-3 items-start border border-amber-200 dark:border-transparent">
        <FileText className="w-5 h-5 text-amber-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Customize your back cover. The design will match your front cover style for a cohesive look.
        </p>
      </div>

      {/* Match Front Cover Toggle */}
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Match Front Cover Style
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Automatically use the same colors and style as the front cover
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBackCoverOptions(prev => ({ ...prev, matchFrontCover: !prev.matchFrontCover }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              backCoverOptions.matchFrontCover 
                ? 'bg-amber-500 dark:bg-yellow-400' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              backCoverOptions.matchFrontCover ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Custom Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Back Cover Description
        </label>
        <textarea
          value={backCoverOptions.customDescription}
          onChange={(e) => setBackCoverOptions(prev => ({ ...prev, customDescription: e.target.value }))}
          placeholder={`Leave blank to use book description:\n\n"${description.substring(0, 150)}..."`}
          rows={4}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          This text will appear as the synopsis on your back cover
        </p>
      </div>

      {/* Back Cover Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Back Cover Layout
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'classic', label: 'Classic', desc: 'Traditional centered layout' },
            { id: 'modern', label: 'Modern', desc: 'Contemporary asymmetric design' },
            { id: 'minimal', label: 'Minimal', desc: 'Clean with lots of space' },
            { id: 'editorial', label: 'Editorial', desc: 'Magazine-style layout' },
          ].map((layout) => (
            <button
              type="button"
              key={layout.id}
              onClick={() => setBackCoverOptions(prev => ({ ...prev, layout: layout.id as any }))}
              className={`p-3 rounded-lg text-left transition-all border ${
                backCoverOptions.layout === layout.id
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black border-amber-500 dark:border-yellow-400'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-sm">{layout.label}</span>
              <p className={`text-xs mt-0.5 ${
                backCoverOptions.layout === layout.id ? 'text-white/70 dark:text-black/70' : 'text-gray-500'
              }`}>
                {layout.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Barcode Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Barcode / QR Code
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'isbn', label: '📊 ISBN Barcode', desc: 'Standard book barcode' },
            { id: 'qr', label: '📱 QR Code', desc: 'Link to website/preview' },
            { id: 'none', label: '✕ None', desc: 'No barcode area' },
          ].map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => setBackCoverOptions(prev => ({ 
                ...prev, 
                barcodeType: option.id as any,
                showBarcode: option.id !== 'none'
              }))}
              className={`p-3 rounded-lg text-center transition-all border ${
                backCoverOptions.barcodeType === option.id
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black border-amber-500 dark:border-yellow-400'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="font-medium text-sm block">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Elements */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Additional Elements
        </label>
        
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Website URL</span>
            <p className="text-xs text-gray-500">www.dlmworld.com</p>
          </div>
          <button
            type="button"
            onClick={() => setBackCoverOptions(prev => ({ ...prev, showWebsite: !prev.showWebsite }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              backCoverOptions.showWebsite 
                ? 'bg-amber-500 dark:bg-yellow-400' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              backCoverOptions.showWebsite ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Show "Created with PowerWrite"</span>
            <p className="text-xs text-gray-500">Tagline at the bottom</p>
          </div>
          <button
            type="button"
            onClick={() => setBackCoverOptions(prev => ({ ...prev, showTagline: !prev.showTagline }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              backCoverOptions.showTagline 
                ? 'bg-amber-500 dark:bg-yellow-400' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              backCoverOptions.showTagline ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdvancedOptions = () => (
    <div className="space-y-4">
      <div className="bg-amber-500/10 dark:bg-gray-800/50 p-3 rounded-lg mb-4 flex gap-3 items-start border border-amber-200 dark:border-transparent">
        <Target className="w-5 h-5 text-amber-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Pro tip: Use these options to fine-tune the AI generation or provide specific instructions.
        </p>
      </div>

      {/* Custom Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom AI Instructions
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Add any specific instructions for the AI. For example:&#10;- Make the cover feel nostalgic&#10;- Use a watercolor style&#10;- Include a subtle border&#10;- Make it look like a vintage 1960s paperback"
          rows={5}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent resize-none"
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
          placeholder="e.g., 'Like Stephen King covers', 'Penguin Classics style', 'Movie poster aesthetic'"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-yellow-400 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Reference a style or aesthetic you'd like to emulate
        </p>
      </div>

      {/* Generation Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Generation Method
        </label>
        <div className="flex gap-2">
          {(['ai', 'template', 'hybrid'] as const).map((method) => (
            <button
              key={method}
              onClick={() => handleMethodChange(method)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                designOptions.generationMethod === method
                  ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {method === 'ai' && '🤖 AI Generated'}
              {method === 'template' && '📐 Template'}
              {method === 'hybrid' && '✨ Hybrid'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {designOptions.generationMethod === 'ai' && `Full AI image generation using ${IMAGE_MODELS.find(m => m.id === imageModel)?.name || 'selected model'}`}
          {designOptions.generationMethod === 'template' && 'Professional templates with custom text'}
          {designOptions.generationMethod === 'hybrid' && 'AI background with styled typography overlay'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCoverMode('generate')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              coverMode === 'generate'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-yellow-400 dark:to-amber-500 text-white dark:text-black shadow-lg shadow-amber-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Bot className="w-5 h-5" />
            Generate with AI
          </button>
          <button
            onClick={() => setCoverMode('upload')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              coverMode === 'upload'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-yellow-400 dark:to-amber-500 text-white dark:text-black shadow-lg shadow-amber-500/25'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Your Own
          </button>
        </div>
      </div>

      {/* Cover Type Toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCoverType('front')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${
              coverType === 'front'
                ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Book className="w-4 h-4" />
            Front Cover
          </button>
          <button
            onClick={() => setCoverType('back')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 ${
              coverType === 'back'
                ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Back Cover
          </button>
        </div>
      </div>

      {/* Gallery Toggle - Only show if bookId exists */}
      {bookId && (
        <button
          onClick={() => setShowGallery(!showGallery)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${
            showGallery
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
        >
          <Images className="w-5 h-5" />
          {showGallery ? 'Hide Cover Gallery' : 'View Cover Gallery'}
          <span className="text-xs opacity-70 ml-1">(previously generated covers)</span>
        </button>
      )}

      {/* Cover Gallery - Shown when toggled */}
      {bookId && showGallery && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CoverGallery
            key={galleryKey}
            bookId={bookId}
            coverType="all"
            currentCoverUrl={coverType === 'front' ? coverUrl : backCoverUrl}
            onCoverSelect={handleGalleryCoverSelect}
          />
        </div>
      )}

      {/* Cover Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-500 dark:text-yellow-400" />
            {coverType === 'front' ? 'Front Cover Preview' : 'Back Cover Preview'}
          </h3>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setPreviewMode('cover')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                previewMode === 'cover'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Flat
            </button>
            <button
              onClick={() => setPreviewMode('mockup')}
              className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-1 ${
                previewMode === 'mockup'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <BoxSelect className="w-3.5 h-3.5" />
              3D
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8">
          {previewMode === 'cover' ? (
            <div className="relative w-64 h-96 bg-gray-300 dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
              {coverType === 'front' ? (
                coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Front cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewDataUrl}
                    alt="Front cover preview"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                backCoverUrl ? (
                  <img
                    src={backCoverUrl}
                    alt="Back cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={backCoverPreviewDataUrl}
                    alt="Back cover preview"
                    className="w-full h-full object-cover"
                  />
                )
              )}
            </div>
          ) : (
            // 3D mockup view
            <div className="relative" style={{ perspective: '1000px' }}>
              <div
                className="w-64 h-96 bg-gray-800 rounded shadow-2xl"
                style={{
                  transform: coverType === 'front' ? 'rotateY(-15deg) rotateX(5deg)' : 'rotateY(15deg) rotateX(5deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {coverType === 'front' ? (
                  coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Front cover"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <img
                      src={previewDataUrl}
                      alt="Front cover preview"
                      className="w-full h-full object-cover rounded"
                    />
                  )
                ) : (
                  backCoverUrl ? (
                    <img
                      src={backCoverUrl}
                      alt="Back cover"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <img
                      src={backCoverPreviewDataUrl}
                      alt="Back cover preview"
                      className="w-full h-full object-cover rounded"
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Options / Upload Area */}
      {coverMode === 'generate' ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Customization Tabs - Always visible now */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex overflow-x-auto scrollbar-hide p-2 gap-1">
              {coverType === 'front' ? (
                // Front cover tabs
                [
                  { id: 'quick' as const, label: 'Quick', icon: <Zap className="w-4 h-4" /> },
                  { id: 'text' as const, label: 'Text', icon: <Type className="w-4 h-4" /> },
                  { id: 'typography' as const, label: 'Type', icon: <Type className="w-4 h-4" /> },
                  { id: 'layout' as const, label: 'Layout', icon: <Layout className="w-4 h-4" /> },
                  { id: 'visuals' as const, label: 'Visuals', icon: <Palette className="w-4 h-4" /> },
                  { id: 'advanced' as const, label: 'Advanced', icon: <Settings className="w-4 h-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-amber-500 dark:bg-yellow-400 text-white dark:text-black shadow-md'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))
              ) : (
                // Back cover has its own options panel
                <div className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Back Cover Options</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {coverType === 'front' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  {activeTab === 'quick' && <><Zap className="w-5 h-5 text-amber-500" /> Quick Options</>}
                  {activeTab === 'text' && <><Type className="w-5 h-5 text-amber-500" /> Text Customization</>}
                  {activeTab === 'typography' && <><Type className="w-5 h-5 text-amber-500" /> Typography Options</>}
                  {activeTab === 'layout' && <><Layout className="w-5 h-5 text-amber-500" /> Layout Options</>}
                  {activeTab === 'visuals' && <><Palette className="w-5 h-5 text-amber-500" /> Visual Options</>}
                  {activeTab === 'advanced' && <><Settings className="w-5 h-5 text-amber-500" /> Advanced Options</>}
                </h3>
                
                {activeTab === 'quick' && renderQuickOptions()}
                {activeTab === 'text' && renderTextOptions()}
                {activeTab === 'typography' && renderTypographyOptions()}
                {activeTab === 'layout' && renderLayoutOptions()}
                {activeTab === 'visuals' && renderVisualOptions()}
                {activeTab === 'advanced' && renderAdvancedOptions()}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" /> Back Cover Customization
                </h3>
                {renderBackCoverOptions()}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-500" />
            Upload Your Cover
          </h3>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 dark:hover:border-yellow-400 hover:bg-amber-50 dark:hover:bg-gray-800/50 transition-all"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-10 w-10 text-amber-500 dark:text-yellow-400" />
                <p className="text-gray-600 dark:text-gray-400">Uploading cover...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-gray-800 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-amber-500 dark:text-yellow-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Drop your cover image here
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  or click to browse files
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Supported formats: JPEG, PNG, WebP, GIF</p>
                  <p>Maximum size: 5MB</p>
                  <p>Recommended: 1024×1536px (portrait, 2:3 ratio)</p>
                </div>
              </>
            )}
          </div>

          {/* Upload Tips */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Tips for best results:
            </h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Use high-resolution images (at least 600×900px)</li>
              <li>• Portrait orientation works best for book covers</li>
              <li>• Ensure text is readable and well-contrasted</li>
              <li>• Keep important elements away from edges</li>
            </ul>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-500 dark:text-red-400/70 text-xs mt-2 hover:text-red-700 dark:hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generate / Upload Button */}
      {coverMode === 'generate' ? (
        coverType === 'front' ? (
          <button
            onClick={handleGenerateCover}
            disabled={isGenerating || !title || !author}
            className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg ${
              isGenerating || !title || !author
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-yellow-400 dark:to-amber-500 text-white dark:text-black hover:from-amber-600 hover:to-orange-600 dark:hover:from-yellow-500 dark:hover:to-amber-600 shadow-amber-500/25'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Generating Front Cover...
              </span>
            ) : coverUrl ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Regenerate Front Cover
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate Front Cover
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={handleGenerateBackCover}
            disabled={isGeneratingBack || !title || !description}
            className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg ${
              isGeneratingBack || !title || !description
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-yellow-400 dark:to-amber-500 text-white dark:text-black hover:from-amber-600 hover:to-orange-600 dark:hover:from-yellow-500 dark:hover:to-amber-600 shadow-amber-500/25'
            }`}
          >
            {isGeneratingBack ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                Generating Back Cover...
              </span>
            ) : backCoverUrl ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Regenerate Back Cover
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate Back Cover
              </span>
            )}
          </button>
        )
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg ${
            isUploading
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-yellow-400 dark:to-amber-500 text-white dark:text-black hover:from-amber-600 hover:to-orange-600 dark:hover:from-yellow-500 dark:hover:to-amber-600 shadow-amber-500/25'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Uploading...
            </span>
          ) : coverUrl ? (
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Cover
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Select File to Upload
            </span>
          )}
        </button>
      )}

      {/* Download buttons for both covers */}
      {(coverUrl || backCoverUrl) && (
        <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Download Your Covers</h4>
          {coverUrl && (
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = coverUrl;
                link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_front_cover.png`;
                link.click();
              }}
              className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium border border-gray-200 dark:border-gray-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Front Cover
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
              className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium border border-gray-200 dark:border-gray-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Back Cover
            </button>
          )}
          {coverMode === 'generate' && (
            <button
              onClick={() => setCoverMode('upload')}
              className="flex items-center justify-center gap-2 py-2 px-4 text-gray-500 dark:text-gray-400 rounded-lg hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4" />
              Replace with Upload
            </button>
          )}
        </div>
      )}
    </div>
  );
}
