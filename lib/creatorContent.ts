import { Layout } from './modelConfig';

export type CreatorPlatform = 'linkedin';
export type CreatorWorkflow = 'banner' | 'post-image' | 'storybook' | 'enhance';

export interface CreatorPreset {
  id: string;
  platform: CreatorPlatform;
  workflow: CreatorWorkflow;
  label: string;
  shortLabel: string;
  dimensions: string;
  width: number;
  height: number;
  generationLayout: Layout;
  guidance: string;
  promptPrefix: string;
  safeArea?: {
    label: string;
    description: string;
  };
}

export const CREATOR_PRESETS: CreatorPreset[] = [
  {
    id: 'linkedin-profile-banner',
    platform: 'linkedin',
    workflow: 'banner',
    label: 'LinkedIn profile banner',
    shortLabel: 'Profile banner',
    dimensions: '1584x396',
    width: 1584,
    height: 396,
    generationLayout: 'landscape',
    guidance: '4:1 cover image. Keep headline, logo, face, and CTA away from the lower-left and center-left profile-photo overlap. Use the top-right and right-center as the safest message zone.',
    safeArea: {
      label: 'Mobile-safe banner',
      description: 'Reserve left/center-left space for LinkedIn profile-photo overlap and responsive crop. Put critical copy in the right half.',
    },
    promptPrefix: 'Create a LinkedIn personal profile cover image at 1584x396. Design for a 4:1 crop. Leave generous negative space in the lower-left and center-left for profile photo overlap on desktop and mobile. Put essential text, logo, and call-to-action in the right half, especially the top-right and right-center. Use premium B2B creator branding, crisp typography, and clean visual hierarchy.',
  },
  {
    id: 'linkedin-feed-landscape',
    platform: 'linkedin',
    workflow: 'post-image',
    label: 'LinkedIn post image',
    shortLabel: 'Post landscape',
    dimensions: '1200x628',
    width: 1200,
    height: 628,
    generationLayout: 'landscape',
    guidance: 'Recommended 1.91:1 feed image. Works well for link-style visuals, campaign launches, and thought-leadership posts on desktop and mobile.',
    promptPrefix: 'Create a LinkedIn feed post image at 1200x628, 1.91:1. Make it high-contrast, professional, readable in-feed, and optimized for B2B sales and marketing. Avoid tiny text and keep the core message centered.',
  },
  {
    id: 'linkedin-feed-square',
    platform: 'linkedin',
    workflow: 'post-image',
    label: 'LinkedIn square post',
    shortLabel: 'Post square',
    dimensions: '1200x1200',
    width: 1200,
    height: 1200,
    generationLayout: 'square',
    guidance: '1:1 feed image for balanced desktop/mobile visibility and reusable creator content.',
    promptPrefix: 'Create a LinkedIn square feed post image at 1200x1200. Use strong editorial composition, large readable text, and a clear visual hook for a B2B creator audience.',
  },
  {
    id: 'linkedin-feed-vertical',
    platform: 'linkedin',
    workflow: 'post-image',
    label: 'LinkedIn vertical post',
    shortLabel: 'Post vertical',
    dimensions: '720x900',
    width: 720,
    height: 900,
    generationLayout: 'mobile',
    guidance: '4:5 vertical creative for mobile-first LinkedIn feed images. Best for visual essays and attention-grabbing sales posts.',
    promptPrefix: 'Create a LinkedIn vertical feed image at 720x900, 4:5. Make it mobile-first, with a clear top hook, large readable typography, and no important details near the edges.',
  },
  {
    id: 'linkedin-storybook-page',
    platform: 'linkedin',
    workflow: 'storybook',
    label: 'LinkedIn PDF storybook page',
    shortLabel: 'PDF page',
    dimensions: '1080x1350',
    width: 1080,
    height: 1350,
    generationLayout: 'mobile',
    guidance: 'Use for each page in a 5-page LinkedIn document carousel/storybook. Export pages as a flattened PDF with consistent page size.',
    promptPrefix: 'Create one page for a premium LinkedIn PDF storybook at 1080x1350. Use a sales and marketing narrative, large editorial typography, a clear page headline, one visual idea, and enough whitespace for mobile reading. This page should fit a 5-page document carousel.',
  },
  {
    id: 'linkedin-image-enhance',
    platform: 'linkedin',
    workflow: 'enhance',
    label: 'Enhance uploaded image',
    shortLabel: 'Enhance',
    dimensions: '1200x1200',
    width: 1200,
    height: 1200,
    generationLayout: 'square',
    guidance: 'Upload a source image first. The prompt preserves subject identity while improving color, contrast, crop, sharpness, and premium social polish.',
    promptPrefix: 'Enhance the uploaded image for LinkedIn creator content. Preserve the subject, identity, product details, and composition intent. Improve exposure, contrast, color balance, skin tones if present, clarity, background cleanup, subtle sharpening, and premium editorial polish similar to a careful Lightroom pass. Do not make it look artificial.',
  },
];

export function getCreatorPreset(id: string): CreatorPreset | undefined {
  return CREATOR_PRESETS.find((preset) => preset.id === id);
}

export function buildCreatorPrompt(userPrompt: string, preset?: CreatorPreset | null): string {
  const trimmedPrompt = userPrompt.trim();
  if (!preset) return trimmedPrompt;

  return [
    preset.promptPrefix,
    trimmedPrompt ? `User brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for a creator studio managing executive, founder, or expert accounts.',
  ].filter(Boolean).join('\n\n');
}
