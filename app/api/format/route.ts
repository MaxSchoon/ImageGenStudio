import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_OUTPUT_DIMENSION = 7680;
const MAX_OUTPUT_PIXELS = 60_000_000;

function parseImageData(dataUri: string): Buffer {
  const match = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!match?.[1]) {
    throw new Error('Image data must be a base64 data URI.');
  }
  return Buffer.from(match[1], 'base64');
}

async function compressToMaxSize(
  pipeline: sharp.Sharp,
  format: 'jpeg' | 'png',
  quality: number,
  maxFileSizeKb?: number,
): Promise<Buffer> {
  if (!maxFileSizeKb) {
    return format === 'jpeg'
      ? pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
      : pipeline.png({ compressionLevel: 9 }).toBuffer();
  }

  const maxBytes = maxFileSizeKb * 1024;
  let workingPipeline = pipeline;
  let currentQuality = quality;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const buffer = format === 'jpeg'
      ? await workingPipeline.jpeg({ quality: currentQuality, mozjpeg: true }).toBuffer()
      : await workingPipeline.png({ compressionLevel: 9 }).toBuffer();

    if (buffer.length <= maxBytes) {
      return buffer;
    }

    if (format === 'jpeg' && currentQuality > 45) {
      currentQuality -= 5;
      workingPipeline = sharp(buffer);
      continue;
    }

    const metadata = await sharp(buffer).metadata();
    const nextWidth = Math.max(320, Math.floor((metadata.width || 1) * 0.85));
    const nextHeight = Math.max(320, Math.floor((metadata.height || 1) * 0.85));
    workingPipeline = sharp(buffer).resize(nextWidth, nextHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  throw new Error(`Unable to compress image below ${maxFileSizeKb} KB. Try simplifying the visual or lowering detail.`);
}

export async function POST(request: NextRequest) {
  try {
    const {
      image,
      width,
      height,
      format = 'png',
      quality = 92,
      maxFileSizeKb,
    } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return NextResponse.json({ error: 'Valid width and height are required' }, { status: 400 });
    }

    if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION || width * height > MAX_OUTPUT_PIXELS) {
      return NextResponse.json({ error: 'Requested output size is too large.' }, { status: 400 });
    }

    const outputFormat = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'png';
    const pipeline = sharp(parseImageData(image))
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false,
      })
      .sharpen({ sigma: 0.6 });

    const buffer = await compressToMaxSize(pipeline, outputFormat, quality, maxFileSizeKb);

    return NextResponse.json({
      image: `data:image/${outputFormat};base64,${buffer.toString('base64')}`,
      width,
      height,
      format: outputFormat,
    });
  } catch (error) {
    console.error('Error formatting image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to format image' },
      { status: 500 }
    );
  }
}
