# PowerWrite Logo Guide

## Overview

The PowerWrite logo has been redesigned with a modern, minimal aesthetic using black and yellow colors. The logo is now a reusable component with multiple variants.

## Logo Component Location

`/components/ui/Logo.tsx`

## Available Logo Variants

### 1. **Logo (Default)** - Recommended
The main logo with a rounded yellow background, "PW" text, and subtle pen stroke decoration.

```tsx
import { Logo } from '@/components/ui/Logo';

<Logo size="md" />
```

**Features:**
- Rounded yellow background with hover effect
- Bold black "PW" text
- Decorative pen stroke overlay (subtle)
- Small black accent corner for depth
- Responsive sizing

### 2. **LogoMinimal**
A simpler version with just the yellow background and text, with a subtle underline accent.

```tsx
import { LogoMinimal } from '@/components/ui/Logo';

<LogoMinimal size="md" />
```

**Features:**
- Clean rectangular design
- Rounded corners
- Subtle bottom accent line
- Hover effect

### 3. **LogoIcon**
An SVG-based icon version with stylized "P" and "W" letters.

```tsx
import { LogoIcon } from '@/components/ui/Logo';

<LogoIcon size="md" />
```

**Features:**
- Vector-based SVG
- Stylized letter forms
- Small pen accent
- Scales perfectly at any size

## Size Options

All logo variants support three sizes:

- `sm` - Small (32px / h-8 w-8)
- `md` - Medium (40px / h-10 w-10) - **Default**
- `lg` - Large (48px / h-12 w-12)

## Usage Examples

### Basic Usage
```tsx
<Logo size="md" />
```

### With Custom Classes
```tsx
<Logo size="lg" className="cursor-pointer" />
```

### In Navigation
```tsx
<header>
  <div className="flex items-center gap-4">
    <Logo size="md" />
    <h1>PowerWrite</h1>
  </div>
</header>
```

## Design Rationale

### Color Scheme
- **Yellow (#FACC15 / yellow-400)**: Represents creativity, energy, and optimism
- **Black**: Provides strong contrast, professionalism, and readability

### Shape & Style
- **Rounded corners**: Modern, friendly, approachable
- **Bold typography**: Confident, clear, memorable
- **Minimal decoration**: Clean, professional, not distracting
- **Pen stroke motif**: Subtle reference to writing without being literal

### Hover Effects
- Slight color change on hover (yellow-400 → yellow-500)
- Opacity changes on decorative elements
- Smooth transitions for polish

## Current Implementation

The logo is currently used across all pages:

- ✅ Home page (`/app/page.tsx`)
- ✅ Studio page (`/app/studio/page.tsx`)
- ✅ Library page (`/app/library/page.tsx`)
- ✅ Library detail page (`/app/library/[id]/page.tsx`)
- ✅ Book detail page (`/app/books/[id]/page.tsx`)
- ✅ Landing page (`/app/landing/page.tsx`)

## Switching Between Variants

To switch to a different variant, simply change the import:

```tsx
// From
import { Logo } from '@/components/ui/Logo';

// To
import { LogoMinimal } from '@/components/ui/Logo';
// or
import { LogoIcon } from '@/components/ui/Logo';
```

## Customization

The logo component is designed to be flexible. You can:

1. **Adjust colors** by modifying the Tailwind classes in `Logo.tsx`
2. **Change sizes** by editing the `sizeClasses` object
3. **Add animations** by extending the component with additional Tailwind classes
4. **Create new variants** by copying and modifying existing variants

## Dark Mode Support

The current logo works well in both light and dark modes:
- The yellow background provides consistent visibility
- Black text ensures readability
- No special dark mode adjustments needed

## Accessibility

- High contrast ratio (black on yellow)
- Clear, readable text
- Appropriate sizing for touch targets
- Semantic HTML structure

## Future Enhancements

Potential improvements to consider:

1. Add animation on hover (subtle rotation or scale)
2. Create an animated version for loading states
3. Add a favicon version
4. Create social media variants (square, circle)
5. Add a full wordmark version ("PowerWrite")



