/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060a14',
          900: '#0a1020',
          850: '#0f1830',
          800: '#142142',
          750: '#1a2b54',
          700: '#22386e',
          600: '#325299',
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00e5ff',
          600: '#00b4d8',
          700: '#0077b6',
        },
        brand: {
          400: '#38e1ff',
          500: '#00e5ff',
          600: '#00b0ff',
          700: '#0088cc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
