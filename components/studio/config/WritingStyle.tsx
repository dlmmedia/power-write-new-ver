'use client';

import { useStudioStore } from '@/lib/store/studio-store';
import { Meh, Smile, Moon, Sun, Sparkles, Drama, Scale } from 'lucide-react';
import React from 'react';

const TONE_ICONS: Record<string, React.ReactNode> = {
  'meh': <Meh className="w-4 h-4" />,
  'smile': <Smile className="w-4 h-4" />,
  'moon': <Moon className="w-4 h-4" />,
  'sun': <Sun className="w-4 h-4" />,
  'sparkles': <Sparkles className="w-4 h-4" />,
  'drama': <Drama className="w-4 h-4" />,
  'scale': <Scale className="w-4 h-4" />,
};

export const WritingStyle: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  const styles = [
    { value: 'formal', label: 'Formal', desc: 'Professional, structured' },
    { value: 'casual', label: 'Casual', desc: 'Relaxed, friendly' },
    { value: 'academic', label: 'Academic', desc: 'Scholarly, detailed' },
    { value: 'conversational', label: 'Conversational', desc: 'Natural, engaging' },
    { value: 'poetic', label: 'Poetic', desc: 'Lyrical, artistic' },
    { value: 'technical', label: 'Technical', desc: 'Precise, specific' },
    { value: 'journalistic', label: 'Journalistic', desc: 'Factual, clear' },
  ];

  const tones = [
    { value: 'serious', label: 'Serious', icon: 'meh' },
    { value: 'humorous', label: 'Humorous', icon: 'smile' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'light-hearted', label: 'Light-hearted', icon: 'sun' },
    { value: 'inspirational', label: 'Inspirational', icon: 'sparkles' },
    { value: 'satirical', label: 'Satirical', icon: 'drama' },
    { value: 'neutral', label: 'Neutral', icon: 'scale' },
  ];

  const povOptions = [
    { value: 'first-person', label: 'First Person', desc: 'I, me, my' },
    { value: 'second-person', label: 'Second Person', desc: 'You, your' },
    { value: 'third-person-limited', label: 'Third Person Limited', desc: 'He, she - one perspective' },
    { value: 'third-person-omniscient', label: 'Third Person Omniscient', desc: 'All-knowing narrator' },
  ];

  const tenses = [
    { value: 'past', label: 'Past Tense', desc: 'She walked, he said' },
    { value: 'present', label: 'Present Tense', desc: 'She walks, he says' },
    { value: 'future', label: 'Future Tense', desc: 'She will walk, he will say' },
    { value: 'mixed', label: 'Mixed', desc: 'Varies by scene' },
  ];

  const voices = [
    { value: 'active', label: 'Active', desc: 'Direct, engaging' },
    { value: 'passive', label: 'Passive', desc: 'Observational' },
    { value: 'descriptive', label: 'Descriptive', desc: 'Rich detail' },
    { value: 'dialogue-heavy', label: 'Dialogue Heavy', desc: 'Conversation-focused' },
  ];

  const selectedClass = 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 ring-1 ring-yellow-500/20';
  const unselectedClass = 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600';
  const selectedText = 'text-yellow-700 dark:text-yellow-300';
  const selectedDesc = 'text-yellow-600/60 dark:text-yellow-400/50';
  const unselectedText = 'text-gray-900 dark:text-white';
  const unselectedDesc = 'text-gray-500 dark:text-gray-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Writing Style & Tone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Define how your book should be written</p>
      </div>

      {/* Writing Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Writing Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {styles.map((style) => {
            const isActive = config.writingStyle.style === style.value;
            return (
              <button
                key={style.value}
                onClick={() =>
                  updateConfig({
                    writingStyle: {
                      ...config.writingStyle,
                      style: style.value as any,
                    },
                  })
                }
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${isActive ? selectedClass : unselectedClass}`}
              >
                <div className={`text-sm font-medium ${isActive ? selectedText : unselectedText}`}>{style.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? selectedDesc : unselectedDesc}`}>{style.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tones.map((tone) => {
            const isActive = config.writingStyle.tone === tone.value;
            return (
              <button
                key={tone.value}
                onClick={() =>
                  updateConfig({
                    writingStyle: {
                      ...config.writingStyle,
                      tone: tone.value as any,
                    },
                  })
                }
                className={`px-3 py-2.5 rounded-lg transition-all border flex items-center gap-2 ${isActive ? selectedClass : unselectedClass}`}
              >
                <span className={`${isActive ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>{TONE_ICONS[tone.icon] || tone.icon}</span>
                <span className={`text-sm font-medium ${isActive ? selectedText : unselectedText}`}>{tone.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Point of View */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Point of View (POV)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {povOptions.map((pov) => {
            const isActive = config.writingStyle.pov === pov.value;
            return (
              <button
                key={pov.value}
                onClick={() =>
                  updateConfig({
                    writingStyle: {
                      ...config.writingStyle,
                      pov: pov.value as any,
                    },
                  })
                }
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${isActive ? selectedClass : unselectedClass}`}
              >
                <div className={`text-sm font-medium ${isActive ? selectedText : unselectedText}`}>{pov.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? selectedDesc : unselectedDesc}`}>{pov.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tense */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tense
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tenses.map((tense) => {
            const isActive = config.writingStyle.tense === tense.value;
            return (
              <button
                key={tense.value}
                onClick={() =>
                  updateConfig({
                    writingStyle: {
                      ...config.writingStyle,
                      tense: tense.value as any,
                    },
                  })
                }
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${isActive ? selectedClass : unselectedClass}`}
              >
                <div className={`text-sm font-medium ${isActive ? selectedText : unselectedText}`}>{tense.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? selectedDesc : unselectedDesc}`}>{tense.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Narrative Voice */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Narrative Voice
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {voices.map((voice) => {
            const isActive = config.writingStyle.narrativeVoice === voice.value;
            return (
              <button
                key={voice.value}
                onClick={() =>
                  updateConfig({
                    writingStyle: {
                      ...config.writingStyle,
                      narrativeVoice: voice.value as any,
                    },
                  })
                }
                className={`px-3 py-2.5 rounded-lg text-left transition-all border ${isActive ? selectedClass : unselectedClass}`}
              >
                <div className={`text-sm font-medium ${isActive ? selectedText : unselectedText}`}>{voice.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? selectedDesc : unselectedDesc}`}>{voice.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Style Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Style</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{config.writingStyle.style}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Tone</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{config.writingStyle.tone}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">POV</span>
            <p className="font-medium text-gray-900 dark:text-white">{povOptions.find(p => p.value === config.writingStyle.pov)?.label}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Tense</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{config.writingStyle.tense}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Voice</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{config.writingStyle.narrativeVoice.replace('-', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
