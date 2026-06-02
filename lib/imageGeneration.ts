import { DEFAULT_MODEL, Layout, Model } from './modelConfig';

type LayoutInput = Layout | { type: 'reference'; width: number; height: number };

export async function generateImage(
  prompt: string,
  layout: LayoutInput,
  model: Model = DEFAULT_MODEL,
  imageData?: string
): Promise<string> {
  try {
    const requestBody: Record<string, unknown> = {
      prompt,
      layout: typeof layout === 'object' ? layout.type : layout,
      model,
    };

    if (typeof layout === 'object' && layout.type === 'reference') {
      requestBody.referenceDimensions = { width: layout.width, height: layout.height };
    }

    if (imageData) {
      requestBody.imageData = imageData;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        try {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      if (data.error) {
        throw new Error(`Failed to generate image: ${data.error}`);
      }
      throw new Error('No image data found in OpenRouter response.');
    }

    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);

    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and ensure the development server is running.');
      }
      throw new Error(`Network error: ${error.message}`);
    }

    if (error instanceof Error) {
      if (error.message.includes('HTTP') || error.message.includes('Failed to generate') || error.message.includes('Network error')) {
        throw error;
      }
      throw new Error(`Failed to generate image: ${error.message}`);
    }

    throw error;
  }
}

