/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gugi: ['Gugi', 'cursive'],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
}

