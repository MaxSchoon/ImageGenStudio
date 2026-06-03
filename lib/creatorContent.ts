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
  negativePromptRules?: string[];
}

export interface StorybookPagePrompt {
  pageNumber: number;
  title: string;
  role: string;
  prompt: string;
}

const STORYBOOK_PAGE_PLAN = [
  {
    title: 'Hook',
    role: 'State one sharp claim or tension the audience recognizes.',
  },
  {
    title: 'Problem',
    role: 'Show the hidden cost, friction, or missed opportunity.',
  },
  {
    title: 'Insight',
    role: 'Explain the counterintuitive idea or useful mental model.',
  },
  {
    title: 'Proof',
    role: 'Show an example, data point, process, or before-and-after.',
  },
  {
    title: 'CTA',
    role: 'Invite one specific next step tied to the offer.',
  },
];

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
    guidance: '4:1 cover image. Keep headline, logo, face, and CTA away from the lower-left and center-left reserved overlay zone. Use the top-right and right-center as the safest message zone.',
    safeArea: {
      label: 'Empty overlay zone',
      description: 'Leave the left/center-left reserved area quiet and empty. LinkedIn will place the real profile photo there after upload, so do not generate a stand-in.',
    },
    promptPrefix: 'Create a LinkedIn personal profile cover image at 1584x396. Design for a 4:1 crop. Reserve the lower-left and center-left as a quiet empty overlay zone for LinkedIn UI on desktop and mobile. Keep that reserved zone as background, texture, color field, or whitespace only. Put essential text, logo, and call-to-action in the right half, especially the top-right and right-center. Use premium B2B creator branding, crisp typography, and clean visual hierarchy.',
    negativePromptRules: [
      'Do not generate a profile photo, avatar, headshot, portrait, face, silhouette, circular photo frame, placeholder badge, or person-shaped graphic in the reserved overlay zone.',
      'Do not fill the reserved overlay zone with a decorative object that reads as a substitute profile picture.',
      'If the brief asks for a person or face, place it outside the reserved overlay zone and keep the zone visually calm.',
    ],
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
    generationLayout: 'portrait',
    guidance: '4:5 vertical creative for mobile-first LinkedIn feed images. Best for visual essays and attention-grabbing sales posts.',
    promptPrefix: 'Create a LinkedIn vertical feed image at 720x900, 4:5. Make it mobile-first, with a clear top hook, large readable typography, and no important details near the edges.',
  },
  {
    id: 'linkedin-storybook-page',
    platform: 'linkedin',
    workflow: 'storybook',
    label: 'LinkedIn PDF storybook pages',
    shortLabel: 'PDF Pages',
    dimensions: '1080x1350',
    width: 1080,
    height: 1350,
    generationLayout: 'portrait',
    guidance: 'Generate a complete 5-page LinkedIn document carousel/storybook and export it as one flattened PDF. Every page stays 1080x1350 with mobile-readable copy.',
    promptPrefix: 'Create a complete premium LinkedIn PDF storybook as five coordinated 1080x1350 pages. Use a sales and marketing narrative, large editorial typography, one visual idea per page, and enough whitespace for mobile reading. Every page must fit a document carousel without cropped text.',
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
    ...(preset.negativePromptRules || []),
    trimmedPrompt ? `User brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for a creator studio managing executive, founder, or expert accounts.',
  ].filter(Boolean).join('\n\n');
}

export function buildStorybookPagePrompts(userPrompt: string, preset: CreatorPreset): StorybookPagePrompt[] {
  const trimmedPrompt = userPrompt.trim();
  const pageCount = STORYBOOK_PAGE_PLAN.length;

  return STORYBOOK_PAGE_PLAN.map((page, index) => {
    const pageNumber = index + 1;
    const prompt = [
      `Create page ${pageNumber} of ${pageCount} for a premium LinkedIn PDF storybook at ${preset.dimensions}.`,
      `Page role: ${page.title}. ${page.role}`,
      'This is one page in a five-page sequence: Hook, Problem, Insight, Proof, CTA.',
      'Use the same visual system, color palette, type scale, margin rhythm, and brand feel across all pages.',
      'Content fit contract: keep all text inside a 90px safe margin, use no more than one headline and two short supporting lines, avoid tiny text, avoid dense paragraphs, and leave enough whitespace that the page reads on mobile.',
      'Do not create a collage, grid, mockup, or contact sheet of multiple pages. Generate exactly one finished page image for this page number.',
      trimmedPrompt ? `User brief: ${trimmedPrompt}` : '',
      'Output must be polished enough for a creator studio managing executive, founder, or expert accounts.',
    ];

    return {
      pageNumber,
      title: page.title,
      role: page.role,
      prompt: prompt.filter(Boolean).join('\n\n'),
    };
  });
}
