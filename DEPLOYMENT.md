# PowerWrite - Vercel Deployment Guide

Complete guide for deploying PowerWrite to Vercel with all necessary configurations.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub/GitLab/Bitbucket Account** - Your code must be in a Git repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Neon Database** - PostgreSQL database at [neon.tech](https://neon.tech)
4. **AI API Key** - Either Vercel AI Gateway or OpenAI API key

---

## Step 1: Prepare Your Database

### 1.1 Create Neon Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project (or use existing)
3. Copy your connection string from **Connection Details**
4. **Important**: Use the **pooled connection** string for Vercel (contains `-pooler` in hostname)

```
Example: postgresql://user:password@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### 1.2 Initialize Database Schema

Run this **locally first** to set up your database schema:

```bash
# Make sure your .env.local has DATABASE_URL set
npm run db:push
```

This creates all necessary tables in your Neon database.

---

## Step 2: Set Up AI Service

You have two options for AI generation. Choose **one**:

### Option A: Vercel AI Gateway (Recommended for Production)

**Benefits**: Better rate limiting, unified billing, monitoring dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **AI Gateway**
3. Click **Create AI Gateway**
4. Add your OpenAI API key to the gateway
5. Copy your gateway API key (starts with `vck_`)
6. Note the gateway URL: `https://ai-gateway.vercel.sh/v1`

### Option B: Direct OpenAI API (Simpler for Development)

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js framework

### 3.2 Configure Environment Variables

**CRITICAL**: Set these environment variables in the Vercel dashboard before deploying.

Go to: **Project Settings** → **Environment Variables**

#### Required Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your Neon pooled connection string | Production, Preview, Development |
| `AI_GATEWAY_API_KEY` | Your Vercel AI Gateway key (if using Option A) | Production, Preview, Development |
| `AI_GATEWAY_URL` | `https://ai-gateway.vercel.sh/v1` (if using Option A) | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI API key (if using Option B) | Production, Preview, Development |

#### Optional Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GOOGLE_BOOKS_API_KEY` | Your Google Books API key | Production, Preview, Development |

**Tips**:
- Check the **"Sensitive"** box for all API keys
- Apply to all environments unless you have separate dev/staging databases
- You can add more variables later in Settings

### 3.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide your deployment URL

---

## Step 4: Verify Deployment

### 4.1 Check Build Logs

If deployment fails:
1. Go to **Deployments** tab
2. Click on the failed deployment
3. Check the **Build Logs** for errors

### 4.2 Test Your App

1. Visit your deployment URL
2. Try these features:
   - Search for books (tests Google Books API)
   - Create a new book project (tests database)
   - Generate an outline (tests AI service)

### 4.3 Common Issues

#### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Fix**: Make sure you're using the **pooled connection** string from Neon (contains `-pooler`)

#### AI Generation Timeout
```
Error: Function execution timed out
```
**Fix**: Already configured in `vercel.json` with 5-minute timeout. If still timing out, check AI service status.

#### Environment Variable Not Found
```
Error: OPENAI_API_KEY is not defined
```
**Fix**: 
1. Go to Project Settings → Environment Variables
2. Ensure variable is set for the correct environment
3. Redeploy the project

---

## Step 5: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain

---

## Deployment Configuration Files

Your project includes these Vercel-specific files:

### `vercel.json`
```json
{
  "functions": {
    "app/api/generate/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

This extends the timeout for AI generation endpoints to 5 minutes.

### `package.json` Build Script
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

Note: `--webpack` flag is only needed for local development, not deployment.

---

## Monitoring & Maintenance

### View Logs

1. Go to **Deployments** tab
2. Click on any deployment
3. Check **Runtime Logs** for errors

### Database Management

Use Drizzle Studio locally to manage your production database:

```bash
# In .env.local, temporarily set DATABASE_URL to production
npm run db:studio
```

**Warning**: Be careful when modifying production data!

### Update Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Edit existing variables
3. Click **Save**
4. **Important**: You must redeploy for changes to take effect

To redeploy:
- Push a new commit, OR
- Go to **Deployments** → Click **...** → **Redeploy**

---

## CI/CD Workflow

Vercel automatically:
- Deploys **Production** on pushes to `main` branch
- Deploys **Preview** on pull requests
- Runs builds and checks before deployment

### Branch Setup

Recommended branch structure:
- `main` → Production deployments
- `develop` → Staging/preview deployments
- Feature branches → Preview deployments on PRs

---

## Performance Optimization

### Recommended Vercel Settings

1. **Function Region**: Set to region closest to your Neon database
   - Settings → Functions → Function Region
   - Match your Neon database region (e.g., `iad1` for us-east-2)

2. **Enable Caching**:
   - Vercel automatically caches static assets
   - API routes use default caching headers

3. **Analytics** (Optional):
   - Enable Vercel Analytics for performance monitoring
   - Settings → Analytics → Enable

---

## Troubleshooting

### Build Fails with Module Error

**Error**: `Module not found: Can't resolve 'xyz'`

**Fix**:
```bash
# Ensure dependencies are in package.json, not devDependencies
npm install xyz --save
git commit -am "Fix dependency"
git push
```

### Environment Variables Not Working

1. Check spelling and capitalization (case-sensitive!)
2. Ensure they're set for the correct environment
3. Redeploy after changing variables
4. Check if variable is being used at build time (requires `NEXT_PUBLIC_` prefix)

### Cold Start Performance

First request after idle period may be slow. This is normal for serverless functions.

To minimize:
- Use Vercel Pro plan for faster cold starts
- Consider Vercel Edge Functions for critical endpoints

### Database Connection Pool Exhausted

**Error**: `remaining connection slots reserved for non-replication superuser connections`

**Fix**: 
- Use Neon's **pooled connection string** (contains `-pooler`)
- Configure connection pooling in your database client

---

## Security Checklist

Before going to production:

- [ ] All API keys marked as "Sensitive" in Vercel
- [ ] `.env.local` file is in `.gitignore` (never commit secrets!)
- [ ] Database uses strong password
- [ ] OpenAI API key has usage limits set
- [ ] Review Vercel deployment protection settings
- [ ] Enable Vercel authentication for preview deployments (if needed)

---

## Support

If you encounter issues:

1. **Check Vercel Logs**: Most issues show detailed errors in deployment/runtime logs
2. **Neon Status**: [status.neon.tech](https://status.neon.tech)
3. **OpenAI Status**: [status.openai.com](https://status.openai.com)
4. **Vercel Support**: [vercel.com/help](https://vercel.com/help)

---

## Quick Reference

### Essential URLs
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Neon Console**: [console.neon.tech](https://console.neon.tech)
- **OpenAI API Keys**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)

### Essential Commands
```bash
# Local development
npm run dev --webpack

# Build for production (test locally)
npm run build
npm start

# Database operations
npm run db:push      # Apply schema changes
npm run db:studio    # Open database GUI

# Code quality
npm run lint
```

### Environment Variables Quick Copy

See `.env.production.example` for a complete template you can copy to Vercel.

---

**Last Updated**: January 2025
