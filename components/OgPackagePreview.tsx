'use client';

import { useMemo, useState } from 'react';
import { renderOgMetaHtml } from '@/lib/og/meta';
import { OgPlatform } from '@/lib/og/types';

export interface OgPackageAsset {
  presetId: string;
  label: string;
  shortLabel: string;
  platform: OgPlatform;
  dimensions: string;
  width: number;
  height: number;
  imageUrl: string;
  filename: string;
}

interface OgPackagePreviewProps {
  assets: OgPackageAsset[];
  metaInput: {
    url: string;
    title: string;
    description: string;
    siteName: string;
    themeColor?: string;
  };
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

export default function OgPackagePreview({ assets, metaInput }: OgPackagePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const activeAsset = assets[activeIndex] || assets[0];

  const metaHtml = useMemo(() => renderOgMetaHtml({
    ...metaInput,
    images: assets.map((asset) => ({
      url: `https://your-domain.com/og/${asset.filename}`,
      width: asset.width,
      height: asset.height,
      alt: metaInput.title,
      platform: asset.platform,
      presetId: asset.presetId,
    })),
    twitterImage: assets.find((asset) => asset.presetId === 'og-twitter-large')
      ? `https://your-domain.com/og/${assets.find((asset) => asset.presetId === 'og-twitter-large')!.filename}`
      : undefined,
  }), [assets, metaInput]);

  if (!activeAsset) return null;

  const handleCopyMeta = async () => {
    await navigator.clipboard.writeText(metaHtml);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (asset: OgPackageAsset) => {
    const blobUrl = dataUriToBlobUrl(asset.imageUrl);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = asset.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="flex h-full w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-studio-text">Social preview package</h2>
          <p className="mt-1 text-xs text-studio-muted">
            {assets.length} platform exports with matching Open Graph and Twitter meta tags.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyMeta}
          className="rounded-lg border border-studio-border bg-studio-surface px-4 py-2 text-sm font-medium text-studio-text transition-colors hover:bg-studio-elevated"
        >
          {copied ? 'Meta tags copied' : 'Copy meta tags'}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2 overflow-y-auto studio-scrollbar pr-1">
          {assets.map((asset, index) => (
            <button
              key={asset.presetId}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                activeIndex === index
                  ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
                  : 'border-studio-border bg-studio-surface text-studio-muted hover:border-studio-muted hover:text-studio-text'
              }`}
            >
              <div className="text-xs font-semibold text-current">{asset.shortLabel}</div>
              <div className="mt-0.5 text-[10px] opacity-75">{asset.dimensions}</div>
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative flex flex-1 items-center justify-center rounded-xl border border-studio-border bg-studio-surface p-4">
            <div className="absolute left-4 top-4 rounded-full border border-studio-border bg-studio-bg/90 px-3 py-1 text-xs font-medium text-studio-text">
              {activeAsset.shortLabel} · {activeAsset.dimensions}
            </div>
            <img
              src={activeAsset.imageUrl}
              alt={activeAsset.label}
              className="max-h-[55vh] max-w-full rounded-lg object-contain"
            />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              <button
                type="button"
                onClick={() => handleDownload(activeAsset)}
                className="rounded-lg border border-studio-border bg-studio-bg/90 px-4 py-2 text-sm font-medium text-studio-text backdrop-blur-sm transition-colors hover:bg-studio-elevated"
              >
                Download {activeAsset.filename}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-studio-border bg-studio-surface p-4">
            <div className="mb-2 text-sm font-semibold text-studio-text">Embed meta tags</div>
            <p className="mb-3 text-xs leading-relaxed text-studio-muted">
              Place these tags in the first 32 KB of your page head. Replace `your-domain.com` with your production CDN or site URL.
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg border border-studio-border bg-studio-bg p-3 text-[11px] leading-relaxed text-studio-muted">
              {metaHtml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}