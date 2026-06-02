// Shared types for OpenRouter image models and layouts
export type Layout = 'landscape' | 'mobile' | 'square' | 'reference';
export type Model =
  | 'nano-banana-2'
  | 'nano-banana-pro'
  | 'gpt-image-2'
  | 'seedream-4-5'
  | 'flux-2-pro'
  | 'recraft-4-1-pro'
  | 'grok-imagine-quality';

export type OutputModality = 'image' | 'text';

// Layout configuration with dimensions
export interface LayoutConfig {
  value: Layout;
  label: string;
  dimensions: string;
  width: number;
  height: number;
  icon: string;
}

// Model capability configuration
export interface ModelCapabilities {
  supportsReferenceImages: boolean;
  supportsLayoutSelection: boolean;
  supportedLayouts: Layout[];
  requiresReferenceImage: boolean;
}

export interface ModelOption {
  value: Model;
  label: string;
  shortLabel: string;
  description: string;
  openRouterModel: string;
  outputModalities: OutputModality[];
  imageSize?: '0.5K' | '1K' | '2K' | '4K';
  supportsImageConfig: boolean;
}

export const DEFAULT_MODEL: Model = 'nano-banana-2';

// Current SOTA image models available through OpenRouter image output models.
export const OPENROUTER_IMAGE_MODELS: ModelOption[] = [
  {
    value: 'nano-banana-2',
    label: 'Nano Banana 2',
    shortLabel: 'Banana 2',
    description: 'Fast current-gen Gemini image generation and editing.',
    openRouterModel: 'google/gemini-3.1-flash-image-preview',
    outputModalities: ['image', 'text'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    shortLabel: 'Banana Pro',
    description: 'Premium Gemini reasoning for complex creative direction.',
    openRouterModel: 'google/gemini-3-pro-image-preview',
    outputModalities: ['image', 'text'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'gpt-image-2',
    label: 'GPT Image 2',
    shortLabel: 'GPT Image',
    description: 'OpenAI high-end instruction following and text rendering.',
    openRouterModel: 'openai/gpt-5.4-image-2',
    outputModalities: ['image', 'text'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'seedream-4-5',
    label: 'Seedream 4.5',
    shortLabel: 'Seedream',
    description: 'Strong image editing consistency and subject preservation.',
    openRouterModel: 'bytedance-seed/seedream-4.5',
    outputModalities: ['image'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'flux-2-pro',
    label: 'FLUX.2 Pro',
    shortLabel: 'FLUX.2',
    description: 'Frontier visual quality with reliable prompt adherence.',
    openRouterModel: 'black-forest-labs/flux.2-pro',
    outputModalities: ['image'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'recraft-4-1-pro',
    label: 'Recraft V4.1 Pro',
    shortLabel: 'Recraft',
    description: 'Aesthetic design work for brand and marketing assets.',
    openRouterModel: 'recraft/recraft-v4.1-pro',
    outputModalities: ['image'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
  {
    value: 'grok-imagine-quality',
    label: 'Grok Imagine Quality',
    shortLabel: 'Grok',
    description: 'Fast high-fidelity generation and editing from xAI.',
    openRouterModel: 'x-ai/grok-imagine-image-quality',
    outputModalities: ['image'],
    imageSize: '2K',
    supportsImageConfig: true,
  },
];

export const OPENROUTER_MODEL_BY_VALUE = OPENROUTER_IMAGE_MODELS.reduce(
  (acc, model) => {
    acc[model.value] = model;
    return acc;
  },
  {} as Record<Model, ModelOption>
);

// Central configuration for model capabilities.
export const MODEL_CAPABILITIES: Record<Model, ModelCapabilities> = OPENROUTER_IMAGE_MODELS.reduce(
  (acc, model) => {
    acc[model.value] = {
      supportsReferenceImages: true,
      supportsLayoutSelection: true,
      supportedLayouts: ['landscape', 'mobile', 'square', 'reference'],
      requiresReferenceImage: false,
    };
    return acc;
  },
  {} as Record<Model, ModelCapabilities>
);

// OpenRouter image_config aspect ratios.
export const OPENROUTER_ASPECT_RATIOS: Record<Layout, string> = {
  landscape: '16:9',
  mobile: '9:16',
  square: '1:1',
  reference: '1:1',
};

export const MODEL_LAYOUT_CONFIGS: Record<Model, LayoutConfig[]> = OPENROUTER_IMAGE_MODELS.reduce(
  (acc, model) => {
    acc[model.value] = [
      { value: 'landscape', label: 'Landscape', dimensions: '16:9', width: 1344, height: 768, icon: '▭' },
      { value: 'mobile', label: 'Mobile', dimensions: '9:16', width: 768, height: 1344, icon: '▯' },
      { value: 'square', label: 'Square', dimensions: '1:1', width: 1024, height: 1024, icon: '▢' },
      { value: 'reference', label: 'Reference', dimensions: 'Auto', width: 0, height: 0, icon: '📐' },
    ];
    return acc;
  },
  {} as Record<Model, LayoutConfig[]>
);

// Default layout configs (used as fallback)
export const LAYOUT_CONFIGS: LayoutConfig[] = MODEL_LAYOUT_CONFIGS[DEFAULT_MODEL];

// Get layout configuration by layout type for a specific model
export function getLayoutConfig(layout: Layout, model: Model = DEFAULT_MODEL): LayoutConfig {
  const modelConfigs = MODEL_LAYOUT_CONFIGS[model] || LAYOUT_CONFIGS;
  return modelConfigs.find(l => l.value === layout) || LAYOUT_CONFIGS[2];
}

// Get available layouts for a specific model
export function getLayoutsForModel(model: Model, hasReferenceImage: boolean): LayoutConfig[] {
  const capabilities = MODEL_CAPABILITIES[model] || MODEL_CAPABILITIES[DEFAULT_MODEL];
  const modelConfigs = MODEL_LAYOUT_CONFIGS[model] || LAYOUT_CONFIGS;

  return modelConfigs.filter(layout => {
    if (!capabilities.supportedLayouts.includes(layout.value)) {
      return false;
    }
    if (layout.value === 'reference' && !hasReferenceImage) {
      return false;
    }
    return true;
  });
}

// Get layout dimensions for a specific model, with support for reference dimensions
export function getLayoutDimensions(
  layout: Layout,
  referenceDimensions?: { width: number; height: number },
  model: Model = DEFAULT_MODEL
): { width: number; height: number } {
  if (layout === 'reference' && referenceDimensions) {
    return referenceDimensions;
  }
  const config = getLayoutConfig(layout, model);
  return { width: config.width, height: config.height };
}

export function isModel(value: unknown): value is Model {
  return typeof value === 'string' && value in OPENROUTER_MODEL_BY_VALUE;
}
