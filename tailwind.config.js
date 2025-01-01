/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'maincolor': '#443F5F',
        dark: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          text: '#ffffff'
        },
        light: {
          primary: '#ffffff',
          secondary: '#f3f4f6',
          text: '#000000'
        }
      },
      fontFamily: {
        montserrat: ['Montserrat', 'Lucida Sans Unicode', 'Lucida Grande', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};