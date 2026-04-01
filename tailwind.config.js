/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFB800',
        'primary-light': '#FFF3D6',
        secondary: '#6366F1',
      }
    },
  },
  plugins: [],
}