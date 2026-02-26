# Image Generation Studio

A modern image generation application built with Next.js, React, and Tailwind CSS. Generate images using Google Gemini, xAI Grok, Hugging Face FLUX.1-Kontext, or Qwen with a beautiful glass morphism UI.

## Features

- 🎨 Modern glass morphism design
- 📱 Multiple layout options (Landscape, Mobile, Square)
- ⚡ Fast image generation using Google Gemini (Nano Banana 2), xAI Grok, Hugging Face FLUX.1-Kontext, or Qwen
- 🤖 Model switching between Google, Grok, FLUX.1-Kontext, and Qwen
- 🖼️ Image preview and download
- ⏳ Beautiful loading screen
- ✍️ AI-powered text autocomplete and spell correction
- 🖼️ Image-to-image generation with reference images (Google Gemini, FLUX.1-Kontext, and Qwen)
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

#### Google Generative AI API Setup

```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-3.1-flash-image-preview  # Optional, defaults to gemini-3.1-flash-image-preview (Nano Banana 2)
```

- **GOOGLE_API_KEY**: Your Google API key (required) - Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **GOOGLE_MODEL**: The model name (optional, defaults to `gemini-3.1-flash-image-preview` / Nano Banana 2)

**Image Generation**: The app uses Gemini's native image generation capabilities. See the [documentation](https://ai.google.dev/gemini-api/docs/image-generation) for details.

**⚠️ Geographic Restrictions**: If you get "Image generation is not available in your country" error, you need to deploy the app to a server in a supported region (like Vercel, which runs in US regions by default). The restriction is based on the server's location, not your local machine. See [Deployment](#deployment) section below.

#### xAI Grok API Setup

```bash
GROK_API_KEY=your_grok_api_key_here
# OR alternatively:
XAI_API_KEY=your_grok_api_key_here

# Optional: Customize models
GROK_MODEL=grok-2-image-1212  # Image generation model (default: grok-2-image-1212)
GROK_COMPLETION_MODEL=grok-4-fast-non-reasoning  # Text completion model (default: grok-4-fast-non-reasoning)
```

- **GROK_API_KEY** or **XAI_API_KEY**: Your Grok API key (required) - Both are supported for compatibility
- **GROK_MODEL**: Image generation model (optional, defaults to `grok-2-image-1212`)
- **GROK_COMPLETION_MODEL**: Text completion model (optional, defaults to `grok-4-fast-non-reasoning`)

**Obtaining a Grok API Key**:
- Sign up for an account at [x.ai](https://x.ai) or visit the [xAI Developer Console](https://console.x.ai)
- Navigate to API Keys section in your account settings
- Generate a new API key

**API Documentation**:
- Official xAI API documentation: [https://docs.x.ai/](https://docs.x.ai/)
- Image generation endpoint: [https://docs.x.ai/docs/api-reference#image-generations](https://docs.x.ai/docs/api-reference#image-generations)
- Chat completions endpoint: [https://docs.x.ai/docs/api-reference#chat-completions](https://docs.x.ai/docs/api-reference#chat-completions)

**Note**: Grok's image generation API supports fixed dimensions, but the app will pass your selected layout dimensions in case the API supports them in future updates. **Reference images are not supported by Grok** - use Google Gemini, FLUX.1-Kontext, or Qwen for image-to-image generation.

#### Hugging Face API Setup (FLUX.1-Kontext)

```bash
HF_TOKEN=your_huggingface_token_here
HF_MODEL=black-forest-labs/FLUX.1-Kontext-dev  # Image generation model (default: FLUX.1-Kontext-dev)
HF_PROVIDER=fal-ai  # Provider for fast inference (default: fal-ai)
```

- **HF_TOKEN**: Your Hugging Face API token (required) - Get it from [Hugging Face Settings](https://huggingface.co/settings/tokens)
- **HF_MODEL**: The Hugging Face model to use (optional, defaults to `black-forest-labs/FLUX.1-Kontext-dev`)
- **HF_PROVIDER**: The inference provider (optional, defaults to `fal-ai` for fast inference)

**Obtaining a Hugging Face Token**:
- Sign up at [Hugging Face](https://huggingface.co/)
- Go to Settings → Access Tokens
- Create a new token with read permissions

**API Documentation**: [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

**Note**: FLUX.1-Kontext supports both text-to-image and image-to-image generation with reference images using Hugging Face's inference API.

#### Hugging Face API Setup (Qwen)

```bash
HF_TOKEN=your_huggingface_token_here
HF_MODEL2=Qwen/Qwen-Image-Edit  # Qwen image-to-image model (default: Qwen/Qwen-Image-Edit)
```

- **HF_TOKEN**: Your Hugging Face API token (required) - Same token as FLUX.1-Kontext
- **HF_MODEL2**: The Qwen model to use (optional, defaults to `Qwen/Qwen-Image-Edit`)

**Obtaining a Hugging Face Token**:
- Sign up at [Hugging Face](https://huggingface.co/)
- Go to Settings → Access Tokens
- Create a new token with read permissions

**API Documentation**: [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

**Important Notes**:
- Qwen uses Hugging Face's image-to-image inference endpoint
- **Reference images are REQUIRED for Qwen** - Qwen is only available when a reference image is uploaded
- Qwen supports layout dimensions (1:1, 16:9, 9:16, etc.) for image-to-image generation
- The Qwen model button will be disabled until a reference image is uploaded

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
│   │       └── route.ts      # API route for image generation (Google, Grok, HF, Qwen)
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
│   ├── modelConfig.ts        # Model capabilities and layout configs
│   └── nanobanana.ts         # Image generation client wrapper
└── middleware.ts              # Auth middleware for route protection
```

## Features in Detail

### Image Generation

- **Text-to-Image**: Generate images from text prompts (Google, Grok, FLUX.1-Kontext)
- **Image-to-Image**: Upload a reference image to guide the generation (**Google Gemini, FLUX.1-Kontext, and Qwen**)
  - ⚠️ Reference images are **not supported** by Grok model
  - ⚠️ Reference images are **required** for Qwen model
  - For image-to-image generation, use Google Gemini, FLUX.1-Kontext, or Qwen
- **Layout Options**: Choose from Landscape (16:9), Mobile (9:16), or Square (1:1) aspect ratios
- **Model Selection**: Switch between Google Gemini, xAI Grok, Hugging Face FLUX.1-Kontext, and Qwen models

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
     - `SITE_PASSWORD`: Your chosen 8-character password (required)
     - `GOOGLE_MODEL`: `gemini-3.1-flash-image-preview` (optional)
     - `GROK_API_KEY` or `XAI_API_KEY`: Your Grok API key (required for Grok model)
     - `GROK_MODEL`: `grok-2-image-1212` (optional)
     - `GROK_COMPLETION_MODEL`: `grok-4-fast-non-reasoning` (optional)
     - `HF_TOKEN`: Your Hugging Face token (required for FLUX.1-Kontext and Qwen models)
     - `HF_MODEL`: `black-forest-labs/FLUX.1-Kontext-dev` (optional, for FLUX.1-Kontext)
     - `HF_PROVIDER`: `auto` (optional, for FLUX.1-Kontext)
     - `HF_MODEL2`: `Qwen/Qwen-Image-Edit` (optional, for Qwen)
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
