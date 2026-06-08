/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0B5D3B',
          50: '#E7F2ED',
          100: '#CFE5DB',
          200: '#9FCBB7',
          300: '#6FB193',
          400: '#3F976F',
          500: '#0B5D3B', // Deep Green
          600: '#094E31',
          700: '#073E27',
          800: '#052F1D',
          900: '#031F13',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FAF6E7',
          100: '#F5EDCF',
          200: '#EBDB9F',
          300: '#E1C96F',
          400: '#D7B73F',
          500: '#D4AF37', // Gold Accent
          600: '#B2912B',
          700: '#8F7422',
          800: '#6B571A',
          900: '#483A11',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        ebony: '#03050a',
        'ebony-card': '#0a0c14',
        'ebony-border': '#1a1d27',
      }
    },
  },
  plugins: [],
}
