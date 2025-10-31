'use client';

import { useStudioStore } from '@/lib/store/studio-store';

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
    { value: 'serious', label: 'Serious', icon: '😐' },
    { value: 'humorous', label: 'Humorous', icon: '😄' },
    { value: 'dark', label: 'Dark', icon: '🌑' },
    { value: 'light-hearted', label: 'Light-hearted', icon: '☀️' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨' },
    { value: 'satirical', label: 'Satirical', icon: '🎭' },
    { value: 'neutral', label: 'Neutral', icon: '⚖️' },
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Writing Style & Tone</h2>
        <p className="text-gray-400">Define how your book should be written</p>
      </div>

      {/* Writing Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Writing Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {styles.map((style) => (
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
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.writingStyle.style === style.value
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{style.label}</div>
              <div className="text-xs mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tones.map((tone) => (
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
              className={`px-4 py-3 rounded font-medium transition-colors ${
                config.writingStyle.tone === tone.value
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">{tone.icon}</div>
              <div className="font-semibold text-sm">{tone.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Point of View */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Point of View (POV)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {povOptions.map((pov) => (
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
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.writingStyle.pov === pov.value
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{pov.label}</div>
              <div className="text-xs mt-1">{pov.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tense */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Tense
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tenses.map((tense) => (
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
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.writingStyle.tense === tense.value
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{tense.label}</div>
              <div className="text-xs mt-1">{tense.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Voice */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Narrative Voice
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {voices.map((voice) => (
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
              className={`px-4 py-3 rounded font-medium transition-colors text-left ${
                config.writingStyle.narrativeVoice === voice.value
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{voice.label}</div>
              <div className="text-xs mt-1">{voice.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded p-4 border border-gray-700">
        <h3 className="font-semibold mb-2">Style Summary</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            <span className="text-gray-400">Style:</span>{' '}
            <span className="text-yellow-400 font-semibold capitalize">
              {config.writingStyle.style}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Tone:</span>{' '}
            <span className="text-yellow-400 font-semibold capitalize">
              {config.writingStyle.tone}
            </span>
          </p>
          <p>
            <span className="text-gray-400">POV:</span>{' '}
            <span className="text-yellow-400 font-semibold">
              {povOptions.find(p => p.value === config.writingStyle.pov)?.label}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Tense:</span>{' '}
            <span className="text-yellow-400 font-semibold capitalize">
              {config.writingStyle.tense}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Voice:</span>{' '}
            <span className="text-yellow-400 font-semibold capitalize">
              {config.writingStyle.narrativeVoice.replace('-', ' ')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
