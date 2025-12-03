import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, mode = 'complete' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const isCorrection = mode === 'correct';

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
    
    // Create different system prompts for completion vs correction
    const systemPrompt = isCorrection
      ? `Enhance this image generation prompt. Add:
- Specific visual details (lighting: golden hour, dramatic shadows, soft diffused)
- Composition terms (close-up, wide angle, centered, rule of thirds)
- Quality modifiers (8k, hyperrealistic, sharp focus, volumetric lighting)
- Art style keywords (cinematic, editorial, concept art, oil painting style)

Rules:
- Fix typos, keep original intent
- Be concise: max 50 words total
- Output only the enhanced prompt, nothing else`
      : `Complete this image prompt briefly (1-10 words). Focus on visual descriptors.`;

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
      max_tokens: isCorrection ? 100 : 20, // Reduced tokens for concise corrections
      temperature: isCorrection ? 0.3 : 0.7, // Lower temperature for corrections (more consistent)
      stream: false, // We want a single completion response
    };

    console.log(`Calling xAI Grok Chat Completions API for text ${isCorrection ? 'correction' : 'completion'}:`, { 
      endpoint: apiEndpoint, 
      model: model,
      mode: isCorrection ? 'correct' : 'complete',
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

    console.log(`Grok ${isCorrection ? 'correction' : 'completion'} response:`, { 
      completionLength: completion.length,
      completionPreview: completion.substring(0, 50),
    });

    return NextResponse.json({ 
      completion,
      mode: isCorrection ? 'correct' : 'complete'
    });
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

