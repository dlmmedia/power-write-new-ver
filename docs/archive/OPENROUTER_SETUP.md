# OpenRouter Setup Guide

## Overview

PowerWrite now supports OpenRouter, giving you access to 20+ AI models from multiple providers including:
- **Claude Opus 4 & Sonnet 4** (Anthropic)
- **GPT-4.1 & o3** (OpenAI)
- **Gemini 2.5 Pro & Flash** (Google)
- **Llama 4 & 3.3** (Meta)
- **Mistral Large** (Mistral AI)
- **DeepSeek R1** (DeepSeek)
- And many more!

## Quick Setup

### 1. Add Environment Variable

Add this to your `.env.local` file:

```bash
# OpenRouter API Key (get yours from https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### 2. For Vercel Deployment

Add the environment variable in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** Your OpenRouter API key
   - **Environment:** Production, Preview, Development

### 3. Keep OpenAI (Optional)

You can keep both OpenAI and OpenRouter configured:

```bash
# Both providers can coexist
OPENAI_API_KEY=sk-your-openai-key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
```

## Available Models

### Flagship Models (Best Quality)
| Model | Provider | Best For |
|-------|----------|----------|
| Claude Opus 4 | Anthropic | Complex, nuanced storytelling |
| Claude Sonnet 4 | Anthropic | Excellent creative writing |
| GPT-4.1 | OpenAI | General excellence |
| Gemini 2.5 Pro | Google | Long-form content (1M context) |

### Fast Models (Quick Iterations)
| Model | Provider | Best For |
|-------|----------|----------|
| GPT-4o Mini | OpenAI | Outlines, quick drafts |
| Claude 3.5 Haiku | Anthropic | Fast, affordable |
| Gemini 2.5 Flash | Google | Ultra-fast |
| Mistral Small 3.1 | Mistral | Efficient tasks |

### Budget-Friendly Models
| Model | Provider | Best For |
|-------|----------|----------|
| Llama 3.3 70B | Meta | Quality at low cost |
| Qwen 2.5 72B | Alibaba | Multilingual writing |
| DeepSeek R1 | DeepSeek | Reasoning at great value |

## How to Use

### In Book Studio

1. Open **Book Studio**
2. Go to **Advanced & AI** tab
3. Click on **AI Models** sub-tab
4. Select your preferred models:
   - **Outline Model**: Use fast models (GPT-4o Mini, Gemini Flash)
   - **Chapter Model**: Use flagship models (Claude Opus 4, GPT-4.1)

### Recommended Configurations

**Best Quality (Premium)**
- Outline: `openai/gpt-4o-mini`
- Chapters: `anthropic/claude-opus-4`

**Balanced (Recommended)**
- Outline: `openai/gpt-4o-mini`
- Chapters: `anthropic/claude-sonnet-4`

**Budget-Conscious**
- Outline: `google/gemini-flash-1.5`
- Chapters: `meta-llama/llama-3.3-70b-instruct`

**Long Books (100K+ words)**
- Outline: `google/gemini-2.5-flash-preview`
- Chapters: `google/gemini-2.5-pro-preview` (1M context)

## Pricing

OpenRouter charges per token. Typical costs per book:

| Book Length | Budget Model | Standard Model | Premium Model |
|-------------|--------------|----------------|---------------|
| 30K words | ~$0.50 | ~$2.00 | ~$8.00 |
| 80K words | ~$1.50 | ~$6.00 | ~$24.00 |
| 120K words | ~$2.50 | ~$10.00 | ~$40.00 |

## Troubleshooting

### "OpenRouter is not configured"
Make sure `OPENROUTER_API_KEY` is set in your environment variables.

### Models not appearing
Restart your development server after adding the API key:
```bash
npm run dev
```

### API Errors
1. Check your OpenRouter dashboard for rate limits
2. Verify your API key is correct
3. Ensure you have credits in your OpenRouter account

## Links

- [OpenRouter Dashboard](https://openrouter.ai/)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [Model Pricing](https://openrouter.ai/models)

