import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const creatorContent = await readFile(new URL('../lib/creatorContent.ts', import.meta.url), 'utf8');
const bannerPresetMatch = creatorContent.match(
  /id: 'linkedin-profile-banner',[\s\S]*?\n  },\n  {\n    id: 'linkedin-feed-landscape'/
);

assert.ok(bannerPresetMatch, 'LinkedIn profile banner preset should exist');

const bannerPresetSource = bannerPresetMatch[0];

for (const phrase of [
  'quiet empty overlay zone',
  'background, texture, color field, or whitespace only',
  'Do not generate a profile photo',
  'avatar',
  'headshot',
  'circular photo frame',
  'substitute profile picture',
]) {
  assert.match(bannerPresetSource, new RegExp(phrase, 'i'), `Banner preset should include: ${phrase}`);
}

assert.doesNotMatch(
  bannerPresetSource,
  /leave generous negative space .*profile photo overlap/i,
  'Banner prompt should not rely on generic profile-photo-overlap wording that can invite generated placeholders'
);

assert.match(
  bannerPresetSource,
  /do not generate a stand-in/i,
  'Safe-area UI copy should tell users the reserved space remains empty'
);

assert.match(
  creatorContent,
  /preset\.promptPrefix,\n\s+\.\.\.\(preset\.negativePromptRules \|\| \[\]\),/,
  'buildCreatorPrompt should include preset negativePromptRules in the final generation prompt'
);

const creatorChatRoute = await readFile(new URL('../app/api/creator-chat/route.ts', import.meta.url), 'utf8');

for (const phrase of [
  'reserved overlay zone',
  'zone must stay quiet and empty',
  'Never suggest a generated profile photo',
  'circular frame',
  'placeholder',
]) {
  assert.match(creatorChatRoute, new RegExp(phrase, 'i'), `Creator assistant rules should include: ${phrase}`);
}

console.log('LinkedIn banner prompt contract passed.');
