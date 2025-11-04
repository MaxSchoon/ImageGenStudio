# Image Generation Studio

A modern image generation application built with Next.js, React, and Tailwind CSS. Generate images using Google Gemini, xAI Grok, or Hugging Face FLUX.1 with a beautiful glass morphism UI.

## Features

- 🎨 Modern glass morphism design
- 📱 Multiple layout options (Landscape, Mobile, Square)
- ⚡ Fast image generation using Google Gemini, xAI Grok, or Hugging Face FLUX.1
- 🤖 Model switching between Google, Grok, and FLUX.1
- 🖼️ Image preview and download
- ⏳ Beautiful loading screen
- ✍️ AI-powered text autocomplete and spell correction
- 🖼️ Image-to-image generation with reference images (Google Gemini only)

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

#### Google Generative AI API Setup

```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-2.5-flash-image  # Optional, defaults to gemini-2.5-flash-image for image generation
```

- **GOOGLE_API_KEY**: Your Google API key (required) - Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **GOOGLE_MODEL**: The model name (optional, defaults to `gemini-2.5-flash-image` for image generation)

**Image Generation**: The app uses Gemini's native image generation capabilities. See the [documentation](https://ai.google.dev/gemini-api/docs/image-generation) for details.

**⚠️ Geographic Restrictions**: If you get "Image generation is not available in your country" error, you need to deploy the app to a server in a supported region (like Vercel, which runs in US regions by default). The restriction is based on the server's location, not your local machine. See [Deployment](#deployment) section below.

#### xAI Grok API Setup

```bash
GROK_API_KEY=your_grok_api_key_here
# OR alternatively:
XAI_API_KEY=your_grok_api_key_here

# Optional: Customize models
GROK_MODEL=grok-2-image-1212  # Image generation model (default: grok-2-image-1212)
GROK_COMPLETION_MODEL=grok-2-1212  # Text completion model (default: grok-2-1212)
```

- **GROK_API_KEY** or **XAI_API_KEY**: Your Grok API key (required) - Both are supported for compatibility
- **GROK_MODEL**: Image generation model (optional, defaults to `grok-2-image-1212`)
- **GROK_COMPLETION_MODEL**: Text completion model (optional, defaults to `grok-2-1212`)

**Obtaining a Grok API Key**:
- Sign up for an account at [x.ai](https://x.ai) or visit the [xAI Developer Console](https://console.x.ai)
- Navigate to API Keys section in your account settings
- Generate a new API key

**API Documentation**:
- Official xAI API documentation: [https://docs.x.ai/](https://docs.x.ai/)
- Image generation endpoint: [https://docs.x.ai/docs/api-reference#image-generations](https://docs.x.ai/docs/api-reference#image-generations)
- Chat completions endpoint: [https://docs.x.ai/docs/api-reference#chat-completions](https://docs.x.ai/docs/api-reference#chat-completions)

**Note**: Grok's image generation API supports fixed dimensions, but the app will pass your selected layout dimensions in case the API supports them in future updates. **Reference images are not supported by Grok** - use Google Gemini for image-to-image generation.

#### Hugging Face API Setup (FLUX.1)

```bash
HF_TOKEN=your_huggingface_token_here
HF_MODEL=black-forest-labs/FLUX.1-dev  # Image generation model (default: FLUX.1-dev)
HF_PROVIDER=nebius  # Provider for fast inference (default: nebius)
```

- **HF_TOKEN**: Your Hugging Face API token (required) - Get it from [Hugging Face Settings](https://huggingface.co/settings/tokens)
- **HF_MODEL**: The Hugging Face model to use (optional, defaults to `black-forest-labs/FLUX.1-dev`)
- **HF_PROVIDER**: The inference provider (optional, defaults to `nebius` for fast inference)

**Obtaining a Hugging Face Token**:
- Sign up at [Hugging Face](https://huggingface.co/)
- Go to Settings → Access Tokens
- Create a new token with read permissions

**API Documentation**: [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

**Note**: FLUX.1 uses Hugging Face's text-to-image inference endpoint. **Reference images are not supported by FLUX.1** - use Google Gemini for image-to-image generation.

## Project Structure

```
ImageGen/
├── app/
│   ├── api/
│   │   ├── complete/
│   │   │   └── route.ts      # API route for text autocomplete/correction
│   │   └── generate/
│   │       └── route.ts      # API route for image generation
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── AutocompleteTextarea.tsx  # Textarea with AI autocomplete and correction
│   ├── ImagePreview.tsx      # Image preview component
│   ├── ImageStudio.tsx       # Main studio component
│   ├── LayoutSelector.tsx    # Layout selection UI
│   ├── LoadingScreen.tsx     # Loading state component
│   └── ModelSelector.tsx    # Model selection UI (Google/Grok)
└── lib/
    └── nanobanana.ts         # Image generation client wrapper
```

## Features in Detail

### Image Generation

- **Text-to-Image**: Generate images from text prompts (all models)
- **Image-to-Image**: Upload a reference image to guide the generation (**Google Gemini only**)
  - ⚠️ Reference images are **not supported** by Grok or FLUX.1 models
  - For image-to-image generation, use Google Gemini
- **Layout Options**: Choose from Landscape (16:9), Mobile (9:16), or Square (1:1) aspect ratios
- **Model Selection**: Switch between Google Gemini, xAI Grok, and Hugging Face FLUX.1 models

### AI Text Autocomplete

The app includes intelligent text completion powered by Grok:
- **Autocomplete**: As you type, the AI suggests completions (shown as ghost text)
- **Spell Correction**: Automatically corrects spelling and grammar errors
- **Tab to Accept**: Press Tab to accept the suggested completion or correction

**Note**: The autocomplete feature requires a Grok API key to be configured.

## Build

Build the application for production:

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel (Recommended for Google API)

To bypass geographic restrictions with Google's image generation API, deploy your app to Vercel:

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
     - `GOOGLE_API_KEY`: Your Google API key (required for Google model)
     - `GOOGLE_MODEL`: `gemini-2.5-flash-image` (optional)
     - `GROK_API_KEY` or `XAI_API_KEY`: Your Grok API key (required for Grok model)
     - `GROK_MODEL`: `grok-2-image-1212` (optional)
     - `GROK_COMPLETION_MODEL`: `grok-2-1212` (optional)
     - `HF_TOKEN`: Your Hugging Face token (required for FLUX.1 model)
     - `HF_MODEL`: `black-forest-labs/FLUX.1-dev` (optional)
     - `HF_PROVIDER`: `nebius` (optional)
   - Deploy

3. **Why Vercel works**: Vercel runs your server-side API routes on infrastructure in supported regions (US by default), which bypasses the geographic restriction.

### Alternative: Deploy to Other Cloud Services

You can also deploy to:
- **AWS** (us-east-1 or other supported regions)
- **Google Cloud Platform** (in a supported region)
- **Azure** (in a supported region)

Just make sure your server is located in a region where Google's image generation API is available. See [Google's available regions](https://ai.google.dev/available_regions) for details.

## Error Handling

The app includes comprehensive error handling:
- Network errors show connection issues
- API errors display the status code and error message
- Missing configuration prompts you to add the API key
- Check the browser console and server logs for detailed error information if generation fails

## License

ISC
