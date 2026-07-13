/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
        sarabun: ['Sarabun', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#2ac5a6',
          50: '#eefbfa',
          100: '#d5f4ef',
          200: '#aee8dd',
          300: '#7ad7c7',
          400: '#4bc1af',
          500: '#2ac5a6',
          600: '#21a088',
          700: '#1d806f',
          800: '#1c665a',
          900: '#1b544b',
          950: '#0a312d',
        }
      }
    },
  },
  plugins: [],
}
