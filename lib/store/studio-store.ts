import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookConfiguration, defaultBookConfiguration } from '../types/studio';
import { ReferenceAnalysis } from '../types/book';
import { BookOutline } from '../types/generation';

interface UploadedReference {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'url';
  content?: string;
  url?: string;
  size?: number;
  uploadedAt: Date;
}

interface StudioStore {
  // Configuration state
  config: BookConfiguration;
  updateConfig: (updates: any) => void;
  resetConfig: () => void;
  setConfig: (config: BookConfiguration) => void;

  // Reference book analysis and auto-population
  referenceAnalysis?: ReferenceAnalysis;
  setReferenceAnalysis: (analysis: ReferenceAnalysis) => void;
  loadFromReference: (analysis: ReferenceAnalysis) => void;

  // Uploaded references
  uploadedReferences: UploadedReference[];
  addUploadedReferences: (references: UploadedReference[]) => void;
  removeUploadedReference: (id: string) => void;
  clearUploadedReferences: () => void;

  // Outline state
  outline?: BookOutline;
  setOutline: (outline: BookOutline) => void;
  clearOutline: () => void;

  // Current book being edited
  currentBookId?: number;
  setCurrentBookId: (id: number | undefined) => void;

  // Generation status
  isGenerating: boolean;
  setIsGenerating: (status: boolean) => void;

  // Unsaved changes tracking
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (status: boolean) => void;
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      config: defaultBookConfiguration,

      updateConfig: (updates) => {
        set((state) => ({
          config: {
            ...state.config,
            ...updates,
          },
          hasUnsavedChanges: true,
        }));
      },

      uploadedReferences: [],
      
      addUploadedReferences: (references) => {
        set((state) => ({
          uploadedReferences: [...state.uploadedReferences, ...references],
        }));
      },

      removeUploadedReference: (id) => {
        set((state) => ({
          uploadedReferences: state.uploadedReferences.filter(r => r.id !== id),
        }));
      },

      clearUploadedReferences: () => {
        set({ uploadedReferences: [] });
      },

      resetConfig: () => {
        set({
          config: defaultBookConfiguration,
          outline: undefined,
          referenceAnalysis: undefined,
          hasUnsavedChanges: false,
        });
      },

      setConfig: (config) => {
        set({ config, hasUnsavedChanges: true });
      },

      referenceAnalysis: undefined,
      
      setReferenceAnalysis: (analysis) => {
        set({ referenceAnalysis: analysis });
      },

      loadFromReference: (analysis) => {
        const currentConfig = get().config;
        
        // Auto-populate fields from reference analysis
        const updatedConfig: BookConfiguration = {
          ...currentConfig,
          writingStyle: {
            ...currentConfig.writingStyle,
            style: mapStyleToConfig(analysis.writingStyle.style),
            tone: mapToneToConfig(analysis.tone),
            pov: mapPOVToConfig(analysis.pov),
            tense: mapTenseToConfig(analysis.tense),
          },
          plot: {
            ...currentConfig.plot,
            narrativeStructure: mapStructureToConfig(analysis.narrativeStructure.structure),
            pacing: mapPacingToConfig(analysis.pacing),
          },
          themes: {
            ...currentConfig.themes,
            primary: analysis.themes || [],
          },
          language: {
            ...currentConfig.language,
            complexity: mapVocabularyToComplexity(analysis.vocabularyLevel),
            dialogueStyle: mapDialogueStyle(analysis.dialogueStyle),
          },
          content: {
            ...currentConfig.content,
            targetWordCount: analysis.avgChapterLength * currentConfig.content.numChapters,
          },
          referenceBooks: {
            selectedBookIds: [],
            analysis: analysis,
            autoPopulated: true,
          },
        };

        set({
          config: updatedConfig,
          referenceAnalysis: analysis,
          hasUnsavedChanges: true,
        });
      },

      outline: undefined,
      setOutline: (outline) => set({ outline }),
      clearOutline: () => set({ outline: undefined }),

