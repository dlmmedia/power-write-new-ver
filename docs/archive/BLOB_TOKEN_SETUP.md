# Vercel Blob Token Configuration

## Overview
This document describes how to configure the `BLOB_READ_WRITE_TOKEN` environment variable in your Vercel project.

## Current Token
The new blob read/write token that should be configured:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac
```

## Configuration Methods

### Method 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/team_XLS4r1tfJ0Myv7zfinX8fJmo/power-write-new-ver/settings/environment-variables

2. Click **"Add New"**

3. Set the following:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac`
   - **Environments**: Select all (Production, Preview, Development)
   - **Encryption**: Select "Encrypted" (recommended)

4. Click **"Save"**

### Method 2: Using the Script

1. Get your Vercel API token:
   - Go to https://vercel.com/account/tokens
   - Create a new token

2. Run the setup script:
   ```bash
   export VERCEL_TOKEN=your_vercel_token
   npx tsx scripts/set-vercel-blob-token.ts
   ```

## Cleanup: Remove Redundant Variables

After setting the new token, check for and **DELETE** any of these redundant variables if they exist:

- ❌ `VERCEL_BLOB_READ_WRITE_TOKEN` (old/different name - if exists)
- ❌ `vercel_blob_rw_2c4ozw7pgS0D4a72_IgSjuk11269Eem5YfvlUxCji6Uzwto_READ_WRITE_TOKEN` (if this was incorrectly set as a variable name)
- ❌ Any other blob-related tokens with different names

**Important**: Only keep `BLOB_READ_WRITE_TOKEN` as this is what the codebase expects. The variable name should be `BLOB_READ_WRITE_TOKEN`, not a long token-formatted name.

### How to Check for Redundant Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for any variables that:
   - Start with `BLOB` or `VERCEL_BLOB`
   - Are not named exactly `BLOB_READ_WRITE_TOKEN`
3. Delete any matches (click the "..." menu → Delete)

## Verification

After setting the variable:

1. **Redeploy your project**:
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Select "Redeploy"
   - Optionally check "Use existing Build Cache"

2. **Test the configuration**:
   - Visit `/api/test/blob` endpoint to verify blob storage is working
   - Try generating audio or covers to confirm uploads work

## Codebase Usage

The codebase uses `BLOB_READ_WRITE_TOKEN` in:
- `app/api/books/[id]/cover/route.ts` - Cover image uploads
- `app/api/generate/audio/route.ts` - Audio file uploads
- `lib/services/tts-service.ts` - Text-to-speech audio storage
- `lib/services/ai-service.ts` - Generated image storage

All code checks for `process.env.BLOB_READ_WRITE_TOKEN`, so this is the **required** variable name.

