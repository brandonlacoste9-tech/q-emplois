/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quebec: {
          blue: '#003DA5',
          gold: '#C9A34F',
          dark: '#0C0A09',
          light: '#FFFFFF',
        },
        'or-couture': '#D4AF37',
        'cuir-bleu-fonce': '#1E3A5F',
        'cuir-bleu-profond': '#0F172A',
        'texte-secondaire': '#64748B',
        accent: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}