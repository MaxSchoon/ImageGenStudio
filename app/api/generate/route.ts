import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_MODEL,
  Layout,
  MODEL_CAPABILITIES,
  isModel,
} from '@/lib/modelConfig';
import { generateWithOpenRouter } from '@/lib/serverImageGeneration';

const VALID_LAYOUTS: Layout[] = ['landscape', 'mobile', 'portrait', 'square', 'reference'];

export async function POST(request: NextRequest) {
  try {
    const { prompt, layout, model = DEFAULT_MODEL, imageData, referenceDimensions } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!layout || !VALID_LAYOUTS.includes(layout)) {
      return NextResponse.json(
        { error: 'Valid layout is required (landscape, mobile, portrait, square, or reference)' },
        { status: 400 }
      );
    }

    if (!isModel(model)) {
      return NextResponse.json(
        { error: `Unsupported model "${model}". Select a configured OpenRouter image model.` },
        { status: 400 }
      );
    }

    if (
      layout === 'reference' &&
      (!referenceDimensions || typeof referenceDimensions.width !== 'number' || typeof referenceDimensions.height !== 'number')
    ) {
      return NextResponse.json(
        { error: 'Reference dimensions are required when using reference layout' },
        { status: 400 }
      );
    }

    if (imageData && typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'imageData must be a string (base64 data URI)' },
        { status: 400 }
      );
    }

    const capabilities = MODEL_CAPABILITIES[model];
    if (!capabilities.supportedLayouts.includes(layout)) {
      return NextResponse.json(
        { error: `${layout} layout is not supported for ${model} model. Supported layouts: ${capabilities.supportedLayouts.join(', ')}.` },
        { status: 400 }
      );
    }

    if (capabilities.requiresReferenceImage && !imageData) {
      return NextResponse.json(
        { error: 'Reference image is required for this model. Please upload a reference image.' },
        { status: 400 }
      );
    }

    const imageUrl = await generateWithOpenRouter(
      prompt,
      layout,
      model,
      imageData,
      layout === 'reference' ? referenceDimensions : undefined
    );

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error: Unable to connect to OpenRouter. Please check the API endpoint URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
