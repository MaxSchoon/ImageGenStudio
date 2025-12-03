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

// Layout definitions with dimensions (HD-level for most models)
// Note: Google uses aspect ratios with 2K resolution (~2048px), other models use explicit dimensions
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

// Get layout configuration by layout type
export function getLayoutConfig(layout: Layout): LayoutConfig {
  return LAYOUT_CONFIGS.find(l => l.value === layout) || LAYOUT_CONFIGS[2]; // Default to square
}

// Get available layouts for a specific model
export function getLayoutsForModel(model: Model, hasReferenceImage: boolean): LayoutConfig[] {
  const capabilities = MODEL_CAPABILITIES[model];

  return LAYOUT_CONFIGS.filter(layout => {
    if (!capabilities.supportedLayouts.includes(layout.value)) {
      return false;
    }
    if (layout.value === 'reference' && !hasReferenceImage) {
      return false;
    }
    return true;
  });
}

// Get layout dimensions, with support for reference dimensions
export function getLayoutDimensions(
  layout: Layout,
  referenceDimensions?: { width: number; height: number }
): { width: number; height: number } {
  if (layout === 'reference' && referenceDimensions) {
    return referenceDimensions;
  }
  const config = getLayoutConfig(layout);
  return { width: config.width, height: config.height };
}
