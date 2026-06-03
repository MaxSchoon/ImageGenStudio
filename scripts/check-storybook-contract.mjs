import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const creatorContent = await readFile(new URL('../lib/creatorContent.ts', import.meta.url), 'utf8');
const imageStudio = await readFile(new URL('../components/ImageStudio.tsx', import.meta.url), 'utf8');
const storybookPreview = await readFile(new URL('../components/StorybookPreview.tsx', import.meta.url), 'utf8');
const loadingOverlay = await readFile(new URL('../components/LoadingOverlay.tsx', import.meta.url), 'utf8');
const modelConfig = await readFile(new URL('../lib/modelConfig.ts', import.meta.url), 'utf8');
const exportPdfRoute = await readFile(new URL('../app/api/export-pdf/route.ts', import.meta.url), 'utf8');

const storybookPresetMatch = creatorContent.match(
  /id: 'linkedin-storybook-page',[\s\S]*?\n  },\n  {\n    id: 'linkedin-image-enhance'/
);

assert.ok(storybookPresetMatch, 'LinkedIn storybook preset should exist');

const storybookPreset = storybookPresetMatch[0];

for (const phrase of [
  'LinkedIn PDF storybook pages',
  'PDF Pages',
  'Generate a complete 5-page LinkedIn document carousel/storybook',
  'Every page must fit a document carousel without cropped text',
  "generationLayout: 'portrait'",
]) {
  assert.match(storybookPreset, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `Storybook preset should include: ${phrase}`);
}

for (const phrase of [
  'STORYBOOK_PAGE_PLAN',
  'Hook',
  'Problem',
  'Insight',
  'Proof',
  'CTA',
  'keep all text inside a 90px safe margin',
  'Do not create a collage, grid, mockup, or contact sheet of multiple pages',
]) {
  assert.match(creatorContent, new RegExp(phrase, 'i'), `Storybook prompt contract should include: ${phrase}`);
}

assert.match(
  imageStudio,
  /for \(const pagePrompt of pagePrompts\)/,
  'ImageStudio should generate every storybook page prompt, not one image'
);
assert.match(imageStudio, /setStorybookPages\(generatedPages\)/, 'ImageStudio should store completed storybook pages');
assert.match(storybookPreview, /Export PDF/, 'Storybook preview should expose PDF export');
assert.match(storybookPreview, /Page \{activePage\.pageNumber\} of \{pages\.length\}/, 'Storybook preview should support page navigation');
assert.match(loadingOverlay, /Building PDF Pages/, 'Loading overlay should use plural PDF Pages copy');
assert.match(modelConfig, /portrait: '4:5'/, 'Model config should include 4:5 portrait generation');
assert.match(exportPdfRoute, /PDFDocument\.create/, 'PDF export route should create a real PDF');
assert.match(exportPdfRoute, /pdf\.addPage\(\[width, height\]\)/, 'PDF export should preserve requested page dimensions');

console.log('LinkedIn storybook contract passed.');
