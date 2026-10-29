/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cotton: {
          50: '#f6fbf7',
          100: '#eaf6ec',
          200: '#d4eed9',
          300: '#aee0b7',
          400: '#7ecc8c',
          500: '#52b364',
          600: '#3e954e',
          700: '#32763f',
          800: '#2c5e35',
          900: '#254e2d',
          950: '#0f2a15',
        },
        earth: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          600: '#97614f',
          800: '#4a2f26',
        }
      }
    },
  },
  plugins: [],
}
