'use client';

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useStudioStore } from '@/lib/store/studio-store';
import { useBookStore } from '@/lib/store/book-store';
import { isNonFiction } from '@/lib/utils/book-type';
import { useState, useMemo } from 'react';

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'protagonist': return 'bg-yellow-400 text-black';
      case 'antagonist': return 'bg-red-400 text-black';
      case 'supporting': return 'bg-blue-400 text-black';
      default: return 'bg-gray-400 text-black';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Characters & World-Building</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Define your characters, setting, and world details to create a rich narrative foundation.
        </p>
      </div>

      {/* Setting/World */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <h4 className="font-bold text-lg">Setting & World</h4>

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
          <p className="text-xs text-gray-500 mt-1">Where does your story take place?</p>
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
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Include details about rules, customs, or unique elements that shape your story world
          </p>
        </div>
      </div>

      {/* Characters Section - Only show for fiction */}
      {!bookIsNonFiction && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <h4 className="font-bold text-lg">Characters</h4>

        {/* Character List */}
        {characters.length > 0 && (
          <div className="space-y-3 mb-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold">{character.name}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${getRoleColor(character.role)}`}>
                      {character.role}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCharacter(character.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                {character.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{character.description}</p>
                )}
                {character.traits && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Traits:</span> {character.traits}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Character Form */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400">Add Character</h5>

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
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

          <p className="text-xs text-gray-500">
            💡 Tip: Start with main characters. You can add supporting characters later as your story develops.
          </p>
        </div>
      )}
      
      {/* Non-fiction notice */}
      {bookIsNonFiction && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📚</div>
            <div>
              <h4 className="font-bold text-blue-400 mb-2">Non-Fiction Mode</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Character development is disabled for non-fiction books. Focus on factual content, research, and informative chapters instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Themes */}
      <div>
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
        <p className="text-xs text-gray-500 mt-1">
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-yellow-400 mb-2">Story Foundation Summary</h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {config.setting?.locationDetails && (
              <p>🌍 <span className="text-gray-600 dark:text-gray-400">Setting:</span> {config.setting.locationDetails}</p>
            )}
            {characters.length > 0 && (
              <p>👥 <span className="text-gray-600 dark:text-gray-400">Characters:</span> {characters.length} defined</p>
            )}
            {config.themes?.primary && config.themes.primary.length > 0 && (
              <p>💭 <span className="text-gray-600 dark:text-gray-400">Themes:</span> {config.themes.primary.length} specified</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
