import { OgPreset } from './types';

const UNIVERSAL_SAFE_ZONE = {
  marginPx: 80,
  avoidBottomPercent: 20,
};

const SQUARE_SAFE_ZONE = {
  marginPx: 80,
  landscapeBand: { width: 1200, height: 630 },
};

export const OG_PRESETS: OgPreset[] = [
  {
    id: 'og-universal-landscape',
    platform: 'universal',
    label: 'Universal Open Graph',
    shortLabel: 'OG landscape',
    dimensions: '1200x630',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    generationLayout: 'landscape',
    maxFileSizeKb: 300,
    format: 'jpeg',
    quality: 85,
    safeZone: UNIVERSAL_SAFE_ZONE,
    guidance: 'Default link preview for Facebook, LinkedIn, Slack, Discord, and WhatsApp. Keep text in the center 80% and avoid the bottom 20%.',
    promptPrefix: 'Create an Open Graph link preview image at 1200x630, 1.91:1 aspect ratio. Design for social link previews across Facebook, LinkedIn, Slack, and WhatsApp. Keep all text and logos inside the center 80% safe zone with 80px margins. Use a minimum 64px headline, high contrast, bold shapes, and no fine detail that disappears after compression. Avoid placing text in the bottom 20% where platforms overlay the domain.',
    metaTagTarget: 'og:image',
    packageRole: 'derivative',
  },
  {
    id: 'og-twitter-large',
    platform: 'twitter',
    label: 'Twitter/X large card',
    shortLabel: 'X card',
    dimensions: '1200x600',
    width: 1200,
    height: 600,
    aspectRatio: '2:1',
    generationLayout: 'landscape',
    maxFileSizeKb: 500,
    format: 'jpeg',
    quality: 85,
    safeZone: { marginPx: 60 },
    guidance: '2:1 summary_large_image card for X/Twitter. Keep copy away from rounded corners.',
    promptPrefix: 'Create a Twitter/X summary_large_image preview at 1200x600, 2:1 aspect ratio. Use large readable typography, high contrast, and keep essential content away from the corners because X rounds card edges.',
    metaTagTarget: 'twitter:image',
    packageRole: 'derivative',
  },
  {
    id: 'og-imessage-square',
    platform: 'imessage',
    label: 'iMessage / Apple square',
    shortLabel: 'Apple square',
    dimensions: '1200x1200',
    width: 1200,
    height: 1200,
    aspectRatio: '1:1',
    generationLayout: 'square',
    maxFileSizeKb: 1000,
    format: 'jpeg',
    quality: 85,
    safeZone: SQUARE_SAFE_ZONE,
    guidance: 'Square preview that survives iOS square crops. Keep critical content inside a centered 1200x630 band.',
    promptPrefix: 'Create a 1200x1200 square Open Graph image for Apple iMessage and iOS link previews. Place all critical text, logos, and visuals inside a centered 1200x630 landscape band. Use high contrast and large typography readable on mobile.',
    metaTagTarget: 'og:image',
    packageRole: 'master',
  },
  {
    id: 'og-pinterest-pin',
    platform: 'pinterest',
    label: 'Pinterest pin',
    shortLabel: 'Pinterest',
    dimensions: '1000x1500',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
    generationLayout: 'portrait',
    maxFileSizeKb: 500,
    format: 'png',
    quality: 90,
    safeZone: { marginPx: 60 },
    guidance: 'Vertical 2:3 pin format for Pinterest-native sharing and Save URL flows.',
    promptPrefix: 'Create a Pinterest pin image at 1000x1500, 2:3 aspect ratio. Use a strong vertical hook, large headline at the top third, and avoid pure white or pure black backgrounds because Pinterest adds a tint overlay.',
    metaTagTarget: 'og:image',
    packageRole: 'derivative',
  },
  {
    id: 'og-whatsapp-optimized',
    platform: 'whatsapp',
    label: 'WhatsApp optimized',
    shortLabel: 'WhatsApp',
    dimensions: '1200x630',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    generationLayout: 'landscape',
    maxFileSizeKb: 300,
    format: 'jpeg',
    quality: 80,
    safeZone: UNIVERSAL_SAFE_ZONE,
    guidance: 'Aggressively compressed JPEG under 300 KB for WhatsApp link previews.',
    promptPrefix: 'Create a bold, high-contrast Open Graph image at 1200x630 for WhatsApp. Use large typography, simple shapes, no fine detail, and strong contrast that survives heavy JPEG compression.',
    metaTagTarget: 'og:image',
    packageRole: 'derivative',
  },
  {
    id: 'og-retina-landscape',
    platform: 'universal',
    label: 'Retina / Apple full-width',
    shortLabel: 'Retina OG',
    dimensions: '2400x1260',
    width: 2400,
    height: 1260,
    aspectRatio: '1.91:1',
    generationLayout: 'landscape',
    maxFileSizeKb: 1000,
    format: 'jpeg',
    quality: 85,
    safeZone: { marginPx: 160 },
    guidance: '2x retina master for Apple full-width previews and high-DPI displays.',
    promptPrefix: 'Create a retina Open Graph image at 2400x1260, 1.91:1. Keep the same visual hierarchy as a 1200x630 OG image but with proportionally larger typography and margins.',
    metaTagTarget: 'og:image',
    packageRole: 'derivative',
  },
];

export const OG_PACKAGE_PRESET_IDS = [
  'og-universal-landscape',
  'og-twitter-large',
  'og-imessage-square',
  'og-pinterest-pin',
  'og-whatsapp-optimized',
  'og-retina-landscape',
] as const;

export const OG_MASTER_PRESET_ID = 'og-imessage-square';

export function getOgPreset(id: string): OgPreset | undefined {
  return OG_PRESETS.find((preset) => preset.id === id);
}

export function getOgPackagePresets(): OgPreset[] {
  return OG_PACKAGE_PRESET_IDS
    .map((id) => getOgPreset(id))
    .filter((preset): preset is OgPreset => Boolean(preset));
}