import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROK_API_KEY or XAI_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // Use Grok chat completions endpoint for text completion
    // Documentation: https://docs.x.ai/docs/api-reference#chat-completions
    const apiEndpoint = 'https://api.x.ai/v1/chat/completions';
    
    // Use a fast, cost-effective model for low-latency predictions
    // Default: grok-2-1212 (fast and reliable)
    // Alternative: grok-3-mini-beta (cheapest at $0.30/$0.50 per million tokens)
    // You can override with GROK_COMPLETION_MODEL environment variable
    const model = process.env.GROK_COMPLETION_MODEL || 'grok-2-1212';
    
    // Create a system prompt that encourages concise completion suggestions
    // for image prompt generation
    const systemPrompt = `You are a helpful assistant that completes image generation prompts. 
Provide concise, natural completions that continue the user's prompt in a way that would be useful for image generation.
Keep suggestions brief (typically 1-10 words) and relevant to image generation. 
Only complete the thought, don't add new unrelated ideas.`;

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 20, // Keep completions short for ghost text
      temperature: 0.7, // Balance between creativity and consistency
      stream: false, // We want a single completion response
    };

    console.log('Calling xAI Grok Chat Completions API for text completion:', { 
      endpoint: apiEndpoint, 
      model: model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100),
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
      console.error('xAI Grok API error:', errorMessage);
      // Return empty completion on error (don't show ghost text)
      return NextResponse.json({ completion: '' });
    }

    const data = await response.json();
    
    // Parse Grok chat completions response
    // Format: { choices: [{ message: { content: "..." } }] }
    let completion = '';
    
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      const firstChoice = data.choices[0];
      if (firstChoice.message?.content) {
        completion = firstChoice.message.content.trim();
      }
    }

    console.log('Grok completion response:', { 
      completionLength: completion.length,
      completionPreview: completion.substring(0, 50),
    });

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('Error getting text completion:', error);
    
    // Handle network errors gracefully - return empty completion
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({ completion: '' });
    }
    
    // Return empty completion on any error (don't break the UI)
    return NextResponse.json({ completion: '' });
  }
}

