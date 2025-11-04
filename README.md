# Image Generation Studio

A modern image generation application built with Next.js, React, and Tailwind CSS. Generate images using nanobanana with a beautiful glass morphism UI.

## Features

- 🎨 Modern glass morphism design
- 📱 Multiple layout options (Landscape, Mobile, Square)
- ⚡ Fast image generation using nanobanana
- 🖼️ Image preview and download
- ⏳ Beautiful loading screen

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure nanobanana API:
   - Add your API key to `.env.local` file:
     ```
     NANOBANANA_API_KEY=your_api_key_here
     ```
   - Update the API endpoint in `app/api/generate/route.ts` if needed

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Google Generative AI API Setup

1. Create a `.env.local` file in the root directory (if it doesn't exist):
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_MODEL=gemini-2.5-flash-image
   ```
   - `GOOGLE_API_KEY`: Your Google API key (required) - Get it from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `GOOGLE_MODEL`: The model name (optional, defaults to `gemini-2.5-flash-image` for image generation)
   
   **Image Generation**: The app uses Gemini's native image generation capabilities (aka "Nano Banana"). See the [documentation](https://ai.google.dev/gemini-api/docs/image-generation) for details.

   **⚠️ Geographic Restrictions**: If you get "Image generation is not available in your country" error, you need to deploy the app to a server in a supported region (like Vercel, which runs in US regions by default). The restriction is based on the server's location, not your local machine. See [Deployment](#deployment) section below.

2. The API key and endpoint are automatically used from `.env.local`

3. Error handling: The app now includes detailed error messages that will help diagnose issues:
   - Network errors will show connection issues
   - API errors will display the status code and error message
   - Missing configuration will prompt you to add the API key

4. Check the browser console and server logs for detailed error information if generation fails.

5. Adjust the response parsing in `app/api/generate/route.ts` based on your nanobanana API response format if needed.

## Project Structure

```
ImageGen/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API route for image generation
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── ImageStudio.tsx       # Main studio component
│   ├── LayoutSelector.tsx   # Layout selection UI
│   ├── LoadingScreen.tsx    # Loading state component
│   └── ImagePreview.tsx     # Image preview component
└── lib/
    └── nanobanana.ts        # Image generation client
```

## Build

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
     - `GOOGLE_API_KEY`: Your Google API key
     - `GOOGLE_MODEL`: `gemini-2.0-flash-exp` (optional)
   - Deploy

3. **Why Vercel works**: Vercel runs your server-side API routes on infrastructure in supported regions (US by default), which bypasses the geographic restriction.

### Alternative: Deploy to Other Cloud Services

You can also deploy to:
- **AWS** (us-east-1 or other supported regions)
- **Google Cloud Platform** (in a supported region)
- **Azure** (in a supported region)

Just make sure your server is located in a region where Google's image generation API is available. See [Google's available regions](https://ai.google.dev/available_regions) for details.

## License

ISC

