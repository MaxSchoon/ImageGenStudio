import { NextRequest, NextResponse } from 'next/server';

type Layout = 'landscape' | 'mobile' | 'square';
type Model = 'google' | 'grok';

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

async function generateWithGoogle(prompt: string, layout: Layout): Promise<string> {
  const { width, height } = getLayoutDimensions(layout);

  // Get API key from environment variables
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NANOBANANA_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured. Please add it to your .env.local file.');
  }

  // Optional proxy URL to route requests through a server in a supported region
  const proxyUrl = process.env.GOOGLE_PROXY_URL;

  // Use Google Generative AI (Gemini) API for image generation
  const model = process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp';
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  // Build request body according to Gemini API documentation
  const layoutDescription = layout === 'landscape' 
    ? 'Create a landscape image (16:9 aspect ratio, wide format).'
    : layout === 'mobile'
    ? 'Create a portrait image (9:16 aspect ratio, tall format).'
    : 'Create a square image (1:1 aspect ratio).';
  
  const enhancedPrompt = `${prompt}\n\n${layoutDescription}`;
  
  const requestBody: any = {
    contents: [
      {
        parts: [
          {
            text: enhancedPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['Text', 'Image'],
    },
  };
  
  console.log('Calling Google Generative AI API:', { 
    endpoint: apiEndpoint, 
    prompt, 
    layout,
    enhancedPrompt,
  });
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.error?.message || JSON.stringify(errorJson);
    } catch (e) {
      // Keep text as is
    }
    throw new Error(`Google Generative AI API error (${response.status}): ${errorMessage || response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Google Generative AI API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Content was blocked: ${data.promptFeedback.blockReason}`);
  }
  
  // Parse response to extract image
  let imageUrl = null;
  
  if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    
    if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const base64Data = part.inlineData.data;
          imageUrl = `data:${mimeType};base64,${base64Data}`;
          break;
        }
      }
    }
    
    if (!imageUrl && candidate.imageData?.data) {
      const mimeType = candidate.imageData.mimeType || 'image/png';
      const base64Data = candidate.imageData.data;
      imageUrl = `data:${mimeType};base64,${base64Data}`;
    }
  }
  
  if (!imageUrl) {
    throw new Error('No image data found in Google API response. Please check the API documentation at https://ai.google.dev/gemini-api/docs/image-generation');
  }
  
  return imageUrl;
}

async function generateWithGrok(prompt: string, layout: Layout): Promise<string> {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROK_API_KEY or XAI_API_KEY is not configured. Please add it to your .env.local file.');
  }

  // Note: xAI's Grok API primarily supports text generation
  // For image generation, you may need to use a different endpoint or service
  // This is a placeholder implementation - you may need to adjust based on xAI's actual image generation API
  // Documentation: https://docs.x.ai/
  
  const layoutDescription = layout === 'landscape' 
    ? 'Create a landscape image (16:9 aspect ratio, wide format).'
    : layout === 'mobile'
    ? 'Create a portrait image (9:16 aspect ratio, tall format).'
    : 'Create a square image (1:1 aspect ratio).';
  
  const enhancedPrompt = `${prompt}\n\n${layoutDescription}`;
  
  // xAI API endpoint for chat completions
  // Note: This may need to be adjusted if xAI has a specific image generation endpoint
  const apiEndpoint = 'https://api.x.ai/v1/chat/completions';
  
  const requestBody = {
    model: 'grok-beta', // or 'grok-2-vision' if available
    messages: [
      {
        role: 'user',
        content: enhancedPrompt,
      },
    ],
    // Add any image generation specific parameters here if available
  };
  
  console.log('Calling xAI Grok API:', { 
    endpoint: apiEndpoint, 
    prompt, 
    layout,
    enhancedPrompt,
  });
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage = errorJson.error?.message || JSON.stringify(errorJson);
    } catch (e) {
      // Keep text as is
    }
    throw new Error(`xAI Grok API error (${response.status}): ${errorMessage || response.statusText}`);
  }

  const data = await response.json();
  
  // Parse xAI response - this structure may need adjustment based on actual API response
  // xAI typically returns text in choices[0].message.content
  // For image generation, the response structure may differ
  if (data.error) {
    throw new Error(`xAI Grok API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  // TODO: Parse image data from xAI response
  // The actual structure depends on xAI's image generation API format
  // This is a placeholder - you'll need to adjust based on xAI's documentation
  throw new Error('Grok image generation is not yet fully implemented. Please check xAI documentation for image generation endpoints: https://docs.x.ai/');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, layout, model = 'google' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!layout || !['landscape', 'mobile', 'square'].includes(layout)) {
      return NextResponse.json(
        { error: 'Valid layout is required (landscape, mobile, or square)' },
        { status: 400 }
      );
    }

    const selectedModel: Model = model === 'grok' ? 'grok' : 'google';
    
    // Route to the appropriate model handler
    let imageUrl: string;
    try {
      if (selectedModel === 'grok') {
        imageUrl = await generateWithGrok(prompt, layout);
      } else {
        imageUrl = await generateWithGoogle(prompt, layout);
      }
    } catch (error) {
      console.error(`Error generating image with ${selectedModel}:`, error);
      throw error;
    }
    
    return NextResponse.json({
      imageUrl,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Handle fetch errors (network issues)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error: Unable to connect to Google Generative AI API. Please check the API endpoint URL.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}

