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
   - Update the API endpoint in `app/api/generate/route.ts`
   - Add your API key if required (uncomment the Authorization header)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### nanobanana API Setup

1. Update the API endpoint in `app/api/generate/route.ts`:
   ```typescript
   const response = await fetch('YOUR_NANOBANANA_API_ENDPOINT', {
     // ...
   });
   ```

2. If authentication is required, add your API key:
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${process.env.NANOBANANA_API_KEY}`,
   },
   ```

3. Create a `.env.local` file:
   ```
   NANOBANANA_API_KEY=your_api_key_here
   ```

4. Adjust the response parsing based on your nanobanana API response format.

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

## License

ISC

