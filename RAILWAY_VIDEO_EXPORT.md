# Video Export on Railway - Setup Guide

This guide explains how to configure video export functionality when deploying to Railway.

## Required Environment Variables

Set these environment variables in your Railway project settings:

### Core Variables

```bash
# Required for Inngest background job processing
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Required for video frame upload
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Optional but recommended - set your Railway domain
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
```

### How to Get These Values

1. **INNGEST_EVENT_KEY & INNGEST_SIGNING_KEY**
   - Create an account at [inngest.com](https://inngest.com)
   - Create a new app
   - Go to Settings → Keys
   - Copy the Event Key and Signing Key

2. **BLOB_READ_WRITE_TOKEN**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage → Blob
   - Create or select a store
   - Go to Settings → Tokens
   - Create a new read-write token

3. **NEXT_PUBLIC_APP_URL**
   - This is automatically detected via `RAILWAY_PUBLIC_DOMAIN` but you can set it explicitly

## nixpacks.toml Configuration

The `nixpacks.toml` file is already configured with the required dependencies:

```toml
[phases.setup]
nixPkgs = [
  "nodejs_20",
  "chromium",
  "ffmpeg",
  "libuuid"
]

[variables]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
PUPPETEER_EXECUTABLE_PATH = "/nix/var/nix/profiles/default/bin/chromium"
FFMPEG_PATH = "/nix/var/nix/profiles/default/bin/ffmpeg"
```

This ensures:
- **Chromium**: Required by Puppeteer to render book pages as frames
- **FFmpeg**: Required to stitch frames into video

## Inngest Setup for Railway

### Option 1: Inngest Cloud (Recommended)

1. Sign up at [inngest.com](https://inngest.com)
2. Create a new app
3. Add the environment keys to Railway
4. Deploy your app
5. In Inngest dashboard, sync your app:
   - Go to Apps → Add App
   - Enter your Railway URL: `https://your-app.up.railway.app/api/inngest`

### Option 2: Self-hosted Inngest (Advanced)

You can run your own Inngest server, but Inngest Cloud is simpler for most use cases.

## Troubleshooting

### Export stuck at "Exporting"

1. **Check Inngest Dashboard**
   - Go to [app.inngest.com](https://app.inngest.com)
   - Check the Functions tab for errors
   - Look at the Run history for failed jobs

2. **Check Railway Logs**
   - Look for `[VideoExport]` or `[FrameRenderer]` or `[Inngest Video]` log entries
   - Common errors:
     - `Puppeteer launch failed` - Chromium not properly installed
     - `FFmpeg not found` - FFmpeg not in nixpacks.toml
     - `BLOB_READ_WRITE_TOKEN not configured` - Missing Vercel Blob token

3. **Verify Environment Variables**
   ```bash
   # Check in Railway dashboard → Variables
   INNGEST_EVENT_KEY      ✓
   INNGEST_SIGNING_KEY    ✓
   BLOB_READ_WRITE_TOKEN  ✓
   ```

4. **Check Inngest App Sync**
   - Ensure your app is synced in Inngest dashboard
   - The endpoint should be: `https://your-domain/api/inngest`

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Video export service is not configured" | Missing Inngest keys | Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` |
| "Puppeteer launch failed" | Chromium not found | Ensure `chromium` is in nixpacks.toml |
| "FFmpeg not found" | FFmpeg not installed | Ensure `ffmpeg` is in nixpacks.toml |
| "BLOB_READ_WRITE_TOKEN is not configured" | Missing Blob token | Set `BLOB_READ_WRITE_TOKEN` |
| "Failed to queue video export" | Inngest not connected | Check Inngest dashboard sync |

### Testing Video Export

1. Generate audio for at least one chapter first
2. Open the book in the library
3. Click the video export button
4. Watch the progress in the modal
5. Check Railway logs for detailed progress

## Architecture Overview

```
User clicks Export Video
        ↓
/api/generate/video (creates job in DB)
        ↓
Sends event to Inngest
        ↓
Inngest picks up job and runs exportVideoBackground
        ↓
1. Generate manifest (timing data)
2. Render frames using Puppeteer
3. Upload frames to Vercel Blob
4. Download frames locally
5. Stitch video with FFmpeg
6. Upload final video to Vercel Blob
7. Update job status in DB
        ↓
Frontend polls /api/generate/video/[jobId]
        ↓
User downloads completed video
```

## Performance Notes

- Video export is CPU and memory intensive
- Consider using a larger Railway instance if exports are slow
- Each frame takes ~2-3 seconds to render
- A 10-minute book video might take 5-10 minutes to export
