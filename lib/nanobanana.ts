type Layout = 'landscape' | 'mobile' | 'square';

export async function generateImage(prompt: string, layout: Layout): Promise<string> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        layout,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
        } catch (e2) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.imageUrl) {
      console.error('API response:', data);
      throw new Error('Invalid response format from API. Expected imageUrl in response.');
    }

    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Handle network errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and ensure the development server is running.');
      }
      // Handle other TypeErrors
      throw new Error(`Network error: ${error.message}`);
    }
    
    // Handle fetch errors (when fetch throws)
    if (error instanceof Error) {
      // If it's already a formatted error, rethrow it
      if (error.message.includes('HTTP') || error.message.includes('Failed to generate') || error.message.includes('Network error')) {
        throw error;
      }
      // Otherwise, provide a more helpful message
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    
    throw error;
  }
}

