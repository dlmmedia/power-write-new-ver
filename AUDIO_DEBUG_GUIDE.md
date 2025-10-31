# Audio Generation Debug Guide

## Error Overview

You're seeing: `Audio generation error: Error: Failed to generate audio`

This is a generic error message. The actual issue could be several things.

## What I've Changed

### 1. Enhanced Error Handling (`components/library/AudioGenerator.tsx`)
- Added detailed logging at each step
- Better error message extraction from API responses
- Display hint messages to user
- Check for `success` field in API response

### 2. Enhanced API Logging (`app/api/generate/audio/route.ts`)
- Added `[Audio API]` prefixed logs throughout the flow
- Log request body details (sanitized)
- Log error stack traces
- Added `success: false` to error responses

## How to Debug

### Step 1: Check Browser Console
1. Open your browser DevTools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Try generating audio again
4. Look for logs starting with `[AudioGenerator]`
5. Note the exact error message

### Step 2: Check Server Logs
1. Make sure dev server is running: `npm run dev --webpack`
2. Look at the terminal where the server is running
3. Try generating audio
4. Look for logs starting with `[Audio API]`
5. Check for any error stack traces

### Step 3: Use Test Script
Run the test script to isolate the issue:

```bash
# Make sure dev server is running first
npm run dev --webpack

# In another terminal, run the test (adjust bookId if needed)
node test-audio-api.js 1 demo-user-123
```

This will:
- Fetch book details to verify it exists
- Try to generate audio for the first chapter
- Show detailed request/response information
- Help identify where the error occurs

### Step 4: Check Environment Variables
Verify both required variables are set:

```bash
# Check if they're in .env.local
grep -E "OPENAI_API_KEY|BLOB_READ_WRITE_TOKEN" .env.local
```

Both should be present and non-empty.

## Common Issues

### Issue 1: Missing BLOB_READ_WRITE_TOKEN
**Symptoms:** Error mentions blob storage
**Solution:** 
1. Go to Vercel Dashboard
2. Settings > Environment Variables
3. Add `BLOB_READ_WRITE_TOKEN`
4. Or run: `vercel env pull .env.local`

### Issue 2: Invalid OpenAI API Key
**Symptoms:** Error mentions OpenAI or authentication
**Solution:**
1. Verify your `OPENAI_API_KEY` in `.env.local`
2. Check it has TTS permissions (GPT-4 access usually includes TTS)
3. Test it: https://platform.openai.com/api-keys

### Issue 3: Book Has No Chapters
**Symptoms:** Error about chapters or empty book
**Solution:**
1. Make sure the book you're testing has generated chapters
2. Use the test script to verify: `node test-audio-api.js [bookId]`

### Issue 4: Network/API Timeout
**Symptoms:** Request times out or network error
**Solution:**
1. Check internet connection
2. Verify OpenAI API status: https://status.openai.com/
3. Try with a shorter chapter

### Issue 5: Rate Limiting
**Symptoms:** Error mentions rate limit or quota
**Solution:**
1. Wait a few minutes
2. Check OpenAI usage limits: https://platform.openai.com/usage
3. Upgrade OpenAI plan if needed

## Expected Flow

### Successful generation should show:

**Browser Console:**
```
[AudioGenerator] Starting audio generation: {userId: "...", bookId: "1", ...}
[AudioGenerator] API response: {success: true, type: "chapters", chapters: [...]}
[AudioGenerator] Chapter audio generated: 1 chapters
```

**Server Logs:**
```
[Audio API] Request received
[Audio API] Request body: {userId: "...", bookId: "1", ...}
[Audio API] Generating audio for book: "Your Book Title" (5 chapters)
[Audio API] Generating 1 specific chapters: [1]
Generating audio for chapter 1...
[Audio API] Generated audio for 1 chapters
[Audio API] Saved audio URL for chapter 1
[Audio API] Successfully completed chapter audio generation
```

## Next Steps

1. **Reproduce the error** while watching both browser console and server logs
2. **Run the test script** to see detailed output
3. **Share the logs** with specific error messages (not just "Failed to generate audio")
4. Check which of the common issues above matches your error

## Quick Environment Check

Run this to verify your setup:

```bash
echo "Checking environment variables..."
echo "OPENAI_API_KEY: $([ -n "$OPENAI_API_KEY" ] && echo "✓ Set" || echo "✗ Missing")"
echo "BLOB_READ_WRITE_TOKEN: $([ -n "$BLOB_READ_WRITE_TOKEN" ] && echo "✓ Set" || echo "✗ Missing")"
echo ""
echo "Checking .env.local..."
grep -q "OPENAI_API_KEY" .env.local && echo "✓ OPENAI_API_KEY in .env.local" || echo "✗ OPENAI_API_KEY not in .env.local"
grep -q "BLOB_READ_WRITE_TOKEN" .env.local && echo "✓ BLOB_READ_WRITE_TOKEN in .env.local" || echo "✗ BLOB_READ_WRITE_TOKEN not in .env.local"
```

## Support

If none of these help, please provide:
1. Full browser console output (with `[AudioGenerator]` logs)
2. Full server logs (with `[Audio API]` logs)  
3. Output from the test script
4. The specific book ID you're testing with
