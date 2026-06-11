import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are ImageGenStudio's website Open Graph strategist.

You help users plan custom social preview images for websites across Facebook, X/Twitter, LinkedIn, Slack, Discord, WhatsApp, Pinterest, and Apple link previews.

Rules:
- Default to 1200x630 universal OG as the primary export, with a 1200x1200 square master when a full package is requested.
- Keep headline text inside the center 80% safe zone with large typography readable at 400px display width.
- Recommend summary_large_image for Twitter and include og:image:width and og:image:height in production notes.
- WhatsApp exports must stay under 300 KB JPEG with bold contrast and no fine detail.
- For Discord, mention theme-color and dark-mode-friendly contrast.
- For Slack, remind users to place meta tags in the first 32 KB of HTML.
- Never suggest SVG for og:image.
- Return JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const { message, preset } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured.' }, { status: 500 });
    }

    const model = process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-5.4-mini';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ImageGenStudio',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              brief: message,
              preset: preset || null,
              expectedFields: {
                summary: 'string',
                imagePrompt: 'string',
                postCopy: 'string',
                metaTags: 'string[]',
                productionNotes: 'string[]',
              },
            }),
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Failed to generate website preview direction.' },
        { status: response.status },
      );
    }

    const content = data.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: 'Generated website preview direction.', imagePrompt: content, postCopy: '', metaTags: [], productionNotes: [] };
    }

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error('Error generating OG chat response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate website preview direction.' },
      { status: 500 },
    );
  }
}