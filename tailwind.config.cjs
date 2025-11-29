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
        // ORIZON Primary (Event Horizon Blue)
        primary: {
          DEFAULT: '#00D4FF',
          hover: '#00B8E6',
          active: '#009CCC',
          light: '#33DDFF',
          dark: '#0088CC',
        },
        // ORIZON Accent (Accretion Orange)
        accent: {
          DEFAULT: '#FF9500',
          hover: '#E68500',
          light: '#FFAD33',
          dark: '#CC7700',
        },
        // Quantum Violet
        quantum: {
          DEFAULT: '#6A00FF',
          light: '#8533FF',
        },
        // Backgrounds
        'bg-dark': '#0A0A0A',
        'surface-dark': '#1A1A1A',
        'surface-hover-dark': '#2A2A2A',
        black: '#000000',
        // Semantic colors
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        // Legacy compatibility (keep for existing components)
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
      },
      fontFamily: {
        primary: ['Outfit', 'Satoshi', 'Inter Tight', 'sans-serif'],
        secondary: ['Inter', 'IBM Plex Sans', 'sans-serif'],
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
        // Cosmic glows
        'glow-primary': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-primary-lg': '0 0 40px rgba(0, 212, 255, 0.5)',
        'glow-primary-xl': '0 0 60px rgba(0, 212, 255, 0.7)',
        'glow-accent': '0 0 20px rgba(255, 149, 0, 0.3)',
        'glow-accent-lg': '0 0 40px rgba(255, 149, 0, 0.5)',
        // Standard shadows
        'soft': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'xl': '0 20px 60px rgba(0, 0, 0, 0.6)',
        // Legacy
        'primary': '0 2px 8px rgba(0, 212, 255, 0.3)',
        'primary-lg': '0 4px 16px rgba(0, 212, 255, 0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFE599 0%, #FFCC66 25%, #FF9933 75%, #FF6600 100%)',
        'gradient-surface': 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'ease-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}
