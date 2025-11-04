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
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NANOBANANA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // Use Google Generative AI (Gemini) API for image generation
    // For image generation, we'll use Imagen model or similar
    // Note: Gemini's generateContent is for text. For images, we may need Imagen API
    // Use Gemini 2.5 Flash Image model for image generation
    // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
    const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-image';
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // Map layout to aspect ratio (as per Gemini API documentation)
    const getAspectRatio = (layout: Layout): string => {
      switch (layout) {
        case 'landscape':
          return '16:9'; // 1344x768
        case 'mobile':
          return '9:16'; // 768x1344
        case 'square':
          return '1:1'; // 1024x1024
        default:
          return '1:1';
      }
    };
    
    const aspectRatio = getAspectRatio(layout);
    
    console.log('Calling Google Generative AI API:', { endpoint: apiEndpoint, prompt, aspectRatio });
    
    let response;
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            imageConfig: {
              aspectRatio: aspectRatio,
            },
          },
        }),
      });
    } catch (fetchError) {
      console.error('Fetch error details:', fetchError);
      
      // Handle specific fetch errors
      if (fetchError instanceof TypeError) {
        if (fetchError.message.includes('fetch')) {
          throw new Error(`Network error: Unable to connect to Google Generative AI API at ${apiEndpoint}. Please check:\n1. The API endpoint URL is correct\n2. Your internet connection\n3. The API service is available`);
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      throw new Error(`Failed to connect to Google Generative AI API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    if (!response.ok) {
      let errorData = '';
      try {
        errorData = await response.text();
      } catch (e) {
        errorData = response.statusText;
      }
      
      console.error('Google Generative AI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      throw new Error(`Google Generative AI API error (${response.status}): ${errorData || response.statusText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, try to get text
      const text = await response.text();
      console.error('Non-JSON response from Google Generative AI API:', text);
      throw new Error('Invalid response format from Google Generative AI API (expected JSON)');
    }
    
    console.log('Google Generative AI API response:', JSON.stringify(data, null, 2));
    
    // Parse Google Generative AI API response according to documentation
    // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
    // The response structure is: data.candidates[0].content.parts[].inlineData
    let imageUrl = null;
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      
      // Iterate through parts to find the image data
      for (const part of parts) {
        if (part.inlineData) {
          // Image is returned as base64 data
          const mimeType = part.inlineData.mimeType || 'image/png';
          const base64Data = part.inlineData.data;
          imageUrl = `data:${mimeType};base64,${base64Data}`;
          break;
        }
        // Also check for text parts (in case there's a description)
        if (part.text) {
          console.log('Text response:', part.text);
        }
      }
    }
    
    if (!imageUrl) {
      console.error('Missing image data in response. Response structure:', JSON.stringify(data, null, 2));
      throw new Error('No image data found in API response. Please check the API documentation at https://ai.google.dev/gemini-api/docs/image-generation');
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

