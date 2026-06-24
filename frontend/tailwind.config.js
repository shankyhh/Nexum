/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6d6bff',
          2: '#8b5cf6',
          soft: 'rgba(109,107,255,0.13)',
        },
        surface: {
          base: '#0b0d12',
          elev: '#11141b',
          elev2: '#161a23',
          panel: '#13161f',
        },
        border: {
          DEFAULT: '#222838',
          soft: '#1b2030',
        },
        content: {
          DEFAULT: '#e7ebf3',
          dim: '#9aa3b6',
          faint: '#6b748a',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '9px',
        md: '10px',
        lg: '14px',
        xl: '16px',
      },
      boxShadow: {
        brand: '0 8px 20px -8px rgba(109,107,255,0.6)',
        card: '0 10px 40px -12px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease',
        'slide-up': 'slideUp 0.25s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
      },
    },
  },
  plugins: [],
};
