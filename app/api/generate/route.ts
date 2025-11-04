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

  // xAI Grok Image Generation API
  // Documentation: https://docs.x.ai/docs/models/grok-2-image-1212
  // Model: grok-2-image-1212 is the current image generation model
  // The model grok-beta was deprecated on 2025-09-15
  
  const layoutDescription = layout === 'landscape' 
    ? 'Create a landscape image (16:9 aspect ratio, wide format).'
    : layout === 'mobile'
    ? 'Create a portrait image (9:16 aspect ratio, tall format).'
    : 'Create a square image (1:1 aspect ratio).';
  
  const enhancedPrompt = `${prompt}\n\n${layoutDescription}`;
  
  // xAI API endpoint for chat completions (image generation uses the same endpoint)
  const apiEndpoint = 'https://api.x.ai/v1/chat/completions';
  
  // Use grok-3 for image generation (per API error message)
  // Alternative: grok-2-image-1212 is the dedicated image generation model
  // You can override with GROK_MODEL environment variable
  const model = process.env.GROK_MODEL || 'grok-3';
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: 'user',
        content: enhancedPrompt,
      },
    ],
    // xAI image generation may support additional parameters
    // Check documentation for size, quality, style parameters if needed
  };
  
  console.log('Calling xAI Grok API:', { 
    endpoint: apiEndpoint, 
    model: model,
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
  
  if (data.error) {
    throw new Error(`xAI Grok API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  // Parse xAI response for image generation
  // xAI typically returns images in choices[0].message.content
  // The structure may be an array of image objects or base64 data
  let imageUrl = null;
  
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    const choice = data.choices[0];
    
    // Check for message content with image data
    if (choice.message?.content) {
      const content = choice.message.content;
      
      // If content is an array (for multimodal responses)
      if (Array.isArray(content)) {
        for (const item of content) {
          // Check for image data in the item
          if (item.type === 'image_url' && item.image_url?.url) {
            imageUrl = item.image_url.url;
            break;
          }
          // Check for base64 image data
          if (item.type === 'image' && item.image) {
            if (item.image.startsWith('data:')) {
              imageUrl = item.image;
            } else {
              // Assume base64, add data URI prefix
              imageUrl = `data:image/png;base64,${item.image}`;
            }
            break;
          }
        }
      } 
      // If content is a string that looks like a data URI
      else if (typeof content === 'string' && content.startsWith('data:image')) {
        imageUrl = content;
      }
      // If content is base64 (common in some APIs)
      else if (typeof content === 'string' && content.length > 100) {
        // Try to detect if it's base64 image data
        imageUrl = `data:image/png;base64,${content}`;
      }
    }
    
    // Check for direct image data in the response
    if (!imageUrl && data.images && Array.isArray(data.images) && data.images.length > 0) {
      const firstImage = data.images[0];
      if (firstImage.url) {
        imageUrl = firstImage.url;
      } else if (firstImage.data) {
        const mimeType = firstImage.mimeType || 'image/png';
        imageUrl = `data:${mimeType};base64,${firstImage.data}`;
      }
    }
  }
  
  if (!imageUrl) {
    console.error('xAI Grok API response structure:', JSON.stringify(data, null, 2));
    throw new Error('No image data found in xAI Grok API response. Response structure logged to server console. Please check xAI documentation: https://docs.x.ai/docs/models/grok-2-image-1212');
  }
  
  console.log('Successfully extracted image from xAI Grok API response');
  return imageUrl;
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

