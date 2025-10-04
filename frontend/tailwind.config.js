/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#8A0303',
            light: '#A10A0A',
            dark: '#6e0202',
          },
          secondary: '#D4AF37',
        },
      },
    },
    plugins: [],
  }
  