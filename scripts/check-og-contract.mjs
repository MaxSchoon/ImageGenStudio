import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const creatorContent = await readFile(new URL('../lib/creatorContent.ts', import.meta.url), 'utf8');
const modelConfig = await readFile(new URL('../lib/modelConfig.ts', import.meta.url), 'utf8');
const ogPresets = await readFile(new URL('../lib/og/presets.ts', import.meta.url), 'utf8');
const ogMeta = await readFile(new URL('../lib/og/meta.ts', import.meta.url), 'utf8');
const ogChatRoute = await readFile(new URL('../app/api/og-chat/route.ts', import.meta.url), 'utf8');

assert.match(modelConfig, /DEFAULT_MODEL: Model = 'gpt-image-2'/, 'GPT Image 2 should be the default model');

assert.match(creatorContent, /website-og-package/, 'Creator presets should include website-og-package');
assert.match(creatorContent, /\.\.\.OG_PRESETS\.map/, 'Creator presets should import OG presets');

for (const phrase of [
  'og-universal-landscape',
  'og-twitter-large',
  'og-imessage-square',
  'og-pinterest-pin',
  'og-whatsapp-optimized',
  'og-retina-landscape',
]) {
  assert.match(ogPresets, new RegExp(phrase), `OG presets should include ${phrase}`);
}

assert.match(ogPresets, /width: 1200,\s*height: 630/, 'Universal OG preset should be 1200x630');
assert.match(ogPresets, /maxFileSizeKb: 300/, 'WhatsApp-safe file size guidance should exist');
assert.match(ogMeta, /twitter:card/, 'Meta builder should include twitter:card');
assert.match(ogMeta, /og:image:width/, 'Meta builder should include og:image:width');

for (const phrase of [
  'summary_large_image',
  'theme-color',
  'first 32 KB',
  '300 KB',
  '1200x630',
]) {
  assert.match(ogChatRoute, new RegExp(phrase, 'i'), `OG assistant rules should include: ${phrase}`);
}

console.log('Open Graph workflow contract passed.');