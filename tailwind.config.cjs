/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#EDE9FF',
          400: '#8366FF',
          500: '#6B4EFF',
          600: '#5940CC',
          700: '#4732A3',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Icon background colors
        purple: {
          bg: '#EDE9FF',
        },
        red: {
          bg: '#FFE9E9',
        },
        yellow: {
          bg: '#FFF4E0',
        },
        green: {
          bg: '#E0F7F4',
        },
        blue: {
          bg: '#E0F0FF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'primary': '0 2px 8px rgba(107, 78, 255, 0.25)',
        'primary-lg': '0 4px 16px rgba(107, 78, 255, 0.35)',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'ease-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
      },
    },
  },
  plugins: [],
}
