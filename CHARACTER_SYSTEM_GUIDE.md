# Character System - Complete Guide

## Overview

The custom character system allows users to define their own characters that will be used throughout the book generation process. This ensures that the characters you create in the Studio are properly reflected in the final book output.

## How It Works

### 1. Character Creation (UI)

**Location:** `components/studio/config/CharactersWorld.tsx`

Users can add custom characters with the following properties:
- **Name** (required): Character's full name
- **Role** (required): protagonist, antagonist, supporting, or minor
- **Description** (optional): Physical appearance, background, motivations
- **Key Traits** (optional): Personality traits like "brave, intelligent, conflicted"

**Storage:** Characters are stored in `config.characterList` in the studio store.

### 2. Outline Generation (API)

**Location:** `app/api/generate/outline/route.ts`

When generating a book outline:

1. The API extracts custom characters from `config.characterList`
2. Characters are formatted into instructions for the AI:
   ```
   Custom Characters:
   - Sarah Chen (protagonist): A brilliant scientist with a dark secret | Traits: Brave, intelligent
   - Dr. Marcus Black (antagonist): Former colleague turned enemy | Traits: Cunning, ruthless
   ```
3. Characters are passed to the AI service via the `customCharacters` parameter
4. They're included in the `customInstructions` sent to the AI

### 3. AI Outline Generation (Service)

**Location:** `lib/services/ai-service.ts` - `generateBookOutline()` method

The AI service:

1. **Receives** custom characters in the config
2. **Builds character context** that instructs the AI to use EXACT characters provided
3. **Includes in prompt:**
   ```
   IMPORTANT - Use these EXACT characters in the outline:
   - Sarah Chen (protagonist): A brilliant scientist...
   - Dr. Marcus Black (antagonist): Former colleague...
   
   Do NOT create new main characters. Use the characters listed above.
   ```
4. **Post-processing:** After receiving the AI response, custom characters are explicitly set in the outline to ensure they override any AI-generated ones:
   ```typescript
   if (hasCustomCharacters && !isNonFiction) {
     outline.characters = config.customCharacters!.map(c => ({
       name: c.name,
       role: c.role,
       description: c.description + (c.traits ? ` | Key traits: ${c.traits}` : '')
     }));
   }
   ```

### 4. Chapter Generation (Service)

**Location:** `lib/services/ai-service.ts` - `generateChapter()` method

When generating each chapter:

1. Characters from the outline are included in the chapter prompt
2. **Full character details** are provided to the AI:
   ```
   Characters:
   - Sarah Chen (protagonist): A brilliant scientist with a dark secret | Key traits: Brave, intelligent
   - Dr. Marcus Black (antagonist): Former colleague turned enemy | Key traits: Cunning, ruthless
   ```
3. AI is instructed to "Develop the characters listed above with depth and authenticity"
4. This ensures characters appear consistently throughout all chapters

### 5. Streaming Chapter Generation

**Location:** `lib/services/ai-service.ts` - `generateChapterStream()` method

The streaming version also includes character information to ensure consistency in real-time generation.

## Character Data Flow

```
User Input (UI)
    ↓
config.characterList
    ↓
Outline Generation API
    ↓
customCharacters parameter
    ↓
AI Service (Outline)
    ↓
outline.characters (guaranteed to match custom characters)
    ↓
AI Service (Chapter Generation)
    ↓
Final Book Content
```

## Key Features

### ✅ Character Preservation
- Custom characters are **guaranteed** to appear in the outline
- They **override** any AI-generated characters
- They're used consistently across **all chapters**

### ✅ Rich Character Details
- Character descriptions are included in every chapter prompt
- Key traits are preserved and shared with the AI
- Role information helps the AI understand character importance

### ✅ Non-Fiction Handling
- Character creation is **disabled** for non-fiction books
- The system detects book type and adjusts accordingly
- Non-fiction books skip character-related prompts

## Testing the Character System

To verify custom characters work properly:

1. **Create a Fiction Book** in the Studio
2. **Add Custom Characters:**
   - Name: "Alex Thompson"
   - Role: "Protagonist"
   - Description: "A retired detective with a photographic memory"
   - Traits: "Observant, cautious, haunted by past"

3. **Generate Outline** - Check that "Alex Thompson" appears in the outline with the correct role and description

4. **Generate Book** - Verify that:
   - Alex Thompson appears throughout the chapters
   - The character matches your description
   - Character traits are reflected in their actions/dialogue
   - No random protagonists were created instead

## Code Changes Summary

### Files Modified:

1. **`app/api/generate/outline/route.ts`**
   - Extract `characterList` from config
   - Format characters into instructions
   - Pass as `customCharacters` to AI service
   - Include in `customInstructions`

2. **`lib/services/ai-service.ts`**
   - Added `customCharacters` to `BookGenerationConfig` interface
   - Build character context in outline generation
   - Include character context in AI prompt
   - Post-process to ensure custom characters in outline
   - Enhanced chapter generation to include full character details
   - Updated streaming generation with character info

### Files Not Modified:

- **`components/studio/config/CharactersWorld.tsx`** - Already working correctly
- Character storage in `config.characterList` was already implemented

## Common Issues & Solutions

### Issue: Characters not appearing in book
**Solution:** Ensure you're generating a fiction book (non-fiction doesn't use characters)

### Issue: AI creating different characters
**Solution:** The post-processing step (lines 228-236 in ai-service.ts) now guarantees custom characters override AI-generated ones

### Issue: Characters inconsistent across chapters
**Solution:** Character details are now included in every chapter prompt for consistency

## Next Steps

The character system is now fully functional. Custom characters you add in the Studio will:
- ✅ Appear in the book outline
- ✅ Be used consistently in all chapters
- ✅ Maintain their descriptions and traits
- ✅ Override any AI-generated characters

You can now confidently create books with your own custom characters!

