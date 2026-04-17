# Fix Outline Generation Error - Vercel Deployment

## Problem
The outline generation is returning a 500 error in production on Vercel. This is most likely due to missing or incorrect environment variables.

## Solution Steps

### 1. Check Vercel Environment Variables
Go to your Vercel dashboard and ensure all required environment variables are set:

1. Visit: https://vercel.com/dashboard
2. Navigate to your project (power-write-new-ver)
3. Go to **Settings** → **Environment Variables**

### 2. Required Environment Variables

You need to set these variables for **Production**, **Preview**, and **Development** environments:

#### **OPENAI_API_KEY** (REQUIRED)
```
[Use your OpenAI API key from .env.local]
```
Get your API key from: https://platform.openai.com/api-keys

#### **DATABASE_URL** (REQUIRED)
```
[Use your Neon PostgreSQL connection string from .env.local]
```
Get from: https://console.neon.tech

#### **GOOGLE_BOOKS_API_KEY** (OPTIONAL - but recommended)
```
[Use your Google Books API key from .env.local]
```
Get from: https://console.cloud.google.com/apis/credentials

### 3. Redeploy After Setting Variables

After setting the environment variables:

1. Go to **Deployments** tab in Vercel
2. Find the latest deployment
3. Click the **⋯** menu → **Redeploy**
4. Check the **Use existing Build Cache** option (faster)
5. Click **Redeploy**

### 4. Verify the Fix

Once redeployed:

1. Open your production app
2. Try generating an outline
3. Open browser console (F12) to check for errors
4. If it still fails, check the deployment logs:
   - Go to Vercel dashboard
   - Click on the deployment
   - Click **Functions** tab
   - Find `/api/generate/outline` and check logs

## What We Fixed in the Code

The updated code now includes:

1. **Better error messages**: Shows specific reasons for failures
2. **Environment variable checks**: Validates API key exists before attempting generation
3. **Detailed logging**: Logs each step of the outline generation process
4. **Helpful hints**: Provides guidance on how to fix common issues

## Testing Locally

Before deploying, you can test locally:

```bash
npm run dev --webpack
```

Then try generating an outline in the studio. Check your terminal for detailed logs.

## Common Issues & Solutions

### Issue: "OpenAI API key is not configured"
**Solution**: Add `OPENAI_API_KEY` to Vercel environment variables

### Issue: "Invalid or missing OpenAI API key"
**Solution**: Verify the API key is correct and hasn't expired. Get a new one from https://platform.openai.com/api-keys

### Issue: "OpenAI API quota exceeded"
**Solution**: Check your OpenAI usage at https://platform.openai.com/usage and add billing if needed

### Issue: Still getting 500 errors
**Solution**: 
1. Check Vercel function logs for detailed error
2. Ensure all environment variables are set for the correct environment (Production/Preview/Development)
3. Try redeploying without build cache

## Alternative: Install Vercel CLI for Better Debugging

```bash
npm install -g vercel

# Login
vercel login

# Link project
cd /Users/shaji/Documents/power-write-new-ver
vercel link

# Pull environment variables
vercel env pull .env.local

# Check deployment logs
vercel logs [deployment-url]
```

## Next Steps

1. ✅ Code changes are complete and built successfully
2. ⏳ Set environment variables in Vercel dashboard
3. ⏳ Redeploy the application
4. ⏳ Test outline generation
5. ⏳ Verify it works without errors

## Need Help?

If you're still having issues after following these steps, check:
- OpenAI API key is valid and has available quota
- Database connection string is correct
- All environment variables are set for Production environment
- Function logs in Vercel dashboard for specific error messages
