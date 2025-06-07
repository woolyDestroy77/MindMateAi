/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#f5f3fa',
          100: '#e9e6f5',
          200: '#d6cfeb',
          300: '#bbb0de',
          400: '#a395d0',
          500: '#9D8AC7', // primary
          600: '#8370b3',
          700: '#705a9a',
          800: '#5c4a7e',
          900: '#4b3c67',
          950: '#2e2540',
        },
        sage: {
          50: '#f4f7f2',
          100: '#e6ede2',
          200: '#d0ddca',
          300: '#b2c8a7',
          400: '#A9C5A0', // primary
          500: '#86a77a',
          600: '#6d8d64',
          700: '#577051',
          800: '#475a44',
          900: '#3c4b3a',
          950: '#1f2720',
        },
      },
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
};