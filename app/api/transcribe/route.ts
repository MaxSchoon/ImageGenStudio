import { NextRequest, NextResponse } from 'next/server';

const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Add it to .env.local to enable speech to text.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file must be smaller than 25 MB.' }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append('file', file, file.name || 'voice.webm');
    upstreamFormData.append('model', TRANSCRIPTION_MODEL);
    upstreamFormData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamFormData,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `OpenAI transcription failed (${response.status}): ${text || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: typeof data.text === 'string' ? data.text : '', model: TRANSCRIPTION_MODEL });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio.' },
      { status: 500 }
    );
  }
}
