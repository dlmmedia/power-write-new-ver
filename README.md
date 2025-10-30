# PowerWrite - AI-Powered Book Writing Application

Create amazing books with AI. PowerWrite is an IMDB-inspired book writing application that allows you to search for reference books from Google Books API and generate new books using AI.

## Features

- 📚 **Google Books Integration** - Search and browse millions of books
- 🤖 **AI-Powered Book Generation** - Create book outlines and full chapters using OpenAI GPT-4
- 🎨 **IMDB-Inspired UI** - Modern, dark-themed interface inspired by IMDB
- 📖 **Book Studio** - Interactive workspace for writing and editing books
- 🎵 **Audiobook Generation** - Convert your books to audiobooks using TTS
- ☁️ **Serverless Architecture** - Built with Next.js and deployed on Vercel
- 🔒 **Vercel AI Gateway** - Secure AI API management (optional but recommended)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4 via Vercel AI SDK
- **API**: Google Books API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ installed
- Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- OpenAI API key (get from [platform.openai.com](https://platform.openai.com))
- Google Books API key (optional - works without key for basic searches)

## Getting Started

### 1. Clone and Install

\`\`\`bash
cd power-write-new-ver
npm install
\`\`\`

### 2. Environment Setup

Copy the environment example file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your credentials:

\`\`\`env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
OPENAI_API_KEY=sk-your-openai-key

# Optional
GOOGLE_BOOKS_API_KEY=your-google-books-key
AI_GATEWAY_URL=https://your-gateway.vercel.app/v1
\`\`\`

### 3. Database Setup

Push the database schema:

\`\`\`bash
npm run db:push
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Vercel AI Gateway Setup (Recommended for Production)

The Vercel AI Gateway provides enhanced security, rate limiting, and monitoring for AI API calls.

### Setup Steps:

1. Go to your Vercel dashboard
2. Navigate to Storage → AI Gateway
3. Create a new gateway and copy the gateway URL
4. Add the URL to your `.env.local`:
   \`\`\`env
   AI_GATEWAY_URL=https://your-gateway.vercel.app/v1
   \`\`\`

Learn more: [Vercel AI Gateway Documentation](https://vercel.com/docs/ai-gateway)

## Deployment to Vercel

### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
\`\`\`

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `GOOGLE_BOOKS_API_KEY` (optional)
   - `AI_GATEWAY_URL` (optional)
4. Deploy!

## Project Structure

\`\`\`
power-write-new-ver/
├── app/
│   ├── api/
│   │   ├── books/         # Book search API routes
│   │   └── generate/      # AI generation API routes
│   ├── page.tsx           # Main homepage
│   └── layout.tsx         # Root layout
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Database schema
│   │   └── index.ts       # Database connection
│   ├── services/
│   │   ├── google-books.ts # Google Books API service
│   │   └── ai-service.ts   # AI generation service
│   └── utils.ts           # Utility functions
├── components/
│   ├── ui/                # Reusable UI components
│   └── books/             # Book-specific components
├── .env.example           # Environment variables template
├── vercel.json            # Vercel deployment config
└── drizzle.config.ts      # Database migration config
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes

## Features Roadmap

- [x] Google Books API integration
- [x] AI-powered book outline generation
- [x] AI-powered chapter generation
- [x] IMDB-inspired UI
- [x] Vercel AI Gateway support
- [ ] User authentication
- [ ] Book studio with rich text editor
- [ ] PDF export
- [ ] Audiobook generation with TTS
- [ ] Reference book upload (PDF, DOCX, TXT)
- [ ] Multi-book projects
- [ ] Collaboration features

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key for book generation |
| `GOOGLE_BOOKS_API_KEY` | No | Google Books API key (works without for basic searches) |
| `AI_GATEWAY_URL` | No | Vercel AI Gateway URL (recommended for production) |
| `NODE_ENV` | No | Environment (development/production) |

## Support

For issues or questions, please open an issue on GitHub or contact support.

## License

MIT

---

Built with ❤️ using Next.js, Vercel AI SDK, and OpenAI GPT-4
