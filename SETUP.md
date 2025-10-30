# PowerWrite - Quick Setup Guide

This guide will help you get PowerWrite up and running quickly.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Get your API keys:

### Required:

**OpenAI API Key** (Required for book generation)
- Go to https://platform.openai.com/api-keys
- Create a new secret key
- Add to `.env.local`: `OPENAI_API_KEY=sk-...`

**Database URL** (Required)
- Sign up for free at https://neon.tech
- Create a new project
- Copy the connection string
- Add to `.env.local`: `DATABASE_URL=postgresql://...`

### Optional:

**Google Books API Key** (Optional - app works without it)
- Go to https://console.cloud.google.com/apis/credentials
- Create a new API key
- Enable Google Books API
- Add to `.env.local`: `GOOGLE_BOOKS_API_KEY=...`

**Vercel AI Gateway** (Recommended for production)
- Go to your Vercel dashboard
- Navigate to Storage → AI Gateway
- Create new gateway
- Add to `.env.local`: `AI_GATEWAY_URL=https://...`

## Step 3: Set Up Database

Push the database schema to your Neon database:

```bash
npm run db:push
```

This will create all the necessary tables.

## Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 5: Test the Application

1. **Search Books**: Use the search bar to find books from Google Books
2. **Browse Categories**: Click on different categories (Bestsellers, New Releases, etc.)
3. **Generate Outline**: Use the API endpoint `/api/generate/outline` to create a book outline

## Common Issues

### Database Connection Error
- Make sure your `DATABASE_URL` is correct
- Check that your Neon database is active
- Verify network connectivity

### OpenAI API Error
- Verify your `OPENAI_API_KEY` is valid
- Check your OpenAI account has credits
- Ensure API key has proper permissions

### Google Books Not Loading
- The app works without the API key for basic searches
- If using API key, verify it's enabled for Google Books API
- Check API quota limits

## Next Steps

1. **Customize the UI**: Edit `app/page.tsx` to modify the homepage
2. **Add Features**: Implement book detail pages, studio interface
3. **Deploy**: Follow the deployment guide in README.md

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Push database changes
npm run db:push

# Open database studio
npm run db:studio
```

## Support

If you encounter any issues:
1. Check the main README.md for detailed documentation
2. Review error messages in the console
3. Verify all environment variables are set correctly

Happy writing! 📚✍️
