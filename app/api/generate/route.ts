import { NextRequest, NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

type Layout = 'landscape' | 'mobile' | 'square';
type Model = 'google' | 'grok' | 'huggingface';

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

// Helper function to extract base64 data and mimeType from data URI
function parseImageData(dataUri: string): { mimeType: string; data: string } {
  // Data URI format: data:mimeType;base64,base64data
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1] || 'image/png',
      data: match[2],
    };
  }
  // If it's already just base64, default to PNG
  return {
    mimeType: 'image/png',
    data: dataUri.replace(/^data:image\/[^;]+;base64,/, ''),
  };
}

// Helper function to map layout to Google Gemini API aspect ratio string
const getAspectRatio = (layout: Layout): string => {
  switch (layout) {
    case 'landscape':
      return '16:9';
    case 'mobile':
      return '9:16';
    case 'square':
      return '1:1';
    default:
      return '1:1';
  }
};

async function generateWithGoogle(prompt: string, layout: Layout, imageData?: string): Promise<string> {
  const { width, height } = getLayoutDimensions(layout);

    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NANOBANANA_API_KEY;
    
    if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured. Please add it to your .env.local file.');
    }

    // Optional proxy URL to route requests through a server in a supported region
    const proxyUrl = process.env.GOOGLE_PROXY_URL;

    // Use Google Generative AI (Gemini) API for image generation
    // For image-to-image generation, use a model that supports image generation
    const model = process.env.GOOGLE_MODEL || (imageData ? 'gemini-2.5-flash-image' : 'gemini-2.0-flash-exp');
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // When a reference image is provided, enhance the prompt to explicitly reference it
    const basePrompt = imageData 
      ? `Based on this reference image, ${prompt}`
      : prompt;
    
    // Build parts array - when imageData is provided, put image BEFORE text
    // This is the correct order for image-to-image generation according to Gemini API docs
    const parts: any[] = [];
    
    // Add image part first if provided (correct order for reference images)
    if (imageData) {
      const { mimeType, data } = parseImageData(imageData);
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: data,
        },
      });
    }
    
    // Add text prompt after image (or first if no image)
    parts.push({
      text: basePrompt,
    });
    
    // Map layout to aspect ratio string for Google Gemini API
    const aspectRatio = getAspectRatio(layout);
    
    const requestBody: any = {
      contents: [
        {
          parts: parts,
        },
      ],
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    };
    
    console.log('Calling Google Generative AI API:', { 
      endpoint: apiEndpoint, 
      prompt, 
      layout,
      aspectRatio,
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
  
    // Log the full response structure for debugging, especially when imageData is provided
    if (imageData) {
      console.log('Google Generative AI API response (with reference image):', JSON.stringify(data, null, 2));
    }
  
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
    // Log the full response structure when image generation fails to help debug
    console.error('No image data found in Google API response. Full response structure:', JSON.stringify(data, null, 2));
    throw new Error('No image data found in Google API response. Please check the API documentation at https://ai.google.dev/gemini-api/docs/image-generation');
  }
  
  return imageUrl;
}

