import { OgPreset } from './types';

export function buildOgPrompt(userPrompt: string, preset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    preset.promptPrefix,
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}

export function buildOgPackageMasterPrompt(userPrompt: string, masterPreset: OgPreset): string {
  const trimmedPrompt = userPrompt.trim();

  return [
    masterPreset.promptPrefix,
    'This image is the master asset for a full social preview package. Keep all critical text inside a centered 1200x630 landscape band within the 1200x1200 canvas so it can be center-cropped for Facebook, X, LinkedIn, Slack, WhatsApp, Pinterest, and Apple previews.',
    trimmedPrompt ? `Page brief: ${trimmedPrompt}` : '',
    'Output must be polished enough for production website launch and social link previews.',
  ].filter(Boolean).join('\n\n');
}