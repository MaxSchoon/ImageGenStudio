'use client';

import { useMemo, useState } from 'react';

export interface StorybookPage {
  pageNumber: number;
  title: string;
  role: string;
  imageUrl: string;
}

interface StorybookPreviewProps {
  pages: StorybookPage[];
  dimensions: {
    width: number;
    height: number;
    label: string;
  };
  title?: string;
}

function makeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'linkedin-storybook';
}

function dataUriToBlobUrl(dataUri: string): string {
  const [header, base64Data] = dataUri.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export default function StorybookPreview({ pages, dimensions, title = 'LinkedIn storybook' }: StorybookPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const activePage = pages[activeIndex] || pages[0];
  const pdfTitle = useMemo(() => makeSlug(title), [title]);

  if (!activePage) return null;

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pdfTitle,
          width: dimensions.width,
          height: dimensions.height,
          pages: pages.map((page) => ({
            title: page.title,
            image: page.imageUrl,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to export PDF.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPage = () => {
    const url = dataUriToBlobUrl(activePage.imageUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pdfTitle}-page-${activePage.pageNumber}-${makeSlug(activePage.title)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full max-w-7xl flex-col gap-3 lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-studio-border bg-studio-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-studio-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-studio-text">PDF Pages</div>
            <div className="mt-0.5 text-xs text-studio-muted">
              Page {activePage.pageNumber} of {pages.length} · {activePage.title} · {dimensions.width}x{dimensions.height}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              disabled={activeIndex === 0}
              className="rounded-md border border-studio-border bg-studio-bg px-3 py-2 text-sm font-medium text-studio-text transition-colors hover:bg-studio-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((index) => Math.min(pages.length - 1, index + 1))}
              disabled={activeIndex === pages.length - 1}
              className="rounded-md border border-studio-border bg-studio-bg px-3 py-2 text-sm font-medium text-studio-text transition-colors hover:bg-studio-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              type="button"
              onClick={handleDownloadPage}
              className="rounded-md border border-studio-border bg-studio-bg px-3 py-2 text-sm font-medium text-studio-text transition-colors hover:bg-studio-elevated"
            >
              Download page
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="rounded-md bg-studio-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-studio-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {exportError && (
          <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {exportError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-studio-bg p-3">
          <img
            src={activePage.imageUrl}
            alt={`Storybook page ${activePage.pageNumber}: ${activePage.title}`}
            className="max-h-full max-w-full rounded-md object-contain shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
            style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
          />
        </div>
      </section>

      <aside className="flex max-h-44 gap-2 overflow-x-auto rounded-lg border border-studio-border bg-studio-surface p-3 lg:max-h-none lg:w-56 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        {pages.map((page, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              type="button"
              key={`${page.pageNumber}-${page.title}`}
              onClick={() => setActiveIndex(index)}
              className={`grid min-w-40 grid-cols-[48px_1fr] items-center gap-3 rounded-md border p-2 text-left transition-colors lg:min-w-0 ${
                isActive
                  ? 'border-studio-accent bg-studio-accent/10 text-studio-text'
                  : 'border-studio-border bg-studio-bg text-studio-muted hover:border-studio-muted hover:text-studio-text'
              }`}
            >
              <img
                src={page.imageUrl}
                alt=""
                className="h-14 w-11 rounded-sm object-cover"
              />
              <span>
                <span className="block text-xs font-semibold">{page.pageNumber}. {page.title}</span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-75">{page.role}</span>
              </span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
