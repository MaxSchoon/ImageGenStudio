// Shared types for image generation models and layouts
export type Layout = 'landscape' | 'mobile' | 'square' | 'reference';
export type Model = 'google' | 'grok' | 'huggingface' | 'qwen';

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

// Central configuration for model capabilities
export const MODEL_CAPABILITIES: Record<Model, ModelCapabilities> = {
  google: {
    supportsReferenceImages: true,
    supportsLayoutSelection: true,
    supportedLayouts: ['landscape', 'mobile', 'square'],
    requiresReferenceImage: false,
  },
  grok: {
    supportsReferenceImages: false,
    supportsLayoutSelection: true,
    supportedLayouts: ['landscape', 'mobile', 'square'],
    requiresReferenceImage: false,
  },
  huggingface: {
    supportsReferenceImages: true,
    supportsLayoutSelection: true,
    supportedLayouts: ['landscape', 'mobile', 'square', 'reference'],
    requiresReferenceImage: false,
  },
  qwen: {
    supportsReferenceImages: true,
    supportsLayoutSelection: false,
    supportedLayouts: ['reference'],
    requiresReferenceImage: true,
  },
};

// Model-specific layout configurations with dimensions
// Each model has different supported dimensions based on their API specifications
export const MODEL_LAYOUT_CONFIGS: Record<Model, LayoutConfig[]> = {
  // Google: Uses 2K resolution (~2048px) with aspect ratios
  google: [
    { value: 'landscape', label: 'Landscape', dimensions: '2048x1152', width: 2048, height: 1152, icon: '▭' },
    { value: 'mobile', label: 'Mobile', dimensions: '1152x2048', width: 1152, height: 2048, icon: '▯' },
    { value: 'square', label: 'Square', dimensions: '2048x2048', width: 2048, height: 2048, icon: '▢' },
  ],
  // Grok: Uses fixed dimensions
  grok: [
    { value: 'landscape', label: 'Landscape', dimensions: '1024x576', width: 1024, height: 576, icon: '▭' },
    { value: 'mobile', label: 'Mobile', dimensions: '576x1024', width: 576, height: 1024, icon: '▯' },
    { value: 'square', label: 'Square', dimensions: '1024x1024', width: 1024, height: 1024, icon: '▢' },
  ],
  // Flux (HuggingFace): Supports HD dimensions
  huggingface: [
    { value: 'landscape', label: 'Landscape', dimensions: '1920x1080', width: 1920, height: 1080, icon: '▭' },
    { value: 'mobile', label: 'Mobile', dimensions: '1080x1920', width: 1080, height: 1920, icon: '▯' },
    { value: 'square', label: 'Square', dimensions: '1024x1024', width: 1024, height: 1024, icon: '▢' },
    { value: 'reference', label: 'Reference', dimensions: 'Auto', width: 0, height: 0, icon: '📐' },
  ],
  // Qwen: Only reference layout, dimensions match input image
  qwen: [
    { value: 'reference', label: 'Reference', dimensions: 'Auto', width: 0, height: 0, icon: '📐' },
  ],
};

// Default layout configs (used as fallback)
export const LAYOUT_CONFIGS: LayoutConfig[] = [
  { value: 'landscape', label: 'Landscape', dimensions: '1920x1080', width: 1920, height: 1080, icon: '▭' },
  { value: 'mobile', label: 'Mobile', dimensions: '1080x1920', width: 1080, height: 1920, icon: '▯' },
  { value: 'square', label: 'Square', dimensions: '1024x1024', width: 1024, height: 1024, icon: '▢' },
  { value: 'reference', label: 'Reference', dimensions: 'Auto', width: 0, height: 0, icon: '📐' },
];

// Google-specific: Maps layouts to aspect ratio strings for the API
export const GOOGLE_ASPECT_RATIOS: Record<Layout, string> = {
  landscape: '16:9',
  mobile: '9:16',
  square: '1:1',
  reference: '1:1', // Fallback, not used
};

// Get layout configuration by layout type for a specific model
export function getLayoutConfig(layout: Layout, model?: Model): LayoutConfig {
  if (model) {
    const modelConfigs = MODEL_LAYOUT_CONFIGS[model];
    const config = modelConfigs.find(l => l.value === layout);
    if (config) return config;
  }
  return LAYOUT_CONFIGS.find(l => l.value === layout) || LAYOUT_CONFIGS[2]; // Default to square
}

// Get available layouts for a specific model
export function getLayoutsForModel(model: Model, hasReferenceImage: boolean): LayoutConfig[] {
  const capabilities = MODEL_CAPABILITIES[model];
  const modelConfigs = MODEL_LAYOUT_CONFIGS[model];

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
  model?: Model
): { width: number; height: number } {
  if (layout === 'reference' && referenceDimensions) {
    return referenceDimensions;
  }
  const config = getLayoutConfig(layout, model);
  return { width: config.width, height: config.height };
}
