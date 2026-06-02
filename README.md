# Image Generation Studio

A modern image generation application built with Next.js, React, and Tailwind CSS. Generate creator-ready images through OpenRouter's multimodal image models with a beautiful studio UI.

## Features

- 🎨 Modern glass morphism design
- 📱 Multiple layout options (Landscape, Mobile, Square)
- ⚡ Fast image generation through OpenRouter image output models
- 🤖 Model switching between Nano Banana, GPT Image, Seedream, FLUX, Recraft, and Grok Imagine presets
- 🖼️ Image preview and download
- ⏳ Beautiful loading screen
- ✍️ AI-powered text autocomplete and spell correction
- 🖼️ Image-to-image generation with uploaded reference images through OpenRouter multimodal inputs
- 🔒 Password-protected access

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure API keys (see [Configuration](#configuration) section below)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

#### Site Access Password

```bash
SITE_PASSWORD=        # Set an 8-character password to protect access to the app
```

- **SITE_PASSWORD**: Password required to access the app (required). Users must enter this password on the login page before they can use the studio.

#### OpenRouter API Setup

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_CHAT_MODEL=openai/gpt-5.4-mini      # Optional, creator chat default
OPENROUTER_PROMPT_MODEL=openai/gpt-5.4-mini    # Optional, prompt enhancement default
NEXT_PUBLIC_APP_URL=http://localhost:3000       # Optional, sent as OpenRouter referer metadata
```

- **OPENROUTER_API_KEY**: Required for image generation, prompt enhancement, and creator chat.
- **OPENROUTER_CHAT_MODEL**: Optional chat model for creator workflow strategy.
- **OPENROUTER_PROMPT_MODEL**: Optional chat model for autocomplete and prompt polishing.

Image generation uses OpenRouter's `/api/v1/chat/completions` endpoint with `modalities` and `image_config`. The configured presets are in `lib/modelConfig.ts` and currently include:

- `google/gemini-3.1-flash-image-preview`
- `google/gemini-3-pro-image-preview`
- `openai/gpt-5.4-image-2`
- `bytedance-seed/seedream-4.5`
- `black-forest-labs/flux.2-pro`
- `recraft/recraft-v4.1-pro`
- `x-ai/grok-imagine-image-quality`

## Project Structure

```
ImageGen/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts      # Authentication endpoint
│   │   ├── complete/
│   │   │   └── route.ts      # API route for text autocomplete/correction
│   │   └── generate/
│   │       └── route.ts      # API route for OpenRouter image generation
│   ├── login/
│   │   └── page.tsx          # Password-protected login page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── Footer.tsx            # Footer component
│   ├── ImagePreview.tsx      # Image preview and download
│   ├── ImageStudio.tsx       # Main studio orchestrator
│   ├── LayoutSelector.tsx    # Layout selection UI
│   ├── LoadingOverlay.tsx    # Loading state overlay
│   ├── MobileBottomSheet.tsx # Mobile UI bottom sheet
│   ├── ModelSelector.tsx     # Model selection dropdown
│   ├── PromptInput.tsx       # Prompt input with autocomplete
│   ├── ReferenceUpload.tsx   # Reference image upload
│   └── StudioControls.tsx    # Studio control panel
├── lib/
│   ├── auth.ts               # Authentication utilities
│   ├── imageGeneration.ts    # Image generation client wrapper
│   └── modelConfig.ts        # OpenRouter model capabilities and layout configs
└── middleware.ts              # Auth middleware for route protection
```

## Features in Detail

### Image Generation

- **Text-to-Image**: Generate images from text prompts through OpenRouter image models
- **Image-to-Image**: Upload a reference image to guide generation for compatible multimodal image models
- **Layout Options**: Choose from Landscape (16:9), Mobile (9:16), or Square (1:1) aspect ratios
- **Model Selection**: Switch between configured OpenRouter image model presets

### AI Text Autocomplete

The app includes intelligent text completion powered by OpenRouter:
- **Autocomplete**: As you type, the AI suggests completions (shown as ghost text)
- **Spell Correction**: Automatically corrects spelling and grammar errors
- **Tab to Accept**: Press Tab to accept the suggested completion or correction

**Note**: The autocomplete feature requires `OPENROUTER_API_KEY` to be configured.

## Build

Build the application for production:

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables:
     - `OPENROUTER_API_KEY`: Your OpenRouter API key (required)
     - `SITE_PASSWORD`: Your chosen 8-character password (required)
     - `OPENROUTER_CHAT_MODEL`: Chat model override (optional)
     - `OPENROUTER_PROMPT_MODEL`: Prompt enhancement model override (optional)
     - `NEXT_PUBLIC_APP_URL`: Public app URL for OpenRouter metadata (optional)
   - Deploy

## Error Handling

The app includes comprehensive error handling:
- Network errors show connection issues
- API errors display the status code and error message
- Missing configuration prompts you to add the API key
- Check the browser console and server logs for detailed error information if generation fails

## License

ISC
