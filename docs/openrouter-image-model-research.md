# OpenRouter Image Model Research

Research date: June 2, 2026.

## Sources

- OpenRouter image generation docs: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
- OpenRouter multimodal overview: https://openrouter.ai/docs/guides/overview/multimodal/overview
- Live model discovery endpoint: https://openrouter.ai/api/v1/models?output_modalities=image

## API Shape

OpenRouter supports image generation through `/api/v1/chat/completions` with a `modalities` parameter:

- Text and image output models use `modalities: ["image", "text"]`.
- Image-only output models use `modalities: ["image"]`.
- Uploaded local files are sent as base64 data URLs in a message content part with `type: "image_url"`.
- Generated images are returned on `choices[0].message.images[*].image_url.url` as base64 data URLs.

The docs also support `image_config.aspect_ratio` and `image_config.image_size`. The app sends supported aspect ratios for the existing layout controls, maps arbitrary reference-image ratios to the nearest documented ratio, and adds explicit prompt instructions so exact creator presets can still be resized by the existing `/api/format` route.

## Selected Models

The app uses current OpenRouter image-output models that support text input, image input, and image output:

- `google/gemini-3.1-flash-image-preview` - default, fast current Gemini image generation and editing.
- `google/gemini-3-pro-image-preview` - higher-end Gemini reasoning for complex creative direction.
- `openai/gpt-5.4-image-2` - OpenAI high-end instruction following and text rendering.
- `bytedance-seed/seedream-4.5` - strong image editing consistency and subject preservation.
- `black-forest-labs/flux.2-pro` - high-end visual quality and prompt adherence.
- `recraft/recraft-v4.1-pro` - strong fit for brand, vector-like, and marketing design assets.
- `x-ai/grok-imagine-image-quality` - fast high-fidelity generation and editing.

## Verification

Local smoke tests passed with `OPENROUTER_API_KEY` from `.env.local`:

- Text-to-image through `google/gemini-3.1-flash-image-preview`.
- Reference-image generation through `google/gemini-3.1-flash-image-preview`.
- Image-only model generation through `black-forest-labs/flux.2-pro`.
