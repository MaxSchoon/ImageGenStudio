// One-off asset generator: creates a few frames of a cute sci-fi droid mascot
// for the AI Chat loading/assistant animation. Frames are kept consistent by
// feeding the base frame back in as a reference image for each variation.
//
// The model is unreliable at emitting true alpha PNGs (it often bakes a fake
// checkerboard into an opaque JPEG), so instead we render the droid on a solid
// pure-black background and key the black out to real transparency with sharp.
// Any faint residual edge is near-black and disappears on the dark chat surface.
//
// Usage: node scripts/generate-robot-frames.mjs
// Requires OPENROUTER_API_KEY in .env.local. Writes PNGs to public/robot/.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const apiKey = env.match(/^OPENROUTER_API_KEY=(.+)$/m)?.[1].trim();
if (!apiKey) throw new Error('OPENROUTER_API_KEY not found in .env.local');

const MODEL = 'google/gemini-3.1-flash-image-preview';
const OUT_DIR = new URL('../public/robot/', import.meta.url);
const BLACK_BG = 'Solid pure black #000000 background filling the entire frame, no checkerboard, no transparency pattern.';

const BASE_PROMPT = [
  'A cute friendly retro sci-fi robot mascot, chibi proportions,',
  'rounded white dome-shaped head with a single large round glowing cyan lens eye,',
  'a short little antenna with a small orange tip, white body with soft indigo and',
  'orange panel accents, clean flat vector cartoon style with thin dark navy line art,',
  'smooth matte finish, gentle soft shading, centered, full body, facing forward,',
  'friendly curious expression, one little arm raised in a small wave.',
  BLACK_BG,
  'No white outline border, no sticker cutout, no halo, no ground shadow, no text.',
].join(' ');

// Small pose changes for an idle loop. Kept minimal so the character stays put.
const VARIATIONS = [
  `Keep this exact same robot character, identical design, colors, size and framing. Make only a tiny change: tilt the head very slightly to the left and dim the lens eye as if blinking. ${BLACK_BG} No white outline, no halo.`,
  `Keep this exact same robot character, identical design, colors, size and framing. Make only a tiny change: face forward with the lens eye glowing brightly and a tiny spark at the antenna tip. ${BLACK_BG} No white outline, no halo.`,
  `Keep this exact same robot character, identical design, colors, size and framing. Make only a tiny change: tilt the head very slightly to the right with a cheerful bright lens eye. ${BLACK_BG} No white outline, no halo.`,
];

function extractDataUrl(data) {
  const message = data?.choices?.[0]?.message;
  const fromImages = message?.images?.find((i) => i?.image_url?.url || i?.url);
  if (fromImages) return fromImages.image_url?.url || fromImages.url;
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part?.image_url?.url) return part.image_url.url;
    }
  }
  return null;
}

async function generateOnce(prompt, refDataUrl) {
  const content = refDataUrl
    ? [{ type: 'image_url', image_url: { url: refDataUrl } }, { type: 'text', text: prompt }]
    : prompt;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'ImageGenStudio',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '1:1', image_size: '1K' },
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = extractDataUrl(data);
  if (!url) return null; // content filter or no image — caller retries
  const match = url.match(/^data:(image\/\w+);base64,(.+)$/s);
  if (!match) return null;
  return { dataUrl: url, buffer: Buffer.from(match[2], 'base64') };
}

// The droid is white, so the background must be dark or keying would eat the
// robot. Sample the four corners and only accept frames rendered on black.
async function cornersAreDark(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const brightnessAt = (x, y) => {
    const i = (y * width + x) * channels;
    return Math.max(data[i], data[i + 1], data[i + 2]);
  };
  const corners = [
    brightnessAt(2, 2),
    brightnessAt(width - 3, 2),
    brightnessAt(2, height - 3),
    brightnessAt(width - 3, height - 3),
  ];
  return corners.every((m) => m <= 45);
}

async function generate(prompt, refDataUrl, attempts = 8) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await generateOnce(prompt, refDataUrl);
    if (result && (await cornersAreDark(result.buffer))) return result;
    console.log(`    retry ${attempt} (${result ? 'background not black' : 'no image / filtered'})`);
  }
  throw new Error('No black-background image after retries');
}

// Key the solid black background out to transparency with a soft alpha ramp on
// the brightest channel, then trim the transparent margin so the droid fills the frame.
async function keyOutBlack(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const ramp = max <= 28 ? 0 : max >= 78 ? 255 : Math.round(((max - 28) / 50) * 255);
    data[i + 3] = Math.min(data[i + 3], ramp);
  }
  return sharp(data, { raw: { width, height, channels } })
    .trim()
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(OUT_DIR, { recursive: true });

console.log('Generating base frame...');
const base = await generate(BASE_PROMPT);
await writeFile(new URL('frame-1.png', OUT_DIR), await keyOutBlack(base.buffer));
console.log('  frame-1.png');

let index = 2;
for (const variation of VARIATIONS) {
  console.log(`Generating frame ${index} (reference-guided)...`);
  const frame = await generate(variation, base.dataUrl);
  await writeFile(new URL(`frame-${index}.png`, OUT_DIR), await keyOutBlack(frame.buffer));
  console.log(`  frame-${index}.png`);
  index += 1;
}

console.log('Done. Frames written to public/robot/.');