async function generateWithGrok(prompt: string, layout: Layout, imageData?: string): Promise<string> {
  const { width, height } = getLayoutDimensions(layout);
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROK_API_KEY or XAI_API_KEY is not configured. Please add it to your .env.local file.');
  }

  // xAI Grok Image Generation API
  // Documentation: https://docs.x.ai/docs/api-reference#image-generations
  // Must use /images/generations endpoint, not /chat/completions
  // Model: grok-2-image-1212 is the current image generation model
  // Note: Grok currently supports fixed 4:3 aspect ratio (1024x768), but we pass dimensions
  // in case the API supports them in future updates
  // IMPORTANT: The /images/generations endpoint does NOT support reference images for image-to-image generation.
  // Reference images are only supported for vision models via /chat/completions endpoint (for image understanding, not generation).
  
  const layoutDescription = layout === 'landscape' 
    ? 'Create a landscape image (16:9 aspect ratio, wide format).'
    : layout === 'mobile'
    ? 'Create a portrait image (9:16 aspect ratio, tall format).'
    : 'Create a square image (1:1 aspect ratio).';
  
  // When a reference image is provided, enhance the prompt to explicitly reference it
  // Note: Grok's /images/generations endpoint doesn't support reference images, so we enhance the text prompt instead
  const basePrompt = imageData 
    ? `Based on this reference image, ${prompt}`
    : prompt;
  
  const enhancedPrompt = `${basePrompt}\n\n${layoutDescription}`;
  
  // xAI API endpoint for image generation
  // Documentation: https://docs.x.ai/docs/api-reference#image-generations
  const apiEndpoint = 'https://api.x.ai/v1/images/generations';
  
  // Use grok-2-image-1212 for image generation (dedicated image generation model)
  // You can override with GROK_MODEL environment variable
  const model = process.env.GROK_MODEL || 'grok-2-image-1212';
  
  // Request body format for /images/generations endpoint
  // Based on xAI API documentation: https://docs.x.ai/docs/api-reference#image-generations
  // The /images/generations endpoint does NOT support reference images for image-to-image generation.
  // We enhance the text prompt instead when a reference image is provided.
  const requestBody: any = {
    model: model,
    prompt: enhancedPrompt,
    width: width,
    height: height,
    // Optional parameters (check documentation for supported options)
    // n: number of images to generate (default: 1, max: 10)
    // quality: image quality (if supported)
    // style: image style (if supported)
  };
  
  // Log a warning when reference image is provided
  // Grok's /images/generations endpoint doesn't support reference images, so we enhance the prompt textually
  if (imageData) {
    console.warn('Grok /images/generations endpoint does not support reference images. Enhancing prompt textually instead.');
  }
  
  console.log('Calling xAI Grok Image Generation API:', { 
    endpoint: apiEndpoint, 
    model: model,
    prompt, 
    layout,
    width,
    height,
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
  
  // Log the full response for debugging
  console.log('xAI Grok Image Generation API response:', JSON.stringify(data, null, 2));
  
  if (data.error) {
    throw new Error(`xAI Grok API error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  
  // Parse xAI /images/generations response
  // Based on xAI API documentation: https://docs.x.ai/docs/api-reference#image-generations
  // Response format is typically: { data: [{ url: "...", b64_json: "..." }] }
  let imageUrl = null;
  
  // Check for data array (standard format for image generation endpoints)
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    const firstImage = data.data[0];
    
    // Check for URL first (preferred format)
    if (firstImage.url) {
      imageUrl = firstImage.url;
      console.log('Found image URL in data array');
    }
    // Check for base64 JSON (alternative format)
    else if (firstImage.b64_json) {
      // Convert base64 to data URI
      imageUrl = `data:image/jpeg;base64,${firstImage.b64_json}`;
      console.log('Found base64 image in data array');
    }
    // Check for base64 field (some APIs use this)
    else if (firstImage.base64) {
      imageUrl = `data:image/jpeg;base64,${firstImage.base64}`;
      console.log('Found base64 field in data array');
    }
    // Check for data field with base64
    else if (firstImage.data) {
      if (typeof firstImage.data === 'string') {
        if (firstImage.data.startsWith('data:')) {
          imageUrl = firstImage.data;
        } else {
          imageUrl = `data:image/jpeg;base64,${firstImage.data}`;
        }
        console.log('Found data field in data array');
      }
    }
  }
  
  // Check for images array (alternative format)
  if (!imageUrl && data.images && Array.isArray(data.images) && data.images.length > 0) {
    const firstImage = data.images[0];
    if (firstImage.url) {
      imageUrl = firstImage.url;
      console.log('Found image URL in images array');
    } else if (firstImage.b64_json) {
      imageUrl = `data:image/jpeg;base64,${firstImage.b64_json}`;
      console.log('Found base64 in images array');
    } else if (typeof firstImage === 'string') {
      // If it's a direct URL string
      if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
        imageUrl = firstImage;
        console.log('Found direct URL string in images array');
      } else if (firstImage.startsWith('data:image')) {
        imageUrl = firstImage;
        console.log('Found data URI in images array');
      }
    }
  }
  
  // Check for direct URL at top level
  if (!imageUrl && data.url) {
    imageUrl = data.url;
    console.log('Found URL at top level');
  }
  
  // Check for direct base64 at top level
  if (!imageUrl && data.b64_json) {
    imageUrl = `data:image/jpeg;base64,${data.b64_json}`;
    console.log('Found base64 at top level');
  }
  
  if (!imageUrl) {
    console.error('xAI Grok Image Generation API response structure:', JSON.stringify(data, null, 2));
    throw new Error('No image data found in xAI Grok API response. Response structure logged to server console. Please check xAI documentation: https://docs.x.ai/docs/api-reference#image-generations');
  }
  
  // Validate the image URL format
  const isValidUrl = imageUrl.startsWith('http://') || 
                     imageUrl.startsWith('https://') || 
                     imageUrl.startsWith('data:image');
  
  if (!isValidUrl) {
    console.error('Invalid image URL format:', imageUrl.substring(0, 100));
    throw new Error(`Invalid image URL format returned from xAI API: ${imageUrl.substring(0, 100)}...`);
  }
  
  console.log('Successfully extracted image from xAI Grok Image Generation API, URL length:', imageUrl.length);
  return imageUrl;
}

async function generateWithHuggingFace(prompt: string, layout: Layout, imageData?: string): Promise<string> {
  const { width, height } = getLayoutDimensions(layout);
  const apiKey = process.env.HF_TOKEN;

  if (!apiKey) {
    throw new Error('HF_TOKEN is not configured. Please add it to your .env.local file.');
  }

  // Initialize Hugging Face Inference Client
  const client = new InferenceClient(apiKey);

  // Use FLUX.1-Kontext-dev model with fal-ai provider (supports reference images)
  const model = process.env.HF_MODEL || 'black-forest-labs/FLUX.1-Kontext-dev';
  const provider = process.env.HF_PROVIDER || 'fal-ai';

  console.log('Calling Hugging Face Inference API:', {
    model,
    provider,
    prompt,
    layout,
    width,
    height,
    hasReferenceImage: !!imageData,
  });

  try {
    let result: any;

    // Use imageToImage API when reference image is provided (FLUX.1-Kontext-dev supports this)
    if (imageData) {
      // Convert data URI to Buffer for imageToImage API
      const { data } = parseImageData(imageData);
      const imageBuffer = Buffer.from(data, 'base64');

      console.log('Using imageToImage API with reference image');
      result = await client.imageToImage({
        provider: provider as any,
        model: model,
        inputs: imageBuffer,
        parameters: {
          prompt: prompt,
          // You can add more parameters here if needed
        },
      });
    } else {
      // Use textToImage API when no reference image
      console.log('Using textToImage API without reference image');
      result = await client.textToImage({
        provider: provider as any,
        model: model,
        inputs: prompt,
        parameters: {
          num_inference_steps: 5, // Fast generation (increase for higher quality)
          width: width,
          height: height,
        },
      });
    }

    // Convert result to base64 data URI
    // In Node.js, the Hugging Face client returns a Blob-like object or Buffer
    let imageUrl: string;
    let imageSize: number;

    // Check if result has arrayBuffer method (Blob-like)
    if (typeof (result as any).arrayBuffer === 'function') {
      // If it's a Blob-like object, convert to base64
      const arrayBuffer = await (result as any).arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = (result as any).type || 'image/jpeg';
      imageUrl = `data:${mimeType};base64,${base64}`;
      imageSize = (result as any).size || arrayBuffer.byteLength;
      console.log('Successfully generated image with Hugging Face (Blob-like), size:', imageSize, 'bytes');
    } else if (Buffer.isBuffer(result)) {
      // If it's already a Buffer, convert directly
      const base64 = result.toString('base64');
      imageUrl = `data:image/jpeg;base64,${base64}`;
      imageSize = result.length;
      console.log('Successfully generated image with Hugging Face (Buffer), size:', imageSize, 'bytes');
    } else {
      throw new Error('Unexpected response type from Hugging Face API');
    }

    return imageUrl;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Hugging Face API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, layout, model = 'google', imageData } = await request.json();

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

    // Validate imageData if provided
    if (imageData && typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'imageData must be a string (base64 data URI)' },
        { status: 400 }
      );
    }

    // Determine which model to use
    let selectedModel: Model = 'google';
    if (model === 'grok') {
      selectedModel = 'grok';
    } else if (model === 'huggingface') {
      selectedModel = 'huggingface';
    }

    // Route to the appropriate model handler
    let imageUrl: string;
    try {
      if (selectedModel === 'huggingface') {
        imageUrl = await generateWithHuggingFace(prompt, layout, imageData);
      } else if (selectedModel === 'grok') {
        imageUrl = await generateWithGrok(prompt, layout, imageData);
      } else {
        imageUrl = await generateWithGoogle(prompt, layout, imageData);
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

