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
        paper: {
          50: '#fbf9f5',
          100: '#f5f0e6',
          200: '#ebd9bf',
          800: '#3e3428',
          900: '#231d16',
        },
        slateDark: {
          800: '#1a1f2c',
          900: '#12151d',
          950: '#0c0e14',
        }
      }
    },
  },
  plugins: [],
}
