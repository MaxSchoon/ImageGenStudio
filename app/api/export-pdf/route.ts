import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'nodejs';

const MAX_PAGES = 20;
const MAX_DIMENSION = 4096;

interface PdfPageInput {
  image: string;
  title?: string;
}

function parseImageData(dataUri: string): { mimeType: string; bytes: Uint8Array } {
  const match = dataUri.match(/^data:(image\/png|image\/jpe?g);base64,(.+)$/);
  if (!match?.[1] || !match[2]) {
    throw new Error('Each PDF page image must be a PNG or JPEG base64 data URI.');
  }

  return {
    mimeType: match[1],
    bytes: Uint8Array.from(Buffer.from(match[2], 'base64')),
  };
}

function sanitizeFilename(value: unknown): string {
  if (typeof value !== 'string') return 'linkedin-storybook';
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'linkedin-storybook';
}

export async function POST(request: NextRequest) {
  try {
    const { pages, width, height, title } = await request.json();

    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'At least one page image is required.' }, { status: 400 });
    }

    if (pages.length > MAX_PAGES) {
      return NextResponse.json({ error: `PDF export supports up to ${MAX_PAGES} pages.` }, { status: 400 });
    }

    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return NextResponse.json({ error: 'Valid PDF width and height are required.' }, { status: 400 });
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return NextResponse.json({ error: 'Requested PDF dimensions are too large.' }, { status: 400 });
    }

    const pdf = await PDFDocument.create();
    pdf.setTitle(typeof title === 'string' ? title : 'LinkedIn storybook');

    for (const pageInput of pages as PdfPageInput[]) {
      if (!pageInput?.image || typeof pageInput.image !== 'string') {
        return NextResponse.json({ error: 'Every PDF page must include an image.' }, { status: 400 });
      }

      const { mimeType, bytes } = parseImageData(pageInput.image);
      const embeddedImage = mimeType === 'image/png'
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
      const page = pdf.addPage([width, height]);

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const pdfBytes = await pdf.save();
    const filename = `${sanitizeFilename(title)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export PDF.' },
      { status: 500 }
    );
  }
}
