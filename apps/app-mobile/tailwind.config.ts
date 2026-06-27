import type { Config } from 'tailwindcss';

// NativeWind exposes the Tailwind preset through CommonJS.
const nativewindPreset = require('nativewind/preset');

/**
 * REFERENCE design tokens — neutral placeholder values. Swap the hex values for
 * your brand palette (keep the keys so existing `brand-*` classes keep working).
 * Mirrors `theme/colors.ts`.
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          accent: '#f59e0b',
          'accent-dark': '#d97706',
          'screen-bg': '#f8fafc',
          'card-bg': '#ffffff',
          'subtle-fill': '#f1f5f9',
          border: '#e2e8f0',
          'body-text': '#0f172a',
          muted: '#94a3b8',
          secondary: '#475569',
          error: '#dc2626',
          'error-bg': '#fef2f2',
          'error-border': '#fecaca',
          dark: {
            bg: '#0b1120',
            card: '#111827',
            'card-bg': '#111827',
            elevated: '#1f2937',
            border: 'rgba(255,255,255,0.12)',
            text: '#f1f5f9',
            'body-text': '#f1f5f9',
            muted: '#94a3b8',
            'subtle-fill': 'rgba(255,255,255,0.06)',
            'success-bg': 'rgba(5,150,105,0.18)',
            'success-text': '#86efac',
            'success-border': 'rgba(134,239,172,0.28)',
            'warning-bg': 'rgba(180,83,9,0.15)',
            'warning-text': '#fbbf24',
            'warning-border': 'rgba(251,191,36,0.3)',
            'error-bg': 'rgba(220,38,38,0.12)',
            'error-text': '#fca5a5',
            'error-border': 'rgba(220,38,38,0.3)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
