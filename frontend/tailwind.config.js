/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leather: {
          dark: '#2d2416',
          medium: '#3d3220',
          light: '#4a3f2e',
        },
        gold: {
          stitch: '#c9a227',
          accent: '#d4af37',
        },
      },
    },
  },
  plugins: [],
}
