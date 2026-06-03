import { readFile } from 'node:fs/promises';

const files = {
  chatRoute: await readFile(new URL('../app/api/chat/route.ts', import.meta.url), 'utf8'),
  transcribeRoute: await readFile(new URL('../app/api/transcribe/route.ts', import.meta.url), 'utf8'),
  appShell: await readFile(new URL('../components/AppShell.tsx', import.meta.url), 'utf8'),
  chatPanel: await readFile(new URL('../components/ChatPanel.tsx', import.meta.url), 'utf8'),
  page: await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8'),
};

function assertIncludes(file, needle, label) {
  if (!file.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

assertIncludes(files.page, '<AppShell />', 'app shell entry');
assertIncludes(files.appShell, "type Surface = 'studio' | 'chat'", 'studio/chat surface switch');
assertIncludes(files.appShell, 'Image Studio', 'status bar studio label');
assertIncludes(files.appShell, 'AI Chat', 'status bar chat label');

assertIncludes(files.chatRoute, "'openai/gpt-5.5'", 'GPT-5.5 chat model default');
assertIncludes(files.chatRoute, "reasoning_effort: 'medium'", 'OpenAI-style medium reasoning effort');
assertIncludes(files.chatRoute, "reasoning: { effort: 'medium'", 'OpenRouter reasoning object');
assertIncludes(files.chatRoute, "id: 'web'", 'OpenRouter web plugin');
assertIncludes(files.chatRoute, "engine: 'exa'", 'OpenRouter Exa engine selection');
assertIncludes(files.chatRoute, 'extractCitationSources', 'OpenRouter citation parsing');
assertIncludes(files.chatRoute, "name: 'generate_image'", 'image generation tool');
assertIncludes(files.chatRoute, 'generateWithOpenRouter(prompt, layout, model)', 'shared image generation helper');
assertIncludes(files.chatRoute, 'profile overlay zone quiet and empty', 'LinkedIn banner empty-zone guard');

if (files.chatRoute.includes('EXA_API_KEY') || files.chatRoute.includes('https://api.exa.ai/search')) {
  throw new Error('Agent chat should use OpenRouter web plugin search, not a direct Exa API key.');
}

assertIncludes(files.transcribeRoute, "'gpt-4o-mini-transcribe'", 'cheap recent transcription model default');
assertIncludes(files.transcribeRoute, 'https://api.openai.com/v1/audio/transcriptions', 'OpenAI transcription endpoint');
assertIncludes(files.transcribeRoute, '25 * 1024 * 1024', 'OpenAI upload size guard');

assertIncludes(files.chatPanel, "event.key === 'Enter' && !event.shiftKey", 'Enter send and Shift+Enter newline behavior');
assertIncludes(files.chatPanel, 'navigator.mediaDevices?.getUserMedia', 'microphone capture');
assertIncludes(files.chatPanel, "fetch('/api/transcribe'", 'speech-to-text client call');
assertIncludes(files.chatPanel, "fetch('/api/chat'", 'agent chat client call');
assertIncludes(files.chatPanel, 'ArtifactList', 'generated image display');
assertIncludes(files.chatPanel, 'SourceList', 'source display');

console.log('Agent chat contract passed.');
