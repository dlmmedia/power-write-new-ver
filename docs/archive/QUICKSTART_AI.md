# Quick Start: AI System Setup

Get PowerWrite AI features working in 5 minutes!

## Step 1: Fill in API Keys

Open `.env.local` and add your API keys:

```bash
# Open .env.local in your editor
code .env.local
# or
nano .env.local
# or
vim .env.local
```

**Required keys:**
```env
DATABASE_URL=your_database_url_here
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

**Where to get keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Google AI**: https://aistudio.google.com/app/apikey
- **Database**: Your existing Neon URL (already set?)

## Step 2: Start Development Server

```bash
npm run dev --webpack
```

Wait for server to start at `http://localhost:3000`

## Step 3: Test Outline Generation

1. Go to http://localhost:3000/studio
2. Fill in book details:
   - Title: "The Mystery of AI"
   - Author: Your name
   - Genre: Mystery
   - Description: "A thrilling mystery about artificial intelligence"
3. Click **"Generate Outline"**

✅ **Success if:** Outline appears with chapters in ~10-30 seconds

❌ **Error if:** Check console for API key errors

## Step 4: Test Book Generation

After outline is generated:

1. Review the outline
2. Click **"Generate Full Book"**
3. Wait 2-5 minutes (it's generating full chapters!)

✅ **Success if:** Book appears in Library with all chapters

## Step 5: Test Cover Generation

```bash
# Use the generated book to test cover
curl -X POST http://localhost:3000/api/generate/cover \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "title": "The Mystery of AI",
    "author": "Your Name",
    "genre": "Mystery",
    "description": "A thrilling mystery about artificial intelligence",
    "style": "photographic"
  }'
```

✅ **Success if:** Returns base64 image data

## Step 6: Test Audio Generation

After book is fully generated:

```bash
curl -X POST http://localhost:3000/api/generate/audio \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "bookId": "your-book-id",
    "voice": "alloy",
    "model": "tts-1"
  }'
```

✅ **Success if:** Returns audio URL

## Common Issues

### "OPENAI_API_KEY not set"
```bash
# Check if .env.local exists
ls -la .env.local

# If not, copy template
cp .env.local.example .env.local

# Add your keys and restart
npm run dev --webpack
```

### "Rate limit exceeded"
- Wait a few seconds and try again
- Check OpenAI billing is set up
- Consider setting up AI Gateway for rate limiting

### "Failed to generate cover"
- Verify Google AI API key is correct
- Check if Imagen API is enabled
- Try again after a few seconds

### Nothing happens when clicking Generate
- Open browser console (F12)
- Check for JavaScript errors
- Verify API keys are set correctly
- Restart dev server

## What's Working Now

✅ **Multi-Model System**
- GPT-4o-mini: Fast outline generation
- GPT-4o: High-quality chapter writing
- Imagen 3: Professional book covers
- TTS-1: Cost-effective audiobooks

✅ **AI Gateway Support**
- Optional but recommended
- Add `AI_GATEWAY_URL` to `.env.local`
- Provides caching, rate limiting, analytics

✅ **Complete Generation Flow**
- Outline → Book → Cover → Audio
- All endpoints operational
- Progress tracking included

## Next Steps

1. **Set up AI Gateway** (optional)
   - Go to https://vercel.com/dashboard
   - Storage → AI Gateway
   - Follow guide in `AI_GATEWAY_SETUP.md`

2. **Test full workflow**
   - Generate outline ✓
   - Generate book ✓
   - Generate cover ✓
   - Generate audio ✓

3. **Deploy to production**
   - Push to GitHub
   - Deploy on Vercel
   - Add environment variables in Vercel dashboard

## Support

Still having issues?

1. Check `AI_GATEWAY_SETUP.md` for detailed setup
2. Review console logs for specific errors
3. Verify all API keys are valid
4. Check API service status pages
5. Restart dev server after changing .env.local

---

**You're all set!** 🎉 Start generating amazing books with AI.
