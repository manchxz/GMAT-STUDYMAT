import type { Config } from 'tailwindcss';

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        vue: {
          bg: '#1a1d21',
          panel: '#22262b',
          border: '#363b42',
          text: '#eceff1',
          muted: '#9aa7b8',
          accent: '#0d9488',
          warn: '#c9a022',
          danger: '#c94c4c',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