      currentBookId: undefined,
      setCurrentBookId: (id) => set({ currentBookId: id }),

      isGenerating: false,
      setIsGenerating: (status) => set({ isGenerating: status }),

      hasUnsavedChanges: false,
      setHasUnsavedChanges: (status) => set({ hasUnsavedChanges: status }),
    }),
    {
      name: 'studio-store',
      partialize: (state) => ({
        config: state.config,
        outline: state.outline,
        currentBookId: state.currentBookId,
      }),
    }
  )
);

// Helper functions to map reference analysis to config values
function mapStyleToConfig(style: string): BookConfiguration['writingStyle']['style'] {
  const styleMap: { [key: string]: BookConfiguration['writingStyle']['style'] } = {
    formal: 'formal',
    casual: 'casual',
    academic: 'academic',
    conversational: 'conversational',
    poetic: 'poetic',
    technical: 'technical',
    journalistic: 'journalistic',
  };
  return styleMap[style.toLowerCase()] || 'conversational';
}

function mapToneToConfig(tone: string): BookConfiguration['writingStyle']['tone'] {
  const toneMap: { [key: string]: BookConfiguration['writingStyle']['tone'] } = {
    serious: 'serious',
    humorous: 'humorous',
    dark: 'dark',
    'light-hearted': 'light-hearted',
    inspirational: 'inspirational',
    satirical: 'satirical',
    neutral: 'neutral',
  };
  return toneMap[tone.toLowerCase()] || 'neutral';
}

function mapPOVToConfig(pov: string): BookConfiguration['writingStyle']['pov'] {
  const povMap: { [key: string]: BookConfiguration['writingStyle']['pov'] } = {
    'first-person': 'first-person',
    'second-person': 'second-person',
    'third-person-limited': 'third-person-limited',
    'third-person-omniscient': 'third-person-omniscient',
  };
  return povMap[pov.toLowerCase()] || 'third-person-limited';
}

function mapTenseToConfig(tense: string): BookConfiguration['writingStyle']['tense'] {
  const tenseMap: { [key: string]: BookConfiguration['writingStyle']['tense'] } = {
    past: 'past',
    present: 'present',
    future: 'future',
    mixed: 'mixed',
  };
  return tenseMap[tense.toLowerCase()] || 'past';
}

function mapStructureToConfig(structure: string): BookConfiguration['plot']['narrativeStructure'] {
  const structureMap: { [key: string]: BookConfiguration['plot']['narrativeStructure'] } = {
    'three-act': 'three-act',
    "hero's journey": 'hero-journey',
    'five-act': 'five-act',
    freytag: 'freytag',
    circular: 'circular',
    custom: 'custom',
  };
  return structureMap[structure.toLowerCase()] || 'three-act';
}

function mapPacingToConfig(pacing?: string): BookConfiguration['plot']['pacing'] {
  if (!pacing) return 'moderate';
  const pacingMap: { [key: string]: BookConfiguration['plot']['pacing'] } = {
    fast: 'fast',
    moderate: 'moderate',
    slow: 'slow',
    variable: 'variable',
  };
  return pacingMap[pacing.toLowerCase()] || 'moderate';
}

function mapVocabularyToComplexity(vocabulary: string): BookConfiguration['language']['complexity'] {
  const complexityMap: { [key: string]: BookConfiguration['language']['complexity'] } = {
    simple: 'simple',
    moderate: 'moderate',
    complex: 'complex',
    mixed: 'mixed',
  };
  return complexityMap[vocabulary.toLowerCase()] || 'moderate';
}

function mapDialogueStyle(dialogueStyle?: string): BookConfiguration['language']['dialogueStyle'] {
  if (!dialogueStyle) return 'realistic';
  const dialogueMap: { [key: string]: BookConfiguration['language']['dialogueStyle'] } = {
    realistic: 'realistic',
    stylized: 'stylized',
    minimal: 'minimal',
    extensive: 'extensive',
  };
  return dialogueMap[dialogueStyle.toLowerCase()] || 'realistic';
}
