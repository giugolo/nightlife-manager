/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Apple system stack (SF on Apple devices), Inter as cross-platform fallback.
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Accent = Apple system blue (dark mode). Flat, no gradients.
        brand: {
          50: '#eaf4ff',
          100: '#d6e9ff',
          200: '#aed3ff',
          300: '#7bb8ff',
          400: '#409cff',
          500: '#0a84ff', // iOS/macOS dark system blue
          600: '#0070e0',
          700: '#0059b3',
          800: '#004488',
          900: '#00305f',
          950: '#001d3a',
          DEFAULT: '#0a84ff',
        },
        success: { DEFAULT: '#30d158', dark: '#28a745' }, // Apple green
        danger: { DEFAULT: '#ff453a', dark: '#d70015' },  // Apple red
        // Apple dark-mode neutral grays (true black base + elevated systemGray surfaces).
        ink: {
          950: '#000000', // base background
          900: '#1c1c1e', // elevated surface (systemGray6 dark)
          850: '#2c2c2e', // systemGray5 dark
          800: '#3a3a3c', // systemGray4 dark
        },
      },
      boxShadow: {
        // Soft, neutral elevation (no colored glow).
        glow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        'glow-accent': '0 8px 30px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
