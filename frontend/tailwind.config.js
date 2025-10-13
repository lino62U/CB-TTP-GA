// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Asegúrate de incluir todas las rutas
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8A0303', // UNSA-like Maroon/Vino Tinto
          light: '#A10A0A',
          dark: '#6e0202',
        },
        secondary: '#D4AF37', // Gold
      },
    },
  },
  plugins: [],
}
