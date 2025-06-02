// src/api/types/hooks/website-theme.types.ts

export interface WebSiteThemeColors {
  primary: string;
  secondary?: string;
  background: string;
  text: string;
  accent?: string;
  border?: string;
  hover?: string;
  error?: string;
  success?: string;
  warning?: string;
}

export interface WebSiteTheme {
  _id: string;
  websiteId: string;
  themeName: string;
  colors: {
    light: WebSiteThemeColors;
    dark: WebSiteThemeColors;
  };
  fonts: {
    heading: {
      family: string;
      weight?: string;
      size?: string;
    };
    body: {
      family: string;
      weight?: string;
      size?: string;
    };
    accent?: {
      family: string;
      weight?: string;
      size?: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebSiteThemeDto {
  websiteId: string;
  themeName: string;
  colors: {
    light: WebSiteThemeColors;
    dark: WebSiteThemeColors;
  };
  fonts: {
    heading: {
      family: string;
      weight?: string;
      size?: string;
    };
    body: {
      family: string;
      weight?: string;
      size?: string;
    };
    accent?: {
      family: string;
      weight?: string;
      size?: string;
    };
  };
  isActive?: boolean;
}

export interface UpdateWebSiteThemeDto {
  themeName?: string;
  colors?: {
    light?: Partial<WebSiteThemeColors>;
    dark?: Partial<WebSiteThemeColors>;
  };
  fonts?: Partial<WebSiteTheme['fonts']>;
  isActive?: boolean;
}

export interface WebSiteThemeResponse {
  success: boolean;
  message: string;
  data: WebSiteTheme;
}

export interface WebSiteThemesResponse {
  success: boolean;
  message: string;
  data: WebSiteTheme[];
}

export interface PaginatedWebSiteThemesResponse {
  success: boolean;
  message: string;
  data: {
    themes: WebSiteTheme[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

// Color preset types for easy theme creation
export interface ColorPreset {
  name: string;
  colors: {
    light: WebSiteThemeColors;
    dark: WebSiteThemeColors;
  };
}

export interface FontPreset {
  name: string;
  fonts: WebSiteTheme['fonts'];
}

// Common color palettes with both light and dark modes
export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Corporate Blue',
    colors: {
      light: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        text: '#212529',
        accent: '#17a2b8',
        border: '#dee2e6',
        hover: '#0056b3',
        error: '#dc3545',
        success: '#28a745',
        warning: '#ffc107'
      },
      dark: {
        primary: '#4dabf7',
        secondary: '#868e96',
        background: '#121212',
        text: '#ffffff',
        accent: '#22b8cf',
        border: '#333333',
        hover: '#339af0',
        error: '#ff6b6b',
        success: '#51cf66',
        warning: '#ffd43b'
      }
    }
  },
  {
    name: 'Emerald Nature',
    colors: {
      light: {
        primary: '#10b981',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#111827',
        accent: '#f59e0b',
        border: '#e5e7eb',
        hover: '#059669',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
      },
      dark: {
        primary: '#34d399',
        secondary: '#9ca3af',
        background: '#0f172a',
        text: '#f8fafc',
        accent: '#fbbf24',
        border: '#374151',
        hover: '#10b981',
        error: '#f87171',
        success: '#34d399',
        warning: '#fbbf24'
      }
    }
  },
  {
    name: 'Purple Creative',
    colors: {
      light: {
        primary: '#8b5cf6',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#111827',
        accent: '#f59e0b',
        border: '#e5e7eb',
        hover: '#7c3aed',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
      },
      dark: {
        primary: '#a78bfa',
        secondary: '#9ca3af',
        background: '#0c0a0a',
        text: '#f3f4f6',
        accent: '#fbbf24',
        border: '#374151',
        hover: '#8b5cf6',
        error: '#f87171',
        success: '#34d399',
        warning: '#fbbf24'
      }
    }
  },
  {
    name: 'Rose Elegant',
    colors: {
      light: {
        primary: '#e11d48',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#0f172a',
        accent: '#06b6d4',
        border: '#e2e8f0',
        hover: '#be185d',
        error: '#ef4444',
        success: '#22c55e',
        warning: '#eab308'
      },
      dark: {
        primary: '#fb7185',
        secondary: '#94a3b8',
        background: '#0f0a0a',
        text: '#f1f5f9',
        accent: '#22d3ee',
        border: '#334155',
        hover: '#e11d48',
        error: '#f87171',
        success: '#4ade80',
        warning: '#facc15'
      }
    }
  }
];

// Common font combinations
export const FONT_PRESETS: FontPreset[] = [
  {
    name: 'Modern Sans',
    fonts: {
      heading: {
        family: 'Inter, sans-serif',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Inter, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Inter, sans-serif',
        weight: '600',
        size: '1.125rem'
      }
    }
  },
  {
    name: 'Classic Serif',
    fonts: {
      heading: {
        family: 'Playfair Display, serif',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Source Serif Pro, serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Playfair Display, serif',
        weight: '600',
        size: '1.125rem'
      }
    }
  },
  {
    name: 'Tech Stack',
    fonts: {
      heading: {
        family: 'Roboto, sans-serif',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Open Sans, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Roboto Mono, monospace',
        weight: '500',
        size: '1rem'
      }
    }
  },
  {
    name: 'Editorial',
    fonts: {
      heading: {
        family: 'Merriweather, serif',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Lato, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Merriweather, serif',
        weight: '600',
        size: '1.125rem'
      }
    }
  }
];

// Theme validation helpers
export const validateColors = (colors: Partial<WebSiteThemeColors>): boolean => {
  const required = ['primary', 'background', 'text'];
  return required.every(key => colors[key as keyof typeof colors]);
};

export const validateThemeColors = (colors: { light?: Partial<WebSiteThemeColors>; dark?: Partial<WebSiteThemeColors> }): boolean => {
  return !!(colors.light && validateColors(colors.light) && colors.dark && validateColors(colors.dark));
};

export const validateFonts = (fonts: Partial<WebSiteTheme['fonts']>): boolean => {
  return !!(fonts.heading?.family && fonts.body?.family);
};

// Theme utility functions
export const getContrastColor = (color: string): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 155 ? '#000000' : '#ffffff';
};

export const generateThemeCSS = (theme: WebSiteTheme, mode: 'light' | 'dark' = 'light'): string => {
  const colors = theme.colors[mode];
  return `
    :root {
      --primary-color: ${colors.primary};
      --secondary-color: ${colors.secondary || colors.primary};
      --background-color: ${colors.background};
      --text-color: ${colors.text};
      --accent-color: ${colors.accent || colors.primary};
      --border-color: ${colors.border || '#e5e7eb'};
      --hover-color: ${colors.hover || colors.primary};
      --error-color: ${colors.error || '#ef4444'};
      --success-color: ${colors.success || '#10b981'};
      --warning-color: ${colors.warning || '#f59e0b'};
      
      --heading-font: ${theme.fonts.heading.family};
      --heading-weight: ${theme.fonts.heading.weight || '700'};
      --heading-size: ${theme.fonts.heading.size || '2rem'};
      
      --body-font: ${theme.fonts.body.family};
      --body-weight: ${theme.fonts.body.weight || '400'};
      --body-size: ${theme.fonts.body.size || '1rem'};
      
      --accent-font: ${theme.fonts.accent?.family || theme.fonts.heading.family};
      --accent-weight: ${theme.fonts.accent?.weight || '600'};
      --accent-size: ${theme.fonts.accent?.size || '1.125rem'};
    }
  `;
};

export const COLOR_LABELS = {
  primary: {
    label: "Main Brand Color",
    description: "Your primary brand color used for buttons and highlights",
    icon: "🎨"
  },
  secondary: {
    label: "Secondary Color", 
    description: "Supporting color that complements your main brand",
    icon: "✨"
  },
  background: {
    label: "Background Color",
    description: "The main background color of your website",
    icon: "📄"
  },
  text: {
    label: "Text Color",
    description: "Color for regular text content",
    icon: "📝"
  },
  accent: {
    label: "Highlight Color",
    description: "Color for special highlights and call-to-actions",
    icon: "⭐"
  },
  border: {
    label: "Border Color",
    description: "Color for lines and borders around elements",
    icon: "🔲"
  },
  hover: {
    label: "Hover Effect Color",
    description: "Color that appears when hovering over buttons",
    icon: "👆"
  },
  error: {
    label: "Error/Warning Color",
    description: "Color for error messages and warnings",
    icon: "⚠️"
  },
  success: {
    label: "Success Color",
    description: "Color for success messages and confirmations",
    icon: "✅"
  },
  warning: {
    label: "Alert Color",
    description: "Color for important notices and alerts",
    icon: "🚨"
  }
};

// User-friendly font type mapping
export const FONT_TYPE_LABELS = {
  heading: {
    label: "Headings & Titles",
    description: "Font used for page titles and section headings",
    icon: "📰"
  },
  body: {
    label: "Body Text",
    description: "Font used for paragraphs and regular content",
    icon: "📖"
  },
  accent: {
    label: "Special Text",
    description: "Font used for quotes, captions, and special elements",
    icon: "💬"
  }
};

// Font property labels
export const FONT_PROPERTY_LABELS = {
  family: "Font Style",
  weight: "Font Thickness", 
  size: "Font Size"
};

// Color mode labels
export const COLOR_MODE_LABELS = {
  light: {
    label: "Light Mode",
    description: "Colors for light theme (default daytime appearance)",
    icon: "☀️"
  },
  dark: {
    label: "Dark Mode", 
    description: "Colors for dark theme (nighttime/low-light appearance)",
    icon: "🌙"
  }
};