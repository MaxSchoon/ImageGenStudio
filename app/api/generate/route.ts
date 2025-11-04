import { NextRequest, NextResponse } from 'next/server';

type Layout = 'landscape' | 'mobile' | 'square';

const getLayoutDimensions = (layout: Layout): { width: number; height: number } => {
  switch (layout) {
    case 'landscape':
      return { width: 1024, height: 576 }; // 16:9
    case 'mobile':
      return { width: 576, height: 1024 }; // 9:16
    case 'square':
      return { width: 1024, height: 1024 };
    default:
      return { width: 1024, height: 1024 };
  }
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, layout } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const { width, height } = getLayoutDimensions(layout || 'square');

    // Get API key from environment variables
    const apiKey = process.env.NANOBANANA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NANOBANANA_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // Call nanobanana API
    const response = await fetch('https://api.nanobanana.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`nanobanana API error: ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    
    // Adjust based on actual nanobanana API response format
    return NextResponse.json({
      imageUrl: data.imageUrl || data.url || data.image,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}

