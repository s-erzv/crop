/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f0',
          100: '#dceddc',
          200: '#bbdcbc',
          300: '#8ec390',
          400: '#5ea362',
          500: '#3d8642',
          600: '#2d6b32',
          700: '#245529',
          800: '#1e4423',
          900: '#19381e',
          950: '#0c1f11',
        },
        earth: {
          50: '#fdf8f0',
          100: '#faefd8',
          200: '#f4dba8',
          300: '#ecc170',
          400: '#e3a040',
          500: '#d4802a',
          600: '#b96320',
          700: '#974a1d',
          800: '#7b3c1e',
          900: '#65321b',
          950: '#38180c',
        },
        parchment: {
          50: '#fefdf8',
          100: '#fdf9ec',
          200: '#f9f0d0',
          300: '#f3e3a8',
          400: '#ecd078',
          500: '#e3bd4e',
        },
        bark: {
          800: '#3d2b1f',
          900: '#261a10',
          950: '#120d06',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-right': 'slideRight 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
