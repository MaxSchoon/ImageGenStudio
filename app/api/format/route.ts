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

export async function POST(request: NextRequest) {
  try {
    const { image, width, height, format = 'png' } = await request.json();

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

    const buffer = outputFormat === 'jpeg'
      ? await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      : await pipeline.png({ compressionLevel: 9 }).toBuffer();

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
