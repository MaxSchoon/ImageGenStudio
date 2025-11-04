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
    
    // Build request body according to Gemini API documentation
    // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
    const requestBody: any = {
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
        responseModalities: ['IMAGE'], // Required to receive image data in response
      },
    };
    
    console.log('Calling Google Generative AI API:', { 
      endpoint: apiEndpoint, 
      prompt, 
      aspectRatio,
      requestBody: JSON.stringify(requestBody, null, 2)
    });
    
    let response;
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
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

    // Log response status and headers for debugging
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Read response as text first to see raw data
    const responseText = await response.text();
    console.log('Raw response text (first 2000 chars):', responseText.substring(0, 2000));
    
    if (!response.ok) {
      console.error('Google Generative AI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
      });
      
      // Try to parse error as JSON
      let errorMessage = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error?.message || JSON.stringify(errorJson);
      } catch (e) {
        // Keep text as is
      }
      
      throw new Error(`Google Generative AI API error (${response.status}): ${errorMessage || response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response. Raw text:', responseText);
      throw new Error('Invalid response format from Google Generative AI API (expected JSON)');
    }
    
    console.log('Parsed Google Generative AI API response:', JSON.stringify(data, null, 2));
    
    // Check for API errors in the response body (even if status is 200)
    if (data.error) {
      console.error('API error in response:', data.error);
      throw new Error(`Google Generative AI API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    // Check for blocked or filtered content
    if (data.promptFeedback) {
      if (data.promptFeedback.blockReason) {
        throw new Error(`Content was blocked: ${data.promptFeedback.blockReason}. ${data.promptFeedback.safetyRatings ? 'Safety ratings: ' + JSON.stringify(data.promptFeedback.safetyRatings) : ''}`);
      }
    }
    
    // Parse Google Generative AI API response according to documentation
    // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
    // The response structure can vary, so we check multiple possible locations
    let imageUrl = null;
    
    // Try different response structures
    // Structure 1: data.candidates[0].content.parts[].inlineData
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      console.log('Processing candidate:', {
        hasContent: !!candidate.content,
        hasParts: !!candidate.content?.parts,
        partsLength: candidate.content?.parts?.length || 0,
        candidateKeys: Object.keys(candidate)
      });
      
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        console.log(`Processing ${candidate.content.parts.length} parts in candidate content`);
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i];
          console.log(`Part ${i} keys:`, Object.keys(part));
          console.log(`Part ${i} structure:`, JSON.stringify(part, null, 2).substring(0, 500));
          
          if (part.inlineData && part.inlineData.data) {
            // Image is returned as base64 data
            const mimeType = part.inlineData.mimeType || 'image/png';
            const base64Data = part.inlineData.data;
            console.log(`Found inlineData in part ${i}, mimeType: ${mimeType}, data length: ${base64Data.length}`);
            imageUrl = `data:${mimeType};base64,${base64Data}`;
            break;
          }
          // Also check for text parts (in case there's a description or error message)
          if (part.text) {
            console.log(`Part ${i} text response from API (first 200 chars):`, part.text.substring(0, 200));
            // If there's text but no image, it might be an error message
            if (!imageUrl && part.text.toLowerCase().includes('error')) {
              console.warn('API returned text that might indicate an error:', part.text);
            }
          }
          // Check for function calls or other response types
          if (part.functionCall) {
            console.log('Function call in response:', part.functionCall);
          }
        }
      }
      
      // Structure 2: Direct imageData in candidate
      if (!imageUrl && candidate.imageData) {
        const mimeType = candidate.imageData.mimeType || 'image/png';
        const base64Data = candidate.imageData.data;
        imageUrl = `data:${mimeType};base64,${base64Data}`;
      }
      
      // Structure 2b: Check finishReason - if it's blocked or filtered, there's no image
      if (candidate.finishReason) {
        console.log('Finish reason:', candidate.finishReason);
        if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
          throw new Error(`Image generation finished with reason: ${candidate.finishReason}. This may indicate the content was blocked or filtered.`);
        }
      }
    }
    
    // Structure 3: Check for direct image data in response
    if (!imageUrl && data.imageData) {
      const mimeType = data.imageData.mimeType || 'image/png';
      const base64Data = data.imageData.data;
      imageUrl = `data:${mimeType};base64,${base64Data}`;
    }
    
    // Structure 4: Check for image URL (if API returns URLs instead)
    if (!imageUrl && data.imageUrl) {
      imageUrl = data.imageUrl;
    }
    
    // Structure 5: Check for images array
    if (!imageUrl && data.images && Array.isArray(data.images) && data.images.length > 0) {
      const firstImage = data.images[0];
      if (firstImage.inlineData && firstImage.inlineData.data) {
        const mimeType = firstImage.inlineData.mimeType || 'image/png';
        const base64Data = firstImage.inlineData.data;
        imageUrl = `data:${mimeType};base64,${base64Data}`;
      } else if (firstImage.url) {
        imageUrl = firstImage.url;
      } else if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      }
    }
    
    if (!imageUrl) {
      console.error('Missing image data in response. Full response structure:', JSON.stringify(data, null, 2));
      console.error('Available keys in response:', Object.keys(data));
      if (data.candidates && data.candidates[0]) {
        console.error('First candidate keys:', Object.keys(data.candidates[0]));
        if (data.candidates[0].content) {
          console.error('Content keys:', Object.keys(data.candidates[0].content));
          if (data.candidates[0].content.parts) {
            console.error('Parts structure:', JSON.stringify(data.candidates[0].content.parts, null, 2));
            // Log what type of parts we actually have
            data.candidates[0].content.parts.forEach((part: any, index: number) => {
              console.error(`Part ${index} keys:`, Object.keys(part));
              if (part.text) {
                console.error(`Part ${index} text content:`, part.text.substring(0, 200));
              }
            });
          }
        }
      }
      
      // Include response structure in error message for debugging
      const responseSummary = {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length || 0,
        firstCandidateKeys: data.candidates?.[0] ? Object.keys(data.candidates[0]) : [],
        topLevelKeys: Object.keys(data),
      };
      
      // Check if we got text instead of image
      let hasTextResponse = false;
      if (data.candidates?.[0]?.content?.parts) {
        hasTextResponse = data.candidates[0].content.parts.some((part: any) => part.text);
      }
      
      let errorMessage = `No image data found in API response. Response structure: ${JSON.stringify(responseSummary)}.`;
      if (hasTextResponse) {
        errorMessage += ' The API returned text instead of an image. This may indicate the model is not configured for image generation or the request format is incorrect.';
      }
      errorMessage += ' Full response logged to server console. Please check the API documentation at https://ai.google.dev/gemini-api/docs/image-generation';
      
      throw new Error(errorMessage);
    }
    
    console.log('Successfully extracted image URL. Image URL length:', imageUrl.length, 'Format:', imageUrl.substring(0, 50) + '...');
    
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

