/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff1f0',
          100: '#ffe0de',
          200: '#ffc7c3',
          300: '#ff9e97',
          400: '#ff6b61',
          500: '#ff3e33',
          600: '#ed1f13',
          700: '#c8150a',
          800: '#a5160d',
          900: '#881812',
        },
        dark: {
          950: '#080a0f',
          900: '#0d0f17',
          800: '#131520',
          700: '#1a1d2e',
          600: '#222540',
          500: '#2e3255',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to bottom, transparent 0%, rgba(8,10,15,0.6) 50%, #080a0f 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(8,10,15,1) 0%, rgba(8,10,15,0.7) 50%, transparent 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
