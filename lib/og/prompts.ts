import { OgPreset } from './types';

export const OG_TYPOGRAPHY_SAFETY_RULES = [
  'Typography and layout safety (mandatory):',
  '- Keep every letter of every headline, subheadline, logo, and label fully visible with clear padding from all four canvas edges.',
  '- No text may touch, overlap, sit behind, or be clipped by outer frames, borders, glow rings, vignettes, or decorative edges.',
  '- Headlines must be sized to fit comfortably inside the safe zone. Never span edge-to-edge. At 1200px width, leave at least 100px padding from the top edge and 80px from the left and right edges.',
  '- If the design uses an outer border or frame, all text must sit inside the inner content area, never on the frame itself.',
  '- Scale headline font size down until the full headline fits on one or two lines within the safe zone without clipping.',
  '- Subheadlines and badges sit below the headline with additional margin, never crowding the top edge.',
].join('\n');

export function buildOgPrompt(userPrompt: string, preset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    preset.promptPrefix,
    OG_TYPOGRAPHY_SAFETY_RULES,
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}

export function buildOgPackageMasterPrompt(userPrompt: string, masterPreset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    masterPreset.promptPrefix,
    'This image is the master asset for a full social preview package. Keep all critical text inside a centered 1200x630 landscape band within the 1200x1200 canvas so it can be center-cropped for Facebook, X, LinkedIn, Slack, WhatsApp, Pinterest, and Apple previews.',
    OG_TYPOGRAPHY_SAFETY_RULES,
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}