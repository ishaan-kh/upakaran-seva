/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Saffron primary
        saffron: {
          50:  '#FDF3E8',
          100: '#FCE8D6',
          200: '#F8D0AC',
          300: '#EFB07A',
          400: '#E18548',
          500: '#C8601C',
          600: '#A54E14',
          700: '#84400F',
          800: '#6B340C',
          900: '#4D250A',
        },
        ivory: {
          DEFAULT: '#FBF7F0',
          dark:    '#F5EEE2',
        },
      },
    },
  },
  plugins: [],
};
