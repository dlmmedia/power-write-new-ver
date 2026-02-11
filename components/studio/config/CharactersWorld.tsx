'use client';

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useStudioStore } from '@/lib/store/studio-store';
import { useBookStore } from '@/lib/store/book-store';
import { isNonFiction } from '@/lib/utils/book-type';
import { useState, useMemo } from 'react';
import { Lightbulb, Library, Globe, MessageCircle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  traits: string;
}

export function CharactersWorld() {
  const { config, updateConfig } = useStudioStore();
  const { selectedBooks } = useBookStore();
  const [characters, setCharacters] = useState<Character[]>(
    Array.isArray((config as any).characterList) ? ((config as any).characterList as Character[]) : []
  );
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    role: 'supporting',
    description: '',
    traits: ''
  });
  
  // Detect if the selected reference books are non-fiction
  const bookIsNonFiction = useMemo(() => {
    if (selectedBooks.length === 0) return false;
    return selectedBooks.some(book => isNonFiction(book));
  }, [selectedBooks]);

  const addCharacter = () => {
    if (!newCharacter.name) return;

    const character: Character = {
      id: Date.now().toString(),
      name: newCharacter.name,
      role: newCharacter.role as Character['role'],
      description: newCharacter.description || '',
      traits: newCharacter.traits || ''
    };

    const updated = [...characters, character];
    setCharacters(updated);
    updateConfig({ characterList: updated });

    // Reset form
    setNewCharacter({
      name: '',
      role: 'supporting',
      description: '',
      traits: ''
    });
  };

  const removeCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    setCharacters(updated);
    updateConfig({ characterList: updated });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'protagonist': return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-500/20';
      case 'antagonist': return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 ring-1 ring-red-500/20';
      case 'supporting': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Characters & World-Building</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Define your characters, setting, and world details to create a rich narrative foundation.
        </p>
      </div>

      {/* Setting/World */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Setting & World</p>

        <div>
          <Label htmlFor="setting">Primary Setting *</Label>
          <Input
            id="setting"
            value={config.setting?.locationDetails || ''}
            onChange={(e) => updateConfig({
              setting: {
                ...config.setting,
                locationDetails: e.target.value,
              },
            })}
            placeholder="e.g., Victorian London, Mars Colony 2157, Small-town America"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Where does your story take place?</p>
        </div>

        <div>
          <Label htmlFor="time-period">Time Period</Label>
          <Input
            id="time-period"
            value={config.setting?.specificEra || ''}
            onChange={(e) => updateConfig({
              setting: {
                ...config.setting,
                specificEra: e.target.value,
              },
            })}
            placeholder="e.g., 1890s, Contemporary, 25th Century"
          />
        </div>

        <div>
          <Label htmlFor="world-details">World-Building Details</Label>
          <Textarea
            id="world-details"
            value={(config.setting?.culturalElements || []).join('\n') || ''}
            onChange={(e) => updateConfig({
              setting: {
                ...config.setting,
                culturalElements: e.target.value.split('\n').filter(Boolean),
              },
            })}
            placeholder="Describe unique aspects of your world: culture, technology, magic systems, social structures, politics, geography, etc."
            rows={4}
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Include details about rules, customs, or unique elements that shape your story world
          </p>
        </div>
      </div>

      {/* Characters Section - Only show for fiction */}
      {!bookIsNonFiction && (
        <div className="space-y-4 pt-5 border-t border-gray-200/60 dark:border-gray-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Characters</p>

        {/* Character List */}
        {characters.length > 0 && (
          <div className="space-y-2">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-white dark:bg-gray-900/50 rounded-lg p-3.5 border border-gray-200/80 dark:border-gray-700/40 group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">{character.name}</h5>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${getRoleBadge(character.role)}`}>
                      {character.role}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCharacter(character.id)}
                    className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Remove
                  </button>
                </div>
                {character.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{character.description}</p>
                )}
                {character.traits && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="font-medium">Traits:</span> {character.traits}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Character Form */}
        <div className="bg-gray-50/80 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-700/30 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Add Character</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="char-name">Character Name *</Label>
              <Input
                id="char-name"
                value={newCharacter.name || ''}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                placeholder="e.g., Sarah Chen"
              />
            </div>

            <div>
              <Label htmlFor="char-role">Role *</Label>
              <select
                id="char-role"
                value={newCharacter.role || 'supporting'}
                onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value as Character['role'] })}
                className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/40 transition-shadow"
              >
                <option value="protagonist">Protagonist</option>
                <option value="antagonist">Antagonist</option>
                <option value="supporting">Supporting</option>
                <option value="minor">Minor</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="char-description">Description</Label>
            <Textarea
              id="char-description"
              value={newCharacter.description || ''}
              onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
              placeholder="Physical appearance, background, motivations..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="char-traits">Key Traits</Label>
            <Input
              id="char-traits"
              value={newCharacter.traits || ''}
              onChange={(e) => setNewCharacter({ ...newCharacter, traits: e.target.value })}
              placeholder="e.g., Brave, intelligent, conflicted, ambitious"
            />
          </div>

          <Button
            variant="outline"
            onClick={addCharacter}
            disabled={!newCharacter.name}
            className="w-full"
          >
            + Add Character
          </Button>
        </div>

          <div className="flex items-start gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Start with main characters. You can add supporting characters later as your story develops.</span>
          </div>
        </div>
      )}
      
      {/* Non-fiction notice */}
      {bookIsNonFiction && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Library className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Non-Fiction Mode</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300/70">
                Character development is disabled for non-fiction books. Focus on factual content, research, and informative chapters instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Themes */}
      <div className="pt-5 border-t border-gray-200/60 dark:border-gray-800/40">
        <Label htmlFor="themes">Themes & Messages</Label>
        <Textarea
          id="themes"
          value={(config.themes?.primary || []).join(', ') || ''}
          onChange={(e) => updateConfig({
            themes: {
              ...config.themes,
              primary: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
            },
          })}
          placeholder="What themes or messages do you want to explore? e.g., redemption, love vs. duty, power and corruption, identity..."
          rows={3}
        />
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          These themes will be woven throughout the narrative (comma-separated)
        </p>
      </div>

      {/* Conflict Type */}
      <div>
        <Label htmlFor="conflict">Central Conflict</Label>
        <Textarea
          id="conflict"
          value={config.plot?.plotPoints?.incitingIncident || ''}
          onChange={(e) => updateConfig({
            plot: {
              ...config.plot,
              plotPoints: {
                ...config.plot?.plotPoints,
                incitingIncident: e.target.value,
              },
            },
          })}
          placeholder="What is the main conflict driving your story? Person vs. person, person vs. self, person vs. society, etc."
          rows={3}
        />
      </div>

      {/* Summary */}
      {(characters.length > 0 || config.setting?.locationDetails) && (
        <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200/40 dark:border-gray-700/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Story Foundation</p>
          <div className="space-y-2 text-sm">
            {config.setting?.locationDetails && (
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Setting:</span>
                <span className="text-gray-900 dark:text-white font-medium">{config.setting.locationDetails}</span>
              </div>
            )}
            {characters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">👥</span>
                <span className="text-gray-500 dark:text-gray-400">Characters:</span>
                <span className="text-gray-900 dark:text-white font-medium">{characters.length} defined</span>
              </div>
            )}
            {config.themes?.primary && config.themes.primary.length > 0 && (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Themes:</span>
                <span className="text-gray-900 dark:text-white font-medium">{config.themes.primary.length} specified</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
