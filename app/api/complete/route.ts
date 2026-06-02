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

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.OPENROUTER_PROMPT_MODEL || process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-5.4-mini';
    
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

    console.log(`Calling OpenRouter Chat Completions API for text ${isCorrection ? 'correction' : 'completion'}:`,
    {
      endpoint: apiEndpoint, 
      model: model,
      mode: isCorrection ? 'correct' : 'complete',
      promptLength: prompt.length,
    });

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ImageGenStudio',
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
      console.error('OpenRouter API error:', errorMessage);
      // Return empty completion on error (don't show ghost text)
      return NextResponse.json({ completion: '' });
    }

    const data = await response.json();
    
    // Parse OpenRouter chat completions response
    // Format: { choices: [{ message: { content: "..." } }] }
    let completion = '';
    
    if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      const firstChoice = data.choices[0];
      if (firstChoice.message?.content) {
        completion = firstChoice.message.content.trim();
      }
    }

    console.log(`OpenRouter ${isCorrection ? 'correction' : 'completion'} response:`, {
      completionLength: completion.length,
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
