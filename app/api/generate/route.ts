import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_MODEL,
  Layout,
  Model,
  MODEL_CAPABILITIES,
  OPENROUTER_ASPECT_RATIOS,
  OPENROUTER_MODEL_BY_VALUE,
  getLayoutDimensions,
  isModel,
} from '@/lib/modelConfig';

type ReferenceDimensions = { width: number; height: number };

type OpenRouterImage = {
  image_url?: { url?: string };
  imageUrl?: { url?: string };
  url?: string;
  b64_json?: string;
};

const STANDARD_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GEMINI_EXTENDED_ASPECT_RATIOS = ['1:4', '4:1', '1:8', '8:1'];

function getAspectRatio(layout: Layout, referenceDimensions?: ReferenceDimensions, model?: Model): string {
  if (layout !== 'reference' || !referenceDimensions) {
    return OPENROUTER_ASPECT_RATIOS[layout];
  }

  const supportedRatios = model === 'nano-banana-2'
    ? [...STANDARD_ASPECT_RATIOS, ...GEMINI_EXTENDED_ASPECT_RATIOS]
    : STANDARD_ASPECT_RATIOS;
  const referenceRatio = referenceDimensions.width / referenceDimensions.height;

  return supportedRatios.reduce((closest, ratio) => {
    const [width, height] = ratio.split(':').map(Number);
    const candidateDistance = Math.abs(referenceRatio - width / height);
    const [closestWidth, closestHeight] = closest.split(':').map(Number);
    const closestDistance = Math.abs(referenceRatio - closestWidth / closestHeight);
    return candidateDistance < closestDistance ? ratio : closest;
  }, supportedRatios[0]);
}

function buildPrompt(prompt: string, layout: Layout, model: Model, referenceDimensions?: ReferenceDimensions): string {
  const { width, height } = getLayoutDimensions(layout, referenceDimensions, model);
  const aspectRatio = getAspectRatio(layout, referenceDimensions, model);
  const dimensionInstruction = layout === 'reference' && referenceDimensions
    ? `Match the reference image aspect ratio (${referenceDimensions.width}x${referenceDimensions.height}, ${aspectRatio}).`
    : `Use a ${aspectRatio} composition suitable for ${width}x${height} export.`;

  return [
    'Generate exactly one production-quality image.',
    dimensionInstruction,
    'Make the result polished enough for creator, social media, and marketing use.',
    'Preserve uploaded subject identity, product details, and brand-critical elements when a reference image is provided.',
    prompt,
  ].join(' ');
}

function extractUrlFromImage(image: OpenRouterImage): string | null {
  if (image.image_url?.url) return image.image_url.url;
  if (image.imageUrl?.url) return image.imageUrl.url;
  if (image.url) return image.url;
  if (image.b64_json) return `data:image/png;base64,${image.b64_json}`;
  return null;
}

function extractImageUrl(data: any): string | null {
  const message = data?.choices?.[0]?.message;
  const image = message?.images?.find((item: OpenRouterImage) => !!extractUrlFromImage(item));
  if (image) return extractUrlFromImage(image);

  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      const url = extractUrlFromImage(part);
      if (url) return url;
    }
  }

  if (Array.isArray(data?.images)) {
    for (const item of data.images) {
      if (typeof item === 'string') return item;
      const url = extractUrlFromImage(item);
      if (url) return url;
    }
  }

  if (Array.isArray(data?.data)) {
    for (const item of data.data) {
      const url = extractUrlFromImage(item);
      if (url) return url;
    }
  }

  return null;
}

async function generateWithOpenRouter(
  prompt: string,
  layout: Layout,
  model: Model,
  imageData?: string,
  referenceDimensions?: ReferenceDimensions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const modelConfig = OPENROUTER_MODEL_BY_VALUE[model];
  const finalPrompt = buildPrompt(prompt, layout, model, referenceDimensions);
  const aspectRatio = getAspectRatio(layout, referenceDimensions, model);

  const content = imageData
    ? [
        { type: 'image_url', image_url: { url: imageData } },
        { type: 'text', text: finalPrompt },
      ]
    : finalPrompt;

  const requestBody: Record<string, unknown> = {
    model: modelConfig.openRouterModel,
    messages: [{ role: 'user', content }],
    modalities: modelConfig.outputModalities,
    stream: false,
  };

  if (modelConfig.supportsImageConfig) {
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
      image_size: modelConfig.imageSize || '2K',
    };
  }

  if (modelConfig.outputModalities.includes('text')) {
    requestBody.max_tokens = 800;
  }

  console.log('Calling OpenRouter image generation API:', {
    model: modelConfig.openRouterModel,
    selectedModel: model,
    layout,
    aspectRatio,
    hasReferenceImage: !!imageData,
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    } catch {
      // Keep text as is.
    }
    throw new Error(`OpenRouter API error (${response.status}) for ${modelConfig.openRouterModel}: ${errorMessage || response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenRouter API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const imageUrl = extractImageUrl(data);
  if (!imageUrl) {
    console.error('No image data found in OpenRouter response:', JSON.stringify(data, null, 2));
    throw new Error(`OpenRouter returned no image data for ${modelConfig.openRouterModel}. Verify the model supports image output and modalities are enabled.`);
  }

  const isValidUrl = imageUrl.startsWith('data:image') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  if (!isValidUrl) {
    throw new Error(`Invalid image URL returned from OpenRouter: ${imageUrl.substring(0, 100)}...`);
  }

  return imageUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, layout, model = DEFAULT_MODEL, imageData, referenceDimensions } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!layout || !['landscape', 'mobile', 'square', 'reference'].includes(layout)) {
      return NextResponse.json(
        { error: 'Valid layout is required (landscape, mobile, square, or reference)' },
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
