# Recipe Card Generator ✨

Upload a photo of any recipe (handwritten, cookbook page, screenshot) and get a beautiful, printable recipe card.

## Features
- 📸 Drag & drop image upload
- 🤖 AI-powered recipe extraction (OpenAI GPT-4o Vision)
- 🎨 3 beautiful card templates (Classic, Modern, Minimal)
- 🖨 Print-ready output
- 📥 Download as PNG image
- ✉️ Email-friendly HTML export
- 📱 Fully responsive (mobile-first)

## Deploy to Netlify

1. Connect this repo to Netlify
2. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add the following environment variable in Netlify:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key (needs GPT-4o access) |

That's it! No other configuration needed.

## Local Development

```bash
npm install
# Create .env with OPENAI_API_KEY=your-key
npm run dev
```

Note: The AI extraction requires the Netlify function, so for local dev you'll need `netlify dev` instead of `npm run dev` to run the serverless functions locally:

```bash
npm install -g netlify-cli
netlify dev
```

## Tech Stack
- **Astro** — static site framework
- **Netlify Functions** — serverless API for OpenAI calls
- **OpenAI GPT-4o** — vision model for recipe extraction
- **html2canvas** — client-side image generation
- **Google Fonts** — Playfair Display, Inter, Caveat
