# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PowerWrite is an AI-powered book writing application built with Next.js 15, featuring Google Books API integration and AI-based book generation using OpenAI GPT-4 via Vercel AI SDK. The UI is inspired by IMDB's dark theme with yellow accents.

## Essential Commands

### Development
```bash
npm run dev --webpack          # Start dev server (webpack mode required)
npm run build --webpack        # Production build
npm start                      # Start production server
```

### Database
```bash
npm run db:push               # Push schema changes to database
npm run db:studio             # Open Drizzle Studio (database GUI)
```

### Quality Checks
```bash
npm run lint                  # Run ESLint
```

### First-Time Setup
```bash
npm install
cp .env.example .env.local    # Then fill in API keys
npm run db:push               # Initialize database
npm run dev --webpack
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI**: Vercel AI SDK with OpenAI GPT-4
- **Styling**: Tailwind CSS v4
- **State**: Zustand with persist middleware
- **UI**: Radix UI components with custom styling

### Core Architecture Pattern
```
Pages (app/) → API Routes (app/api/) → Services (lib/services/) → Database (lib/db/)
                                      ↓
                              External APIs (OpenAI, Google Books)
```

### Key Directories
- `app/`: Next.js App Router pages and API routes
  - `app/studio/`: Book creation studio interface
  - `app/library/`: User's generated books library
  - `app/api/generate/`: AI generation endpoints (outline, book)
  - `app/api/books/`: Book search and retrieval endpoints
- `lib/db/`: Database schema and operations (Drizzle ORM)
- `lib/services/`: Business logic services (AI, Google Books, TTS, exports)
- `lib/store/`: Zustand state management (book-store, studio-store)
- `lib/types/`: TypeScript type definitions
- `lib/utils/`: Utility functions including auto-populate logic
- `components/`: React components organized by feature
  - `components/ui/`: Reusable UI components
  - `components/studio/`: Studio-specific components
  - `components/library/`: Library-specific components

### Database Schema (Drizzle ORM)
Core tables: `users`, `generatedBooks`, `bookChapters`, `bookSearches`, `referenceBooks`, `sessions`

Relations are fully defined using Drizzle's relational schema. When modifying schema:
1. Edit `lib/db/schema.ts`
2. Run `npm run db:push` to apply changes
3. Types are auto-inferred from schema

## Important Development Patterns

### AI Service Integration
- AI generation uses Vercel AI SDK with `@ai-sdk/openai`
- Supports optional AI Gateway for production (set `AI_GATEWAY_URL` env var)
- Two generation modes: `generateText()` for complete responses, `streamText()` for streaming
- Always use 5-minute timeout for generation endpoints (configured in `vercel.json`)

### State Management with Zustand
- `useBookStore`: Selected reference books, search results
- `useStudioStore`: Book configuration, outline, generation state, uploaded references
- Both stores use persist middleware - check what's persisted in `partialize` option
- Studio store includes auto-populate functionality from reference books

### Auto-Populate Feature
Located in `lib/utils/auto-populate.ts`. Analyzes reference books to generate:
- Sample titles (genre-specific)
- Descriptions
- Genre mappings
- Writing style inference
- Target audience
- Content settings (word count, chapters)

When working on auto-populate, maintain genre consistency and ensure all mapped values exist in type definitions.

### API Route Patterns
- Always validate environment variables at import time
- Use try-catch with proper error messages
- Return consistent JSON structure: `{ success: boolean, data?: any, error?: string }`
- AI generation endpoints should have 300s timeout (configured in `vercel.json`)
- Demo account uses `getDemoUserId()` from `lib/services/demo-account.ts`

### Component Organization
- UI components in `components/ui/` are generic and reusable
- Feature components in `components/studio/`, `components/library/`, etc.
- Studio config forms are split into separate components (BasicInfo, ContentSettings, WritingStyle, etc.)
- Use Radix UI primitives for complex interactions (Dialog, Dropdown, Select, etc.)

### Type Safety
- All database models have both insert and select types
- Use `z.infer` for Zod schema types
- Drizzle schemas use `drizzle-zod` for validation
- Avoid `any` - use proper types from `lib/types/`

## Environment Variables

Required:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for book generation

Optional:
- `GOOGLE_BOOKS_API_KEY`: Google Books API (works without for basic searches)
- `AI_GATEWAY_URL`: Vercel AI Gateway URL (recommended for production)
- `NODE_ENV`: Set automatically by framework

## Common Development Tasks

### Adding a New AI Generation Feature
1. Define types in `lib/types/generation.ts`
2. Add method to `AIService` class in `lib/services/ai-service.ts`
3. Create API route in `app/api/generate/[feature]/route.ts`
4. Update `vercel.json` if timeout > 60s needed
5. Add UI in appropriate component (likely `app/studio/`)

### Adding a New Database Table
1. Define table in `lib/db/schema.ts` using Drizzle syntax
2. Add relations if needed
3. Export insert/select types
4. Run `npm run db:push` to apply
5. Add operations in `lib/db/operations.ts` if complex queries needed

### Adding Studio Configuration Options
1. Update type definition in `lib/types/studio.ts` (`BookConfiguration`)
2. Update `defaultBookConfiguration` with sensible defaults
3. Create or modify component in `components/studio/config/`
4. Update auto-populate logic in `lib/utils/auto-populate.ts` if relevant
5. Update AI prompt generation in `lib/services/ai-service.ts` to use new config

### Modifying UI Theme
Theme is IMDB-inspired with these key colors:
- Background: `bg-black`
- Primary accent: `bg-yellow-400` or `border-yellow-600`
- Text: `text-white` for primary, `text-gray-400` for secondary
- Maintain high contrast for readability

## Testing & Debugging

- No test framework currently configured
- Use `npm run dev --webpack` with browser DevTools
- Database inspection: `npm run db:studio`
- Check API responses in Network tab
- AI generation errors logged to console with detailed messages
- Drizzle queries logged in development mode

## Important Notes

### Webpack Mode Required
Always use `--webpack` flag with Next.js commands. This project requires webpack for compatibility with certain dependencies.

### AI Generation Timeouts
Book generation can take several minutes. API routes in `app/api/generate/` have 5-minute (300s) timeout configured in `vercel.json`. Do not reduce this without testing full book generation.

### Demo Account
Current implementation uses a demo account system (`lib/services/demo-account.ts`) with credit limits. Real authentication is planned but not implemented.

### Uploaded References
File upload functionality is scaffolded but not fully implemented. Database schema is ready (`referenceBooks` table). Upload UI exists in `components/studio/ReferenceUpload.tsx`.

### Export Services
PDF and audiobook generation services are stubbed in `lib/services/export-service.ts` and `lib/services/tts-service.ts`. Integration points are ready but implementations are incomplete.

## Code Style

- Use functional components with hooks
- Prefer `const` over `let`
- Use arrow functions for inline callbacks
- Keep components focused - split when >300 lines
- Extract reusable logic to `lib/utils/`
- API routes should be thin - business logic goes in services
- Use TypeScript strict mode - no implicit `any`
- Format: 2-space indentation, single quotes for strings (enforced by ESLint)

## External API Integration

### Google Books API
- Service: `lib/services/google-books.ts`
- Works without API key for basic searches
- With API key: higher rate limits and more features
- Returns standardized book format regardless of source

### OpenAI API
- Service: `lib/services/ai-service.ts`
- Uses Vercel AI SDK (`generateText`, `streamText`)
- Model: `gpt-4o` for all generations
- Optional: Route through AI Gateway for production

## Deployment

Configured for Vercel:
- `vercel.json` includes all settings
- API routes have extended timeouts
- Environment variables should be set in Vercel dashboard
- Database migrations: run `npm run db:push` locally first, then deploy
