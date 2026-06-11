import { Layout } from '../modelConfig';

export type OgPlatform =
  | 'universal'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'discord'
  | 'slack'
  | 'whatsapp'
  | 'pinterest'
  | 'imessage';

export type OgMetaTagTarget = 'og:image' | 'twitter:image';

export interface OgSafeZone {
  marginPx: number;
  avoidBottomPercent?: number;
  landscapeBand?: { width: number; height: number };
}

export interface OgPreset {
  id: string;
  platform: OgPlatform;
  label: string;
  shortLabel: string;
  dimensions: string;
  width: number;
  height: number;
  aspectRatio: string;
  generationLayout: Layout;
  maxFileSizeKb: number;
  format: 'jpeg' | 'png';
  quality: number;
  safeZone: OgSafeZone;
  guidance: string;
  promptPrefix: string;
  metaTagTarget: OgMetaTagTarget;
  packageRole?: 'master' | 'derivative';
  exportFit?: 'cover' | 'contain';
}

export interface OgMetaImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  platform: OgPlatform;
  presetId: string;
}

export interface OgMetaInput {
  url: string;
  title: string;
  description: string;
  siteName: string;
  images: OgMetaImage[];
  twitterImage?: string;
  themeColor?: string;
}

export interface OgMetaTag {
  tag: 'meta';
  property?: string;
  name?: string;
  content: string;
}