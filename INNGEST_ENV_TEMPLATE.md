## Local env setup for Inngest (video export)

### Option A: Inngest Cloud (recommended for production)

Add these to `.env.local` (and also set them in Vercel Project → Environment Variables):

```bash
INNGEST_EVENT_KEY=YOUR_INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY=YOUR_INNGEST_SIGNING_KEY
```

Get both values from the Inngest dashboard for your app/environment (Keys section).

### Option B: Local Inngest Dev Server (recommended for local development)

This avoids needing real cloud keys locally:

```bash
INNGEST_DEV=true
INNGEST_BASE_URL=http://localhost:8288
```

Then run the dev server:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

