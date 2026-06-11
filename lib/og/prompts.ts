import { OgPreset } from './types';

export const OG_TYPOGRAPHY_SAFETY_RULES = [
  'Typography and layout safety (mandatory):',
  '- The 1200x630 landscape frame is the final artboard. Every pixel of text and every graphic must fit completely inside it.',
  '- Keep every letter fully visible with clear padding from all four edges. No clipping, cropping, or hidden characters.',
  '- No text may touch, overlap, sit behind, or be clipped by outer frames, borders, glow rings, vignettes, or canvas edges.',
  '- Headlines go in the upper third of the artboard. Never anchor headlines to the bottom edge.',
  '- At 1200px width: minimum 80px left/right padding, 80px top padding, 60px bottom padding.',
  '- Scale headline font size down until the full headline fits on one or two lines inside the padded artboard.',
  '- Illustrations and diagrams must fit above the headline area or beside it, never pushing text off the bottom edge.',
  '- If using a decorative border or frame, all content sits inside the inner area only.',
].join('\n');

export const OG_LANDSCAPE_ARTBOARD_RULES = [
  'Landscape artboard composition (mandatory):',
  '- Compose as a finished 1200x630 landscape image, not a square poster cropped later.',
  '- Vertical layout order: headline at top, supporting visuals in the middle, optional footer badges above the bottom margin.',
  '- The bottom 60px and bottom 20% are margin zones — no headlines, labels, or important icons there.',
  '- Do not bleed content off any edge. The full composition must read correctly at exact 1200x630 dimensions.',
].join('\n');

export function buildOgPrompt(userPrompt: string, preset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    preset.promptPrefix,
    OG_TYPOGRAPHY_SAFETY_RULES,
    OG_LANDSCAPE_ARTBOARD_RULES,
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}

export function buildOgPackageMasterPrompt(userPrompt: string, masterPreset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    masterPreset.promptPrefix,
    'This is the master asset for a full social preview package. Generate it as a native 1200x630 landscape composition. Square and vertical variants are derived from this master, so all critical content must already fit inside the landscape frame.',
    OG_TYPOGRAPHY_SAFETY_RULES,
    OG_LANDSCAPE_ARTBOARD_RULES,
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}